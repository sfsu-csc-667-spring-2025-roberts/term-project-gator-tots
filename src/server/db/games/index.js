"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("../connection"));
const sql_1 = require("./sql");
const create = (name, minPlayers, maxPlayers, password, user_id) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { id: gameId } = yield connection_1.default.one(sql_1.CREATE_SQL, [
      name,
      minPlayers,
      maxPlayers,
      password,
    ]);
    yield connection_1.default.none(sql_1.ADD_PLAYER, [gameId, user_id]);
    return gameId;
  });
const join = (userId_1, gameId_1, ...args_1) =>
  __awaiter(
    void 0,
    [userId_1, gameId_1, ...args_1],
    void 0,
    function* (userId, gameId, password = "") {
      const { playerCount } = yield connection_1.default.one(
        sql_1.CONDITIONALLY_JOIN_SQL,
        {
          gameId,
          userId,
          password,
        },
      );
      return playerCount;
    },
  );
exports.default = { create, join };
