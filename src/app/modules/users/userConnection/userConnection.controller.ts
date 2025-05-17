import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserConnectionService } from "./userConnection.service";

const sendRequest = catchAsync(async (req, res) => {
  const recId = req.body.userId;
  const senderId = req.user.userId;
  const result = await UserConnectionService.sendRequest(
    [recId, senderId],
    senderId
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Request sent successfully",
    data: result,
  });
});

const sentlist = catchAsync(async (req, res) => {
  const senderId = req.user.userId;
  const result = await UserConnectionService.sentlist(senderId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Request sent list fetched successfully",
    data: result,
  });
});

const requestlist = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const result = await UserConnectionService.requestlist(userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Request list fetched successfully",
    data: result,
  });
});

const friendList = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const result = await UserConnectionService.friendList(userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Friend list fetched successfully",
    data: result,
  });
});

const removeFriend = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const recId = req.body.userId;
  const result = await UserConnectionService.removeFriend([userId, recId]);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Friend removed successfully",
    data: result,
  });
});

// NEW CONTROLLERS FOR THE MISSING ENDPOINTS

const acceptRequest = catchAsync(async (req, res) => {
  const receiverId = req.user.userId;
  const connectionID = req.body.connectionID;

  // Call the service with correct parameters
  const result = await UserConnectionService.acceptRequest(
    connectionID,
    receiverId
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Friend request accepted successfully",
    data: result,
  });
});

// Update the rejectRequest controller function
const rejectRequest = catchAsync(async (req, res) => {
  const receiverId = req.user.userId;
  const connectionID = req.body.connectionID;

  // Call the service with correct parameters
  const result = await UserConnectionService.rejectRequest(
    connectionID,
    receiverId
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Friend request rejected successfully",
    data: result,
  });
});

const cancelRequest = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const connectionID = req.body.connectionID;
  // Call the service with correct parameters
  const result = await UserConnectionService.cancelRequest(
    connectionID,
    userId
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Connection canceled successfully",
    data: result,
  });
});

export const UserConnectionController = {
  sendRequest,
  sentlist,
  requestlist,
  friendList,
  removeFriend,
  acceptRequest,
  rejectRequest,
  cancelRequest,
};
