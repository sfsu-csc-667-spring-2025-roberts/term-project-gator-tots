"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeMiddleware = void 0;
const timeMiddleware = (_request, response, next) => {
  const currentTime = new Date().toISOString();
  console.log(`Current Time: ${currentTime}`);
  response.locals.currentTime = currentTime; // Store the time in response locals
  next();
};
exports.timeMiddleware = timeMiddleware;
