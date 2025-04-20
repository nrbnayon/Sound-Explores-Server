import status from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserConnectionService } from "./userConnection.service";

const sendRequest = catchAsync(async (req, res) => {
  const recId = req.body.userId;
  const senderId = req.user.userId;
  const result = await UserConnectionService.sendRequest([recId, senderId]);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Request send successfully",
    data: result,
  });
});
const sentlist = catchAsync(async (req, res) => {
  const senderId = req.user.userId;
  const result = await UserConnectionService.sentlist(senderId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Request sent list fetched successfully",
    data: result,
  });
});

export const UserConnectionController = {
  sendRequest,
  sentlist,
};
