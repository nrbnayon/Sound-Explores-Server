// src\app\modules\users\user\user.interface.ts
import { Document } from "mongoose";
import { TUserRole } from "../../../interface/auth.interface";

export interface IBaseUser {
  email: string;
  role: TUserRole;
  password: string;
  agreeToTerms?: boolean;
  premiumUserNumber?: number;
  authentication: {
    expDate: Date;
    otp: number;
    token: string;
  };
  isVerified: boolean;
  needToResetPass: boolean;
  isSubscribed: boolean;
  subscription?: {
    plan: "basic" | "premium";
    status: string;
    price: number;
    autoRenew: boolean;
    startDate: Date;
    endDate: Date;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  };
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
