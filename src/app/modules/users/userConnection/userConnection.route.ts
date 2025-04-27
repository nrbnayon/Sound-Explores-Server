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
router.get("/request-list", auth("USER"), UserConnectionController.requestlist);

export const UserConnectionRoute = router;
