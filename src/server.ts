/* eslint-disable no-console */

import server from "./app";
import { appConfig } from "./app/config";
import mongoose from "mongoose";
import logger from "./app/utils/logger";
import seedAdmin from "./app/DB";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection:", err);

  process.exit(1);
});

const main = async () => {
  await mongoose.connect(appConfig.database.dataBase_uri as string);
  logger.info("MongoDB connected");
await seedAdmin();
  server.listen(
    Number(appConfig.server.port),
    appConfig.server.ip as string,
    () => {
      logger.info(
        `Example app listening on port ${appConfig.server.port} & ip:${
          appConfig.server.ip as string
        }`
      );
    }
  );
};
main().catch((err) => logger.error("Error connecting to MongoDB:", err));
