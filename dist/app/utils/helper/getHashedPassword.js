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
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
const config_1 = require("../../config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getHashedPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield bcryptjs_1.default.hash(password, Number(config_1.appConfig.bcrypt.salt_round));
    }
    catch (error) {
        throw new Error("Error hashing password");
    }
});
exports.default = getHashedPassword;
