"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const sound_interface_1 = require("./sound.interface");
const SoundSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    link: { type: String, required: true },
    description: { type: String },
    category: {
        type: String,
        enum: sound_interface_1.soundCategories,
        required: true,
    },
});
// Mongoose Model
const Sound = (0, mongoose_1.model)("Sound", SoundSchema);
exports.default = Sound;
