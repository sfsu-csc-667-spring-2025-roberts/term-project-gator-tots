import * as path from "path";

import express from "express";
import rootRoutes from "./routes/root";
import testRouter from "./routes/test";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import dotenv from "dotenv";
dotenv.config();

console.log("Database URL:", process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "src", "public")));
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);

app.use("/test", testRouter);
app.use("/promise_version", testRouter);

app.use((_request, _response, next) => {
  next(httpErrors(404));
});

app.listen(PORT, () => {
  console.log("Server is running on port ${PORT}");
});
