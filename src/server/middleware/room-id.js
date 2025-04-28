"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware = (request, response, next) => {
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
exports.default = authMiddleware;
