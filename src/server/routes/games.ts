import express from "express";
import { Request, Response } from "express";

import { Game } from "../db";

const router = express.Router();

router.post("/create", async (request: Request, response: Response) => {
  // @ts-ignore
  const host_id = request.session?.user_id as number;
  const { game_name, minPlayers, maxPlayers, password } = request.body;

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

  try {
    const playerCount = await Game.join(user_id, parseInt(gameId), password);
    console.log({ playerCount });

    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.log({ error });

    response.redirect("/lobby");
  }
});

router.post("/leave/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;

  const numericGameId = Number(gameId);
  // @ts-ignore
  const user_id = request.session.user_id;

  const isHost = await Game.isHost(user_id, numericGameId);
  if (isHost) {
    await Game.deleteGame(numericGameId);
  } else {
    await Game.leaveGame(user_id, numericGameId);
  }
  response.redirect("/lobby");
});

router.get("/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;

  // @ts-ignore
  const username = request.session.username;
  // @ts-ignore
  const user_id = request.session.user_id;

  const { game_room_name, game_room_host_user_id } = await Game.getGameNameById(
    Number(gameId),
  );
  const isHost = user_id === game_room_host_user_id;

  // @ts-ignore
  response.render("games", {
    gameId,
    username,
    game_name: game_room_name,
    isHost,
  });
});

export default router;
