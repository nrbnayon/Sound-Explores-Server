import { Router } from "express";
import { SoundController } from "./sound.controller";
import { upload } from "../../middleware/fileUpload/fileUploadHandler";
import { parseDataField } from "../../middleware/fileUpload/parseDataField";
import { auth } from "../../middleware/auth/auth";

const router = Router();

router.post(
  "/add-sound",
  auth("ADMIN", "USER"),
  upload.single("sound"),
  parseDataField("data"),
  SoundController.addSound
);

router.get(
  "/get-all-sound",
  auth("ADMIN", "USER"),
  SoundController.getAllSound
);

router.delete("/delete-sound/:id", auth("ADMIN"), SoundController.deleteSound);

router.delete(
  "/delete-multiple-sounds",
  auth("ADMIN"),
  SoundController.deleteMultipleSounds
);

export const SoundRoute = router;
