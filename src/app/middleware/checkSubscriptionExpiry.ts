// src\app\middleware\checkSubscriptionExpiry.ts
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import User from "../modules/users/user/user.model";

export const checkSubscriptionExpiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.userId) {
      const user = await User.findById(req.user.userId);

      if (user && user.isSubscribed && user.subscription?.endDate) {
        const now = new Date();
        const subscriptionEndDate = new Date(user.subscription.endDate);

        // If subscription has expired
        if (now > subscriptionEndDate) {
          logger.info(
            `Subscription expired for user ${user._id}, updating status`
          );

          await User.findByIdAndUpdate(user._id, {
            isSubscribed: false,
            "subscription.status": "expired",
          });

          // Update the req.user object to reflect the change
          if (req.user) {
            req.user.isSubscribed = false;
          }
        }
      }
    }
    next();
  } catch (error) {
    logger.error("Error checking subscription expiry:", error);
    next(); // Continue even if check fails
  }
};
