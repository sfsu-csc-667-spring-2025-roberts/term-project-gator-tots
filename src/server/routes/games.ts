import express from "express";
import { Request, Response } from "express";
import { saveChatMessage } from "../db/chat"; // Adjust path as needed

import { Game } from "../db";
import { getAvailableGames, getGameInfo } from "../db/games";

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

  if (!game || !game.game_room_name) {
    // Game not found, redirect to lobby or show an error
    return response.redirect("/lobby");
  }

  const { game_room_name, game_room_host_user_id } = game;
  const isHost = user_id === game_room_host_user_id;

  io.to(gameId).emit("game:update", {
    players,
    gameInfo,
    userCards,
    currentPlayer,
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
  });
});

router.post("/:gameId/play", async (req, res) => {
  const io = req.app.get("io");
  const { gameId } = req.params;
  const { cards } = req.body;

  // Get current supposed rank
  const gameInfo = await Game.getGameInfo(Number(gameId));
  let supposedRank = gameInfo.current_supposed_rank || 1;

  // ...validate and process the play...

  // Advance supposed rank (1-13)
  let nextSupposedRank = supposedRank + 1;
  if (nextSupposedRank > 13) nextSupposedRank = 1;

  // Update in DB
  io.to(gameId).emit("game:supposedRank", { supposedRank: supposedRank });
  await Game.setSupposedRank(Number(gameId), nextSupposedRank);

  // Move cards to pile
  await Game.moveCardsToPile(cards.map(Number), Number(gameId));

  // --- Rotate turn to next player ---
  const players = await Game.getPlayersInGame(Number(gameId)); // Should be ordered by join time/seat
  // @ts-ignore
  const user_id = req.session.user_id;
  const currentIndex = players.findIndex((p) => p.user_id === user_id);
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];

  // Update turn in DB
  await Game.setCurrentPlayerTurn(Number(gameId), nextPlayer.user_id);

  // Notify clients whose turn it is
  io.to(gameId).emit(`chat:message:${gameId}`, {
    sender: { username: "Server" },
    message: `It's ${nextPlayer.username}'s turn!`,
    timestamp: Date.now(),
  });
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

router.post("/:gameId/bs", async (req, res) => {
  const { gameId } = req.params;
  // @ts-ignore
  const user_id = req.session.user_id;
  // TODO: Implement your bluff-checking logic here!
  // For now, just broadcast a message:
  const io = req.app.get("io");
  const user = await Game.getUserById(user_id);
  io.to(gameId).emit(`chat:message:${gameId}`, {
    sender: { username: "Server" },
    message: `${user.username} called Bullshit!`,
    timestamp: Date.now(),
  });
  res.sendStatus(200);
});

export default router;
