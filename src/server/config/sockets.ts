import { Server } from "socket.io";
import type { Express, RequestHandler } from "express";

const configureSockets = (
  io: Server,
  app: Express,
  sessionMiddleware: RequestHandler,
) => {
  app.set("io", io);

  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    // Log the entire session object for debugging
    // @ts-ignore
    console.log("Session data:", socket.request.session);

    // Extract user_id and username from the session
    // @ts-ignore
    const { user_id, username } = socket.request.session;

    if (user_id && username) {
      console.log(`User [${username}] connected with session id ${socket.id}`);
      socket.join(user_id.toString()); // Ensure user_id is a string for room names
    } else {
      console.warn("User session data is missing or incomplete.");
    }

    socket.on("disconnect", () => {
      if (user_id && username) {
        console.log(`User [${username}] disconnected`);
        socket.leave(user_id.toString());
      }
    });
  });
};
export default configureSockets;
