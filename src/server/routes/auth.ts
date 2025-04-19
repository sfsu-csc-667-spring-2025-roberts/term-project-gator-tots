import express from "express";
import { Request, Response } from "express";

const router = express.Router();

router.get("/register", async (_request: Request, response: Response) => {
  response.render("auth/register");
});

router.post("/register", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  response.json({ username, password });
});

router.get("/login", async (_request: Request, response: Response) => {
  response.render("auth/login");
});

router.post("/login", async (request: Request, response: Response) => {
  const { username, password } = request.body;

  response.json({ username, password });
});

export default router;
