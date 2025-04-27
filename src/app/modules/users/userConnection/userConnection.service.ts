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
    throw new AppError(status.BAD_REQUEST, "You havebeen blocked by the user.");
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
    select: "fullName  email  nickname  dateOfBirth  phone address  image",
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
    select: "fullName  email  nickname  dateOfBirth  phone address  image",
  });

  return result;
};

//
export const UserConnectionService = {
  sendRequest,
  requestlist,
  sentlist,
};
