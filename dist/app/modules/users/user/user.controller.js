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
exports.UserController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const user_service_1 = require("./user.service");
const config_1 = require("../../../config");
const createUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.body;
    const result = yield user_service_1.UserService.createUser(userData);
    // Set refresh token cookie with long expiration (1 year)
    res.cookie("refreshToken", result.refreshToken, {
        secure: config_1.appConfig.server.node_env === "production",
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
        sameSite: "strict",
        path: "/",
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Account successfully created.",
        data: result,
    });
}));
const getAllUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUserId = req.user.userId;
    const { search, page, limit } = req.query;
    const result = yield user_service_1.UserService.getAllUser({
        searchTerm: search,
        page: Number(page),
        limit: Number(limit),
        excludeUserId: currentUserId,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "All user successfully fetched.",
        data: result,
    });
}));
const updateProfileImage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const filePath = (_a = req.file) === null || _a === void 0 ? void 0 : _a.path;
    const result = yield user_service_1.UserService.updateProfileImage(filePath, req.user.userEmail);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Profile image changed successfully.",
        data: result,
    });
}));
const updateProfileData = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.body;
    const result = yield user_service_1.UserService.updateProfileData(userData, req.user.userEmail);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Profile info updated successfully.",
        data: result,
    });
}));
const getMe = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.getMe(req.user.userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User data is fetched successfully.",
        data: result,
    });
}));
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userRole, userId: currentAdminId } = req.user;
    const { userId: targetUserId } = req.body;
    // Check if user is admin
    if (userRole !== "ADMIN") {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.FORBIDDEN,
            message: "Access denied. Only admins can delete users.",
        });
    }
    // Check if targetUserId is provided
    if (!targetUserId) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.BAD_REQUEST,
            message: "Target user not found.",
        });
    }
    // Prevent admin from deleting themselves
    if (targetUserId === currentAdminId) {
        return (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.BAD_REQUEST,
            message: "You cannot delete your own account.",
        });
    }
    const result = yield user_service_1.UserService.deleteUserIntoDB(targetUserId);
    return (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User deleted successfully.",
        data: result,
    });
}));
exports.UserController = {
    getMe,
    createUser,
    getAllUser,
    updateProfileImage,
    updateProfileData,
    deleteUser,
};
