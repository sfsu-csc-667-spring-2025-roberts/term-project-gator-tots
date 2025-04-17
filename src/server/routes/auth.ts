import express from "express";
import { Request, Response } from "express";

const router = express.Router();

router.get("/register", async (_request: Request, response: Response) => {
  response.send("Register");
});

router.get("/login", async (_request: Request, response: Response) => {
  response.send("Login");
});

export default router;
