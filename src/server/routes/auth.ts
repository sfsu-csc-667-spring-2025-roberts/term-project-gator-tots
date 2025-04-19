import express from "express";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

import User from "../db/users";

const router = express.Router();

router.get("/register", async (_request: Request, response: Response) => {
  response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
  const { username, password: plainTextPassword } = request.body;

  // Encrypt password
  const encryptedPassword = await bcrypt.hash(plainTextPassword, 10);

  // Create a record in the users table for the user (email, encrypted password)
  const userId = await User.register(username, encryptedPassword);

  // Automatically log the user in

  response.json({ userId });
});

router.get("/login", async (_request: Request, response: Response) => {
  response.render("auth/login");
});

router.post("/login", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  response.json({ username, password });
});

export default router;
