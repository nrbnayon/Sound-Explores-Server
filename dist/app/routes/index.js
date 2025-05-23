"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_route_1 = require("../modules/users/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const sound_route_1 = require("../modules/sound/sound.route");
const userConnection_route_1 = require("../modules/users/userConnection/userConnection.route");
const sendMessage_route_1 = require("../modules/sendMessge/sendMessage.route");
const router = (0, express_1.Router)();
const apiRoutes = [
    { path: "/user", route: user_route_1.UserRoute },
    { path: "/auth", route: auth_route_1.AuthRoute },
    { path: "/sound", route: sound_route_1.SoundRoute },
    { path: "/user-connection", route: userConnection_route_1.UserConnectionRoute },
    { path: "/message", route: sendMessage_route_1.SendMessageRoute },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
