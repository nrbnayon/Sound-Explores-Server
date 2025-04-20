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
  const session = await mongoose.startSession();
  session.startTransaction();
  superUser.password = await getHashedPassword(superUser.password as string);
  try {
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
    session.endSession();
  } catch (error) {
    logger.error("Faield to create Admin");

    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export default seedAdmin;
