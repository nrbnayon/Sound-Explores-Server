import mongoose from "mongoose";
import User from "../users/user/user.model";
import { sendSMS } from "../../utils/twilio/twilio.sms";
import { UserProfile } from "../users/userProfile/userProfile.model";
import logger from "../../utils/logger";
import { UserConnection } from "../users/userConnection/userConnection.model";

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
  logger.info("Users for send::", users, link, soundTitle);
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

  // Check if the IDs are user IDs or connection IDs and get user IDs accordingly
  let userIds: mongoose.Types.ObjectId[] = [];

  try {
    // First attempt to find if these are connection IDs
    const connections = await UserConnection.find({
      _id: { $in: userArray.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    if (connections && connections.length > 0) {
      // These are connection IDs, extract the user IDs from connections
      for (const connection of connections) {
        userIds = [...userIds, ...connection.users];
      }
    } else {
      // These might be direct user IDs
      userIds = userArray
        .map((id) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch (error) {
            logger.error(`Invalid ObjectId: ${id}`, error);
            return null;
          }
        })
        .filter((id): id is mongoose.Types.ObjectId => id !== null);
    }
  } catch (error) {
    logger.error(`Error processing IDs: ${error}`);
    // Default to treating them as user IDs
    userIds = userArray
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch (err) {
          logger.error(`Invalid ObjectId: ${id}`, err);
          return null;
        }
      })
      .filter((id): id is mongoose.Types.ObjectId => id !== null);
  }

  if (userIds.length === 0) {
    throw new Error("No valid user IDs provided");
  }

  // Get user details including phone numbers
  const userRecords = await User.find({ _id: { $in: userIds } })
    .select("phone _id")
    .lean();

  if (!userRecords || userRecords.length === 0) {
    return {
      success: false,
      message: "No users found with the provided IDs",
    };
  }

  // Look up profiles for all users
  const userProfiles = await UserProfile.find({
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
      const phone = profile?.phone || user.phone;
      const fullName = profile?.fullName || "My friend";

      return {
        phone,
        fullName,
      };
    })
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

const sendSoundToAllFriends = async (
  userId: string,
  userEmail: string,
  soundLink: string,
  soundTitle?: string
): Promise<{
  success: boolean;
  successCount?: number;
  failedCount?: number;
  totalRecipients?: number;
  message?: string;
}> => {
  logger.info("Send message to all friends::", userId, userEmail);

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

  const senderData = await UserProfile.findOne({ email: userEmail });
  if (!senderData?.fullName) {
    throw new Error("Sender not found");
  }

  // Find all ACCEPTED connections for the logged-in user
  const connections = await UserConnection.find({
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
  const friendIds = connections.reduce<mongoose.Types.ObjectId[]>(
    (acc, connection) => {
      // Find friend IDs (all user IDs in the connection except the logged-in user)
      const friendsInConnection = connection.users.filter(
        (id) => id.toString() !== userId
      );
      return [...acc, ...friendsInConnection];
    },
    []
  );

  if (friendIds.length === 0) {
    return {
      success: false,
      message: "No friends found in your connections",
    };
  }

  // Add projection to include user's full name and phone
  const usersData = await User.aggregate([
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
    return {
      success: false,
      message: "No valid phone numbers found among your friends",
    };
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
        soundLink,
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
  sendSoundToAllFriends,
};
