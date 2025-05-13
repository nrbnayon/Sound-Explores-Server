import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { SendMessageController } from "./sendMessage.controller";

const router = Router();

router.post("/send-message", auth("USER"), SendMessageController.sendMessage);

export const SendMessageRoute = router;
