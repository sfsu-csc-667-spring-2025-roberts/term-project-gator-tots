import { NextFunction, Request, Response } from "express";

const sessionMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  // @ts-ignore
  if (request.session.userId !== undefined) {
    // @ts-ignore
    response.locals.userId = request.session.userId; // add stored userId to 'locals' which is accessible by all views
    next();
  } else {
    response.redirect("/auth/login");
  }
  // Check if the session is initialized
};

export { sessionMiddleware };
