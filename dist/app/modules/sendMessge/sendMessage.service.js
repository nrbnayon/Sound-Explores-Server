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
exports.SendMessageService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../users/user/user.model"));
const twilio_sms_1 = require("../../utils/twilio/twilio.sms");
const userProfile_model_1 = require("../users/userProfile/userProfile.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const sendMessage = (users, link, senderEmail, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    // Handle both single user ID (string) and array of user IDs
    const userArray = Array.isArray(users) ? users : [users];
    // Validate input parameters
    if (!userArray || userArray.length === 0) {
        throw new Error("Invalid or empty users array");
    }
    if (!link) {
        throw new Error("Link is required");
    }
    if (!senderEmail) {
        throw new Error("Sender email is required");
    }
    const senderData = yield userProfile_model_1.UserProfile.findOne({ email: senderEmail });
    if (!(senderData === null || senderData === void 0 ? void 0 : senderData.fullName)) {
        throw new Error("Sender not found");
    }
    // Safely convert user IDs to ObjectId
    const objectIds = userArray
        .map((id) => {
        try {
            return new mongoose_1.default.Types.ObjectId(id);
        }
        catch (_a) {
            logger_1.default.error(`Invalid ObjectId: ${id}`);
            return null;
        }
    })
        .filter((id) => id !== null);
    if (objectIds.length === 0) {
        throw new Error("No valid user IDs provided");
    }
    // Add projection to include user's full name
    const usersData = yield user_model_1.default.aggregate([
        {
            $match: { _id: { $in: objectIds } },
        },
        {
            $lookup: {
                from: "userprofiles",
                as: "userProfile",
                foreignField: "user",
                localField: "_id",
            },
        },
        {
            $project: {
                userProfile: 1,
            },
        },
        // Only unwind if userProfile array exists and is not empty
        {
            $match: { "userProfile.0": { $exists: true } },
        },
        { $unwind: "$userProfile" },
        {
            $project: {
                "userProfile.phone": 1,
                "userProfile.fullName": 1,
            },
        },
    ]);
    if (!usersData || usersData.length === 0) {
        return {
            success: false,
            message: "No users found with the provided IDs or they don't have profiles",
        };
    }
    // Extract recipients with their phone numbers and names
    const recipients = usersData
        .filter((user) => user.userProfile && user.userProfile.phone)
        .map((user) => ({
        phone: user.userProfile.phone,
        fullName: user.userProfile.fullName || "My friend",
    }))
        .filter((recipient) => recipient.phone && recipient.phone.trim().length > 0);
    if (recipients.length === 0) {
        return { success: false, message: "No valid phone numbers found" };
    }
    // Create a personalized greeting message base
    const customMessageBase = "I've shared an audio you might enjoy";
    let successCount = 0;
    const failedNumbers = [];
    // Send personalized SMS to each recipient
    for (const recipient of recipients) {
        const personalizedMessage = `Hi, ${recipient.fullName}\n${customMessageBase}`;
        try {
            yield (0, twilio_sms_1.sendSMS)(recipient.phone, senderData.fullName, personalizedMessage, link, soundTitle);
            successCount++;
        }
        catch (error) {
            failedNumbers.push(recipient.phone);
            logger_1.default.error(`Failed to send SMS to ${recipient.phone}: ${error}`);
        }
    }
    return {
        success: true,
        successCount,
        failedCount: failedNumbers.length,
        totalRecipients: recipients.length,
    };
});
exports.SendMessageService = {
    sendMessage,
};
