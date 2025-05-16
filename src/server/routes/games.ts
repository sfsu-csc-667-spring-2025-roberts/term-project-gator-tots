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

  try {
    const playerCount = await Game.join(username, parseInt(gameId), password);
    console.log({ playerCount });

    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.log({ error });

    response.redirect("/lobby");
  }
});

// router.post("/leave/:gameId", async (request: Request, response: Response) => {
//   const { gameId } = request.params;
//   // @ts-ignore
//   const user_id = request.session.user_id;

//   // Check if the user is the host (creator) of the game
//   const isHost = await Game.isHost(user_id, gameId);

//   if (isHost) {
//     // Delete the game and related data
//     await Game.deleteGame(gameId);
//   } else {
//     // Optionally: just remove the user from the game
//     await Game.leaveGame(user_id, gameId);
//   }

//   response.redirect("/lobby");
// });

router.get("/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;

  // @ts-ignore
  const username = request.session.username;

  const { game_room_name } = await Game.getGameNameById(Number(gameId));

  // @ts-ignore
  response.render("games", { gameId, username, game_name: game_room_name });
});

export default router;
