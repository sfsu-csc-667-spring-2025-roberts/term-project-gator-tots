import type { Express } from "express";
import type { Server } from "socket.io";
import { sessionMiddleware } from "./sessions";

const configureSockets = (io: Server, app: Express) => {
  app.set("io", io);

  io.engine.use(sessionMiddleware); // gives us sessionMiddleware in the context of our socket

  io.on("connection", (socket) => {
    // @ts-ignore
    const { id, user } = socket.request.session;
    console.log(socket.request.session);

    console.log(
      `User [${user.user_id}] connected: ${user.username} with session id ${id}`,
    );

    socket.join(user.id);

    socket.on("disconnect", () => {
      console.log(
        `User [${user.user_id}] disconnected: ${user.username} with session id ${id}`,
      );
    });
  });
};

export default configureSockets;
