import express from "express";
import { Request, Response } from "express";
import db from "../db/connection";
import { getAvailableGames } from "../db/games";

const router = express.Router();

router.get("/", async (request: Request, response: Response) => {
  try {
    // @ts-ignore
    const user_id = request.session.user_id;

    // Fetch the username from the database
    const { username } = await db.one(
      "SELECT username FROM users WHERE user_id = $1",
      [user_id],
    );
    const games = await getAvailableGames();
    // Render the lobby view with the username
    response.render("lobby", {
      // @ts-ignore
      username: request.session?.username,
      games,
    });
  } catch (error) {
    console.error("Error fetching username:", error);
    response.status(500).send("Internal Server Error");
  }
});

export default router;
