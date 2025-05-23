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
exports.SendMessageController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const sendMessage_service_1 = require("./sendMessage.service");
const sendMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract all needed parameters from request body
    const { users, link, soundTitle } = req.body;
    const result = yield sendMessage_service_1.SendMessageService.sendMessage(users, link, req.user.userEmail, soundTitle);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Message is sent successfully",
        data: result,
    });
}));
const sendSoundToAllFriends = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract all needed parameters from request body
    const { userId, userEmail } = req.user;
    const { soundLink, soundTitle } = req.body;
    const result = yield sendMessage_service_1.SendMessageService.sendSoundToAllFriends(userId, userEmail, soundLink, soundTitle);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Message is sent successfully to all friends",
        data: result,
    });
}));
exports.SendMessageController = {
    sendMessage,
    sendSoundToAllFriends,
};
