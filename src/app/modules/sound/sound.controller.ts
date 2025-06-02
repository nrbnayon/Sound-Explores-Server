import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import { getRelativePath } from "../../middleware/fileUpload/getRelativeFilePath";
import sendResponse from "../../utils/sendResponse";
import { SoundService } from "./sound.service";

const addSound = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new Error("No File found.");
  }
  const link = getRelativePath(req.file.path);

  const soundData = {
    ...req.body,
    link,
  };

  const result = await SoundService.addSound(soundData);

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Sound added successfully",
    data: result,
  });
});

const getAllSound = catchAsync(async (req, res) => {
  const { searchTerm, category, page, limit } = req.query;

  const result = await SoundService.getAllSound(
    req.user.userId,
    searchTerm as string,
    category as string,
    page ? parseInt(page as string, 1000) : undefined,
    limit ? parseInt(limit as string, 1000) : undefined
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "All sound is fetched successfully",
    data: result.data,
    meta: {
      totalItem: result.pagination.total,
      totalPage: result.pagination.totalPages,
      limit: result.pagination.limit,
      page: result.pagination.page,
    },
  });
});

const deleteSound = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await SoundService.deleteSound(id);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Sound deleted successfully",
    data: result,
  });
});

const deleteMultipleSounds = catchAsync(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error("No sound IDs provided");
  }

  const result = await SoundService.deleteMultipleSounds(ids);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: `${result.deletedCount} sounds deleted successfully`,
    data: result,
  });
});

export const SoundController = {
  addSound,
  getAllSound,
  deleteSound,
  deleteMultipleSounds,
};
