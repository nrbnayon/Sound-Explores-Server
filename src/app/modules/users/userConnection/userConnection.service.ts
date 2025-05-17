/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import status from "http-status";
import AppError from "../../../errors/AppError";
import { UserConnection } from "./userConnection.model";
import mongoose from "mongoose";

const sendRequest = async (userdata: string[], senderId: string) => {
  const lengthOfConnection = await UserConnection.find({
    users: { $in: senderId },
  });

  if (lengthOfConnection.length > 10) {
    throw new AppError(500, "You have already made 10 friends.");
  }

  const exists = await UserConnection.findOne({
    users: { $all: userdata },
    $expr: { $eq: [{ $size: "$users" }, 2] },
  });

  if (exists?.status === "BLOCKED") {
    throw new AppError(
      status.BAD_REQUEST,
      "You have been blocked by the user."
    );
  }

  if (exists?.status === "PENDING") {
    throw new AppError(status.BAD_REQUEST, "You already sent request");
  }

  if (exists?.status === "ACCEPTED") {
    throw new AppError(status.BAD_REQUEST, "You are already friend");
  }

  if (exists?.status === "REMOVED") {
    exists.status = "PENDING";
    await exists.save();
    return exists;
  }

  const result = await UserConnection.create({
    users: userdata,
    senderId: senderId,
  });
  return result;
};

const sentlist = async (senderId: string) => {
  const result = await UserConnection.find({
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
};

const requestlist = async (userId: string) => {
  const result = await UserConnection.find({
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
};

interface FriendListQuery {
  searchTerm?: string;
  page?: number;
  limit?: number;
}

const friendList = async (userId: string, queries: FriendListQuery = {}) => {
  const { searchTerm = "", page = 1, limit = 20 } = queries;
  const skip = (page - 1) * limit;

  // First, find all connection IDs where the user is involved and status is ACCEPTED
  const connections = await UserConnection.find({
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
                  user: { $ne: new mongoose.Types.ObjectId(userId) },
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

  const results = await UserConnection.aggregate(pipeline);

  // Format the response with pagination metadata
  const totalItem = results[0]?.metadata[0]?.totalItem || 0;
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
};

const removeFriend = async (userIds: string[]) => {
  const result = await UserConnection.findOneAndUpdate(
    {
      users: { $all: userIds, $size: 2 },
      status: "ACCEPTED",
    },
    { status: "REMOVED" },
    { new: true }
  );

  if (!result) {
    throw new Error("Connection not found.");
  }

  return result;
};

// NEW SERVICE FUNCTIONS FOR THE MISSING ENDPOINTS

interface AcceptRequestParams {
  connectionID: string;
  receiverId: string;
}

const acceptRequest = async (
  connectionID: AcceptRequestParams["connectionID"],
  receiverId: AcceptRequestParams["receiverId"]
): Promise<InstanceType<typeof UserConnection> | null> => {
  // Find the connection by its MongoDB _id
  const connection = await UserConnection.findById(connectionID);

  if (!connection) {
    throw new AppError(status.NOT_FOUND, "Friend request not found");
  }

  // Verify the receiver is part of this connection
  if (
    !connection.users
      .map((id: string | { toString(): string }) => id.toString())
      .includes(receiverId)
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You are not authorized to accept this request"
    );
  }

  // Verify the receiver is not the sender
  if (connection.senderId.toString() === receiverId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot accept your own friend request"
    );
  }

  // Verify the request is pending
  if (connection.status !== "PENDING") {
    throw new AppError(status.BAD_REQUEST, "This request is no longer pending");
  }

  connection.status = "ACCEPTED";
  await connection.save();
  return connection;
};

// Update the rejectRequest service function
interface RejectRequestParams {
  connectionID: string;
  receiverId: string;
}

const rejectRequest = async (
  connectionID: RejectRequestParams["connectionID"],
  receiverId: RejectRequestParams["receiverId"]
): Promise<InstanceType<typeof UserConnection> | null> => {
  // Find the connection by its MongoDB _id
  const connection = await UserConnection.findById(connectionID);

  if (!connection) {
    throw new AppError(status.NOT_FOUND, "Friend request not found");
  }

  // Verify the receiver is part of this connection
  if (
    !connection.users
      .map((id: string | { toString(): string }) => id.toString())
      .includes(receiverId)
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You are not authorized to reject this request"
    );
  }

  // Verify the receiver is not the sender
  if (connection.senderId.toString() === receiverId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot reject your own friend request"
    );
  }

  // Verify the request is pending
  if (connection.status !== "PENDING") {
    throw new AppError(status.BAD_REQUEST, "This request is no longer pending");
  }

  connection.status = "REMOVED";
  await connection.save();
  return connection;
};

// UPDATED cancelRequest service function to allow both users to cancel
interface CancelRequestParams {
  connectionID: string;
  userId: string;
}

const cancelRequest = async (
  connectionID: CancelRequestParams["connectionID"],
  userId: CancelRequestParams["userId"]
): Promise<InstanceType<typeof UserConnection> | null> => {
  // Find the connection by its MongoDB _id
  const connection = await UserConnection.findById(connectionID);

  if (!connection) {
    throw new AppError(status.NOT_FOUND, "Friend request not found");
  }

  // Verify the user is part of this connection
  if (
    !connection.users
      .map((id: string | { toString(): string }) => id.toString())
      .includes(userId)
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You are not part of this connection"
    );
  }

  // Allow cancellation if it's PENDING or ACCEPTED
  if (connection.status !== "PENDING" && connection.status !== "ACCEPTED") {
    throw new AppError(
      status.BAD_REQUEST,
      "This connection cannot be canceled"
    );
  }

  connection.status = "REMOVED";
  await connection.save();
  return connection;
};

// Don't forget to export these updated functions
export const UserConnectionService = {
  sendRequest,
  requestlist,
  sentlist,
  friendList,
  removeFriend,
  acceptRequest,
  rejectRequest,
  cancelRequest,
};
