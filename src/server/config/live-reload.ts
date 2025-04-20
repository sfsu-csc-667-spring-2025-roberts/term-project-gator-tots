import path from "path";

import type { Express } from "express";

const configureReload = (app: Express) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const reloadServer = require("livereload").createServer();
  const connectLivereload = require("connect-livereload");

  reloadServer.watch(path.join(process.cwd(), "public", "js", "ejs"));
  reloadServer.server.once("connection", () => {
    setTimeout(() => {
      reloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLivereload());
};

export default configureReload;
