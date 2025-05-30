import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserService } from "./user.service";
import { appConfig } from "../../../config";

const createUser = catchAsync(async (req, res) => {
  const userData = req.body;

  const result = await UserService.createUser(userData);

  // Set refresh token cookie with long expiration (1 year)
  res.cookie("refreshToken", result.refreshToken, {
    secure: appConfig.server.node_env === "production",
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
    sameSite: "strict",
    path: "/",
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Account successfully created.",
    data: result,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const currentUserId = req.user.userId;
  const { search, page, limit } = req.query;
  const result = await UserService.getAllUser({
    searchTerm: search as string,
    page: Number(page),
    limit: Number(limit),
    excludeUserId: currentUserId,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "All user successfully fetched.",
    data: result,
  });
});

const updateProfileImage = catchAsync(async (req, res) => {
  const filePath = req.file?.path;

  const result = await UserService.updateProfileImage(
    filePath as string,
    req.user.userEmail
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Profile image changed successfully.",
    data: result,
  });
});

const updateProfileData = catchAsync(async (req, res) => {
  const userData = req.body;

  const result = await UserService.updateProfileData(
    userData,
    req.user.userEmail
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Profile info updated successfully.",
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  const result = await UserService.getMe(req.user.userId);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User data is fetched successfully.",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userRole, userId: currentAdminId } = req.user;
  const { userId: targetUserId } = req.body;

  // Check if user is admin
  if (userRole !== "ADMIN") {
    return sendResponse(res, {
      success: false,
      statusCode: status.FORBIDDEN,
      message: "Access denied. Only admins can delete users.",
    });
  }

  // Check if targetUserId is provided
  if (!targetUserId) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Target user not found.",
    });
  }

  // Prevent admin from deleting themselves
  if (targetUserId === currentAdminId) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "You cannot delete your own account.",
    });
  }
  const result = await UserService.deleteUserIntoDB(targetUserId);
  return sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User deleted successfully.",
    data: result,
  });
});

export const UserController = {
  getMe,
  createUser,
  getAllUser,
  updateProfileImage,
  updateProfileData,
  deleteUser,
};
