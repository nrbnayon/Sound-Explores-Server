import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { UserConnectionController } from "./userConnection.controller";

const router = Router();
router.post(
  "/send-request",
  auth("USER"),
  UserConnectionController.sendRequest
);

router.get("/sent-list", auth("USER"), UserConnectionController.sentlist);

export const UserConnectionRoute = router;
