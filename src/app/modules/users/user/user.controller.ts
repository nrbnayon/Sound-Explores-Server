// src\app\modules\users\user\user.controller.ts
import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserService } from "./user.service";
import { appConfig } from "../../../config";
import Stripe from "stripe";
import AppError from "../../../errors/AppError";
import { CreateSubscriptionRequest } from "../../../types/subscription.types";
import logger from "../../../utils/logger";

if (!appConfig.stripe_key) {
  throw new Error("Stripe key is not configured");
}
const stripe = new Stripe(appConfig.stripe_key);

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

// const buySubscription = catchAsync(async (req, res) => {
//   const { plan, price, paymentMethodId }: CreateSubscriptionRequest = req.body;
//   const userEmail = req.user.userEmail;
//   const userId = req.user.userId;

//   // Validation
//   if (!plan || !["basic", "premium"].includes(plan)) {
//     return sendResponse(res, {
//       success: false,
//       statusCode: status.BAD_REQUEST,
//       message: "Invalid plan. Must be 'basic' or 'premium'.",
//     });
//   }

//   if (!price || typeof price !== "number" || price <= 0) {
//     return sendResponse(res, {
//       success: false,
//       statusCode: status.BAD_REQUEST,
//       message: "Valid price is required.",
//     });
//   }

//   try {
//     const result = await UserService.buySubscriptionIntoDB(
//       plan,
//       price,
//       userEmail,
//       userId,
//       paymentMethodId
//     );

//     sendResponse(res, {
//       success: true,
//       statusCode: status.OK,
//       message: "Subscription created successfully.",
//       data: result,
//     });
//   } catch (error) {
//     logger.error("Subscription creation error:", error);

//     if (error instanceof AppError) {
//       throw error;
//     }

//     // Handle Stripe specific errors
//     if (typeof error === "object" && error !== null && "type" in error) {
//       const stripeError = error as Stripe.errors.StripeError;
//       switch (stripeError.type) {
//         case "StripeCardError":
//           throw new AppError(
//             status.BAD_REQUEST,
//             `Card error: ${stripeError.message}`
//           );
//         case "StripeInvalidRequestError":
//           throw new AppError(
//             status.BAD_REQUEST,
//             `Invalid request: ${(stripeError as Stripe.errors.StripeInvalidRequestError).message}`
//           );
//         case "StripeAPIError":
//           throw new AppError(
//             status.INTERNAL_SERVER_ERROR,
//             "Payment processing error"
//           );
//         default:
//           throw new AppError(
//             status.INTERNAL_SERVER_ERROR,
//             "Payment processing failed"
//           );
//       }
//     }

//     throw new AppError(
//       status.INTERNAL_SERVER_ERROR,
//       "Subscription creation failed"
//     );
//   }
// });

const buySubscription = catchAsync(async (req, res) => {
  const { plan, price, paymentMethodId }: CreateSubscriptionRequest = req.body;
  const userEmail = req.user.userEmail;
  const userId = req.user.userId;

  // Validation
  if (plan !== "premium") {
    throw new AppError(
      status.BAD_REQUEST,
      "Only the premium plan is available."
    );
  }

  if (price !== 3.99) {
    throw new AppError(
      status.BAD_REQUEST,
      "Price must be $3.99 for the premium plan."
    );
  }

  try {
    const result = await UserService.buySubscriptionIntoDB(
      plan,
      price,
      userEmail,
      userId,
      paymentMethodId
    );

    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Subscription created successfully.",
      data: result,
    });
  } catch (error) {
    logger.error("Subscription creation error:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      "Subscription creation failed"
    );
  }
});

const handleWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  if (!sig || typeof sig !== "string") {
    logger.error("Missing or invalid Stripe signature header");
    return next(
      new AppError(400, "Missing or invalid Stripe signature header")
    );
  }

  let event: Stripe.Event;

  try {
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET || appConfig.stripe_webhook_secret;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const error = err as Error;
    logger.error("Webhook signature verification failed:", error.message);
    return next(new AppError(400, `Webhook Error: ${error.message}`));
  }

  logger.info("Webhook event received:", event.type);

  try {
    await UserService.handleStripeWebhook(event);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    return next(new AppError(500, "Webhook processing failed"));
  }
});

const cancelSubscription = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await UserService.cancelSubscriptionIntoDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Subscription cancelled successfully.",
    data: result,
  });
});

const getSubscriptionStatus = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await UserService.getSubscriptionStatus(userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Subscription status retrieved successfully.",
    data: result,
  });
});


const syncSubscriptionStatus = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await UserService.syncSubscriptionStatus(userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Subscription status synchronized successfully.",
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
  buySubscription,
  handleWebhook,
  cancelSubscription,
  getSubscriptionStatus,
  syncSubscriptionStatus,
};
