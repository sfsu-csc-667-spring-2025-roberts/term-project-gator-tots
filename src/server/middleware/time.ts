import { NextFunction, Request, Response } from "express";

const timeMiddleware = (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  const currentTime = new Date().toISOString();
  console.log(`Current Time: ${currentTime}`);
  response.locals.currentTime = currentTime; // Store the time in response locals

  next();
};

export { timeMiddleware };
