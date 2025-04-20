"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const handleDuplicateError = (err) => {
    const match = err.message.match(/"([^"]*)"/);
    const extractedMessage = match && match[1];
    const errors = [
        {
            path: "",
            message: `${extractedMessage} is already exists`,
        },
    ];
    const statusCode = 400;
    return {
        statusCode,
        message: `Invalid: ${extractedMessage} is already exists`,
        errors,
    };
};
exports.default = handleDuplicateError;
