"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoute = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const zodValidator_1 = __importDefault(require("../../../middleware/zodValidator"));
const fileUploadHandler_1 = require("../../../middleware/fileUpload/fileUploadHandler");
const auth_1 = require("../../../middleware/auth/auth");
const router = (0, express_1.Router)();
router.get("/me", (0, auth_1.auth)("ADMIN", "USER"), user_controller_1.UserController.getMe);
router.get("/get-all-user", (0, auth_1.auth)("ADMIN", "USER"), user_controller_1.UserController.getAllUser);
router.post("/create-user", (0, zodValidator_1.default)(user_validation_1.zodCreateUserSchema), user_controller_1.UserController.createUser);
router.patch("/update-profile-image", (0, auth_1.auth)("ADMIN", "USER"), fileUploadHandler_1.upload.single("file"), user_controller_1.UserController.updateProfileImage);
router.patch("/update-profile-data", (0, auth_1.auth)("ADMIN", "USER"), user_controller_1.UserController.updateProfileData);
exports.UserRoute = router;
