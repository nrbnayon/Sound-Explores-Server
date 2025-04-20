/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";

import AppError from "../errors/AppError";
import mongoose from "mongoose";
import { handleZodError } from "../errors/zodErrorHandler";

import { ZodError } from "zod";
import multer from "multer";
import multerErrorHandler from "../errors/MulterErrorHandler";
import logger from "../utils/logger";

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong!";
  let errors: any = [];

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
  } else if (err.code === 11000) {
    statusCode = 400;
    message = `${Object.keys(err.keyValue).join(", ")} already exist`;
    errors = [
      {
        field: "",
        message: `Duplicate key error: ${Object.keys(err.keyValue).join(", ")}`,
      },
    ];
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
    errors = [
      {
        field: err.path,
        message: `Invalid value for ${err.path}`,
      },
    ];
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
  } else if (err instanceof ZodError) {
    const zodError = handleZodError(err);
    statusCode = zodError.statusCode;
    message = zodError.message;
    errors = zodError.errors;
  } else if (err?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please login again.";
    errors = [
      {
        path: "token",
        message: message,
      },
    ];
  } else if (err instanceof multer.MulterError) {
    const multerError = multerErrorHandler(err);
    statusCode = multerError.statusCode;
    message = multerError.message;
    errors = multerError.errors;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errors = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  logger.error(err);
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    errors: errors.length ? errors : undefined,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
