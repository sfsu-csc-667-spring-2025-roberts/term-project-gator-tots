import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import type { Express, RequestHandler } from "express";

let sessionMiddleware: RequestHandler | undefined = undefined;

const setupSessions = (app: Express) => {
  if (sessionMiddleware === undefined) {
    const pgSession = connectPgSimple(session);

    sessionMiddleware = session({
      store: new pgSession({
        createTableIfMissing: true, // automatically creates table in db for cookie storage
      }),
      secret: process.env.SESSION_SECRET!, // provides 'secret' to encrypt cookie info, '!' tells typescript to trust that variable is defined
      resave: true, // updates session everytime a request comes in
      saveUninitialized: false, // creates a record in the session table even without authenticated user
    });

    console.log("Setting up app to use sessionMiddleware from session.ts");

    app.use(sessionMiddleware);
  }

  return sessionMiddleware;
};

export default setupSessions;
export { sessionMiddleware };
