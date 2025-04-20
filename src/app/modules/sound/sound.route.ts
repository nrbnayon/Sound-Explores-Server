import { Router } from "express";
import { SoundController } from "./sound.controller";
import { upload } from "../../middleware/fileUpload/fileUploadHandler";
import { parseDataField } from "../../middleware/fileUpload/parseDataField";
import { auth } from "../../middleware/auth/auth";

const router = Router();
router.post(
  "/add-sound",
  auth("ADMIN"),
  upload.single("sound"),
  parseDataField("data"),
  SoundController.addSound
);

router.get(
  "/get-all-sound",
  auth("ADMIN", "USER"),

  SoundController.getAllSound
);
export const SoundRoute = router;
