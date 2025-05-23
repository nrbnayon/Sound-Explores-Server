import status from "http-status";
import { PrivacyPolicyService } from "./privacyPolicy.service";
import {
  CreatePrivacyPolicyDto,
  UpdatePrivacyPolicyDto,
} from "./privacyPolicy.interface";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const createPrivacyPolicy = catchAsync(async (req, res) => {
  const adminId = req.user.userId;
  const data: CreatePrivacyPolicyDto = req.body;

  const result = await PrivacyPolicyService.createPrivacyPolicy(data, adminId);

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Privacy policy created successfully",
    data: result,
  });
});

const getAllPrivacyPolicies = catchAsync(async (req, res) => {
  const { search, page, limit, isActive } = req.query;

  const searchTerm = typeof search === "string" ? search : undefined;
  const isActiveValue =
    isActive === "true" ? true : isActive === "false" ? false : undefined;

  const result = await PrivacyPolicyService.getAllPrivacyPolicies({
    search: searchTerm,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    isActive: isActiveValue,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Privacy policies fetched successfully",
    data: result,
  });
});

const getPrivacyPolicyById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PrivacyPolicyService.getPrivacyPolicyById(id);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Privacy policy fetched successfully",
    data: result,
  });
});

const updatePrivacyPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data: UpdatePrivacyPolicyDto = req.body;

  const result = await PrivacyPolicyService.updatePrivacyPolicy(id, data);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Privacy policy updated successfully",
    data: result,
  });
});

const deletePrivacyPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  await PrivacyPolicyService.deletePrivacyPolicy(id);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Privacy policy deleted successfully",
    data: null,
  });
});

const reorderPrivacyPolicies = catchAsync(async (req, res) => {
  const reorderData = req.body.policies; // [{ id: string, order: number }]

  const result = await PrivacyPolicyService.reorderPrivacyPolicies(reorderData);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Privacy policies reordered successfully",
    data: result,
  });
});

const getActivePrivacyPolicies = catchAsync(async (req, res) => {
  const result = await PrivacyPolicyService.getActivePrivacyPolicies();

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Active privacy policies fetched successfully",
    data: result,
  });
});

export const PrivacyPolicyController = {
  createPrivacyPolicy,
  getAllPrivacyPolicies,
  getPrivacyPolicyById,
  updatePrivacyPolicy,
  deletePrivacyPolicy,
  reorderPrivacyPolicies,
  getActivePrivacyPolicies,
};
