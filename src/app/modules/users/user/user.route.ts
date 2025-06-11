// src\app\modules\users\user\user.route.ts
import { Router } from "express";
import { UserController } from "./user.controller";

import { zodCreateUserSchema } from "./user.validation";
import zodValidator from "../../../middleware/zodValidator";
import { upload } from "../../../middleware/fileUpload/fileUploadHandler";
import { auth } from "../../../middleware/auth/auth";

const router = Router();
router.get("/me", auth("ADMIN", "USER"), UserController.getMe);

router.get("/get-all-user", auth("ADMIN", "USER"), UserController.getAllUser);

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

router.delete("/delete-user", auth("ADMIN"), UserController.deleteUser);

// Subscription routes
router.post("/buy-subscription", auth("USER"), UserController.buySubscription);
router.post("/cancel-subscription", auth("USER"), UserController.cancelSubscription);
router.get("/subscription-status", auth("USER"), UserController.getSubscriptionStatus);
router.post(
  "/sync-subscription",
  auth("USER"),
  UserController.syncSubscriptionStatus
);

export const UserRoute = router;
