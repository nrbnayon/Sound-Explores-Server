"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./app/routes"));
const http_1 = __importDefault(require("http"));
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const noRouteFound_1 = require("./app/utils/noRouteFound");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
const corsOption = {
    origin: ["*"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOption));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.send("Hello World! This app name is Ai_Finance_Hub");
});
app.use("/uploads", express_1.default.static("uploads"));
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(noRouteFound_1.noRouteFound);
const server = http_1.default.createServer(app);
exports.default = server;
