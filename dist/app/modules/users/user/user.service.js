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
exports.UserService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const getRelativeFilePath_1 = require("../../../middleware/fileUpload/getRelativeFilePath");
const getHashedPassword_1 = __importDefault(require("../../../utils/helper/getHashedPassword"));
const userProfile_model_1 = require("../userProfile/userProfile.model");
const user_model_1 = __importDefault(require("./user.model"));
const adminProfile_model_1 = require("../adminProfile/adminProfile.model");
const removeFalsyField_1 = require("../../../utils/helper/removeFalsyField");
const mongoose_1 = __importDefault(require("mongoose"));
const userConnection_model_1 = require("../userConnection/userConnection.model");
const logger_1 = __importDefault(require("../../../utils/logger"));
const jwt_1 = require("../../../utils/jwt/jwt");
const config_1 = require("../../../config");
const createUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield user_model_1.default.findOne({ email: data.email }).select("+password");
    const hashedPassword = yield (0, getHashedPassword_1.default)(data.password);
    if (isUserExist) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This email already registered.");
    }
    const userData = {
        email: data.email,
        password: hashedPassword,
        isVerified: true,
    };
    const createdUser = yield user_model_1.default.create(userData);
    if (!createdUser) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create user.");
    }
    //user profile data
    const userProfileData = {
        email: createdUser.email,
        user: createdUser._id,
    };
    yield userProfile_model_1.UserProfile.create(userProfileData);
    const jwtPayload = {
        userEmail: userData.email,
        userId: createdUser._id,
        userRole: createdUser.role,
    };
    const accessToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_access_secret, config_1.appConfig.jwt.jwt_access_exprire);
    const refreshToken = jwt_1.jsonWebToken.generateToken(jwtPayload, config_1.appConfig.jwt.jwt_refresh_secret, config_1.appConfig.jwt.jwt_refresh_exprire);
    return {
        accessToken,
        refreshToken,
        userData: Object.assign(Object.assign({}, userProfileData), { password: null }),
    };
});
const getAllUser = (queries) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { searchTerm = "", page = 1, limit = 20, excludeUserId } = queries;
    const skip = (page - 1) * limit;
    const pipeline = [
        {
            $match: Object.assign({}, (excludeUserId && {
                _id: { $ne: new mongoose_1.default.Types.ObjectId(excludeUserId) },
            })),
        },
        {
            $lookup: {
                from: "userprofiles",
                localField: "_id",
                foreignField: "user",
                as: "userProfile",
            },
        },
        {
            $lookup: {
                from: "adminprofiles",
                localField: "_id",
                foreignField: "user",
                as: "adminProfile",
            },
        },
        {
            $addFields: {
                profile: {
                    $cond: [
                        { $eq: ["$role", "ADMIN"] },
                        { $arrayElemAt: ["$adminProfile", 0] },
                        { $arrayElemAt: ["$userProfile", 0] },
                    ],
                },
            },
        },
        {
            $project: {
                password: 0,
                userProfile: 0,
                adminProfile: 0,
                authentication: 0,
                __v: 0,
            },
        },
    ];
    if (searchTerm.trim()) {
        pipeline.push({
            $match: {
                $or: [
                    { "profile.fullName": { $regex: searchTerm, $options: "i" } },
                    { "profile.email": { $regex: searchTerm, $options: "i" } },
                ],
            },
        });
    }
    const count = yield user_model_1.default.aggregate([...pipeline, { $count: "total" }]);
    const totalItem = ((_a = count[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    const totalPage = Math.ceil(totalItem / limit);
    pipeline.push({ $skip: skip }, { $limit: limit });
    const users = yield user_model_1.default.aggregate(pipeline);
    return {
        meta: {
            totalItem,
            totalPage,
            limit,
            page,
        },
        data: users,
    };
});
const updateProfileImage = (path, email) => __awaiter(void 0, void 0, void 0, function* () {
    const image = (0, getRelativeFilePath_1.getRelativePath)(path);
    const user = yield user_model_1.default.findOne({ email: email });
    let updated;
    if ((user === null || user === void 0 ? void 0 : user.role) === "USER") {
        updated = yield userProfile_model_1.UserProfile.findOneAndUpdate({ email: email }, { image }, { new: true });
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === "ADMIN") {
        updated = yield adminProfile_model_1.AdminProfile.findOneAndUpdate({ email: email }, { image }, { new: true });
    }
    if (!updated) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update image.");
    }
    return updated;
});
const updateProfileData = (userdata, email) => __awaiter(void 0, void 0, void 0, function* () {
    const data = (0, removeFalsyField_1.removeFalsyFields)(userdata);
    const user = yield user_model_1.default.findOne({ email: email });
    let updated;
    if ((user === null || user === void 0 ? void 0 : user.role) === "ADMIN") {
        updated = yield adminProfile_model_1.AdminProfile.findOneAndUpdate({ email: email }, data, {
            new: true,
        });
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === "USER") {
        updated = yield userProfile_model_1.UserProfile.findOneAndUpdate({ email: email }, data, {
            new: true,
        });
    }
    if (!updated) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update user info.");
    }
    return updated;
});
const getMe = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Choose the collection based on user role
    const profileCollection = user.role === "ADMIN" ? "adminprofiles" : "userprofiles";
    const userWithProfile = yield user_model_1.default.aggregate([
        {
            $match: { _id: new mongoose_1.default.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: profileCollection,
                localField: "_id",
                foreignField: "user",
                as: "profile",
            },
        },
        {
            $unwind: {
                path: "$profile",
                preserveNullAndEmptyArrays: true, // Keep user even if profile doesn't exist
            },
        },
        {
            $project: {
                email: 1,
                role: 1,
                isVerified: 1,
                name: "$profile.fullName",
                profile: 1,
                // Can't mix inclusion (1) and exclusion (0) in the same $project
            },
        },
    ]);
    if (userWithProfile.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User profile not found");
    }
    return userWithProfile[0];
});
const deleteUserIntoDB = (targetUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!targetUserId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User ID is required");
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(targetUserId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid user ID format");
    }
    const session = yield mongoose_1.default.startSession();
    let deletedUser = null;
    try {
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const userExists = yield user_model_1.default.findById(targetUserId).session(session);
            if (!userExists) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found or already deleted");
            }
            // Store user info before deletion
            deletedUser = {
                _id: userExists._id,
                email: userExists.email,
                role: userExists.role,
            };
            // Delete from UserProfile collection (if exists)
            const deletedProfile = yield userProfile_model_1.UserProfile.findOneAndDelete({
                user: targetUserId,
            }).session(session);
            // Delete from AdminProfile collection (if exists)
            const deletedAdminProfile = yield adminProfile_model_1.AdminProfile.findOneAndDelete({
                user: targetUserId,
            }).session(session);
            // Delete all user connections where this user is involved (if any)
            const deletedConnections = yield userConnection_model_1.UserConnection.deleteMany({
                $or: [{ users: targetUserId }, { senderId: targetUserId }],
            }).session(session);
            // Finally, delete the user from Users collection
            const userDeleted = yield user_model_1.default.findByIdAndDelete(targetUserId).session(session);
            if (!userDeleted) {
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to delete user from database");
            }
            logger_1.default.info(`Deletion Summary for User ${targetUserId}:`);
            logger_1.default.info(`- User Profile: ${deletedProfile ? "Deleted" : "Not found"}`);
            logger_1.default.info(`- Admin Profile: ${deletedAdminProfile ? "Deleted" : "Not found"}`);
            logger_1.default.info(`- User Connections: ${deletedConnections.deletedCount} deleted`);
        }));
        return {
            message: "User deleted successfully",
            deletedUserId: targetUserId,
            email: deletedUser.email,
            deletedAt: new Date(),
        };
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "An error occurred while deleting the user");
    }
    finally {
        yield session.endSession();
    }
});
exports.UserService = {
    getMe,
    createUser,
    updateProfileImage,
    updateProfileData,
    getAllUser,
    deleteUserIntoDB,
};
