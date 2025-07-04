/* eslint-disable @typescript-eslint/no-unused-vars */
import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

const userLogin = catchAsync(async (req, res, next) => {
  const result = await AuthService.userLogin(req.body);

  console.log("User login::", result);

  console.log("Cookies set:", {
    isAuthenticated: true,
    accessToken: result.accessToken ? "SET" : "NOT SET",
    refreshToken: result.refreshToken ? "SET" : "NOT SET",
  });
  if (result.accessToken && result.refreshToken) {
    const isProduction = process.env.NODE_ENV === "production";
    const domain = isProduction ? "http://192.168.10.12:3000" : undefined;

    // Set isAuthenticated cookie with long expiration (1 year)
    res.cookie("isAuthenticated", true, {
      secure: isProduction,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      path: "/",
    });

    // Set accessToken cookie with long expiration (1 year)
    res.cookie("accessToken", result.accessToken, {
      secure: isProduction,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      path: "/",
    });

    // Set refreshToken cookie with long expiration (1 year)
    res.cookie("refreshToken", result.refreshToken, {
      secure: isProduction,
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      path: "/",
    });

    console.log("Cookies set successfully");
  }

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User login successfully",
    data: result,
  });
});

const userLogout = catchAsync(async (req, res, next) => {
  // Clear all auth cookies
  res.clearCookie("isAuthenticated", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("accessToken", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User logged out successfully",
    data: null,
  });
});

const verifyUser = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  const result = await AuthService.verifyUser(email, Number(otp));

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Email successfully verified.",
    data: result,
  });
});

const forgotPasswordRequest = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const result = await AuthService.forgotPasswordRequest(email);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "A verification code is sent to your email.",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const tokenWithBearer = req.headers.authorization as string;
  const token = tokenWithBearer.split(" ")[1];

  const result = await AuthService.resetPassword(token as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Password reset successfully",
    data: result,
  });
});

const getNewAccessToken = catchAsync(async (req, res) => {
  // Try to get the refresh token from multiple sources
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.query?.refreshToken ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  // console.log("RefT::", refreshToken);

  const result = await AuthService.getNewAccessToken(refreshToken);

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: status.OK,
    message: "New access-token is created.",
  });
});

const updatePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await AuthService.updatePassword(userId, req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: status.OK,
    message: "Password successfully updated",
  });
});

const reSendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.reSendOtp(email);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: status.OK,
    message: "Verification Code send successfully",
  });
});

export const AuthController = {
  verifyUser,
  forgotPasswordRequest,
  resetPassword,
  userLogin,
  userLogout,
  getNewAccessToken,
  updatePassword,
  reSendOtp,
};
