"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelativePath = void 0;
const path_1 = __importDefault(require("path"));
const getRelativePath = (filePath) => {
    if (!filePath) {
        throw new Error("Path not found.");
    }
    const uploadDir = path_1.default.join(process.cwd(), "uploads"); // Root of the uploads folder
    const relativePath = path_1.default.relative(uploadDir, filePath); // Get the relative path from 'uploads'
    // Replace backslashes with forward slashes for uniformity and add a leading "/"
    return "/" + relativePath.replace(/\\/g, "/");
};
exports.getRelativePath = getRelativePath;
