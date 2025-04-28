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
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
router.get("/", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // @ts-ignore
      const user_id = request.session.user_id;
      // Fetch the username from the database
      const { username } = yield connection_1.default.one(
        'SELECT username FROM "GatorTotsDb"."users" WHERE user_id = $1',
        [user_id],
      );
      // Render the lobby view with the username
      response.render("lobby", { username });
    } catch (error) {
      console.error("Error fetching username:", error);
      response.status(500).send("Internal Server Error");
    }
  }),
);
exports.default = router;
