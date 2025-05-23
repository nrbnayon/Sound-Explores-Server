import { Router } from "express";
import { PrivacyPolicyController } from "./privacyPolicy.controller";
import { auth } from "../../middleware/auth/auth";
import { PrivacyPolicyValidation } from "./privacyPolicy.validation";

const router = Router();

// Public route - get active privacy policies for users
router.get("/active", PrivacyPolicyController.getActivePrivacyPolicies);

// Admin only routes
router.post(
  "/",
  auth("ADMIN"),
  (req, res, next) => { PrivacyPolicyValidation.createPrivacyPolicy(req, res, next); },
  PrivacyPolicyController.createPrivacyPolicy
);

router.get("/", auth("ADMIN"), PrivacyPolicyController.getAllPrivacyPolicies);

router.get(
  "/:id",
  auth("ADMIN"),
  (req, res, next) => { PrivacyPolicyValidation.getPrivacyPolicyById(req, res, next); },
  PrivacyPolicyController.getPrivacyPolicyById
);

router.patch(
  "/:id",
  auth("ADMIN"),
  (req, res, next) => { PrivacyPolicyValidation.updatePrivacyPolicy(req, res, next); },
  PrivacyPolicyController.updatePrivacyPolicy
);

router.delete(
  "/:id",
  auth("ADMIN"),
  (req, res, next) => { PrivacyPolicyValidation.deletePrivacyPolicy(req, res, next); },
  PrivacyPolicyController.deletePrivacyPolicy
);

router.patch(
  "/reorder/bulk",
  auth("ADMIN"),
  (req, res, next) => {
    PrivacyPolicyValidation.reorderPrivacyPolicies(req, res, next);
  },
  PrivacyPolicyController.reorderPrivacyPolicies
);

export const PrivacyPolicyRoute = router;
