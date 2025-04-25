import type { Request, Response, NextFunction } from "express";

const authMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const { roomId } = request.params;

  if (roomId == undefined && request.url.includes("lobby")) {
    response.locals.roomId = 0;
    response.locals.deck_id = 0;
    response.locals.game_card_pile_id = 0;
  } else if (roomId !== undefined) {
    response.locals.roomId = roomId;
  }

  next();
};

export default authMiddleware;
