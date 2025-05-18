import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SendMessageService } from "./sendMessage.service";

const sendMessage = catchAsync(async (req, res) => {
  // Extract all needed parameters from request body
  const { users, link, soundTitle } = req.body;

  const result = await SendMessageService.sendMessage(
    users,
    link,
    req.user.userEmail,
    soundTitle
  );

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Message is sent successfully",
    data: result,
  });
});

export const SendMessageController = {
  sendMessage,
};
