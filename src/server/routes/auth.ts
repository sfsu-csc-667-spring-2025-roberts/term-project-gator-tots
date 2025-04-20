import express from "express";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

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
    request.session.userId = user_id; // store userId in session

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
    const userId = await User.login(username, password);

    // @ts-ignore
    request.session.userId = userId; // store userId in session

    response.redirect("/lobby");
  } catch (error) {
    console.error("Login error: ", error);
    response.render("auth/login", { error: "Invalid email or password" });
  }
});

router.get("/logout", async (request: Request, response: Response) => {
  request.session.destroy(() => {
    response.redirect("/");
  });
});

export default router;
