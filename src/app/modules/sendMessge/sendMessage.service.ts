// Updated sendMessage.service.ts
import mongoose from "mongoose";
import User from "../users/user/user.model";
import { sendBulkSMS } from "../../utils/twilio/twilio.sms";
import { UserProfile } from "../users/userProfile/userProfile.model";
import logger from "../../utils/logger";

const sendMessage = async (
  users: string | string[],
  link: string,
  senderEmail: string
): Promise<{
  success: boolean;
  successCount?: number;
  failedCount?: number;
  totalRecipients?: number;
  message?: string;
}> => {
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

  const senderData = await UserProfile.findOne({ email: senderEmail });
  if (!senderData?.fullName) {
    throw new Error("Sender not found");
  }

  // Safely convert user IDs to ObjectId
  const objectIds = userArray
    .map((id) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch {
        logger.error(`Invalid ObjectId: ${id}`);
        return null;
      }
    })
    .filter((id) => id !== null);

  if (objectIds.length === 0) {
    throw new Error("No valid user IDs provided");
  }

  const usersData = await User.aggregate([
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
  ]);

  if (!usersData || usersData.length === 0) {
    return {
      success: false,
      message:
        "No users found with the provided IDs or they don't have profiles",
    };
  }

  interface AggregatedUser {
    userProfile: {
      phone: string;
    };
  }

  const validPhoneNumbers = usersData
    .filter(
      (user: AggregatedUser) => user.userProfile && user.userProfile.phone
    )
    .map((user: AggregatedUser) => user.userProfile.phone)
    .filter((phone: string) => phone && phone.trim().length > 0);

  if (validPhoneNumbers.length === 0) {
    return { success: false, message: "No valid phone numbers found" };
  }

  // Send SMS to all valid numbers
  const { successCount, failedNumbers } = await sendBulkSMS(
    validPhoneNumbers,
    senderData?.fullName,
    "hi, my friend",
    link
  );

  return {
    success: true,
    successCount,
    failedCount: failedNumbers.length,
    totalRecipients: validPhoneNumbers.length,
  };
};

export const SendMessageService = {
  sendMessage,
};
