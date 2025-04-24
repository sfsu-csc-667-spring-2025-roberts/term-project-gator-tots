import dotenv from "dotenv";
import path from "path";
import webpack from "webpack";

dotenv.config();

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

const config: webpack.Configuration = {
  mode,
  entry: {
    main: path.join(process.cwd(), "src", "client", "index.ts"),
    socket: path.join(process.cwd(), "src", "client", "socket", "index.ts"),
    chat: path.join(process.cwd(), "src", "client", "chat", "index.ts"),
  },
  output: {
    path: path.join(process.cwd(), "public", "js"),
    filename: "[name].js",
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ }],
  },
  resolve: {
    extensions: [".ts", ".js"], // Add .ts to resolve TypeScript files
  },
};

export default config;
