"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminProfile = void 0;
const mongoose_1 = require("mongoose");
const adminProfileSchema = new mongoose_1.Schema({
    fullName: { type: String },
    nickname: { type: String },
    dateOfBirth: { type: Date },
    email: { type: String, unique: true },
    phone: { type: String },
    address: { type: String },
    image: { type: String },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", unique: true },
});
exports.AdminProfile = (0, mongoose_1.model)("AdminProfile", adminProfileSchema);
