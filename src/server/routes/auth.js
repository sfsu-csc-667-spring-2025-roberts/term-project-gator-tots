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
const users_1 = __importDefault(require("../db/users"));
const router = express_1.default.Router();
// Register
router.get("/register", (_request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    response.render("auth/register");
  }),
);
router.post("/register", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST /register route hit");
    const { username, password } = request.body;
    // console.log("Username: " + request.body);
    // console.log("Password: " + password);
    try {
      // Create a record in the users table for the user (email, encrypted password)
      const user_id = yield users_1.default.register(username, password);
      // @ts-ignore
      request.session.user_id = user_id; // store userId in session
      // @ts-ignore
      request.session.username = username;
      // Redirect to lobby after successful registration
      response.redirect("/lobby");
    } catch (error) {
      console.error("Registration error: ", error);
      response.render("auth/register", {
        error: "An error occured when registering.",
      });
    }
  }),
);
// Login
router.get("/login", (_request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    response.render("auth/login", { error: null });
  }),
);
router.post("/login", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = request.body;
    try {
      const user_id = yield users_1.default.login(username, password);
      // @ts-ignore
      request.session.user_id = user_id; // store userId in session
      // @ts-ignore
      request.session.username = username;
      response.redirect("/lobby");
    } catch (error) {
      console.error("Login error: ", error);
      response.render("auth/login", { error: "Invalid email or password" });
    }
  }),
);
router.get("/logout", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    request.session.destroy(() => {
      response.redirect("/");
    });
  }),
);
exports.default = router;
