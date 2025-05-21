// src\app\modules\sendMessge\sendMessage.route.ts
import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { SendMessageController } from "./sendMessage.controller";

const router = Router();

router.post("/send-sound", auth("USER"), SendMessageController.sendMessage);
router.post("/send-sound-to-all-friends", auth("USER"), SendMessageController.sendSoundToAllFriends);

export const SendMessageRoute = router;
