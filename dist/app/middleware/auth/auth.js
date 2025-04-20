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
exports.auth = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const jwt_1 = require("../../utils/jwt/jwt");
const config_1 = require("../../config");
const user_model_1 = __importDefault(require("../../modules/users/user/user.model"));
const auth = (...userRole) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenWithBearer = req.headers.authorization;
    if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer")) {
        return next(new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized"));
    }
    const token = tokenWithBearer.split(" ")[1];
    if (token === "null") {
        return next(new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized"));
    }
    const decodedData = jwt_1.jsonWebToken.verifyJwt(token, config_1.appConfig.jwt.jwt_access_secret);
    const userData = yield user_model_1.default.findById(decodedData.userId);
    if (!userData) {
        return next(new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized"));
    }
    if (userRole.length && !userRole.includes(decodedData.userRole)) {
        return next(new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized"));
    }
    if (userData.role !== decodedData.userRole ||
        userData.email !== decodedData.userEmail) {
        return next(new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized"));
    }
    req.user = decodedData;
    return next();
});
exports.auth = auth;
