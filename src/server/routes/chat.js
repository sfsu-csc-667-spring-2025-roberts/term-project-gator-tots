"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection")); // Import your database connection
const router = express_1.default.Router();
router.post("/:roomId", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
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
      yield connection_1.default.none(
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
  }),
);
router.get("/:roomId/messages", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = request.params;
    try {
      const messages = yield connection_1.default.any(
        "SELECT username AS username, message_content, timestamp FROM message WHERE game_room_game_room_id = $1 ORDER BY timestamp ASC",
        [roomId],
      );
      response.json(messages);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      response.status(500).send("Internal Server Error");
    }
  }),
);
exports.default = router;
