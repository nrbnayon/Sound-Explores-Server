"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganStream = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env = process.env.NODE_ENV || "development";
const logDir = path_1.default.join(process.cwd(), "logs");
// Create logs directory if it doesn't exist
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const dailyRotateFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(logDir, "%DATE%-app.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    level: "info",
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
});
const errorFilter = (0, winston_1.format)((info) => (info.level === "error" ? info : false));
const exceptionHandlers = [
    new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDir, "%DATE%-exceptions.log"),
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
        format: winston_1.format.combine(errorFilter(), winston_1.format.timestamp(), winston_1.format.json()),
    }),
];
const rejectionHandlers = [
    new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDir, "%DATE%-rejections.log"),
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "30d",
        format: winston_1.format.combine(errorFilter(), winston_1.format.timestamp(), winston_1.format.json()),
    }),
];
const logger = (0, winston_1.createLogger)({
    level: env === "development" ? "debug" : "info",
    format: winston_1.format.combine(winston_1.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json()),
    defaultMeta: { service: "your-service-name" },
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
        }),
        dailyRotateFileTransport,
    ],
    exceptionHandlers,
    rejectionHandlers,
});
exports.morganStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.default = logger;
