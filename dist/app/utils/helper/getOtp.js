"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getOtp = (digits) => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp;
};
exports.default = getOtp;
