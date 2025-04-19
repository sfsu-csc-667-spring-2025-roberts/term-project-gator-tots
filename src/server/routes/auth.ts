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
    const userId = await User.register(username, password);

    // Automatically log the user in

    response.json({ userId });
  } catch (error) {
    response.render("auth/register", {
      error: "An error occured when registering.",
    });
  }
});

// Login
router.get("/login", async (_request: Request, response: Response) => {
  response.render("auth/login");
});

router.post("/login", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  try {
    const userId = await User.login(username, password);

    response.json({ userId });
  } catch (error) {
    response.render("auth/login", { error: "Invalid email or password" });
  }
});

export default router;
