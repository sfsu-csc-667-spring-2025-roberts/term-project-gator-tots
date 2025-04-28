"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
const http_errors_1 = __importDefault(require("http-errors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = __importStar(require("./config"));
const routes = __importStar(require("./routes"));
const middleware = __importStar(require("./middleware"));
const app = (0, express_1.default)();
const server = http.createServer(app);
const io = new socket_io_1.Server(server);
const PORT = process.env.PORT || 3000;
app.use(middleware.room);
config.liveReload(app);
config.sockets(io, app, config.session(app));
app.use((0, morgan_1.default)("dev"));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(
  express_1.default.urlencoded({
    extended: false,
  }),
);
app.use(express_1.default.static(path.join(process.cwd(), "public")));
// app.use(middleware.room);
app.set("views", path.join(process.cwd(), "src", "server", "views"));
app.set("view engine", "ejs");
app.use("/", routes.root);
app.use("/test", routes.test);
app.use("/auth", routes.auth);
app.use("/chat", middleware.auth, routes.chat);
app.use("/lobby", middleware.auth, routes.lobby);
app.use("/games", middleware.auth, routes.games);
app.use(
  "/js",
  express_1.default.static(path.join(process.cwd(), "src", "client", "js")),
);
app.use((_request, _response, next) => {
  next((0, http_errors_1.default)(404));
});
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
