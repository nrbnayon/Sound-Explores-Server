"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMongooseError = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// middlewares/mongooseErrorHandler.ts
const mongoose_1 = __importDefault(require("mongoose"));
const handleMongooseError = (err) => {
    let statusCode = 500;
    let message = "Something went wrong!";
    let errors = [];
    // Mongoose Validation Error
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        statusCode = 400;
        message = "Validation failed";
        errors = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));
    }
    // Mongoose Cast Error (invalid ObjectId format)
    if (err instanceof mongoose_1.default.Error.CastError) {
        statusCode = 400;
        message = `Invalid value for ${err.path}`;
        errors = [
            {
                field: err.path,
                message: `Invalid value for ${err.path}`,
            },
        ];
    }
    // Mongoose Duplicate Key Error (e.g., unique constraint violation)
    if (err.code === 11000) {
        statusCode = 400;
        message = `Duplicate key error: ${Object.keys(err.keyValue).join(", ")}`;
        errors = [
            {
                field: "",
                message: `Duplicate key error: ${Object.keys(err.keyValue).join(", ")}`,
            },
        ];
    }
    return { statusCode, message, errors };
};
exports.handleMongooseError = handleMongooseError;
