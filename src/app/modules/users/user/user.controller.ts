import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserService } from "./user.service";
import logger from "../../../utils/logger";

const createUser = catchAsync(async (req, res) => {
  const userData = req.body;

  logger.info("New User", userData);
  const result = await UserService.createUser(userData);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Account successfully created. Check your email for code.",
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

export const UserController = {
  getMe,
  createUser,
  getAllUser,
  updateProfileImage,
  updateProfileData,
};
