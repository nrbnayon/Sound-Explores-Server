// src\app\modules\users\user\user.service.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { IUserProfile } from "./../userProfile/userProfile.interface";
import status from "http-status";
import AppError from "../../../errors/AppError";
import { getRelativePath } from "../../../middleware/fileUpload/getRelativeFilePath";
import getHashedPassword from "../../../utils/helper/getHashedPassword";
import { UserProfile } from "../userProfile/userProfile.model";
import { IUser } from "./user.interface";
import User from "./user.model";
import { AdminProfile } from "../adminProfile/adminProfile.model";
import { IAdminProfile } from "../adminProfile/adminProfile.interface";
import { removeFalsyFields } from "../../../utils/helper/removeFalsyField";
import mongoose from "mongoose";
import { UserConnection } from "../userConnection/userConnection.model";
import logger from "../../../utils/logger";
import { jsonWebToken } from "../../../utils/jwt/jwt";
import { appConfig } from "../../../config";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS } from "../../../constants/subscriptionPlans";
import { SubscriptionResponse } from "../../../types/subscription.types";
import {
  sendSubscriptionCancelEmail,
  sendSubscriptionSuccessEmail,
} from "../../../helper/notifyByEmail";

if (!appConfig.stripe_key) {
  throw new Error("Stripe key is not configured");
}
const stripe = new Stripe(appConfig.stripe_key);

const createUser = async (data: {
  email: string;
  password: string;
}): Promise<
  Partial<IUser> & {
    accessToken: string;
    refreshToken: string;
    userData: any;
  }
> => {
  const isUserExist = await User.findOne({ email: data.email }).select(
    "+password"
  );
  const hashedPassword = await getHashedPassword(data.password);

  if (isUserExist) {
    throw new AppError(status.BAD_REQUEST, "This email already registered.");
  }

  const userData: any = {
    email: data.email,
    password: hashedPassword,
    isVerified: true,
  };

  const createdUser = await User.create(userData);

  if (!createdUser) {
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create user.");
  }

  //user profile data
  const userProfileData = {
    email: createdUser.email,
    user: createdUser._id,
  };
  await UserProfile.create(userProfileData);

  const jwtPayload = {
    userEmail: userData.email,
    userId: createdUser._id,
    userRole: createdUser.role,
  };

  const accessToken = jsonWebToken.generateToken(
    jwtPayload,
    appConfig.jwt.jwt_access_secret as string,
    appConfig.jwt.jwt_access_exprire
  );

  const refreshToken = jsonWebToken.generateToken(
    jwtPayload,
    appConfig.jwt.jwt_refresh_secret as string,
    appConfig.jwt.jwt_refresh_exprire
  );

  return {
    accessToken,
    refreshToken,
    userData: {
      ...userProfileData,
      password: null,
    },
  };
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
        premiumUserNumber: 1,
        isSubscribed: 1,
        subscription: 1,
        name: "$profile.fullName",
        profile: 1,
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
        throw new AppError(
          status.NOT_FOUND,
          "User not found or already deleted"
        );
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

      logger.info(`Deletion Summary for User ${targetUserId}:`);
      logger.info(
        `- User Profile: ${deletedProfile ? "Deleted" : "Not found"}`
      );
      logger.info(
        `- Admin Profile: ${deletedAdminProfile ? "Deleted" : "Not found"}`
      );
      logger.info(
        `- User Connections: ${deletedConnections.deletedCount} deleted`
      );
    });
    return {
      message: "User deleted successfully",
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

// const buySubscriptionIntoDB = async (
//   plan: "premium",
//   price: number,
//   userEmail: string,
//   userId: string,
//   paymentMethodId?: string
// ): Promise<SubscriptionResponse> => {
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(status.NOT_FOUND, "User not found.");
//   if (user.isSubscribed && user.subscription?.status === "active") {
//     throw new AppError(status.BAD_REQUEST, "Already subscribed.");
//   }

//   const subscriptionPlan = SUBSCRIPTION_PLANS[plan];
//   if (!subscriptionPlan || price !== 4.99) {
//     throw new AppError(status.BAD_REQUEST, "Invalid plan or price.");
//   }

//   const session = await mongoose.startSession();
//   try {
//     return await session.withTransaction(async () => {
//       let stripeCustomerId =
//         user.subscription?.stripeCustomerId ||
//         (
//           await stripe.customers.create({
//             email: userEmail,
//             metadata: { userId },
//           })
//         ).id;

//       if (paymentMethodId) {
//         await stripe.paymentMethods.attach(paymentMethodId, {
//           customer: stripeCustomerId,
//         });
//         await stripe.customers.update(stripeCustomerId, {
//           invoice_settings: { default_payment_method: paymentMethodId },
//         });
//       }

//       const subscription = await stripe.subscriptions.create({
//         customer: stripeCustomerId,
//         items: [{ price: subscriptionPlan.priceId }],
//         payment_behavior: "error_if_incomplete",
//         payment_settings: {
//           save_default_payment_method: "on_subscription",
//           payment_method_types: ["card"],
//         },
//         expand: ["latest_invoice.payment_intent"],
//       });

//       const invoice = subscription.latest_invoice as Stripe.Invoice;
//       const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

//       logger.info("Subscription created:", {
//         subscriptionId: subscription.id,
//         status: subscription.status,
//         paymentIntentStatus: paymentIntent?.status,
//         current_period_start: subscription.current_period_start,
//         current_period_end: subscription.current_period_end,
//       });

//       if (paymentIntent?.last_payment_error) {
//         logger.error("Payment intent error:", paymentIntent.last_payment_error);
//       }

//       // Fix: Handle potential null/undefined timestamps
//       let startDate: Date | undefined;
//       let endDate: Date | undefined;

//       if (subscription.current_period_start) {
//         startDate = new Date(subscription.current_period_start * 1000);
//       }

//       if (subscription.current_period_end) {
//         endDate = new Date(subscription.current_period_end * 1000);
//       }

//       // Build subscription object with only valid dates
//       const subscriptionData: any = {
//         plan,
//         status: subscription.status,
//         price,
//         autoRenew: !subscription.cancel_at_period_end,
//         stripeSubscriptionId: subscription.id,
//         stripeCustomerId,
//       };

//       // Only add dates if they are valid
//       if (startDate && !isNaN(startDate.getTime())) {
//         subscriptionData.startDate = startDate;
//       }

//       if (endDate && !isNaN(endDate.getTime())) {
//         subscriptionData.endDate = endDate;
//       }

//       const updatedUser = await User.findByIdAndUpdate(
//         userId,
//         {
//           isSubscribed: subscription.status === "active",
//           subscription: subscriptionData,
//         },
//         { new: true, session }
//       );

//       if (!updatedUser)
//         throw new AppError(
//           status.INTERNAL_SERVER_ERROR,
//           "Failed to update user."
//         );

//       return {
//         subscriptionId: subscription.id,
//         clientSecret: paymentIntent?.client_secret,
//         status: subscription.status,
//         currentPeriodEnd: endDate,
//         plan,
//         price,
//         requiresAction: paymentIntent?.status === "requires_action",
//         paymentIntentStatus: paymentIntent?.status,
//       };
//     });
//   } catch (error) {
//     logger.error("Subscription error:", error);
//     throw error instanceof AppError
//       ? error
//       : new AppError(status.INTERNAL_SERVER_ERROR, "Subscription failed.");
//   } finally {
//     await session.endSession();
//   }
// };

// const cancelSubscriptionIntoDB = async (userId: string) => {
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(status.NOT_FOUND, "User not found.");
//   if (!user.isSubscribed || !user.subscription?.stripeSubscriptionId) {
//     throw new AppError(status.BAD_REQUEST, "No active subscription found.");
//   }

//   const session = await mongoose.startSession();

//   try {
//     return await session.withTransaction(async () => {
//       if (!user.subscription?.stripeSubscriptionId) {
//         throw new AppError(status.BAD_REQUEST, "No subscription ID found.");
//       }
//       const cancelledSubscription = await stripe.subscriptions.update(
//         user.subscription.stripeSubscriptionId,
//         { cancel_at_period_end: true }
//       );

//       // Validate end date
//       const endDate = cancelledSubscription.current_period_end
//         ? new Date(cancelledSubscription.current_period_end * 1000)
//         : null;

//       if (endDate && isNaN(endDate.getTime())) {
//         logger.error(
//           `Invalid end date for subscription ${cancelledSubscription.id}`
//         );
//         throw new AppError(
//           status.INTERNAL_SERVER_ERROR,
//           "Invalid subscription end date."
//         );
//       }

//       const updateData: any = {
//         "subscription.status": cancelledSubscription.status,
//         "subscription.autoRenew": false,
//       };

//       if (endDate) {
//         updateData["subscription.endDate"] = endDate;
//       }

//       const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
//         new: true,
//         session,
//       });

//       if (!updatedUser) {
//         throw new AppError(
//           status.INTERNAL_SERVER_ERROR,
//           "Failed to update subscription."
//         );
//       }

//       logger.info(
//         `Subscription cancelled for user ${userId}: ${cancelledSubscription.id}`
//       );

//       return {
//         message:
//           "Subscription will be cancelled at the end of the current period",
//         cancelAtPeriodEnd: endDate,
//       };
//     });
//   } catch (error) {
//     logger.error("Subscription cancellation error:", error);
//     throw error instanceof AppError
//       ? error
//       : new AppError(
//           status.INTERNAL_SERVER_ERROR,
//           "Failed to cancel subscription."
//         );
//   } finally {
//     await session.endSession();
//   }
// };

const buySubscriptionIntoDB = async (
  plan: "premium",
  price: number,
  userEmail: string,
  userId: string,
  paymentMethodId?: string
): Promise<SubscriptionResponse> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(status.NOT_FOUND, "User not found.");
  if (user.isSubscribed && user.subscription?.status === "active") {
    throw new AppError(status.BAD_REQUEST, "Already subscribed.");
  }

  const subscriptionPlan = SUBSCRIPTION_PLANS[plan];
  if (!subscriptionPlan || price !== 3.99) {
    throw new AppError(status.BAD_REQUEST, "Invalid plan or price.");
  }

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const stripeCustomerId =
        user.subscription?.stripeCustomerId ||
        (
          await stripe.customers.create({
            email: userEmail,
            metadata: { userId },
          })
        ).id;

      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: subscriptionPlan.priceId }],
        payment_behavior: "error_if_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        expand: ["latest_invoice.payment_intent"],
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      logger.info("Subscription created:", {
        subscriptionId: subscription.id,
        status: subscription.status,
        paymentIntentStatus: paymentIntent?.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      });

      if (paymentIntent?.last_payment_error) {
        logger.error("Payment intent error:", paymentIntent.last_payment_error);
        throw new AppError(status.BAD_REQUEST, "Payment failed.");
      }

      // Calculate dates with proper validation
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (subscription.current_period_start) {
        const calculatedStartDate = new Date(
          subscription.current_period_start * 1000
        );
        if (!isNaN(calculatedStartDate.getTime())) {
          startDate = calculatedStartDate;
          logger.info("Start date calculated:", startDate.toISOString());
        } else {
          logger.error(
            "Invalid start date from Stripe:",
            subscription.current_period_start
          );
        }
      }

      if (subscription.current_period_end) {
        const calculatedEndDate = new Date(
          subscription.current_period_end * 1000
        );
        if (!isNaN(calculatedEndDate.getTime())) {
          endDate = calculatedEndDate;
          logger.info("End date calculated:", endDate.toISOString());
        } else {
          logger.error(
            "Invalid end date from Stripe:",
            subscription.current_period_end
          );
        }
      }

      // Generate premium user number only if subscription is active and user doesn't have one
      let premiumUserNumber = user.premiumUserNumber;

      if (subscription.status === "active" && !premiumUserNumber) {
        const getNextPremiumUserNumber = async (): Promise<number> => {
          const lastUser = await User.findOne(
            { premiumUserNumber: { $exists: true, $ne: null } },
            {},
            { sort: { premiumUserNumber: -1 } }
          ).session(session);
          return lastUser?.premiumUserNumber
            ? lastUser.premiumUserNumber + 1
            : 1;
        };

        premiumUserNumber = await getNextPremiumUserNumber();
      }

      // FIXED: Use dot notation to update subscription fields individually
      // instead of replacing the entire subscription object
      const updateData: any = {
        isSubscribed: subscription.status === "active",
        "subscription.plan": plan,
        "subscription.status": subscription.status,
        "subscription.price": price,
        "subscription.autoRenew": !subscription.cancel_at_period_end,
        "subscription.stripeSubscriptionId": subscription.id,
        "subscription.stripeCustomerId": stripeCustomerId,
      };

      // Add dates using dot notation - this ensures they are properly saved
      if (startDate) {
        updateData["subscription.startDate"] = startDate;
        logger.info("Adding start date to update:", startDate.toISOString());
      }

      if (endDate) {
        updateData["subscription.endDate"] = endDate;
        logger.info("Adding end date to update:", endDate.toISOString());
      }

      // Only assign premium user number if subscription is active and user doesn't have one
      if (subscription.status === "active" && !user.premiumUserNumber) {
        updateData.premiumUserNumber = premiumUserNumber;
      }

      logger.info("Update data being sent to database:", {
        userId,
        updateFields: Object.keys(updateData),
        subscriptionDates: {
          startDate: updateData["subscription.startDate"],
          endDate: updateData["subscription.endDate"],
        },
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData }, // Use $set explicitly for clarity
        {
          new: true,
          session,
        }
      );

      if (!updatedUser) {
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to update user."
        );
      }

      // Log the final result to verify dates were saved
      logger.info("User updated successfully:", {
        userId: updatedUser._id,
        isSubscribed: updatedUser.isSubscribed,
        subscriptionStatus: updatedUser.subscription?.status,
        startDate: updatedUser.subscription?.startDate,
        endDate: updatedUser.subscription?.endDate,
        premiumUserNumber: updatedUser.premiumUserNumber,
      });

      // Send subscription success email
      if (subscription.status === "active") {
        await sendSubscriptionSuccessEmail(updatedUser, {
          plan,
          price,
          startDate,
          endDate,
        });
      }

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status,
        currentPeriodEnd: endDate,
        plan,
        price,
        requiresAction: paymentIntent?.status === "requires_action",
        paymentIntentStatus: paymentIntent?.status,
        premiumUserNumber: updatedUser.premiumUserNumber,
      };
    });
  } catch (error) {
    logger.error("Subscription error:", error);
    throw error instanceof AppError
      ? error
      : new AppError(status.INTERNAL_SERVER_ERROR, "Subscription failed.");
  } finally {
    await session.endSession();
  }
};

const cancelSubscriptionIntoDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(status.NOT_FOUND, "User not found.");
  if (!user.isSubscribed || !user.subscription?.stripeSubscriptionId) {
    throw new AppError(status.BAD_REQUEST, "No active subscription found.");
  }

  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      if (!user.subscription?.stripeSubscriptionId) {
        throw new AppError(status.BAD_REQUEST, "No subscription ID found.");
      }
      const cancelledSubscription = await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      const endDate = cancelledSubscription.current_period_end
        ? new Date(cancelledSubscription.current_period_end * 1000)
        : null;

      if (endDate && isNaN(endDate.getTime())) {
        logger.error(
          `Invalid end date for subscription ${cancelledSubscription.id}`
        );
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Invalid subscription end date."
        );
      }

      const updateData: any = {
        "subscription.status": cancelledSubscription.status,
        "subscription.autoRenew": false,
      };

      if (endDate) {
        updateData["subscription.endDate"] = endDate;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        session,
      });

      if (!updatedUser) {
        throw new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to update subscription."
        );
      }

      // Send subscription cancellation email
      await sendSubscriptionCancelEmail(updatedUser, {
        plan: user.subscription.plan,
        endDate,
      });

      logger.info(
        `Subscription cancelled for user ${userId}: ${cancelledSubscription.id}`
      );

      return {
        message:
          "Subscription will be cancelled at the end of the current period",
        cancelAtPeriodEnd: endDate,
      };
    });
  } catch (error) {
    logger.error("Subscription cancellation error:", error);
    throw error instanceof AppError
      ? error
      : new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to cancel subscription."
        );
  } finally {
    await session.endSession();
  }
};

const getSubscriptionStatus = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  if (!user.subscription?.stripeSubscriptionId) {
    return {
      isSubscribed: false,
      subscription: null,
    };
  }

  try {
    // Get latest subscription data from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId
    );

    // Get dates from Stripe, fall back to local database if not available
    let startDate = null;
    let endDate = null;

    // Try to get dates from Stripe first
    if (subscription.current_period_start) {
      const stripeStartDate = new Date(
        subscription.current_period_start * 1000
      );
      if (!isNaN(stripeStartDate.getTime())) {
        startDate = stripeStartDate;
      }
    }

    if (subscription.current_period_end) {
      const stripeEndDate = new Date(subscription.current_period_end * 1000);
      if (!isNaN(stripeEndDate.getTime())) {
        endDate = stripeEndDate;
      }
    }

    // Fall back to local database dates if Stripe dates are not available
    if (!startDate && user.subscription.startDate) {
      startDate = new Date(user.subscription.startDate);
      logger.info("Using local database start date as fallback");
    }

    if (!endDate && user.subscription.endDate) {
      endDate = new Date(user.subscription.endDate);
      logger.info("Using local database end date as fallback");
    }

    // Prepare update object with the most recent data from Stripe
    const updateData: any = {
      isSubscribed: subscription.status === "active",
      "subscription.status": subscription.status,
      "subscription.autoRenew": !subscription.cancel_at_period_end,
    };

    // Only update dates in database if we have valid dates from Stripe
    if (subscription.current_period_start) {
      const stripeStartDate = new Date(
        subscription.current_period_start * 1000
      );
      if (!isNaN(stripeStartDate.getTime())) {
        updateData["subscription.startDate"] = stripeStartDate;
      }
    }

    if (subscription.current_period_end) {
      const stripeEndDate = new Date(subscription.current_period_end * 1000);
      if (!isNaN(stripeEndDate.getTime())) {
        updateData["subscription.endDate"] = stripeEndDate;
      }
    }

    // Update local data with latest from Stripe
    await User.findByIdAndUpdate(userId, updateData);

    return {
      isSubscribed: subscription.status === "active",
      subscription: {
        plan: user.subscription.plan,
        status: subscription.status,
        price: user.subscription.price,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        startDate: startDate,
        endDate: endDate,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        autoRenew: !subscription.cancel_at_period_end,
      },
    };
  } catch (error) {
    logger.error("Error fetching subscription status:", error);
    throw error instanceof AppError
      ? error
      : new AppError(
          status.INTERNAL_SERVER_ERROR,
          "Failed to fetch subscription status."
        );
  }
};

const handleStripeWebhook = async (event: Stripe.Event): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await updateSubscriptionFromWebhook(subscription, session);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription, session);
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentSucceeded(invoice, session);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailed(invoice, session);
          break;
        }
        case "customer.created":
        case "payment_intent.created":
        case "customer.updated":
        case "invoice.created":
        case "invoice.finalized":
          logger.info(`Received and logged event: ${event.type}`);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};

// Helper functions for webhook processing
const updateSubscriptionFromWebhook = async (
  subscription: Stripe.Subscription,
  session: mongoose.ClientSession
): Promise<void> => {
  const customer = await stripe.customers.retrieve(
    subscription.customer as string
  );

  if (!customer || (customer as any).deleted) {
    logger.error("Customer not found for subscription:", subscription.id);
    return;
  }

  const userId = (customer as Stripe.Customer).metadata?.userId;

  if (!userId) {
    logger.error("User ID not found in customer metadata:", customer.id);
    return;
  }

  // Get current user data
  const user = await User.findById(userId).session(session);
  if (!user) {
    logger.error("User not found:", userId);
    return;
  }

  // Build update object with date validation
  const updateData: any = {
    isSubscribed: subscription.status === "active",
    "subscription.status": subscription.status,
    "subscription.stripeSubscriptionId": subscription.id,
  };

  // Generate premium user number if subscription becomes active and user doesn't have one
  if (subscription.status === "active" && !user.premiumUserNumber) {
    const getNextPremiumUserNumber = async (): Promise<number> => {
      const lastUser = await User.findOne(
        { premiumUserNumber: { $exists: true, $ne: null } },
        {},
        { sort: { premiumUserNumber: -1 } }
      ).session(session);
      return lastUser?.premiumUserNumber ? lastUser.premiumUserNumber + 1 : 1;
    };

    updateData.premiumUserNumber = await getNextPremiumUserNumber();
  }

  // Only add dates if they are valid
  if (subscription.current_period_start) {
    const startDate = new Date(subscription.current_period_start * 1000);
    if (!isNaN(startDate.getTime())) {
      updateData["subscription.startDate"] = startDate;
    }
  }

  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end * 1000);
    if (!isNaN(endDate.getTime())) {
      updateData["subscription.endDate"] = endDate;
    }
  }

  await User.findByIdAndUpdate(userId, { $set: updateData }, { session });

  logger.info(
    `Updated subscription for user ${userId}: ${subscription.status}`
  );
};

const handlePaymentSucceeded = async (
  invoice: Stripe.Invoice,
  session: mongoose.ClientSession
): Promise<void> => {
  if (!invoice.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const customer = await stripe.customers.retrieve(
    subscription.customer as string
  );

  if (!customer || (customer as any).deleted) {
    logger.error("Customer not found for subscription:", subscription.id);
    return;
  }

  const userId = (customer as Stripe.Customer).metadata?.userId;

  if (!userId) {
    logger.error("User ID not found in customer metadata:", customer.id);
    return;
  }

  // Get current user data
  const user = await User.findById(userId).session(session);
  if (!user) {
    logger.error("User not found:", userId);
    return;
  }

  // Build update object with date validation
  const updateData: any = {
    isSubscribed: true, // Always set to true when payment succeeds
    "subscription.status": "active", // Force active status
    "subscription.autoRenew": !subscription.cancel_at_period_end,
    "subscription.stripeSubscriptionId": subscription.id,
  };

  // Generate premium user number if user doesn't have one
  if (!user.premiumUserNumber) {
    const getNextPremiumUserNumber = async (): Promise<number> => {
      const lastUser = await User.findOne(
        { premiumUserNumber: { $exists: true, $ne: null } },
        {},
        { sort: { premiumUserNumber: -1 } }
      ).session(session);
      return lastUser?.premiumUserNumber ? lastUser.premiumUserNumber + 1 : 1;
    };

    updateData.premiumUserNumber = await getNextPremiumUserNumber();
  }

  // Only add dates if they are valid
  if (subscription.current_period_start) {
    const startDate = new Date(subscription.current_period_start * 1000);
    if (!isNaN(startDate.getTime())) {
      updateData["subscription.startDate"] = startDate;
    }
  }

  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end * 1000);
    if (!isNaN(endDate.getTime())) {
      updateData["subscription.endDate"] = endDate;
    }
  }

  // Update user subscription status to active when payment succeeds
  const updateResult = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { session, new: true }
  );

  if (updateResult) {
    logger.info(
      `Payment succeeded and subscription activated for user ${userId}: ${subscription.id}, Premium User Number: ${updateResult.premiumUserNumber}`
    );
  } else {
    logger.error(`Failed to update user ${userId} after successful payment`);
  }
};

// Add a method to manually sync subscription status
const syncSubscriptionStatus = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || !user.subscription?.stripeSubscriptionId) {
    return null;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId
    );

    // Build update object with date validation
    const updateData: any = {
      isSubscribed: subscription.status === "active",
      "subscription.status": subscription.status,
      "subscription.autoRenew": !subscription.cancel_at_period_end,
    };

    // Only add dates if they are valid
    if (subscription.current_period_start) {
      const startDate = new Date(subscription.current_period_start * 1000);
      if (!isNaN(startDate.getTime())) {
        updateData["subscription.startDate"] = startDate;
      }
    }

    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end * 1000);
      if (!isNaN(endDate.getTime())) {
        updateData["subscription.endDate"] = endDate;
      }
    }

    // Update local database with Stripe data
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    logger.info(
      `Synced subscription status for user ${userId}: ${subscription.status}`
    );
    return updatedUser;
  } catch (error) {
    logger.error(`Failed to sync subscription for user ${userId}:`, error);
    throw error;
  }
};

const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription,
  session: mongoose.ClientSession
): Promise<void> => {
  try {
    logger.info(`Processing subscription deletion: ${subscription.id}`);

    const customer = await stripe.customers.retrieve(
      subscription.customer as string
    );

    if (!customer || customer.deleted) {
      logger.warn(
        `Customer not found or deleted for subscription: ${subscription.id}`
      );
      return;
    }

    const userId = (customer as Stripe.Customer).metadata?.userId;

    if (!userId) {
      logger.warn(
        `User ID not found in customer metadata for subscription: ${subscription.id}`
      );
      return;
    }

    // Get current user state
    const user = await User.findById(userId).session(session);
    if (!user) {
      logger.warn(`User not found in database: ${userId}`);
      return;
    }

    // Update user subscription status
    const updateResult = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isSubscribed: false,
          "subscription.status": "cancelled",
          "subscription.autoRenew": false,
          // Optionally set end date if not already set
          ...(subscription.current_period_end && {
            "subscription.endDate": new Date(
              subscription.current_period_end * 1000
            ),
          }),
        },
      },
      { session, new: true }
    );

    if (updateResult) {
      logger.info(
        `Successfully updated subscription status for user ${userId}: cancelled`
      );
    } else {
      logger.error(`Failed to update subscription status for user ${userId}`);
    }
  } catch (error) {
    logger.error(
      `Error handling subscription deletion for ${subscription.id}:`,
      error
    );
    throw error; // Re-throw to trigger transaction rollback
  }
};

const handlePaymentFailed = async (invoice: Stripe.Invoice): Promise<void> => {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (!customer || customer.deleted) return;

  const userId = (customer as Stripe.Customer).metadata?.userId;
  if (!userId) return;

  const errorMessage = invoice.last_payment_error?.message || "Unknown error";
  logger.error(
    `Payment failed for user ${userId}, invoice: ${invoice.id}, reason: ${errorMessage}`
  );

  // Optionally notify the user or update status
  await User.findByIdAndUpdate(userId, {
    "subscription.status": "incomplete",
  });
};

const processExpiredSubscriptions = async (): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const now = new Date();

      // Find users with expired subscriptions
      const expiredUsers = await User.find({
        isSubscribed: true,
        "subscription.endDate": { $lt: now },
        "subscription.status": { $in: ["active", "cancelled"] },
      }).session(session);

      logger.info(
        `Found ${expiredUsers.length} users with expired subscriptions`
      );

      for (const user of expiredUsers) {
        if (user.subscription?.stripeSubscriptionId) {
          try {
            // Verify with Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(
              user.subscription.stripeSubscriptionId
            );

            // Only update if Stripe also shows it as ended
            if (
              ["canceled", "unpaid", "past_due"].includes(
                stripeSubscription.status
              )
            ) {
              await User.findByIdAndUpdate(
                user._id,
                {
                  $set: {
                    isSubscribed: false,
                    "subscription.status": "expired",
                  },
                },
                { session }
              );

              logger.info(
                `Marked subscription as expired for user ${user._id}`
              );
            }
          } catch (stripeError) {
            logger.error(
              `Error checking Stripe subscription for user ${user._id}:`,
              stripeError
            );
            // If Stripe subscription not found, assume it's cancelled
            await User.findByIdAndUpdate(
              user._id,
              {
                $set: {
                  isSubscribed: false,
                  "subscription.status": "expired",
                },
              },
              { session }
            );
          }
        } else {
          // No Stripe subscription ID, just mark as expired
          await User.findByIdAndUpdate(
            user._id,
            {
              $set: {
                isSubscribed: false,
                "subscription.status": "expired",
              },
            },
            { session }
          );
        }
      }
    });
  } catch (error) {
    logger.error("Error processing expired subscriptions:", error);
    throw error;
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
  deleteUserIntoDB,
  buySubscriptionIntoDB,
  cancelSubscriptionIntoDB,
  getSubscriptionStatus,
  handleStripeWebhook,
  syncSubscriptionStatus,
  processExpiredSubscriptions,
};
