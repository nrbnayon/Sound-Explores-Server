"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyPolicy = void 0;
const mongoose_1 = require("mongoose");
const PrivacyPolicySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    order: {
        type: Number,
        required: true,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
// Create index for better performance
PrivacyPolicySchema.index({ order: 1 });
PrivacyPolicySchema.index({ isActive: 1 });
PrivacyPolicySchema.index({ title: "text", description: "text" });
exports.PrivacyPolicy = (0, mongoose_1.model)("PrivacyPolicy", PrivacyPolicySchema);
