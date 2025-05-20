"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageRoute = void 0;
// src\app\modules\sendMessge\sendMessage.route.ts
const express_1 = require("express");
const auth_1 = require("../../middleware/auth/auth");
const sendMessage_controller_1 = require("./sendMessage.controller");
const router = (0, express_1.Router)();
router.post("/send-sound", (0, auth_1.auth)("USER"), sendMessage_controller_1.SendMessageController.sendMessage);
exports.SendMessageRoute = router;
