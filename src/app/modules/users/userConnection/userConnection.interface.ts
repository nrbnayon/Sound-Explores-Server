import { Types } from "mongoose";

export interface IUserConnection {
  users: Types.ObjectId[];
  senderId: Types.ObjectId;
  status: TStatus;
}
export const userStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  BLOCKED: "BLOCKED",
  REMOVED: "REMOVED",
} as const;

export type TStatus = keyof typeof userStatus;
