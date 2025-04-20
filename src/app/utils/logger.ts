/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const env = process.env.NODE_ENV || "development";
const logDir = path.join(process.cwd(), "logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDir, "%DATE%-app.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
});

const errorFilter = format((info) => (info.level === "error" ? info : false));

const exceptionHandlers = [
  new DailyRotateFile({
    filename: path.join(logDir, "%DATE%-exceptions.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    format: format.combine(errorFilter(), format.timestamp(), format.json()),
  }),
];

const rejectionHandlers = [
  new DailyRotateFile({
    filename: path.join(logDir, "%DATE%-rejections.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    format: format.combine(errorFilter(), format.timestamp(), format.json()),
  }),
];

const logger = createLogger({
  level: env === "development" ? "debug" : "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "your-service-name" },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    dailyRotateFileTransport,
  ],
  exceptionHandlers,
  rejectionHandlers,
});

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
