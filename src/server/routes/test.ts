import express from "express";
import { Request, Response } from "express";
import db from "../db/connection";
import type { Server } from "socket.io";

const router = express.Router();

router.get("/", async (_request: Request, response: Response) => {
  try {
    // Insert a new row into the test_table
    await db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
      `Test string ${new Date().toISOString()}`,
    ]);

    // Fetch all rows from the test_table
    response.json(await db.any("SELECT * FROM test_table"));
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "An error occurred" });
  }
});

router.get("/promise_version", (request: Request, response: Response) => {
  db.none("INSERT INTO test_table (test_string) VALUES ($1)", [
    `Test string ${new Date().toISOString()}`,
  ])
    .then(() => {
      return db.any("SELECT * FROM test_table");
    })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ error: "Internal Service Error" });
    });
});

router.get("/socket", (request: Request, response: Response) => {
  const io: Server = request.app.get("io");

  console.log("Session data: ", request.session);

  io.emit("test", {
    // @ts-ignore
    user: request.session.username,
    // @ts-ignore
    userId: request.session.user_id,
  });

  // @ts-ignore
  io.to(request.session.user_id).emit("test", { secret: "hi" }); // send message to specific user

  response.json({ message: "Socket event emitted" });
});

router.post("/test-actual-simple", (request: Request, response: Response) => {
  response.json({ message: "Test simple route OK" });
});

export default router;
