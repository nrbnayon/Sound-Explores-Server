import { model, Schema } from "mongoose";
import { IPrivacyPolicy } from "./privacyPolicy.interface";

const PrivacyPolicySchema = new Schema<IPrivacyPolicy>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for better performance
PrivacyPolicySchema.index({ order: 1 });
PrivacyPolicySchema.index({ isActive: 1 });
PrivacyPolicySchema.index({ title: "text", description: "text" });

export const PrivacyPolicy = model<IPrivacyPolicy>(
  "PrivacyPolicy",
  PrivacyPolicySchema
);
