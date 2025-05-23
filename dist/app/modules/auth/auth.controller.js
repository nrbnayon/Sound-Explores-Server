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
    var _a, _b, _c, _d;
    // Try to get the refresh token from multiple sources
    const refreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
        ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken) ||
        ((_c = req.query) === null || _c === void 0 ? void 0 : _c.refreshToken) ||
        (((_d = req.headers.authorization) === null || _d === void 0 ? void 0 : _d.startsWith("Bearer "))
            ? req.headers.authorization.split(" ")[1]
            : null);
    // console.log("RefT::", refreshToken);
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
const reSendOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.AuthService.reSendOtp(email);
    (0, sendResponse_1.default)(res, {
        data: result,
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Verification Code send successfully",
    });
}));
exports.AuthController = {
    verifyUser,
    forgotPasswordRequest,
    resetPassword,
    userLogin,
    getNewAccessToken,
    updatePassword,
    reSendOtp,
};
