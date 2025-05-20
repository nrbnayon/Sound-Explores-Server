"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoundService = exports.deleteMultipleSounds = exports.deleteSound = exports.getAllSound = exports.addSound = void 0;
const user_model_1 = __importDefault(require("../users/user/user.model"));
const sound_model_1 = __importDefault(require("./sound.model"));
const addSound = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const sound = new sound_model_1.default(data);
    return yield sound.save();
});
exports.addSound = addSound;
const getAllSound = (userId, searchTerm, category, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const userdata = yield user_model_1.default.findById(userId);
    const query = {};
    // Free users only see non-premium sounds
    if ((userdata === null || userdata === void 0 ? void 0 : userdata.isSubscribed) === false) {
        query.isPremium = false;
    }
    // Add search filter if provided
    if (searchTerm) {
        query.title = { $regex: searchTerm, $options: "i" };
    }
    // Add category filter if provided
    if (category) {
        query.category = category;
    }
    // Set up pagination
    const pageNumber = page || 1;
    const limitNumber = limit || 20;
    const skip = (pageNumber - 1) * limitNumber;
    // Get total count for pagination info
    const total = yield sound_model_1.default.countDocuments(query);
    // Execute query with pagination
    const result = yield sound_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);
    // Return with pagination metadata
    return {
        data: result,
        pagination: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
        },
    };
});
exports.getAllSound = getAllSound;
const deleteSound = (soundId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield sound_model_1.default.findByIdAndDelete(soundId);
    if (!result) {
        throw new Error("Sound not found");
    }
    return result;
});
exports.deleteSound = deleteSound;
const deleteMultipleSounds = (soundIds) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield sound_model_1.default.deleteMany({ _id: { $in: soundIds } });
    return result;
});
exports.deleteMultipleSounds = deleteMultipleSounds;
exports.SoundService = {
    addSound: exports.addSound,
    getAllSound: exports.getAllSound,
    deleteSound: exports.deleteSound,
    deleteMultipleSounds: exports.deleteMultipleSounds,
};
