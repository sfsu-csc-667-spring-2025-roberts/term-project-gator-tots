import express from "express";
import { Request, Response } from "express";
import { saveChatMessage } from "../db/chat"; // Adjust path as needed

import { Game } from "../db";
import {
  getAvailableGames,
  getCurrentPlayer,
  getGameInfo,
  setSupposedRank,
} from "../db/games";

const router = express.Router();

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
    const currentPlayer = await Game.getCurrentPlayer(Number(gameId));
    // After successful join
    const io = request.app.get("io");
    // @ts-ignore
    const username = request.session.username;
    const serverMsg = `${username} has joined the game.`;

    io.to(gameId).emit(`chat:message:${gameId}`, {
      sender: { username: "Server" },
      message: serverMsg,
      timestamp: Date.now(),
    });

    // Save to DB
    await saveChatMessage(Number(gameId), "Server", serverMsg);

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
  // @ts-ignore
  const username = request.session.username;

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

  const io = request.app.get("io");

  const serverMsg = `${username} has left the game.`;
  io.to(gameId).emit(`chat:message:${gameId}`, {
    sender: { username: "Server" },
    message: serverMsg,
    timestamp: Date.now(),
  });
  await saveChatMessage(Number(gameId), "Server", serverMsg);

  // For sendBeacon, don't redirect
  if (request.headers.accept !== "application/json") {
    response.redirect("/lobby");
  } else {
    response.status(204).end();
  }
});

router.get("/:gameId", async (request: Request, response: Response) => {
  const io = request.app.get("io");
  const { gameId } = request.params;

  // @ts-ignore
  const username = request.session.username;
  // @ts-ignore
  const user_id = request.session.user_id;

  const game = await Game.getGameNameById(Number(gameId));
  const players = await Game.getPlayersInGame(Number(gameId));
  const gameInfo = await Game.getGameInfo(Number(gameId));
  const userCards = await Game.getUserCards(user_id, Number(gameId));
  const currentPlayer = await Game.getCurrentPlayer(Number(gameId));
  const gameRoom = await Game.getGameRoomFields(Number(gameId), [
    "last_played_user_id",
  ]);
  let lastPlayedUser = null;
  if (gameRoom.last_played_user_id) {
    const user = await Game.getUserById(gameRoom.last_played_user_id);
    lastPlayedUser = user.username;
  }

  let current_supposed_rank = await Game.getSupposedRank(Number(gameId));
  console.log("current_supposed_rank" + current_supposed_rank);

  if (!game || !game.game_room_name) {
    // Game not found, redirect to lobby or show an error
    return response.redirect("/lobby");
  }

  const { game_room_name } = game;
  const isHost = user_id === gameInfo.game_room_host_user_id;

  io.to(gameId).emit("game:update", {
    players,
    gameInfo,
    userCards,
    currentPlayer,
    current_supposed_rank,
    lastPlayedUser,
  });

  // Emit a server message about whose turn it is
  if (currentPlayer && currentPlayer.username) {
    io.to(gameId).emit(`chat:message:${gameId}`, {
      sender: { username: "Server" },
      message: `It's ${currentPlayer.username}'s turn!`,
      timestamp: Date.now(),
    });
  }

  response.render("games", {
    gameId,
    username,
    game_name: game_room_name,
    isHost,
    players,
    min_players: gameInfo.min_players,
    max_players: gameInfo.max_players,
    userCards,
    currentPlayer: currentPlayer?.username,
    supposedRank: gameInfo.current_supposed_rank,
    lastPlayedUser,
  });
});

router.post("/:gameId/play", async (req, res) => {
  const io = req.app.get("io");
  const { gameId } = req.params;
  const { cards } = req.body;

  // Get current supposed rank
  const gameInfo = await Game.getGameInfo(Number(gameId));
  let supposedRank = gameInfo.current_supposed_rank;

  // ...validate and process the play...

  // Advance supposed rank (1-13)
  let nextSupposedRank = supposedRank + 4;
  if (nextSupposedRank > 52) nextSupposedRank = 1;

  // Map supposedRank (1-52) to rank name
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const rankName = ranks[Math.floor((supposedRank - 1) / 4)];

  // Move cards to pile
  await Game.moveCardsToPile(cards.map(Number), Number(gameId));
  // Update last played user and cards
  await Game.setLastPlayed(
    Number(gameId),
    gameInfo.current_players_turn,
    cards.map(Number),
  );
  // --- Rotate turn to next player ---
  const players = await Game.getPlayersInGame(Number(gameId)); // Should be ordered by join time/seat
  // @ts-ignore
  const user_id = req.session.user_id;
  const currentIndex = players.findIndex((p) => p.user_id === user_id);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];

  const current_player = await getCurrentPlayer(Number(gameId));
  const current_players_username = current_player.username;

  // Update turn in DB
  await Game.setCurrentPlayerTurn(Number(gameId), nextPlayer.user_id);
  // Update in DB
  io.to(gameId).emit("game:supposedRank", { supposedRank: supposedRank });
  await Game.setSupposedRank(Number(gameId), nextSupposedRank);
  console.log("Supposed rank updated to", nextSupposedRank, "for game", gameId);

  // Send message to room
  const playerTurnMessage = `${current_players_username} has played ${cards.length} card${cards.length > 1 ? "s" : ""} of rank ${rankName}`;
  io.to(gameId).emit(`chat:message:${gameId}`, {
    sender: { username: "Server" },
    message: playerTurnMessage,
    timestamp: Date.now(),
  });
  await saveChatMessage(Number(gameId), "Server", playerTurnMessage);

  // Notify clients whose turn it is
  const playerTurnMessage2 = `It's ${nextPlayer.username}'s turn!`;
  io.to(gameId).emit(`chat:message:${gameId}`, {
    sender: { username: "Server" },
    message: playerTurnMessage2,
    timestamp: Date.now(),
  });

  await saveChatMessage(Number(gameId), "Server", playerTurnMessage2);

  res.sendStatus(200);
});

router.get("/:gameId/start-test", async (req, res) => {
  const { gameId } = req.params;
  const io = req.app.get("io");
  const currentPlayer = await Game.getCurrentPlayer(Number(gameId));

  // Emit a server message about whose turn it is
  if (currentPlayer && currentPlayer.username) {
    io.to(gameId).emit(`chat:message:${gameId}`, {
      sender: { username: "Server" },
      message: `It's ${currentPlayer.username}'s turn!`,
      timestamp: Date.now(),
    });
  }

  try {
    await Game.start(Number(gameId));
    res.json({ success: true, message: "Game started and cards dealt!" });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

router.post("/:gameId/bs", (request: Request, response: Response) => {
  (async () => {
    const io = request.app.get("io");

    const { gameId } = request.params;
    // @ts-ignore
    const user_id = request.session.user_id;

    // Get game info
    const gameInfo = await Game.getGameInfo(Number(gameId));
    const current_supposed_rank = gameInfo.current_supposed_rank;

    let prevSupposedRank = current_supposed_rank - 4;
    if (prevSupposedRank < 1) prevSupposedRank += 52;
    const prevSupposedRankIndex = Math.floor((prevSupposedRank - 1) / 4);

    // Get last played cards and user
    const {
      last_played_cards,
      last_played_user_id,
      game_card_pile_game_card_pile_id,
    } = await Game.getGameRoomFields(Number(gameId), [
      "last_played_cards",
      "last_played_user_id",
      "game_card_pile_game_card_pile_id",
    ]);

    if (!last_played_cards || last_played_cards.length === 0) {
      response.status(400).json({ error: "No cards to challenge." });
      return;
    }

    // Check if all cards match the supposed rank
    const allMatch = last_played_cards.every(
      (cardRank: number) =>
        Math.floor((cardRank - 1) / 4) === prevSupposedRankIndex,
    );

    // Get all cards in the pile
    const pileCards = await Game.getPileCards(game_card_pile_game_card_pile_id); // Should return array of card IDs

    // Decide who gets the pile
    let loser_id;
    if (allMatch) {
      loser_id = user_id; // Caller gets pile
    } else {
      loser_id = last_played_user_id; // Last player gets pile
    }

    // Move all pile cards to the loser
    if (pileCards.length > 0) {
      await Game.giveCardsToUser(loser_id, pileCards);
    }

    // Clear the pile (optional, if you want)
    // await Game.clearPile(game_card_pile_game_card_pile_id);

    // Announce result
    const caller = await Game.getUserById(user_id);
    const lastPlayer = await Game.getUserById(last_played_user_id);
    let message;
    if (allMatch) {
      message = `${caller.username} called Bullshit, but ${lastPlayer.username} told the truth! ${caller.username} takes the pile.`;
    } else {
      message = `${caller.username} called Bullshit and was correct! ${lastPlayer.username} takes the pile.`;
    }

    io.to(gameId).emit(`chat:message:${gameId}`, {
      sender: { username: "Server" },
      message,
      timestamp: Date.now(),
    });
    await saveChatMessage(Number(gameId), "Server", message);

    response.sendStatus(200);
  })().catch((err) => {
    console.error(err);
    response.status(500).json({ error: "Internal server error" });
  });
});

export default router;
