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
  const result = await SoundService.getAllSound();

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "All sound is fetched successfully",
    data: result,
  });
});

export const SoundController = { addSound, getAllSound };
