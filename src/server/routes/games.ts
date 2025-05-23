import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";
import db from "../db/connection";
import { Game } from "../db";
import { getAvailableGames, getGameInfo } from "../db/games";

// --- Interfaces for Game State & Cards ---
export interface Card {
  id: number; // Unique identifier for the card type (e.g., 0-51)
  suit: number; // 0:Spades, 1:Hearts, 2:Diamonds, 3:Clubs
  rank: number; // 1 (Ace) to 13 (King)
}

export interface PlayerServerState {
  userId: number;
  username: string;
  hand: Card[];
  cardCount: number;
}

export interface GameServerState {
  gameId: number;
  players: PlayerServerState[];
  currentPlayerTurn: number | null;
  pile: {
    actualCards: Card[];
    lastClaimedRank: number | null;
    lastClaimedCount: number | null;
  };
  lastPlayBy: number | null;
  gameStarted: boolean;
}

export const activeGames: Map<number, GameServerState> = new Map();

const router = express.Router();

function getIo(req: express.Request) {
  return req.app.get("io"); // Your server/index.ts sets 'io' on the app [cite: 57, 71, 227, 241]
}

router.post("/create", async (request: Request, response: Response) => {
  // @ts-ignore
  const host_id = request.session?.user_id as number;
  const { game_name, minPlayers, maxPlayers } = request.body;
  const games = await getAvailableGames();
  const password = request.body.password === "" ? null : request.body.password;

  try {
    const gameId = await Game.create(
      game_name,
      minPlayers,
      maxPlayers,
      password,
      host_id,
    );
    response.redirect(`/games/${gameId}`);
  } catch (error: any) {
    // Check for unique constraint violation (Postgres error code 23505)
    if (error.code === "23505") {
      // Render the form again with a warning message
      return response.render("lobby", {
        warning:
          "A game with that name already exists. Please choose another name.",
        game_name,
        minPlayers,
        maxPlayers,
        password,
        roomId: 0,
        // @ts-ignore
        username: request.session?.username,
        games,
      });
    }
    console.log({ error });
    response.redirect("/lobby");
  }
});

router.post("/join/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  const { password } = request.body;
  // @ts-ignore
  const username = request.session.username;
  // @ts-ignore
  const user_id = request.session.user_id;

  // 1. Check if user is already in a game
  const user = await Game.getUserById(user_id); // Implement this to get user's current game_room_id
  if (user && user.game_room_id) {
    return response.redirect(
      "/lobby?warning=You%20are%20already%20in%20a%20game.",
    );
  }

  // 2. Check if game exists and get info
  const gameInfo = await Game.getGameInfo(Number(gameId)); // Should return { max_players, game_room_password }
  if (!gameInfo) {
    return response.redirect("/lobby?warning=Game%20not%20found");
  }

  console.log(
    "DB password:",
    gameInfo.game_room_password,
    "User entered:",
    password,
  );
  // 3. Check password
  if (
    (gameInfo.game_room_password && gameInfo.game_room_password !== password) ||
    (gameInfo.game_room_password === null && password)
  ) {
    return response.redirect("/lobby?warning=Incorrect%20password");
  }

  // 4. Check if game is full
  const currentPlayers = await Game.getPlayerCount(Number(gameId));
  if (currentPlayers.count >= gameInfo.max_players) {
    return response.redirect("/lobby?warning=Game%20full");
  }

  // 5. All checks passed, join the game
  try {
    const playerCount = await Game.join(user_id, Number(gameId), password);
    console.log({ playerCount });
    response.redirect(`/games/${gameId}`);
  } catch (error: any) {
    console.log("game join error", { error });
    response.redirect("/lobby?warning=Could%20not%20join%20game");
  }
});

router.post("/leave/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  const numericGameId = Number(gameId);
  // @ts-ignore
  const user_id = request.session.user_id;

  let isHost = false;
  if (user_id) {
    isHost = await Game.isHost(user_id, numericGameId);
  }

  if (isHost) {
    await Game.deleteGame(numericGameId);
  } else if (user_id) {
    await Game.leaveGame(user_id, numericGameId);

    // Check if any users are left in the game
    const { count } = await Game.getPlayerCount(numericGameId);
    if (count === 0) {
      await Game.deleteGame(numericGameId);
    }
  } else {
    // If user_id is missing (e.g., sendBeacon with no session), as a fallback, check if the game has any users
    const { count } = await Game.getPlayerCount(numericGameId);
    if (count === 0) {
      await Game.deleteGame(numericGameId);
    }
  }

  // For sendBeacon, don't redirect
  if (request.headers.accept !== "application/json") {
    response.redirect("/lobby");
  } else {
    response.status(204).end();
  }
});

router.get("/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;

  // @ts-ignore
  const username = request.session.username;
  // @ts-ignore
  const user_id = request.session.user_id;

  const game = await Game.getGameNameById(Number(gameId));
  const players = await Game.getPlayersInGame(Number(gameId));
  const gameInfo = await Game.getGameInfo(Number(gameId));

  if (!game || !game.game_room_name) {
    // Game not found, redirect to lobby or show an error
    return response.redirect("/lobby");
  }

  const { game_room_name, game_room_host_user_id } = game;
  const isHost = user_id === game_room_host_user_id;

  response.render("games", {
    gameId,
    username,
    game_name: game_room_name,
    isHost,
    players,
    min_players: gameInfo.min_players,
    max_players: gameInfo.max_players,
  });
});

// In src/server/routes/games.ts
// Make sure your imports, interfaces, activeGames map, and router init are above this.

// Your other working routes (/create, /join, /leave, GET /:gameId, /test-actual-simple)

router.post(
  "/:gameId/start",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const gameId = parseInt(req.params.gameId, 10);
      // @ts-ignore
      const hostUserId = req.session.user_id;

      // --- Piece 1: hostUserId Validation ---
      if (!hostUserId) {
        res.status(401).json({ message: "User not authenticated." });
        return;
      }

      // --- Piece 2: isUserHost Validation ---
      const isUserHost: boolean = await Game.isHost(hostUserId, gameId); // [cite: 88, 258]
      if (!isUserHost) {
        res.status(403).json({ message: "Only the host can start the game." });
        return;
      }

      // --- Piece 3: gameRoomInfo Fetch and Validation ---
      // Define a more complete type for gameRoomInfo if possible, based on your table structure
      const gameRoomInfo: {
        game_room_id: number;
        game_started: boolean;
        min_players: number | null;
        max_players: number | null /* other fields */;
      } | null = await db.oneOrNone(
        "SELECT * FROM game_room WHERE game_room_id = $1",
        [gameId],
      ); // [cite: 4, 174]

      if (!gameRoomInfo) {
        res.status(404).json({ message: "Game room not found." });
        return;
      }
      if (gameRoomInfo.game_started) {
        // [cite: 4, 174]
        res.status(400).json({ message: "Game already started." });
        return;
      }

      // --- Piece 4: playersFromDb Fetch and Validation ---
      // Ensure Game.getPlayersInGame is updated to return Promise<{user_id: number, username: string}[]>
      const playersFromDb: { user_id: number; username: string }[] =
        await Game.getPlayersInGame(gameId); // [cite: 93, 263]
      if (
        !playersFromDb ||
        playersFromDb.length < (gameRoomInfo.min_players || 2)
      ) {
        res
          .status(400)
          .json({
            message: `Not enough players. Minimum ${gameRoomInfo.min_players || 2} required.`,
          });
        return;
      }

      // --- Start of "Step 5" Logic ---

      // 5a. Mark Game as Started in DB
      await db.none(
        "UPDATE game_room SET game_started = TRUE, game_start_time = NOW() WHERE game_room_id = $1", // [cite: 4, 174]
        [gameId],
      );

      // 5b. Initialize Card Deck and Shuffle
      const standardDeck: Card[] = []; // Assumes Card interface is defined
      for (let suit = 0; suit < 4; suit++) {
        // 0-Spades, 1-Hearts, 2-Diamonds, 3-Clubs
        for (let rank = 1; rank <= 13; rank++) {
          // 1-Ace to 13-King
          standardDeck.push({ id: suit * 13 + (rank - 1), suit, rank }); // card.id from 0 to 51
        }
      }
      // Fisher-Yates Shuffle
      for (let i = standardDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [standardDeck[i], standardDeck[j]] = [standardDeck[j], standardDeck[i]];
      }

      // 5c. `serverPlayers` mapping
      const serverPlayers: PlayerServerState[] = playersFromDb.map((p) => ({
        // Assumes PlayerServerState interface is defined
        userId: p.user_id,
        username: p.username,
        hand: [],
        cardCount: 0,
      }));

      // 5d. Loop for dealing cards, `card` table insertion, and finding Ace of Spades
      let firstPlayerUserId: number | null = null;
      const aceOfSpadesCardId = 0; // Card with id:0 (Suit: Spades (0), Rank: Ace (1))

      // Clear previous cards for this game from 'card' table.
      await db.none("DELETE FROM card WHERE deck_deck_id = $1", [gameId]); // [cite: 6, 176]

      for (let i = 0; i < standardDeck.length; i++) {
        const card = standardDeck[i];
        const playerIndex = i % serverPlayers.length;
        serverPlayers[playerIndex].hand.push(card);
        serverPlayers[playerIndex].cardCount++;

        if (card.id === aceOfSpadesCardId) {
          firstPlayerUserId = serverPlayers[playerIndex].userId;
        }

        // Persisting cards: card.card_id is type: "integer", primaryKey: true, NOT serial [cite: 6, 176]
        // Workaround for unique card_id: (gameId * 1000) + card_type_id (0-51)
        const cardInstanceIdForDB = gameId * 1000 + card.id;

        await db
          .none(
            "INSERT INTO card (card_id, card_rank, user_user_id, deck_deck_id, game_card_pile_game_card_pile_id) VALUES ($1, $2, $3, $4, $5)",
            [
              cardInstanceIdForDB,
              card.rank, // Storing the 1-13 rank [cite: 6, 176]
              serverPlayers[playerIndex].userId, // user_user_id [cite: 6, 176]
              gameId, // deck_deck_id [cite: 6, 176]
              gameId, // game_card_pile_game_card_pile_id [cite: 6, 176]
            ],
          )
          .catch((err) => {
            console.error(
              `Failed to insert card ${card.id} (DB ID ${cardInstanceIdForDB}) for game ${gameId}:`,
              err,
            );
            // This is a critical error. Consider re-throwing or handling it more robustly.
            // For now, it logs and continues.
          });
      }

      // 5e. Determine `firstPlayerUserId` Fallback
      if (!firstPlayerUserId && serverPlayers.length > 0) {
        firstPlayerUserId = serverPlayers[0].userId; // Fallback if Ace of Spades somehow not found
      }

      // 5f. Update `current_players_turn` in Database
      await db.none(
        "UPDATE game_room SET current_players_turn = $1 WHERE game_room_id = $2",
        [firstPlayerUserId, gameId],
      ); // [cite: 4, 175]

      // 5g. Initialize In-Memory Game State
      const initialServerState: GameServerState = {
        // Assumes GameServerState interface is defined
        gameId,
        players: serverPlayers,
        currentPlayerTurn: firstPlayerUserId,
        pile: {
          actualCards: [],
          lastClaimedRank: null,
          lastClaimedCount: null,
        },
        lastPlayBy: null,
        gameStarted: true,
      };
      activeGames.set(gameId, initialServerState); // Assumes activeGames Map is defined

      // 5h. Socket.IO Emissions
      const io = getIo(req); // Assumes getIo function is defined
      serverPlayers.forEach((player) => {
        io.to(player.userId.toString()).emit("game:started", {
          // [cite: 72, 242]
          gameId,
          players: serverPlayers.map((p) => ({
            userId: p.userId,
            username: p.username,
            cardCount: p.cardCount,
          })),
          yourHand: player.hand,
          currentPlayerTurn: firstPlayerUserId,
          myUserId: player.userId,
        });
      });

      io.to(gameId.toString()).emit("game:stateUpdate", {
        // [cite: 73, 243]
        gameId,
        players: serverPlayers.map((p) => ({
          userId: p.userId,
          username: p.username,
          cardCount: p.cardCount,
        })),
        currentPlayerTurn: firstPlayerUserId,
        pileDisplay: { claimedRank: null, count: 0 },
        lastPlayBy: null,
      });

      // 5i. Final Success Response
      res
        .status(200)
        .json({
          message: "Game started successfully.",
          gameId,
          firstPlayerUserId,
        });
      return;
    } catch (error) {
      console.error(
        `Error in POST /games/${req.params.gameId}/start route:`,
        error,
      );
      next(error); // Pass error to error handling middleware
    }
  },
);

export default router;
