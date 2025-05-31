"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyPolicyRoute = void 0;
const express_1 = require("express");
const privacyPolicy_controller_1 = require("./privacyPolicy.controller");
const auth_1 = require("../../middleware/auth/auth");
const privacyPolicy_validation_1 = require("./privacyPolicy.validation");
const router = (0, express_1.Router)();
// Public route - get active privacy policies for users
router.get("/active", privacyPolicy_controller_1.PrivacyPolicyController.getActivePrivacyPolicies);
// Admin only routes
router.post("/", (0, auth_1.auth)("ADMIN"), (req, res, next) => { privacyPolicy_validation_1.PrivacyPolicyValidation.createPrivacyPolicy(req, res, next); }, privacyPolicy_controller_1.PrivacyPolicyController.createPrivacyPolicy);
router.get("/", (0, auth_1.auth)("ADMIN"), privacyPolicy_controller_1.PrivacyPolicyController.getAllPrivacyPolicies);
router.get("/:id", (0, auth_1.auth)("ADMIN"), (req, res, next) => { privacyPolicy_validation_1.PrivacyPolicyValidation.getPrivacyPolicyById(req, res, next); }, privacyPolicy_controller_1.PrivacyPolicyController.getPrivacyPolicyById);
router.patch("/:id", (0, auth_1.auth)("ADMIN"), (req, res, next) => { privacyPolicy_validation_1.PrivacyPolicyValidation.updatePrivacyPolicy(req, res, next); }, privacyPolicy_controller_1.PrivacyPolicyController.updatePrivacyPolicy);
router.delete("/:id", (0, auth_1.auth)("ADMIN"), (req, res, next) => { privacyPolicy_validation_1.PrivacyPolicyValidation.deletePrivacyPolicy(req, res, next); }, privacyPolicy_controller_1.PrivacyPolicyController.deletePrivacyPolicy);
router.patch("/reorder/bulk", (0, auth_1.auth)("ADMIN"), (req, res, next) => {
    privacyPolicy_validation_1.PrivacyPolicyValidation.reorderPrivacyPolicies(req, res, next);
}, privacyPolicy_controller_1.PrivacyPolicyController.reorderPrivacyPolicies);
exports.PrivacyPolicyRoute = router;
