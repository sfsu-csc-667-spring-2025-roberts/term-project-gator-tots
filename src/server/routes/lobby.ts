import express from "express";
import { Request, Response } from "express";
import db from "../db/connection";

const router = express.Router();

router.get("/", async (request: Request, response: Response) => {
  try {
    // @ts-ignore
    const userId = request.session.userId;

    // Fetch the username from the database
    const { username } = await db.one(
      "SELECT username FROM users WHERE user_id = $1",
      [userId],
    );

    // Render the lobby view with the username
    response.render("lobby", { username });
  } catch (error) {
    console.error("Error fetching username:", error);
    response.status(500).send("Internal Server Error");
  }
});

export default router;
