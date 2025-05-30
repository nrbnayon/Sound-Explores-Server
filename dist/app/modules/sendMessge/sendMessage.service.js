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
const userConnection_model_1 = require("../users/userConnection/userConnection.model");
const sendMessage = (users, link, senderEmail, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    // Handle both single user ID (string) and array of user IDs
    logger_1.default.info("Users for send::", users, link, soundTitle);
    const userArray = Array.isArray(users) ? users : [users];
    // Validate input parameters
    if (!userArray || userArray.length === 0) {
        throw new Error("You have no friend yet to send this message");
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
    // Check if the IDs are user IDs or connection IDs and get user IDs accordingly
    let userIds = [];
    try {
        // First attempt to find if these are connection IDs
        const connections = yield userConnection_model_1.UserConnection.find({
            _id: { $in: userArray.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
        });
        if (connections && connections.length > 0) {
            // These are connection IDs, extract the user IDs from connections
            for (const connection of connections) {
                userIds = [...userIds, ...connection.users];
            }
        }
        else {
            // These might be direct user IDs
            userIds = userArray
                .map((id) => {
                try {
                    return new mongoose_1.default.Types.ObjectId(id);
                }
                catch (error) {
                    logger_1.default.error(`Invalid ObjectId: ${id}`, error);
                    return null;
                }
            })
                .filter((id) => id !== null);
        }
    }
    catch (error) {
        logger_1.default.error(`Error processing IDs: ${error}`);
        // Default to treating them as user IDs
        userIds = userArray
            .map((id) => {
            try {
                return new mongoose_1.default.Types.ObjectId(id);
            }
            catch (err) {
                logger_1.default.error(`Invalid ObjectId: ${id}`, err);
                return null;
            }
        })
            .filter((id) => id !== null);
    }
    if (userIds.length === 0) {
        throw new Error("No valid user IDs provided");
    }
    // Get user details including phone numbers
    const userRecords = yield user_model_1.default.find({ _id: { $in: userIds } })
        .select("phone _id")
        .lean();
    if (!userRecords || userRecords.length === 0) {
        return {
            success: false,
            message: "No users found with the provided IDs",
        };
    }
    // Look up profiles for all users
    const userProfiles = yield userProfile_model_1.UserProfile.find({
        user: { $in: userIds },
    })
        .select("fullName phone user")
        .lean();
    // Create a map for quick lookup of user profiles
    const profileMap = new Map();
    userProfiles.forEach((profile) => {
        if (profile.user) {
            profileMap.set(profile.user.toString(), profile);
        }
    });
    // Prepare recipients list with phone numbers and names
    const recipients = userRecords
        .map((user) => {
        const profile = profileMap.get(user._id.toString());
        const phone = (profile === null || profile === void 0 ? void 0 : profile.phone) || user.phone;
        const fullName = (profile === null || profile === void 0 ? void 0 : profile.fullName) || "My friend";
        return {
            phone,
            fullName,
        };
    })
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
const sendSoundToAllFriends = (userId, userEmail, soundLink, soundTitle) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info("Send message to all friends::", userId, userEmail);
    // Validate input parameters
    if (!userId) {
        throw new Error("You are not authorized");
    }
    if (!userEmail) {
        throw new Error("Sender email is required");
    }
    if (!soundLink) {
        throw new Error("Sound link is required");
    }
    const senderData = yield userProfile_model_1.UserProfile.findOne({ email: userEmail });
    if (!(senderData === null || senderData === void 0 ? void 0 : senderData.fullName)) {
        throw new Error("Sender not found");
    }
    // Find all ACCEPTED connections for the logged-in user
    const connections = yield userConnection_model_1.UserConnection.find({
        users: { $in: [userId] },
        status: "ACCEPTED",
    });
    if (!connections || connections.length === 0) {
        return {
            success: false,
            message: "No friend connections found",
        };
    }
    // Extract friend IDs (excluding the logged-in user)
    const friendIds = connections.reduce((acc, connection) => {
        // Find friend IDs (all user IDs in the connection except the logged-in user)
        const friendsInConnection = connection.users.filter((id) => id.toString() !== userId);
        return [...acc, ...friendsInConnection];
    }, []);
    if (friendIds.length === 0) {
        return {
            success: false,
            message: "No friends found in your connections",
        };
    }
    // Add projection to include user's full name and phone
    const usersData = yield user_model_1.default.aggregate([
        {
            $match: { _id: { $in: friendIds } },
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
            message: "No friend profiles found with valid information",
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
        return {
            success: false,
            message: "No valid phone numbers found among your friends",
        };
    }
    // Create a personalized greeting message base
    const customMessageBase = "I've shared an audio you might enjoy";
    let successCount = 0;
    const failedNumbers = [];
    // Send personalized SMS to each recipient
    for (const recipient of recipients) {
        const personalizedMessage = `Hi, ${recipient.fullName}\n${customMessageBase}`;
        try {
            yield (0, twilio_sms_1.sendSMS)(recipient.phone, senderData.fullName, personalizedMessage, soundLink, soundTitle);
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
    sendSoundToAllFriends,
};
