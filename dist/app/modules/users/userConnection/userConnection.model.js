"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserConnection = void 0;
const mongoose_1 = require("mongoose");
const userConnection_interface_1 = require("./userConnection.interface");
const UserConnectionSchema = new mongoose_1.Schema({
    users: {
        type: [mongoose_1.Schema.Types.ObjectId],
        required: true,
    },
    senderId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    status: {
        type: String,
        enum: Object.values(userConnection_interface_1.userStatus),
        default: userConnection_interface_1.userStatus.PENDING,
    },
}, {
    timestamps: true,
});
exports.UserConnection = (0, mongoose_1.model)("UserConnection", UserConnectionSchema);
