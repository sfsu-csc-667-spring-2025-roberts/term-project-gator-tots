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
router.get("/", (_request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Insert a new row into the test_table
      yield connection_1.default.none(
        "INSERT INTO test_table (test_string) VALUES ($1)",
        [`Test string ${new Date().toISOString()}`],
      );
      // Fetch all rows from the test_table
      response.json(yield connection_1.default.any("SELECT * FROM test_table"));
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "An error occurred" });
    }
  }),
);
router.get("/promise_version", (request, response) => {
  connection_1.default
    .none("INSERT INTO test_table (test_string) VALUES ($1)", [
      `Test string ${new Date().toISOString()}`,
    ])
    .then(() => {
      return connection_1.default.any("SELECT * FROM test_table");
    })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ error: "Internal Service Error" });
    });
});
router.get("/socket", (request, response) => {
  const io = request.app.get("io");
  console.log("Session data: ", request.session);
  io.emit("test", {
    // @ts-ignore
    user: request.session.username,
    // @ts-ignore
    userId: request.session.user_id,
  });
  // @ts-ignore
  io.to(request.session.user_id).emit("test", { secret: "hi" }); // send message to specific user
  response.json({ message: "Socket event emitted" });
});
exports.default = router;
