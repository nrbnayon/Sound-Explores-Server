/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import status from "http-status";
import AppError from "../../../errors/AppError";
import { UserConnection } from "./userConnection.model";

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

const friendList = async (userId: string) => {
  const result = await UserConnection.find({
    users: { $in: [userId] },
    status: "ACCEPTED",
  }).populate({
    path: "users",
    foreignField: "user",
    model: "UserProfile",
    select: "fullName email nickname dateOfBirth phone address image",
  });

  return result;
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

const acceptRequest = async (userIds: string[]) => {
  const connection = await UserConnection.findOne({
    users: { $all: userIds, $size: 2 },
    status: "PENDING",
  });

  if (!connection) {
    throw new AppError(status.NOT_FOUND, "Friend request not found");
  }

  // Ensure the person accepting is not the sender
  const receiverId = userIds[1];
  if (connection.senderId.toString() === receiverId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot accept your own friend request"
    );
  }

  connection.status = "ACCEPTED";
  await connection.save();
  return connection;
};

const rejectRequest = async (userIds: string[]) => {
  const connection = await UserConnection.findOne({
    users: { $all: userIds, $size: 2 },
    status: "PENDING",
  });

  if (!connection) {
    throw new AppError(status.NOT_FOUND, "Friend request not found");
  }

  // Ensure the person rejecting is not the sender
  const receiverId = userIds[1];
  if (connection.senderId.toString() === receiverId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot reject your own friend request"
    );
  }

  connection.status = "REMOVED";
  await connection.save();
  return connection;
};

const cancelRequest = async (userIds: string[]) => {
  const connection = await UserConnection.findOne({
    users: { $all: userIds, $size: 2 },
    status: "PENDING",
  });

  if (!connection) {
    throw new AppError(status.NOT_FOUND, "Friend request not found");
  }

  // Ensure the person canceling is the sender
  const senderId = userIds[0];
  if (connection.senderId.toString() !== senderId) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only cancel requests you've sent"
    );
  }

  connection.status = "REMOVED";
  await connection.save();
  return connection;
};

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
