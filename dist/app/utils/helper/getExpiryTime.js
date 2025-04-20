"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getExpiryTime = (minutes = 10) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes); // Add 10 minutes to the current time
    return now;
};
exports.default = getExpiryTime;
