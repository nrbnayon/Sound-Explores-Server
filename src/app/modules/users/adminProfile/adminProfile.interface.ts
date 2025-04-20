import { Types } from "mongoose";

export interface IAdminProfile {
  fullName: string;
  nickname?: string;
  dateOfBirth?: Date;
  email: string;
  phone?: string;
  address?: string;
  image?: string;
  user: Types.ObjectId;
}
