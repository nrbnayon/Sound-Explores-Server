"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts - Update this file with the proper middleware configuration
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const http_1 = __importDefault(require("http"));
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const noRouteFound_1 = require("./app/utils/noRouteFound");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./app/utils/logger"));
const app = (0, express_1.default)();
const corsOption = {
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://192.168.10.12:3000",
        "http://192.168.10.12:5173",
        "http://31.97.15.225:3000",
        "http://31.97.15.225:5173",
        "http://31.97.15.225:4500",
        "poopalert.fun",
        "www.poopalert.fun",
        "www.poopalert.fun",
        "https://poopalert.fun",
        "https://www.poopalert.fun",
        "api.poopalert.fun",
        "https://api.poopalert.fun",
    ],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOption));
app.use((0, cookie_parser_1.default)());
// Fix: Parse both JSON and text/plain content types
app.use(express_1.default.json());
app.use(express_1.default.text({ type: "text/plain" }));
app.use((req, res, next) => {
    if (req.headers["content-type"] === "text/plain" &&
        typeof req.body === "string") {
        try {
            req.body = JSON.parse(req.body);
        }
        catch (error) {
            logger_1.default.error("Error parsing text/plain as JSON:", error);
        }
    }
    next();
});
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.send("Hello World! This app name is Sound Explore");
});
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(noRouteFound_1.noRouteFound);
const server = http_1.default.createServer(app);
exports.default = server;
