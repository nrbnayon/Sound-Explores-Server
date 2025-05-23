"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZodError = void 0;
const handleZodError = (err) => {
    const statusCode = 400;
    const message = "Validation failed!";
    // Map through Zod error issues and format them
    const errors = err.errors.map((e) => ({
        message: e.message,
        path: e.path.join("."),
    }));
    return { statusCode, message, errors };
};
exports.handleZodError = handleZodError;
