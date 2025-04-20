"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppError_1 = __importDefault(require("../errors/AppError"));
const mongoose_1 = __importDefault(require("mongoose"));
const zodErrorHandler_1 = require("../errors/zodErrorHandler");
const mongooseErrorHandler_1 = require("../errors/mongooseErrorHandler");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const MulterErrorHandler_1 = __importDefault(require("../errors/MulterErrorHandler"));
const logger_1 = __importDefault(require("../utils/logger"));
const globalErrorHandler = (err, req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong!";
    let errors = [];
    if (err instanceof mongoose_1.default.Error) {
        const mongooseError = (0, mongooseErrorHandler_1.handleMongooseError)(err);
        statusCode = mongooseError.statusCode;
        message = mongooseError.message;
        errors = mongooseError.errors;
    }
    else if ((err === null || err === void 0 ? void 0 : err.name) === "ValidationError") {
        const mongooseError = (0, mongooseErrorHandler_1.handleMongooseError)(err);
        statusCode = mongooseError.statusCode;
        message = mongooseError.message;
        errors = mongooseError.errors;
    }
    else if (err instanceof zod_1.ZodError) {
        const zodError = (0, zodErrorHandler_1.handleZodError)(err);
        statusCode = zodError.statusCode;
        message = zodError.message;
        errors = zodError.errors;
    }
    else if ((err === null || err === void 0 ? void 0 : err.name) === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired. Please login again.";
        errors = [
            {
                path: "token",
                message: message,
            },
        ];
    }
    else if (err instanceof multer_1.default.MulterError) {
        const multerError = (0, MulterErrorHandler_1.default)(err);
        statusCode = multerError.statusCode;
        message = multerError.message;
        errors = multerError.errors;
    }
    else if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errors = [
            {
                path: "",
                message: err.message,
            },
        ];
    }
    else if (err instanceof Error) {
        message = err.message;
        errors = [
            {
                path: "",
                message: err.message,
            },
        ];
    }
    logger_1.default.error(message);
    res.status(statusCode).json(Object.assign({ success: false, status: statusCode, message, errors: errors.length ? errors : undefined }, (process.env.NODE_ENV === "development" && { stack: err.stack })));
});
exports.globalErrorHandler = globalErrorHandler;
