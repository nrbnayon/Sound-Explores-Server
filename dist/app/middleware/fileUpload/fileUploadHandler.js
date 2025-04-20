"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../../config");
const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/webm",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
];
const getFolder = (mimetype) => {
    if (mimetype.startsWith("image/"))
        return "images";
    if (mimetype.startsWith("video/"))
        return "videos";
    if (mimetype === "application/pdf")
        return "pdfs";
    if (mimetype.startsWith("application/vnd.ms-excel") ||
        mimetype.startsWith("application/vnd.openxmlformats") ||
        mimetype.startsWith("application/msword") ||
        mimetype === "text/plain")
        return "documents";
    return "others";
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const folder = getFolder(file.mimetype);
        const uploadPath = path_1.default.join(process.cwd(), "uploads", folder);
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniquePrefix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: Number(config_1.appConfig.multer.file_size_limit), // max size 100MB
        files: Number(config_1.appConfig.multer.max_file_number), // Maximum number of files allowed
    },
});
