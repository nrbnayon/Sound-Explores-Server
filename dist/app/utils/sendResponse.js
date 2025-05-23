"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, data) => {
    res.status(data.statusCode).send({
        success: data.success,
        message: data.message,
        statusCode: data.statusCode,
        data: data.data,
        meta: data.meta,
    });
};
exports.default = sendResponse;
