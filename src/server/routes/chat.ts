import express from "express";
import { Request, Response } from "express";
import { ChatMessage } from "global";
import db from "../db/connection";
import socket from "../config/sockets";
import { cloneTemplate, getRoomId } from "../../client/utils";

const router = express.Router();

router.post("/:roomId", async (request: Request, response: Response) => {
  const { roomId } = request.params;
  const { message } = request.body;

  // @ts-ignore
  const username = request.session.username;
  // @ts-ignore
  const user_id = request.session.user_id;
  // @ts-ignore
  console.log("user id from server-side chat.ts", request.session.user_id);
  const io = request.app.get("io");

  if (!io) {
    response.status(500).send("Socket.io not initialized");
    return;
  }

  if (!message) {
    response.status(400).send("Message is required");
    return;
  }

  try {
    // Save the message to the database
    await db.none(
      "INSERT INTO message (game_room_game_room_id, username, message_content, user_user_id) VALUES ($1, $2, $3, $4)",
      [roomId, username, message, user_id],
    );

    // Emit the message to the room
    io.emit(`chat:message:${roomId}`, {
      message,
      sender: { username },
      timestamp: new Date(),
    });

    response.status(200).send();
  } catch (error) {
    console.error("Error saving message:", error);
    response.status(500).send("Internal Server Error");
  }
});

router.get(
  "/:roomId/messages",
  async (request: Request, response: Response) => {
    const { roomId } = request.params;

    try {
      const messages = await db.any(
        "SELECT username AS username, message_content, timestamp FROM message WHERE game_room_game_room_id = $1 ORDER BY timestamp ASC",
        [roomId],
      );

      response.json(messages);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      response.status(500).send("Internal Server Error");
    }
  },
);

export default router;
