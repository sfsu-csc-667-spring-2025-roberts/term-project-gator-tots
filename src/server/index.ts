import * as path from "path";

import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

import * as routes from "./routes";
console.log("Imported auth:", routes.auth);

import dotenv from "dotenv";

dotenv.config();
const app = express();

if (process.env.NODE_ENV !== "production") {
  const reloadServer = livereload.createServer();

  reloadServer.watch(path.join(process.cwd(), "public", "js"));
  reloadServer.server.once("connection", () => {
    setTimeout(() => {
      reloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLivereload());
}

console.log("Database URL:", process.env.DATABASE_URL);

const PORT = process.env.PORT || 3000;

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

app.use("/promise_version", routes.test);

app.use((req, res, next) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  next(httpErrors(404));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
