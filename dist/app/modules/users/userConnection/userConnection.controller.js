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
exports.UserConnectionController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const userConnection_service_1 = require("./userConnection.service");
const sendRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const recId = req.body.userId;
    const senderId = req.user.userId;
    const result = yield userConnection_service_1.UserConnectionService.sendRequest([recId, senderId], senderId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Request sent successfully",
        data: result,
    });
}));
const sentlist = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const senderId = req.user.userId;
    const result = yield userConnection_service_1.UserConnectionService.sentlist(senderId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Request sent list fetched successfully",
        data: result,
    });
}));
const requestlist = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const result = yield userConnection_service_1.UserConnectionService.requestlist(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Request list fetched successfully",
        data: result,
    });
}));
const friendList = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const { search, page, limit } = req.query;
    const searchTerm = typeof search === "string"
        ? search
        : Array.isArray(search)
            ? search[0]
            : undefined;
    const safeSearchTerm = typeof searchTerm === "string"
        ? searchTerm
        : searchTerm !== undefined
            ? String(searchTerm)
            : undefined;
    const result = yield userConnection_service_1.UserConnectionService.friendList(userId, {
        searchTerm: safeSearchTerm,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Friend list fetched successfully",
        data: result,
    });
}));
const removeFriend = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const recId = req.body.userId;
    const result = yield userConnection_service_1.UserConnectionService.removeFriend([userId, recId]);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Friend removed successfully",
        data: result,
    });
}));
// NEW CONTROLLERS FOR THE MISSING ENDPOINTS
const acceptRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const receiverId = req.user.userId;
    const connectionID = req.body.connectionID;
    // Call the service with correct parameters
    const result = yield userConnection_service_1.UserConnectionService.acceptRequest(connectionID, receiverId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Friend request accepted successfully",
        data: result,
    });
}));
// Update the rejectRequest controller function
const rejectRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const receiverId = req.user.userId;
    const connectionID = req.body.connectionID;
    // Call the service with correct parameters
    const result = yield userConnection_service_1.UserConnectionService.rejectRequest(connectionID, receiverId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Friend request rejected successfully",
        data: result,
    });
}));
const cancelRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.userId;
    const connectionID = req.body.connectionID;
    // Call the service with correct parameters
    const result = yield userConnection_service_1.UserConnectionService.cancelRequest(connectionID, userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Connection canceled successfully",
        data: result,
    });
}));
exports.UserConnectionController = {
    sendRequest,
    sentlist,
    requestlist,
    friendList,
    removeFriend,
    acceptRequest,
    rejectRequest,
    cancelRequest,
};
