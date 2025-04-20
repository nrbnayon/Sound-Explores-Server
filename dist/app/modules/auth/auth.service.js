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
exports.AuthService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const jwt_1 = require("../../utils/jwt/jwt");
const userProfile_model_1 = require("../users/userProfile/userProfile.model");
const getExpiryTime_1 = __importDefault(require("../../utils/helper/getExpiryTime"));
const getOtp_1 = __importDefault(require("../../utils/helper/getOtp"));
const sendEmail_1 = require("../../utils/sendEmail");
const getHashedPassword_1 = __importDefault(require("../../utils/helper/getHashedPassword"));
const config_1 = require("../../config");
const userLogin = (loginData) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield user_model_1.default.findOne({ email: loginData.email }).select("+password");
    if (!userData) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your email");
    }
    if (userData.isVerified === false) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please verify your email.");
    }
    const isPassMatch = yield userData.comparePassword(loginData.password);
    if (!isPassMatch) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please check your password.");
    }
    const jwtPayload = {
        userEmail: userData.email,
        userId: userData._id,
        userRole: userData.role,
    };
    const accessToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_exprire);
    const refreshToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_refresh_secret, config_1.appConfig.jwt.jwt_refresh_exprire);
    return {
        accessToken,
        refreshToken,
        userData: Object.assign(Object.assign({}, userData.toObject()), { password: null }),
    };
});
const verifyUser = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Give the Code. Check your email.");
    }
    const user = (yield userProfile_model_1.UserProfile.findOne({ email }).populate("user"));
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found");
    }
    const currentDate = new Date();
    const expirationDate = new Date(user.user.authentication.expDate);
    if (currentDate > expirationDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code time expired.");
    }
    if (otp !== user.user.authentication.otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Code not matched.");
    }
    let updatedUser;
    let token = null;
    if (user.user.isVerified) {
        token = jwt_1.jsonWebToken.generateToken({ userEmail: user.email }, config_1.appConfig.jwt.jwt_access_secret, "10m");
        const expDate = (0, getExpiryTime_1.default)(10);
        updatedUser = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
            "authentication.otp": null,
            "authentication.expDate": expDate,
            "authentication.needToResetPass": true,
            "authentication.token": token,
        }, { new: true });
    }
    else {
        updatedUser = yield user_model_1.default.findOneAndUpdate({ email: user.email }, {
            "authentication.otp": null,
            "authentication.expDate": null,
            isVerified: true,
        }, { new: true });
    }
    return {
        userId: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser._id,
        email: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.email,
        isVerified: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.isVerified,
        needToResetPass: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.needToResetPass,
        token: token,
    };
});
const forgotPasswordRequest = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Email not found.");
    }
    const otp = (0, getOtp_1.default)(4);
    const expDate = (0, getExpiryTime_1.default)(10);
    const data = {
        otp: otp,
        expDate: expDate,
        needToResetPass: false,
        token: null,
    };
    yield (0, sendEmail_1.sendEmail)(user.email, "Reset Password Verification Code", `Your code is: ${otp}`);
    yield user_model_1.default.findOneAndUpdate({ email }, { authentication: data }, { new: true });
    return { email: user.email };
});
const resetPassword = (token, userData) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password } = userData;
    if (!token) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are not allowed to reset password.");
    }
    const user = yield user_model_1.default.findOne({ "authentication.token": token });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User not found.");
    }
    const currentDate = new Date();
    const expirationDate = new Date(user.authentication.expDate);
    if (currentDate > expirationDate) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Token expired.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const decode = jwt_1.jsonWebToken.verifyJwt(token, config_1.appConfig.jwt.jwt_access_secret);
    const hassedPassword = yield (0, getHashedPassword_1.default)(new_password);
    const updateData = yield user_model_1.default.findOneAndUpdate({ email: decode.userEmail }, {
        password: hassedPassword,
        authentication: { opt: null, token: null, expDate: null },
    }, { new: true });
    if (!updateData) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to reset password. Try again.");
    }
    return { email: updateData === null || updateData === void 0 ? void 0 : updateData.email };
});
const getNewAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (!refreshToken) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Refresh token not found.");
    }
    const decode = jwt_1.jsonWebToken.verifyJwt(refreshToken, config_1.appConfig.jwt.jwt_refresh_secret);
    const { userEmail, userId, userRole } = decode;
    if (userEmail && userId && userRole) {
        const jwtPayload = {
            userEmail: userEmail,
            userId: userId,
            userRole: userRole,
        };
        const accessToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_exprire);
        return { accessToken };
    }
    else {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are unauthorized.");
    }
});
const updatePassword = (userId, passData) => __awaiter(void 0, void 0, void 0, function* () {
    const { new_password, confirm_password, old_password } = passData;
    const user = yield user_model_1.default.findById(userId).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found.");
    }
    const isPassMatch = yield user.comparePassword(old_password);
    if (!isPassMatch) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Old password not matched.");
    }
    if (new_password !== confirm_password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hassedPassword = yield (0, getHashedPassword_1.default)(new_password);
    if (!hassedPassword) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update password. Try again.");
    }
    user.password = hassedPassword;
    yield user.save();
    return { user: user.email, message: "Password successfully updated." };
});
exports.AuthService = {
    userLogin,
    verifyUser,
    forgotPasswordRequest,
    resetPassword,
    getNewAccessToken,
    updatePassword,
};
