import { Schema, model } from "mongoose";
import { IAdminProfile } from "./adminProfile.interface";

const adminProfileSchema = new Schema<IAdminProfile>({
  fullName: { type: String },
  nickname: { type: String },
  dateOfBirth: { type: Date },
  email: { type: String, unique: true },
  phone: { type: String },
  address: { type: String },
  image: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User", unique: true },
});

export const AdminProfile = model<IAdminProfile>(
  "AdminProfile",
  adminProfileSchema
);
