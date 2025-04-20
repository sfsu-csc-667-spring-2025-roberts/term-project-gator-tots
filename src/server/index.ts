import * as path from "path";

import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import livereload from "livereload";
import connectLivereload from "connect-livereload";

import * as routes from "./routes";
import * as config from "./config";

console.log("Imported auth:", routes.auth);

// Import or define sessionMiddleware
import * as middleware from "./middleware/auth";

import dotenv from "dotenv";

dotenv.config();
const app = express();

console.log("Database URL:", process.env.DATABASE_URL);

const PORT = process.env.PORT || 3000;

config.liveReload(app);
config.session(app);

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
