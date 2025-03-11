import { NextFunction, Request, Response } from "express";

const timeMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  console.log("Request made at ${new Date()}");
};

export { timeMiddleware };
