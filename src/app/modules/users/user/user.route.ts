import { Router } from "express";
import { UserController } from "./user.controller";

import { zodCreateUserSchema } from "./user.validation";
import zodValidator from "../../../middleware/zodValidator";
import { upload } from "../../../middleware/fileUpload/fileUploadHandler";
import { auth } from "../../../middleware/auth/auth";

const router = Router();
router.get("/get-all-user", auth("ADMIN", "USER"), UserController.getAllUser);

router.get("/me", auth("ADMIN", "USER"), UserController.getMe);

router.post(
  "/create-user",
  zodValidator(zodCreateUserSchema),
  UserController.createUser
);

router.patch(
  "/update-profile-image",
  auth("ADMIN", "USER"),
  upload.single("file"),
  UserController.updateProfileImage
);

router.patch(
  "/update-profile-data",
  auth("ADMIN", "USER"),
  UserController.updateProfileData
);

export const UserRoute = router;
