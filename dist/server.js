"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-expressions */

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
const app_1 = __importDefault(require("./app"));
const config_1 = require("./app/config");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./app/utils/logger"));
const DB_1 = __importDefault(require("./app/DB"));
process.on("uncaughtException", (err) => {
  logger_1.default.error("Uncaught exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  logger_1.default.error("Unhandled promise rejection:", err);
  process.exit(1);
});
const main = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(config_1.appConfig.database.dataBase_uri);
    logger_1.default.info("MongoDB connected");
    (0, DB_1.default)();
    app_1.default.listen(
      Number(config_1.appConfig.server.port),
      config_1.appConfig.server.ip,
      () => {
        logger_1.default.info(
          `Example app listening on port ${config_1.appConfig.server.port} & ip:${config_1.appConfig.server.ip}`
        );
      }
    );
  });
main().catch((err) =>
  logger_1.default.error("Error connecting to MongoDB:", err)
);
