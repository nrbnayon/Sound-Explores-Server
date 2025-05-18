import mongoose from "mongoose";
import User from "../users/user/user.model";
import { sendSMS } from "../../utils/twilio/twilio.sms";
import { UserProfile } from "../users/userProfile/userProfile.model";
import logger from "../../utils/logger";

const sendMessage = async (
  users: string | string[],
  link: string,
  senderEmail: string,
  soundTitle?: string
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

  // Add projection to include user's full name
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
      message:
        "No users found with the provided IDs or they don't have profiles",
    };
  }

  interface AggregatedUser {
    userProfile: {
      phone: string;
      fullName?: string;
    };
  }

  // Extract recipients with their phone numbers and names
  const recipients = usersData
    .filter(
      (user: AggregatedUser) => user.userProfile && user.userProfile.phone
    )
    .map((user: AggregatedUser) => ({
      phone: user.userProfile.phone,
      fullName: user.userProfile.fullName || "My friend",
    }))
    .filter(
      (recipient) => recipient.phone && recipient.phone.trim().length > 0
    );

  if (recipients.length === 0) {
    return { success: false, message: "No valid phone numbers found" };
  }

  // Create a personalized greeting message base
  const customMessageBase = "I've shared an audio you might enjoy";

  let successCount = 0;
  const failedNumbers: string[] = [];

  // Send personalized SMS to each recipient
  for (const recipient of recipients) {
    const personalizedMessage = `Hi, ${recipient.fullName}\n${customMessageBase}`;

    try {
      await sendSMS(
        recipient.phone,
        senderData.fullName,
        personalizedMessage,
        link,
        soundTitle
      );
      successCount++;
    } catch (error) {
      failedNumbers.push(recipient.phone);
      logger.error(`Failed to send SMS to ${recipient.phone}: ${error}`);
    }
  }

  return {
    success: true,
    successCount,
    failedCount: failedNumbers.length,
    totalRecipients: recipients.length,
  };
};

export const SendMessageService = {
  sendMessage,
};
