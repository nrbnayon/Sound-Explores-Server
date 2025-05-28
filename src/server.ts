
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
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.dataBase_uri as string);
    logger.info("MongoDB connected");

    // Seed admin data
    await seedAdmin();
    logger.info("Admin seeding completed");

    // Start the server
    server.listen(
      Number(appConfig.server.port),
      appConfig.server.ip as string,
      () => {
        // Enhanced console output with proper formatting
        logger.info(`
╔═════════════════════════════════════╗
║  🚀 Server launched successfully!   ║
║  🌐 Running on: ${appConfig.server.ip}:${appConfig.server
          .port!.toString()
          .padStart(4, " ")}      ║
╚═════════════════════════════════════╝`);
      }
    );
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Call the main function and handle any unhandled promise rejections
main().catch((error) => {
  logger.error("Unhandled error in main function:", error);
  process.exit(1);
});
