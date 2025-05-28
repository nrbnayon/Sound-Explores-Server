// src\app\modules\users\userConnection\userConnection.model.ts
import { model, Schema } from "mongoose";
import { IUserConnection, userStatus } from "./userConnection.interface";

const UserConnectionSchema = new Schema<IUserConnection>(
  {
    users: {
      type: [Schema.Types.ObjectId],
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: Object.values(userStatus),
      default: userStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

export const UserConnection = model<IUserConnection>(
  "UserConnection",
  UserConnectionSchema
);
