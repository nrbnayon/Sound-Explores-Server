import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { UserConnectionController } from "./userConnection.controller";

const router = Router();

// Existing routes
router.post(
  "/send-request",
  auth("USER"),
  UserConnectionController.sendRequest
);
router.get("/sent-list", auth("USER"), UserConnectionController.sentlist);
router.get("/request-list", auth("USER"), UserConnectionController.requestlist);
router.get("/friend-list", auth("USER"), UserConnectionController.friendList);
router.patch(
  "/remove-friend",
  auth("USER"),
  UserConnectionController.removeFriend
);

// New routes for the missing endpoints
router.patch(
  "/accept-request",
  auth("USER"),
  UserConnectionController.acceptRequest
);
router.patch(
  "/reject-request",
  auth("USER"),
  UserConnectionController.rejectRequest
);
router.patch(
  "/cancel-request",
  auth("USER"),
  UserConnectionController.cancelRequest
);

export const UserConnectionRoute = router;
