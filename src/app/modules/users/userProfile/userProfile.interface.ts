import { Types } from "mongoose";

export interface IUserProfile {
  fullName: string;
  nickname?: string;
  dateOfBirth?: Date;
  email: string;
  phone?: string;
  address?: string;
  image?: string;
  user: Types.ObjectId;
}
