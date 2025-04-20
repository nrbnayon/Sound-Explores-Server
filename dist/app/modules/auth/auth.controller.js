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
exports.AuthController = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_service_1 = require("./auth.service");
const config_1 = require("../../config");
const userLogin = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthService.userLogin(req.body);
    res.cookie("refreshToken", result.refreshToken, {
        secure: config_1.appConfig.server.node_env === "production",
        httpOnly: true,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "User login successfull",
        data: result,
    });
}));
const verifyUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    const result = yield auth_service_1.AuthService.verifyUser(email, Number(otp));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Email successfully verified.",
        data: result,
    });
}));
const forgotPasswordRequest = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.AuthService.forgotPasswordRequest(email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "A verification code is sent to your email.",
        data: result,
    });
}));
const resetPassword = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenWithBearer = req.headers.authorization;
    const token = tokenWithBearer.split(" ")[1];
    const result = yield auth_service_1.AuthService.resetPassword(token, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Password reset successfully",
        data: result,
    });
}));
const getNewAccessToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    const result = yield auth_service_1.AuthService.getNewAccessToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        data: result,
        success: true,
        statusCode: http_status_1.default.OK,
        message: "New access-token is created.",
    });
}));
const updatePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.user;
    const result = yield auth_service_1.AuthService.updatePassword(userId, req.body);
    (0, sendResponse_1.default)(res, {
        data: result,
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Password successfully updated",
    });
}));
exports.AuthController = {
    verifyUser,
    forgotPasswordRequest,
    resetPassword,
    userLogin,
    getNewAccessToken,
    updatePassword,
};
