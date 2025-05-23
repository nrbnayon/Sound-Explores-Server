import { Types } from "mongoose";

export interface IPrivacyPolicy {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePrivacyPolicyDto {
  title: string;
  description: string;
  order?: number;
}

export interface UpdatePrivacyPolicyDto {
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface PrivacyPolicyQuery {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}
