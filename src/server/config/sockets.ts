import type { Express } from "express";
import type { Server } from "socket.io";
import { sessionMiddleware } from "./sessions";

const configureSockets = (io: Server, app: Express) => {
  app.set("io", io);
  console.log("Setting up io to use sessionMiddleware");
  io.engine.use(sessionMiddleware); // gives us sessionMiddleware in the context of our socket

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);
    console.log(`Total connections: ${io.sockets.sockets.size}`);
    // @ts-ignore
    const { id, user_id, username } = socket.request.session;

    console.log(
      `User [${username}] connected: ${user_id} with session id ${id}`,
    );

    socket.join(id);

    socket.on("disconnect", () => {
      console.log(
        `User [${username}] disconnected: ${user_id} with session id ${id}`,
      );
    });
  });
};

export default configureSockets;
