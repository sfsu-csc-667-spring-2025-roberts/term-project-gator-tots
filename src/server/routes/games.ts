import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";
import db from "../db/connection";
import { Game } from "../db";
import { getAvailableGames, getGameInfo } from "../db/games";

// Defines a single card with its ID, suit, and rank.
export interface Card {
  id: number;
  suit: number;
  rank: number;
}

// Represents a player's state on the server, including their hand.
export interface PlayerServerState {
  userId: number;
  username: string;
  hand: Card[];
  cardCount: number;
}

// Represents the overall state of a game instance on the server.
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

// In-memory store for all active game states, keyed by gameId.
export const activeGames: Map<number, GameServerState> = new Map();

const router = express.Router();

// Helper to get the Socket.IO instance from the app object.
function getIo(req: express.Request) {
  return req.app.get("io");
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
    if (error.code === "23505") {
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
  const joining_username = request.session.username;
  // @ts-ignore
  const joining_user_id = request.session.user_id;

  const user = await Game.getUserById(joining_user_id);
  if (user && user.game_room_id) {
    return response.redirect(
      "/lobby?warning=You%20are%20already%20in%20a%20game.",
    );
  }

  const gameInfo = await Game.getGameInfo(Number(gameId));
  if (!gameInfo) {
    return response.redirect("/lobby?warning=Game%20not%20found");
  }

  console.log(
    "DB password:",
    gameInfo.game_room_password,
    "User entered:",
    password,
  );
  if (
    (gameInfo.game_room_password && gameInfo.game_room_password !== password) ||
    (gameInfo.game_room_password === null && password)
  ) {
    return response.redirect("/lobby?warning=Incorrect%20password");
  }

  const currentPlayers = await Game.getPlayerCount(Number(gameId));
  if (currentPlayers.count >= gameInfo.max_players) {
    return response.redirect("/lobby?warning=Game%20full");
  }

  try {
    const playerCount = await Game.join(
      joining_user_id,
      Number(gameId),
      password,
    );

    console.log(
      `[JOIN_SUCCESS] User ${joining_username} (ID: ${joining_user_id}) joined game ${gameId}. Player count now: ${playerCount}`,
    );

    const updatedPlayersList = await Game.getPlayersInGame(Number(gameId));
    const io = getIo(request);

    if (io && updatedPlayersList) {
      const eventData = {
        players: updatedPlayersList,
        gameId: Number(gameId),
        joinedPlayerUsername: joining_username,
      };
      const targetRoom = gameId.toString();
      io.to(targetRoom).emit("lobby:updated", eventData);
      console.log(
        `[EMIT lobby:updated] To room: '${targetRoom}'. Data:`,
        JSON.stringify(eventData),
      );
    } else {
      console.error(
        `[EMIT_FAIL lobby:updated] Missing io instance or updatedPlayersList for game ${gameId}.`,
      );
    }

    response.redirect(`/games/${gameId}`);
  } catch (error: any) {
    console.error(
      `[ERROR /join/:gameId] For game ${gameId} by user ${joining_username} (ID: ${joining_user_id}):`,
      error,
    );
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

    const { count } = await Game.getPlayerCount(numericGameId);
    if (count === 0) {
      await Game.deleteGame(numericGameId);
    }
  } else {
    const { count } = await Game.getPlayerCount(numericGameId);
    if (count === 0) {
      await Game.deleteGame(numericGameId);
    }
  }

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

  const gameData = await Game.getGameNameById(Number(gameId));
  const players = await Game.getPlayersInGame(Number(gameId));
  const gameSettings = await Game.getGameInfo(Number(gameId));

  if (!gameData || !gameData.game_room_name) {
    return response.redirect("/lobby");
  }

  const isHost = user_id === gameData.game_room_host_user_id;

  response.render("games", {
    gameId,
    username,
    user_id,
    game_name: gameData.game_room_name,
    game_room_host_user_id: gameData.game_room_host_user_id,
    isHost,
    players,
    min_players: gameSettings.min_players,
    max_players: gameSettings.max_players,
  });
});

router.post(
  "/:gameId/start",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const gameIdParamForLog = req.params.gameId; // For logging before parseInt
    try {
      // @ts-ignore
      const hostUserId = req.session.user_id as number | undefined;
      const gameId = parseInt(req.params.gameId, 10);

      // Validate host user ID from session.
      if (hostUserId === undefined || hostUserId === null) {
        res
          .status(401)
          .json({
            message: "User not authenticated or session user ID missing.",
          });
        return;
      }

      // Validate if the requester is the host of the game.
      const numericHostUserId = Number(hostUserId);
      const isUserHost: boolean = await Game.isHost(numericHostUserId, gameId);
      if (!isUserHost) {
        res.status(403).json({ message: "Only the host can start the game." });
        return;
      }

      // Fetch game room details.
      const gameRoomInfo: {
        game_room_id: number;
        game_started: boolean;
        min_players: number | null;
        max_players: number | null;
      } | null = await db.oneOrNone(
        "SELECT * FROM game_room WHERE game_room_id = $1",
        [gameId],
      );

      // Validate game room existence and status.
      if (!gameRoomInfo) {
        res.status(404).json({ message: "Game room not found." });
        return;
      }
      if (gameRoomInfo.game_started) {
        res.status(400).json({ message: "Game already started." });
        return;
      }

      // Validate player count.
      const playersFromDb: { user_id: number; username: string }[] =
        await Game.getPlayersInGame(gameId);
      if (
        !playersFromDb ||
        playersFromDb.length < (gameRoomInfo.min_players || 2)
      ) {
        res.status(400).json({
          message: `Not enough players. Minimum ${gameRoomInfo.min_players || 2} required.`,
        });
        return;
      }

      // Mark game as started in the database.
      await db.none(
        "UPDATE game_room SET game_started = TRUE, game_start_time = NOW() WHERE game_room_id = $1",
        [gameId],
      );

      // Initialize and shuffle a standard 52-card deck.
      const standardDeck: Card[] = [];
      for (let suit = 0; suit < 4; suit++) {
        for (let rank = 1; rank <= 13; rank++) {
          standardDeck.push({ id: suit * 13 + (rank - 1), suit, rank });
        }
      }
      for (let i = standardDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [standardDeck[i], standardDeck[j]] = [standardDeck[j], standardDeck[i]];
      }

      // Prepare player objects for server-side game state.
      const serverPlayers: PlayerServerState[] = playersFromDb.map((p) => ({
        userId: p.user_id,
        username: p.username,
        hand: [],
        cardCount: 0,
      }));

      let firstPlayerUserId: number | null = null;
      const aceOfSpadesCardId = 0; // Assumes Ace of Spades is card with id 0.

      // Clear any previous cards for this game and deal new ones.
      await db.none("DELETE FROM card WHERE deck_deck_id = $1", [gameId]);
      for (let i = 0; i < standardDeck.length; i++) {
        const card = standardDeck[i];
        const playerIndex = i % serverPlayers.length;
        serverPlayers[playerIndex].hand.push(card);
        serverPlayers[playerIndex].cardCount++;

        if (card.id === aceOfSpadesCardId) {
          firstPlayerUserId = serverPlayers[playerIndex].userId;
        }

        // Persist card to DB; card_id is not serial, so generate one.
        const cardInstanceIdForDB = gameId * 1000 + card.id;
        await db
          .none(
            "INSERT INTO card (card_id, card_rank, user_user_id, deck_deck_id, game_card_pile_game_card_pile_id) VALUES ($1, $2, $3, $4, $5)",
            [
              cardInstanceIdForDB,
              card.rank,
              serverPlayers[playerIndex].userId,
              gameId,
              gameId,
            ],
          )
          .catch((err) => {
            // Log error but continue; consider if this should halt game start.
            console.error(
              `Failed to insert card ${card.id} (DB ID ${cardInstanceIdForDB}) for game ${gameId}:`,
              err,
            );
          });
      }

      // Fallback if Ace of Spades wasn't found (e.g., very few players/cards).
      if (!firstPlayerUserId && serverPlayers.length > 0) {
        firstPlayerUserId = serverPlayers[0].userId;
      }

      // Set the starting player in the database.
      await db.none(
        "UPDATE game_room SET current_players_turn = $1 WHERE game_room_id = $2",
        [firstPlayerUserId, gameId],
      );

      // Initialize and store the game state in memory.
      const initialServerState: GameServerState = {
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
      activeGames.set(gameId, initialServerState);

      // Notify all players via Socket.IO that the game has started.
      const io = getIo(req);
      serverPlayers.forEach((player) => {
        io.to(player.userId.toString()).emit("game:started", {
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

      // Send a general game state update to the room.
      io.to(gameId.toString()).emit("game:stateUpdate", {
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

      // Send success response to the host who initiated the start.
      res.status(200).json({
        message: "Game started successfully.",
        gameId,
        firstPlayerUserId,
      });
      return; // Explicit return after successful response.
    } catch (error) {
      console.error(
        `Error in POST /games/${gameIdParamForLog}/start route:`, // Use gameIdParamForLog for safety.
        error,
      );
      next(error); // Pass error to Express error handling middleware.
    }
  },
);

export default router;
