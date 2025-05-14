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
};

const superUserProfile = {
  fullName: "Admin-1",
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
      logger.info("Admin Created");
    } else {
      logger.info("Admin already created");
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
