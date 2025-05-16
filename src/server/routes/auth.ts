import express from "express";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../db/connection"; // Import your database connection
import { Game } from "../db";

import User from "../db/users";

const router = express.Router();

// Register
router.get("/register", async (_request: Request, response: Response) => {
  response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  try {
    // Create a record in the users table for the user (email, encrypted password)
    const user_id = await User.register(username, password);

    // @ts-ignore
    request.session.user_id = user_id; // store userId in session
    // @ts-ignore
    request.session.username = username;

    // Redirect to lobby after successful registration
    response.redirect("/lobby");
  } catch (error) {
    console.error("Registration error: ", error);
    response.render("auth/register", {
      error: "An error occured when registering.",
    });
  }
});

// Login
router.get("/login", async (_request: Request, response: Response) => {
  response.render("auth/login", { error: null });
});

router.post("/login", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  try {
    const user_id = await User.login(username, password);

    // @ts-ignore
    request.session.user_id = user_id; // store userId in session
    // @ts-ignore
    request.session.username = username;
    // @ts-ignore
    const user = await db.oneOrNone(
      "SELECT game_room_id FROM users WHERE user_id = $1",
      // @ts-ignore
      [request.session.user_id],
    );

    // If user is already in a game, redirect to game_room instead of lobby
    if (user && user.game_room_id) {
      // Redirect to the game page if in a game
      return response.redirect(`/games/${user.game_room_id}`);
    } else {
      // Otherwise, go to the lobby
      return response.redirect("/lobby");
    }

    response.redirect("/lobby");
  } catch (error) {
    console.error("Login error: ", error);
    response.render("auth/login", { error: "Invalid email or password" });
  }
});

router.get("/logout", async (request: Request, response: Response) => {
  // @ts-ignore
  const user_id = request.session.user_id;

  // Find if the user is hosting any game
  const game = await db.oneOrNone(
    "SELECT game_room_id FROM game_room WHERE game_room_host_user_id = $1",
    [user_id],
  );

  if (game) {
    // If user is host, delete the game
    await Game.deleteGame(game.game_room_id);
  } else {
    // Otherwise, just remove user from any game
    await db.none("UPDATE users SET game_room_id = NULL WHERE user_id = $1", [
      user_id,
    ]);
  }

  request.session.destroy(() => {
    response.redirect("/");
  });
});

export default router;
