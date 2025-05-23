"use strict";
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
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
exports.UserConnectionService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const userConnection_model_1 = require("./userConnection.model");
const mongoose_1 = __importDefault(require("mongoose"));
const sendRequest = (userdata, senderId) => __awaiter(void 0, void 0, void 0, function* () {
    const lengthOfConnection = yield userConnection_model_1.UserConnection.find({
        users: { $in: senderId },
    });
    if (lengthOfConnection.length > 10) {
        throw new AppError_1.default(500, "You have already made 10 friends.");
    }
    const exists = yield userConnection_model_1.UserConnection.findOne({
        users: { $all: userdata },
        $expr: { $eq: [{ $size: "$users" }, 2] },
    });
    if ((exists === null || exists === void 0 ? void 0 : exists.status) === "BLOCKED") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have been blocked by the user.");
    }
    if ((exists === null || exists === void 0 ? void 0 : exists.status) === "PENDING") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You already sent request");
    }
    if ((exists === null || exists === void 0 ? void 0 : exists.status) === "ACCEPTED") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are already friend");
    }
    if ((exists === null || exists === void 0 ? void 0 : exists.status) === "REMOVED") {
        exists.status = "PENDING";
        yield exists.save();
        return exists;
    }
    const result = yield userConnection_model_1.UserConnection.create({
        users: userdata,
        senderId: senderId,
    });
    return result;
});
const sentlist = (senderId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield userConnection_model_1.UserConnection.find({
        users: { $in: [senderId] },
        senderId,
        status: "PENDING",
    }).populate({
        path: "users",
        foreignField: "user",
        model: "UserProfile",
        select: "fullName email nickname dateOfBirth phone address image",
    });
    return result;
});
const requestlist = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield userConnection_model_1.UserConnection.find({
        users: { $in: [userId] },
        senderId: { $ne: userId },
        status: "PENDING",
    }).populate({
        path: "users",
        foreignField: "user",
        model: "UserProfile",
        select: "fullName email nickname dateOfBirth phone address image",
    });
    return result;
});
const friendList = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, queries = {}) {
    var _a, _b;
    const { searchTerm = "", page = 1, limit = 20 } = queries;
    const skip = (page - 1) * limit;
    // First, find all connection IDs where the user is involved and status is ACCEPTED
    const connections = yield userConnection_model_1.UserConnection.find({
        users: { $in: [userId] },
        status: "ACCEPTED",
    });
    // If there are no connections, return empty results with pagination metadata
    if (connections.length === 0) {
        return {
            meta: {
                totalItem: 0,
                totalPage: 0,
                limit: Number(limit),
                page: Number(page),
            },
            data: [],
        };
    }
    // Extract the connection IDs for the aggregation pipeline
    const connectionIds = connections.map((conn) => conn._id);
    // Build the aggregation pipeline
    const pipeline = [
        // Match only the user's accepted connections
        {
            $match: {
                _id: { $in: connectionIds },
                status: "ACCEPTED",
            },
        },
        // Lookup the user profiles
        {
            $lookup: {
                from: "userprofiles",
                localField: "users",
                foreignField: "user",
                as: "userProfiles",
            },
        },
        // Filter to only include connections where one of the user profiles
        // matches the search term in fullName or email
        ...(searchTerm
            ? [
                {
                    $match: {
                        userProfiles: {
                            $elemMatch: {
                                $or: [
                                    { fullName: { $regex: searchTerm, $options: "i" } },
                                    { email: { $regex: searchTerm, $options: "i" } },
                                ],
                                user: { $ne: new mongoose_1.default.Types.ObjectId(userId) },
                            },
                        },
                    },
                },
            ]
            : []),
        // Get the count for pagination before applying skip and limit
        {
            $facet: {
                metadata: [{ $count: "totalItem" }],
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    // Include the populated user data in the results
                    {
                        $lookup: {
                            from: "userprofiles",
                            localField: "users",
                            foreignField: "user",
                            as: "users",
                        },
                    },
                ],
            },
        },
    ];
    const results = yield userConnection_model_1.UserConnection.aggregate(pipeline);
    // Format the response with pagination metadata
    const totalItem = ((_b = (_a = results[0]) === null || _a === void 0 ? void 0 : _a.metadata[0]) === null || _b === void 0 ? void 0 : _b.totalItem) || 0;
    const totalPage = Math.ceil(totalItem / limit);
    return {
        meta: {
            totalItem,
            totalPage,
            limit: Number(limit),
            page: Number(page),
        },
        data: results[0].data,
    };
});
const removeFriend = (userIds) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield userConnection_model_1.UserConnection.findOneAndUpdate({
        users: { $all: userIds, $size: 2 },
        status: "ACCEPTED",
    }, { status: "REMOVED" }, { new: true });
    if (!result) {
        throw new Error("Connection not found.");
    }
    return result;
});
const acceptRequest = (connectionID, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the connection by its MongoDB _id
    const connection = yield userConnection_model_1.UserConnection.findById(connectionID);
    if (!connection) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Friend request not found");
    }
    // Verify the receiver is part of this connection
    if (!connection.users
        .map((id) => id.toString())
        .includes(receiverId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are not authorized to accept this request");
    }
    // Verify the receiver is not the sender
    if (connection.senderId.toString() === receiverId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You cannot accept your own friend request");
    }
    // Verify the request is pending
    if (connection.status !== "PENDING") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This request is no longer pending");
    }
    connection.status = "ACCEPTED";
    yield connection.save();
    return connection;
});
const rejectRequest = (connectionID, receiverId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the connection by its MongoDB _id
    const connection = yield userConnection_model_1.UserConnection.findById(connectionID);
    if (!connection) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Friend request not found");
    }
    // Verify the receiver is part of this connection
    if (!connection.users
        .map((id) => id.toString())
        .includes(receiverId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are not authorized to reject this request");
    }
    // Verify the receiver is not the sender
    if (connection.senderId.toString() === receiverId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You cannot reject your own friend request");
    }
    // Verify the request is pending
    if (connection.status !== "PENDING") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This request is no longer pending");
    }
    connection.status = "REMOVED";
    yield connection.save();
    return connection;
});
const cancelRequest = (connectionID, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the connection by its MongoDB _id
    const connection = yield userConnection_model_1.UserConnection.findById(connectionID);
    if (!connection) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Friend request not found");
    }
    // Verify the user is part of this connection
    if (!connection.users
        .map((id) => id.toString())
        .includes(userId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You are not part of this connection");
    }
    // Allow cancellation if it's PENDING or ACCEPTED
    if (connection.status !== "PENDING" && connection.status !== "ACCEPTED") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This connection cannot be canceled");
    }
    connection.status = "REMOVED";
    yield connection.save();
    return connection;
});
// Don't forget to export these updated functions
exports.UserConnectionService = {
    sendRequest,
    requestlist,
    sentlist,
    friendList,
    removeFriend,
    acceptRequest,
    rejectRequest,
    cancelRequest,
};
