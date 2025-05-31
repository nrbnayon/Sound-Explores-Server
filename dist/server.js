"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect(config_1.appConfig.database.dataBase_uri);
        logger_1.default.info("MongoDB connected");
        // Seed admin data
        yield (0, DB_1.default)();
        logger_1.default.info("Admin seeding completed");
        // Start the server
        app_1.default.listen(Number(config_1.appConfig.server.port), config_1.appConfig.server.ip, () => {
            // Enhanced console output with proper formatting
            logger_1.default.info(`
╔═════════════════════════════════════╗
║  🚀 Server launched successfully!   ║
║  🌐 Running on: ${config_1.appConfig.server.ip}:${config_1.appConfig.server
                .port.toString()
                .padStart(4, " ")}      ║
╚═════════════════════════════════════╝`);
        });
    }
    catch (error) {
        logger_1.default.error("Failed to start server:", error);
        process.exit(1);
    }
});
// Call the main function and handle any unhandled promise rejections
main().catch((error) => {
    logger_1.default.error("Unhandled error in main function:", error);
    process.exit(1);
});
