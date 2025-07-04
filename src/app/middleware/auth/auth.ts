import { NextFunction, Request, Response } from "express";
import AppError from "../../errors/AppError";
import status from "http-status";
import { TUserRole } from "../../interface/auth.interface";
import { jsonWebToken } from "../../utils/jwt/jwt";
import { appConfig } from "../../config";
import User from "../../modules/users/user/user.model";
import logger from "../../utils/logger";

export const auth =
  (...userRole: TUserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let token: string | undefined;

      // // Log all cookies for debugging
      // console.log("All cookies:", req.cookies);
      // console.log("Authorization header:", req.headers.authorization);

      // First, try to get token from Authorization header (for password reset, etc.)
      const tokenWithBearer = req.headers.authorization as string;
      if (tokenWithBearer && tokenWithBearer.startsWith("Bearer ")) {
        token = tokenWithBearer.split(" ")[1];
      }

      // console.log("Token::", tokenWithBearer);

      // If no token in header, try to get from httpOnly cookies
      if (!token) {
        token = req.cookies?.accessToken;
      }

      // If still no token, return unauthorized
      if (!token || token === "null") {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      const decodedData = jsonWebToken.verifyJwt(
        token,
        appConfig.jwt.jwt_access_secret as string
      );

      const userData = await User.findById(decodedData.userId);

      if (!userData) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      if (userRole.length && !userRole.includes(decodedData.userRole)) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      if (
        userData.role !== decodedData.userRole ||
        userData.email !== decodedData.userEmail
      ) {
        return next(
          new AppError(status.UNAUTHORIZED, "You are not authorized")
        );
      }

      req.user = decodedData;

      return next();
    } catch (error) {
      logger.error("Auth Error:", error);
      return next(
        new AppError(status.UNAUTHORIZED, "Invalid or expired token")
      );
    }
  };
