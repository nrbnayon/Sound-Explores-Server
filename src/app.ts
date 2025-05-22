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
const app = express();

const corsOption = {
  origin: [
    "http://localhost:5173",
    "http://192.168.10.12:5173",
    "http://31.97.15.225:3000",
    "http://31.97.15.225:5173",
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());

// Fix: Parse both JSON and text/plain content types
app.use(express.json());
app.use(express.text({ type: "text/plain" }));
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
