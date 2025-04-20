import { Document } from "mongoose";
import { TUserRole } from "../../../interface/auth.interface";

export interface IBaseUser {
  email: string;
  role: TUserRole;
  password: string;
  authentication: {
    expDate: Date;
    otp: number;
    token: string;
  };
  isVerified: boolean;
  needToResetPass: boolean;
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
