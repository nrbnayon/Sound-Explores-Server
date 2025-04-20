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
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const mongoose_1 = require("mongoose");
const auth_interface_1 = require("../../../interface/auth.interface");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: auth_interface_1.userRole, default: "USER" },
    authentication: {
        expDate: { type: Date, default: null },
        otp: { type: Number, default: null },
        token: { type: String, default: null },
    },
    isVerified: { type: Boolean, default: false },
    needToResetPass: { type: Boolean, default: false },
});
userSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield bcryptjs_1.default.compare(enteredPassword, this.password);
        }
        catch (error) {
            throw new Error("Error comparing password");
        }
    });
};
const User = (0, mongoose_1.model)("User", userSchema);
exports.default = User;
