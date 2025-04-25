import express from "express";
import { Request, Response } from "express";

import { Game } from "../db";

const router = express.Router();

router.post("/create", async (request: Request, response: Response) => {
  // @ts-ignore
  const { id: user_id } = request.session.user_id;
  const { description, minPlayers, maxPlayers, password } = request.body;

  try {
    const gameId = await Game.create(
      description,
      minPlayers,
      maxPlayers,
      password,
      user_id,
    );

    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.log({ error });

    response.redirect("/lobby");
  }
});

router.post("/join/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  const { password } = request.body;
  // @ts-ignore
  const username = request.session.username;

  try {
    const playerCount = await Game.join(username, parseInt(gameId), password);
    console.log({ playerCount });

    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.log({ error });

    response.redirect("/lobby");
  }
});

router.get("/:gameId", (request: Request, response: Response) => {
  const { gameId } = request.params;

  // @ts-ignore
  const username = request.session.username;

  // @ts-ignore
  response.render("games", { gameId, username });
});

export default router;
