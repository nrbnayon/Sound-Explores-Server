// sound.controller.js - Fixed controller with better error handling
import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import { getRelativePath } from "../../middleware/fileUpload/getRelativeFilePath";
import sendResponse from "../../utils/sendResponse";
import { SoundService } from "./sound.service";

const addSound = catchAsync(async (req, res) => {
  // FIXED: Better error handling and validation
  if (!req.file) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "No audio file provided. Please upload a sound file.",
      data: null,
    });
  }

  // Validate file type
  if (!req.file.mimetype.startsWith("audio/")) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Invalid file type. Please upload an audio file.",
      data: null,
    });
  }

  // FIXED: Better error handling for file path
  let link;
  try {
    link = getRelativePath(req.file.path);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return sendResponse(res, {
      success: false,
      statusCode: status.INTERNAL_SERVER_ERROR,
      message: `Error processing uploaded file: ${errorMessage}`,
      data: null,
    });
  }

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
  const { searchTerm, category, page, limit, showAllSounds } = req.query;

  // FIXED: Better parameter parsing
  const pageNumber = page ? parseInt(page as string, 200) : undefined;
  const limitNumber = limit ? parseInt(limit as string, 200) : undefined;

  const result = await SoundService.getAllSound(
    req.user.userId,
    searchTerm as string,
    category as string,
    pageNumber,
    limitNumber,
    showAllSounds === "true"
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "All sounds fetched successfully",
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

  if (!id) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "Sound ID is required",
      data: null,
    });
  }

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
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: "No sound IDs provided or invalid format",
      data: null,
    });
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
