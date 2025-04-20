import * as path from "path";
import * as http from "http";

import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import dotenv from "dotenv";
dotenv.config();

import * as routes from "./routes";
import * as config from "./config";
import * as middleware from "./middleware/auth";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

config.liveReload(app);
config.session(app);
config.sockets(io, app);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../../public")));
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

app.use("/", routes.root);
app.use("/test", routes.test);
app.use("/auth", routes.auth);
app.use("/lobby", middleware.sessionMiddleware, routes.lobby);
app.use("/promise_version", routes.test);

app.use((req, res, next) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  next(httpErrors(404));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
