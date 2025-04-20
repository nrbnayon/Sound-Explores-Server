"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const multerErrorHandler = (err) => {
    const statusCode = 400;
    const message = "Multer Error";
    const errors = [];
    if (err.code === "LIMIT_FILE_SIZE") {
        const bytes = Number(config_1.appConfig.multer.file_size_limit);
        const megabytes = bytes / (1024 * 1024);
        errors.push({
            field: "",
            message: `File size exceeds the limit of ${megabytes} mb`,
        });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
        errors.push({
            field: "",
            message: `You can upload a maximum of ${config_1.appConfig.multer.max_file_number} files`,
        });
    }
    return { statusCode, message, errors };
};
exports.default = multerErrorHandler;
