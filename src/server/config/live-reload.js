"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const configureReload = (app) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const reloadServer = require("livereload").createServer();
  const connectLivereload = require("connect-livereload");
  reloadServer.watch(path_1.default.join(process.cwd(), "public", "js", "ejs"));
  reloadServer.server.once("connection", () => {
    setTimeout(() => {
      reloadServer.refresh("/");
    }, 100);
  });
  app.use(connectLivereload());
};
exports.default = configureReload;
