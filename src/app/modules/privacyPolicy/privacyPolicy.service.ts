import status from "http-status";
import { PrivacyPolicy } from "./privacyPolicy.model";
import {
  IPrivacyPolicy,
  CreatePrivacyPolicyDto,
  UpdatePrivacyPolicyDto,
  PrivacyPolicyQuery,
} from "./privacyPolicy.interface";
import AppError from "../../errors/AppError";

const createPrivacyPolicy = async (
  data: CreatePrivacyPolicyDto,
  adminId: string
): Promise<IPrivacyPolicy> => {
  // Check if title already exists
  const existingPolicy = await PrivacyPolicy.findOne({
    title: { $regex: new RegExp(`^${data.title}$`, "i") },
    isActive: true,
  });

  if (existingPolicy) {
    throw new AppError(
      status.BAD_REQUEST,
      "Privacy policy with this title already exists"
    );
  }

  // If no order specified, set it to the next available order
  if (!data.order) {
    const lastPolicy = await PrivacyPolicy.findOne(
      {},
      {},
      { sort: { order: -1 } }
    );
    data.order = lastPolicy ? lastPolicy.order + 1 : 1;
  }

  const privacyPolicy = await PrivacyPolicy.create({
    ...data,
    createdBy: adminId,
  });

  return privacyPolicy;
};

const getAllPrivacyPolicies = async (queries: PrivacyPolicyQuery = {}): Promise<{ meta: { totalItem: number; totalPage: number; limit: number; page: number }; data: IPrivacyPolicy[] }> => {
  const { search = "", page = 1, limit = 20, isActive } = queries;
  const skip = (page - 1) * limit;

  // Build search criteria
  const searchCriteria: {
    $or?: { [key: string]: { $regex: string; $options: string } }[];
    isActive?: boolean;
  } = {};

  if (search) {
    searchCriteria.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (isActive !== undefined) {
    searchCriteria.isActive = isActive;
  }

  // Get total count for pagination
  const totalItem = await PrivacyPolicy.countDocuments(searchCriteria);
  const totalPage = Math.ceil(totalItem / limit);

  // Get privacy policies with pagination
  const privacyPolicies = await PrivacyPolicy.find(searchCriteria)
    .populate("createdBy", "email fullName")
    .sort({ order: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    meta: {
      totalItem,
      totalPage,
      limit: Number(limit),
      page: Number(page),
    },
    data: privacyPolicies,
  };
};

const getPrivacyPolicyById = async (id: string): Promise<IPrivacyPolicy> => {
  const privacyPolicy = await PrivacyPolicy.findById(id).populate(
    "createdBy",
    "email fullName"
  );

  if (!privacyPolicy) {
    throw new AppError(status.NOT_FOUND, "Privacy policy not found");
  }

  return privacyPolicy;
};

const updatePrivacyPolicy = async (
  id: string,
  data: UpdatePrivacyPolicyDto
): Promise<IPrivacyPolicy> => {
  const privacyPolicy = await PrivacyPolicy.findById(id);

  if (!privacyPolicy) {
    throw new AppError(status.NOT_FOUND, "Privacy policy not found");
  }

  // Check if title already exists (excluding current policy)
  if (data.title) {
    const existingPolicy = await PrivacyPolicy.findOne({
      _id: { $ne: id },
      title: { $regex: new RegExp(`^${data.title}$`, "i") },
      isActive: true,
    });

    if (existingPolicy) {
      throw new AppError(
        status.BAD_REQUEST,
        "Privacy policy with this title already exists"
      );
    }
  }

  const updatedPolicy = await PrivacyPolicy.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "email fullName");

  if (!updatedPolicy) {
    throw new AppError(status.NOT_FOUND, "Privacy policy not found");
  }

  return updatedPolicy;
};

const deletePrivacyPolicy = async (id: string): Promise<void> => {
  const privacyPolicy = await PrivacyPolicy.findById(id);

  if (!privacyPolicy) {
    throw new AppError(status.NOT_FOUND, "Privacy policy not found");
  }

  // Soft delete by setting isActive to false
  await PrivacyPolicy.findByIdAndUpdate(id, { isActive: false });
};

const reorderPrivacyPolicies = async (
  reorderData: { id: string; order: number }[]
): Promise<{ message: string }> => {
  const bulkOps = reorderData.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order },
    },
  }));

  await PrivacyPolicy.bulkWrite(bulkOps);

  return { message: "Privacy policies reordered successfully" };
};

const getActivePrivacyPolicies = async (): Promise<IPrivacyPolicy[]> => {
  const privacyPolicies = await PrivacyPolicy.find({ isActive: true })
    .select("title description order")
    .sort({ order: 1 });

  return privacyPolicies;
};

export const PrivacyPolicyService = {
  createPrivacyPolicy,
  getAllPrivacyPolicies,
  getPrivacyPolicyById,
  updatePrivacyPolicy,
  deletePrivacyPolicy,
  reorderPrivacyPolicies,
  getActivePrivacyPolicies,
};
