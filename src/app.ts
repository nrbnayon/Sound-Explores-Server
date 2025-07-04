// src/app.ts - Update this file with the proper middleware configuration
import express from "express";
import cors from "cors";
import router from "./app/routes";
import http from "http";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { noRouteFound } from "./app/utils/noRouteFound";
import cookieParser from "cookie-parser";
import path from "path";
import logger from "./app/utils/logger";
import { UserController } from "./app/modules/users/user/user.controller";
const app = express();

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
    "https://poopalert.com",
    "https://www.poopalert.fun",
    "api.poopalert.fun",
    "https://api.poopalert.fun",
    "poopalert.online",
    "www.poopalert.online",
    "api.poopalert.online",
    "https://poopalert.online",
    "https://www.poopalert.online",
    "https://api.poopalert.online",
    "https://api.poop-alert.com",
    "poop-alert.com",
    "www.poop-alert.com",
    "api.poop-alert.com",
    "https://poop-alert.com",
    "https://www.poop-alert.com",
    "https://api.poop-alert.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());

// Webhook handler with raw body parsing - MUST be before other body parsers
app.post(
  "/my-webhook/stripe",
  express.raw({ type: "application/json" }),
  UserController.handleWebhook
);

// Fix: Parse both JSON and text/plain content types
app.use(express.json({ limit: "200mb" }));
app.use(express.text({ type: "text/plain", limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

app.use((req, res, next) => {
  if (
    req.headers["content-type"] === "text/plain" &&
    typeof req.body === "string"
  ) {
    try {
      req.body = JSON.parse(req.body);
    } catch (error) {
      logger.error("Error parsing text/plain as JSON:", error);
    }
  }
  next();
});
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello World! This app name is Sound Explore");
});

app.use(globalErrorHandler);
app.use(noRouteFound);
const server = http.createServer(app);

export default server;
