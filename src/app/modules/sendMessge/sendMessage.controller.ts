import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SendMessageService } from "./sendMessage.service";

const sendMessage = catchAsync(async (req, res) => {
  console.log(req.user);
  const result = await SendMessageService.sendMessage(
    req.body.users,
    req.body.link,
    req.user.userEmail
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
