import dotenv from "dotenv";
import path from "path";
import webpack from "webpack";

dotenv.config();

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

const config: webpack.Configuration = {
  mode,
  entry: {
    main: path.join(process.cwd(), "src", "client", "utils", "index.ts"), // Main entry point
    lobby: path.join(process.cwd(), "src", "client", "lobby.ts"), // Lobby entry point
    chat: path.join(process.cwd(), "src", "client", "chat.ts"), // Chat entry point
  },
  output: {
    path: path.join(process.cwd(), "public", "js"),
    filename: "[name].js", // Output file name will match the entry point name (e.g., lobby.js, chat.js)
  },
  module: {
    rules: [{ test: /\.ts$/, use: "ts-loader", exclude: /node_modules/ }],
  },
  resolve: {
    extensions: [".ts", ".js"], // Add .ts to resolve TypeScript files
  },
};

export default config;
