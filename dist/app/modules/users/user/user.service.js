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
const getExpiryTime_1 = __importDefault(require("../../../utils/helper/getExpiryTime"));
const getHashedPassword_1 = __importDefault(require("../../../utils/helper/getHashedPassword"));
const getOtp_1 = __importDefault(require("../../../utils/helper/getOtp"));
const sendEmail_1 = require("../../../utils/sendEmail");
const userProfile_model_1 = require("../userProfile/userProfile.model");
const user_model_1 = __importDefault(require("./user.model"));
const adminProfile_model_1 = require("../adminProfile/adminProfile.model");
const removeFalsyField_1 = require("../../../utils/helper/removeFalsyField");
const mongoose_1 = __importDefault(require("mongoose"));
const libphonenumber_js_1 = require("libphonenumber-js");
const createUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedPassword = yield (0, getHashedPassword_1.default)(data.password);
    const otp = (0, getOtp_1.default)(4);
    const expDate = (0, getExpiryTime_1.default)(10);
    const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(data.phone);
    if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number");
    }
    const normalizedPhone = phoneNumber.number;
    //user data
    const userData = {
        email: data.email,
        phone: normalizedPhone,
        password: hashedPassword,
        authentication: { otp, expDate },
    };
    const createdUser = yield user_model_1.default.create(userData);
    //user profile data
    const userProfileData = {
        fullName: data.fullName,
        email: createdUser.email,
        phone: normalizedPhone,
        user: createdUser._id,
    };
    yield userProfile_model_1.UserProfile.create(userProfileData);
    yield (0, sendEmail_1.sendEmail)(data.email, "Email Verification Code", `Your OTP code is: ${otp}`);
    return { email: createdUser.email, isVerified: createdUser.isVerified };
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
                    { "profile.phone": { $regex: searchTerm, $options: "i" } },
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
        if (data.phone) {
            yield user_model_1.default.findOneAndUpdate({ email: email }, { phone: data.phone }, { new: true });
        }
    }
    if (!updated) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to update user info.");
    }
    return updated;
});
// const getMe = async (userId: string) => {
//   const userWithProfile = await User.aggregate([
//     {
//       $match: { _id: new mongoose.Types.ObjectId(userId) }, // Match the user by userId
//     },
//     {
//       $lookup: {
//         from: "userprofiles", // Name of the UserProfile collection
//         localField: "_id", // The field from the User collection to join on
//         foreignField: "user", // The field in the UserProfile collection that references User
//         as: "profile", // The alias for the joined data
//       },
//     },
//     {
//       $unwind: "$profile", // Unwind the profile array (because $lookup returns an array)
//     },
//     {
//       $project: {
//         email: 1, // Include the fields you want from User
//         role: 1,
//         profile: 1, // Include the profile data
//       },
//     },
//   ]);
//   if (userWithProfile.length === 0) {
//     throw new Error("User not found");
//   }
//   return userWithProfile[0]; //
// };
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
                phone: 1,
                // Can't mix inclusion (1) and exclusion (0) in the same $project
            },
        },
    ]);
    if (userWithProfile.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User profile not found");
    }
    return userWithProfile[0];
});
exports.UserService = {
    getMe,
    createUser,
    updateProfileImage,
    updateProfileData,
    getAllUser,
};
