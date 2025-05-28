// src\app\modules\users\user\user.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { IUserProfile } from "./../userProfile/userProfile.interface";
import status from "http-status";
import AppError from "../../../errors/AppError";
import { getRelativePath } from "../../../middleware/fileUpload/getRelativeFilePath";
import getExpiryTime from "../../../utils/helper/getExpiryTime";
import getHashedPassword from "../../../utils/helper/getHashedPassword";
import getOtp from "../../../utils/helper/getOtp";
import { sendEmail } from "../../../utils/sendEmail";
import { UserProfile } from "../userProfile/userProfile.model";

import { IUser } from "./user.interface";
import User from "./user.model";
import { AdminProfile } from "../adminProfile/adminProfile.model";
import { IAdminProfile } from "../adminProfile/adminProfile.interface";
import { removeFalsyFields } from "../../../utils/helper/removeFalsyField";
import mongoose from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { UserConnection } from "../userConnection/userConnection.model";

const createUser = async (data: {
  email: string;
  fullName: string;
  phone: string;
  password: string;
}): Promise<Partial<IUser>> => {
  const hashedPassword = await getHashedPassword(data.password);
  const otp = getOtp(4);
  const expDate = getExpiryTime(10);
  const phoneNumber = parsePhoneNumberFromString(data.phone);
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
  const createdUser = await User.create(userData);

  //user profile data
  const userProfileData = {
    fullName: data.fullName,
    email: createdUser.email,
    phone: normalizedPhone,
    user: createdUser._id,
  };
  await UserProfile.create(userProfileData);
  await sendEmail(
    data.email,
    "Email Verification Code",
    `Your OTP code is: ${otp}`
  );
  return { email: createdUser.email, isVerified: createdUser.isVerified };
};

const getAllUser = async (queries: {
  searchTerm?: string;
  page?: number;
  limit?: number;
  excludeUserId?: string;
}) => {
  const { searchTerm = "", page = 1, limit = 20, excludeUserId } = queries;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    {
      $match: {
        ...(excludeUserId && {
          _id: { $ne: new mongoose.Types.ObjectId(excludeUserId) },
        }),
      },
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

  const count = await User.aggregate([...pipeline, { $count: "total" }]);
  const totalItem = count[0]?.total || 0;
  const totalPage = Math.ceil(totalItem / limit);

  pipeline.push({ $skip: skip }, { $limit: limit });

  const users = await User.aggregate(pipeline);

  return {
    meta: {
      totalItem,
      totalPage,
      limit,
      page,
    },
    data: users,
  };
};

const updateProfileImage = async (path: string, email: string) => {
  const image = getRelativePath(path);

  const user = await User.findOne({ email: email });

  let updated;

  if (user?.role === "USER") {
    updated = await UserProfile.findOneAndUpdate(
      { email: email },
      { image },
      { new: true }
    );
  }

  if (user?.role === "ADMIN") {
    updated = await AdminProfile.findOneAndUpdate(
      { email: email },
      { image },
      { new: true }
    );
  }

  if (!updated) {
    throw new AppError(status.BAD_REQUEST, "Failed to update image.");
  }

  return updated;
};

const updateProfileData = async (
  userdata: Partial<IAdminProfile> | Partial<IUserProfile>,
  email: string
): Promise<IAdminProfile | IUserProfile | null> => {
  const data = removeFalsyFields(userdata);
  const user = await User.findOne({ email: email });
  let updated;

  if (user?.role === "ADMIN") {
    updated = await AdminProfile.findOneAndUpdate({ email: email }, data, {
      new: true,
    });
  }
  if (user?.role === "USER") {
    updated = await UserProfile.findOneAndUpdate({ email: email }, data, {
      new: true,
    });
    if (data.phone) {
      await User.findOneAndUpdate(
        { email: email },
        { phone: data.phone },
        { new: true }
      );
    }
  }
  if (!updated) {
    throw new AppError(status.BAD_REQUEST, "Failed to update user info.");
  }

  return updated;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // Choose the collection based on user role
  const profileCollection =
    user.role === "ADMIN" ? "adminprofiles" : "userprofiles";

  const userWithProfile = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(userId) },
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
    throw new AppError(status.NOT_FOUND, "User profile not found");
  }

  return userWithProfile[0];
};

const deleteUserIntoDB = async (targetUserId: string) => {
  if (!targetUserId) {
    throw new AppError(status.BAD_REQUEST, "User ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError(status.BAD_REQUEST, "Invalid user ID format");
  }

  const session = await mongoose.startSession();
  let deletedUser: any = null;

  try {
    await session.withTransaction(async () => {
      const userExists = await User.findById(targetUserId).session(session);
      if (!userExists) {
        throw new AppError(status.NOT_FOUND, "User not found");
      }

      // Store user info before deletion
      deletedUser = {
        _id: userExists._id,
        email: userExists.email,
        role: userExists.role,
      };

      // Delete from UserProfile collection (if exists)
      const deletedProfile = await UserProfile.findOneAndDelete({
        user: targetUserId,
      }).session(session);

      // Delete from AdminProfile collection (if exists)
      const deletedAdminProfile = await AdminProfile.findOneAndDelete({
        user: targetUserId,
      }).session(session);

      // Delete all user connections where this user is involved (if any)
      const deletedConnections = await UserConnection.deleteMany({
        $or: [{ users: targetUserId }, { senderId: targetUserId }],
      }).session(session);

      // Finally, delete the user from Users collection
      const userDeleted = await User.findByIdAndDelete(targetUserId).session(
        session
      );

      if (!userDeleted) {
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to delete user from database"
        );
      }

      console.log(`Deletion Summary for User ${targetUserId}:`);
      console.log(
        `- User Profile: ${deletedProfile ? "Deleted" : "Not found"}`
      );
      console.log(
        `- Admin Profile: ${deletedAdminProfile ? "Deleted" : "Not found"}`
      );
      console.log(
        `- User Connections: ${deletedConnections.deletedCount} deleted`
      );
    });
    return {
      message: "User and all related data deleted successfully",
      deletedUserId: targetUserId,
      email: deletedUser.email,
      deletedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "An error occurred while deleting the user"
    );
  } finally {
    await session.endSession();
  }
};


export const UserService = {
  getMe,
  createUser,
  updateProfileImage,
  updateProfileData,
  getAllUser,
  deleteUserIntoDB
};
