// src\app\modules\users\user\user.model.ts
import mongoose, { model, Schema } from "mongoose";
import { IUser } from "./user.interface";
import { userRole } from "../../../interface/auth.interface";
import bcrypt from "bcryptjs";

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ["free", "premium"],
    default: "free",
  },
  status: {
    type: String,
    enum: ["active", "pending", "cancelled", "expired", "incomplete"],
    default: "active",
  },
  price: { type: Number, default: 0 },
  autoRenew: { type: Boolean, default: false },
  startDate: { type: Date },
  endDate: { type: Date },
  stripeSubscriptionId: { type: String },
  stripeCustomerId: { type: String },
});

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: userRole, default: "USER" },
  premiumUserNumber: {
    type: Number,
    unique: true,
    sparse: true,
  },
  agreeToTerms: { type: Boolean },
  authentication: {
    expDate: { type: Date, default: null },
    otp: { type: Number, default: null },
    token: { type: String, default: null },
  },
  isVerified: { type: Boolean, default: false },
  needToResetPass: { type: Boolean, default: false },
  isSubscribed: { type: Boolean, default: false },
  subscription: { type: subscriptionSchema, default: () => ({}) },
});

userSchema.pre("save", function (next) {
  if (this.premiumUserNumber === null) {
    this.premiumUserNumber = undefined;
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword: string) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch {
    throw new Error("Error comparing password");
  }
};

const User = model<IUser>("User", userSchema);

export default User;
