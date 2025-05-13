/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable arrow-body-style */

import mongoose from "mongoose";
import User from "../users/user/user.model";
import { sendBulkSMS } from "../../utils/twilio/twilio.sms";
import { UserProfile } from "../users/userProfile/userProfile.model";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const sendMessage = async (
  users: string[],
  link: string,
  senderEmail: string
) => {
  const senderData = await UserProfile.findOne({ email: senderEmail });
  if (!senderData?.fullName) {
    throw new Error("Sender not found");
  }
  const objectIds = users.map((id) => new mongoose.Types.ObjectId(id));

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
    { $unwind: "$userProfile" },
  ]);

  const validPhoneNumbers = usersData
    .map((user: any) => user.userProfile.phone)
    .filter((phone) => phone && phone.trim().length > 0);

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
    successCount,
    failedCount: failedNumbers.length,
    totalRecipients: validPhoneNumbers.length,
  };
};

export const SendMessageService = {
  sendMessage,
};
