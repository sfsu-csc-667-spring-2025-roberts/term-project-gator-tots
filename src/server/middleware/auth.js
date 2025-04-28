"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware = (request, response, next) => {
  // @ts-ignore
  if (request.session.user_id !== undefined) {
    // @ts-ignore
    response.locals.user_id = request.session.user_id; // add stored userId to 'locals' which is accessible by all views
    next();
  } else {
    response.redirect("/auth/login");
  }
  // Check if the session is initialized
};
exports.default = authMiddleware;
