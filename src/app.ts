import express from "express";
import cors from "cors";
import router from "./app/routes";
import http from "http";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { noRouteFound } from "./app/utils/noRouteFound";
import cookieParser from "cookie-parser";
import path from "path";
const app = express();

const corsOption = {
  origin: ["*"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOption));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello World! This app name is Ai_Finance_Hub");
});

app.use(express.static(path.join(process.cwd(), "uploads")));

app.use(globalErrorHandler);
app.use(noRouteFound);
const server = http.createServer(app);

export default server;
