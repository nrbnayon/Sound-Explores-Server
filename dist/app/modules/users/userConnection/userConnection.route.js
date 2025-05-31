"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserConnectionRoute = void 0;
const express_1 = require("express");
const auth_1 = require("../../../middleware/auth/auth");
const userConnection_controller_1 = require("./userConnection.controller");
const router = (0, express_1.Router)();
// Existing routes
router.post("/send-request", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.sendRequest);
router.get("/sent-list", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.sentlist);
router.get("/request-list", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.requestlist);
router.get("/friend-list", (0, auth_1.auth)("USER", "ADMIN"), userConnection_controller_1.UserConnectionController.friendList);
router.patch("/remove-friend", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.removeFriend);
// New routes for the missing endpoints
router.patch("/accept-request", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.acceptRequest);
router.patch("/reject-request", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.rejectRequest);
router.patch("/cancel-request", (0, auth_1.auth)("USER"), userConnection_controller_1.UserConnectionController.cancelRequest);
exports.UserConnectionRoute = router;
