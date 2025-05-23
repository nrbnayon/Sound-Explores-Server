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
exports.SoundController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const getRelativeFilePath_1 = require("../../middleware/fileUpload/getRelativeFilePath");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const sound_service_1 = require("./sound.service");
const addSound = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        throw new Error("No File found.");
    }
    const link = (0, getRelativeFilePath_1.getRelativePath)(req.file.path);
    const soundData = Object.assign(Object.assign({}, req.body), { link });
    const result = yield sound_service_1.SoundService.addSound(soundData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Sound added successfully",
        data: result,
    });
}));
const getAllSound = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, category, page, limit } = req.query;
    const result = yield sound_service_1.SoundService.getAllSound(req.user.userId, searchTerm, category, page ? parseInt(page, 10) : undefined, limit ? parseInt(limit, 10) : undefined);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "All sound is fetched successfully",
        data: result.data,
        meta: {
            totalItem: result.pagination.total,
            totalPage: result.pagination.totalPages,
            limit: result.pagination.limit,
            page: result.pagination.page,
        },
    });
}));
const deleteSound = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield sound_service_1.SoundService.deleteSound(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Sound deleted successfully",
        data: result,
    });
}));
const deleteMultipleSounds = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error("No sound IDs provided");
    }
    const result = yield sound_service_1.SoundService.deleteMultipleSounds(ids);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: `${result.deletedCount} sounds deleted successfully`,
        data: result,
    });
}));
exports.SoundController = {
    addSound,
    getAllSound,
    deleteSound,
    deleteMultipleSounds,
};
