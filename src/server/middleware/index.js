"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.room = exports.auth = void 0;
var auth_1 = require("./auth");
Object.defineProperty(exports, "auth", {
  enumerable: true,
  get: function () {
    return __importDefault(auth_1).default;
  },
});
var room_1 = require("./room");
Object.defineProperty(exports, "room", {
  enumerable: true,
  get: function () {
    return __importDefault(room_1).default;
  },
});
