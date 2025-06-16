import mongoose from "mongoose";
import { appConfig } from "../config";
import { userRoles } from "../interface/auth.interface";
import { AdminProfile } from "../modules/users/adminProfile/adminProfile.model";
import User from "../modules/users/user/user.model";
import logger from "../utils/logger";
import getHashedPassword from "../utils/helper/getHashedPassword";

const superUser = {
  role: userRoles.ADMIN,
  email: appConfig.admin.email,
  password: appConfig.admin.password,
  isVerified: true,
  isSubscribed: true,
  premiumUserNumber: 0,
  subscription: {
    plan: "premium",
    status: "active",
    price: 3.99, // Free for admin
    autoRenew: false, // No need for auto-renewal since it's lifetime
    startDate: new Date(),
    endDate: new Date("2099-12-31"), // Far future date for lifetime access
    stripeSubscriptionId: null, // No Stripe subscription needed
    stripeCustomerId: null, // No Stripe customer needed
  },
};

const superUserProfile = {
  fullName: "Admin",
  email: appConfig.admin.email,
};

const seedAdmin = async (): Promise<void> => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    superUser.password = await getHashedPassword(superUser.password as string);

    const isExistSuperAdmin = await User.findOne({
      role: userRoles.ADMIN,
    }).session(session);

    if (!isExistSuperAdmin) {
      const data = await User.create([superUser], { session });
      await AdminProfile.create([{ ...superUserProfile, user: data[0]._id }], {
        session,
      });
      logger.info("Admin Created with Premium Lifetime Subscription");
    } else {
      // Update existing admin to ensure they have premium subscription
      await User.findOneAndUpdate(
        { role: userRoles.ADMIN },
        {
          $set: {
            isSubscribed: true,
            subscription: {
              plan: "premium",
              status: "active",
              price: 3.99,
              autoRenew: false,
              startDate: new Date(),
              endDate: new Date("2099-12-31"),
              stripeSubscriptionId: null,
              stripeCustomerId: null,
            },
          },
        },
        { session }
      );
      logger.info("Admin already exists - Premium subscription ensured");
    }

    await session.commitTransaction();
  } catch (error) {
    logger.error(error);
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error("Error aborting transaction:", abortError);
      }
    }
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export default seedAdmin;
