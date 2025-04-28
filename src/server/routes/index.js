"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.games =
  exports.chat =
  exports.lobby =
  exports.auth =
  exports.test =
  exports.root =
    void 0;
var root_1 = require("./root");
Object.defineProperty(exports, "root", {
  enumerable: true,
  get: function () {
    return __importDefault(root_1).default;
  },
});
var test_1 = require("./test");
Object.defineProperty(exports, "test", {
  enumerable: true,
  get: function () {
    return __importDefault(test_1).default;
  },
});
var auth_1 = require("./auth");
Object.defineProperty(exports, "auth", {
  enumerable: true,
  get: function () {
    return __importDefault(auth_1).default;
  },
});
var lobby_1 = require("./lobby");
Object.defineProperty(exports, "lobby", {
  enumerable: true,
  get: function () {
    return __importDefault(lobby_1).default;
  },
});
var chat_1 = require("./chat");
Object.defineProperty(exports, "chat", {
  enumerable: true,
  get: function () {
    return __importDefault(chat_1).default;
  },
});
var games_1 = require("./games");
Object.defineProperty(exports, "games", {
  enumerable: true,
  get: function () {
    return __importDefault(games_1).default;
  },
});
