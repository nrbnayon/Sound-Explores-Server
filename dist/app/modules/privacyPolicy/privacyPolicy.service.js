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
exports.PrivacyPolicyService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const privacyPolicy_model_1 = require("./privacyPolicy.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createPrivacyPolicy = (data, adminId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if title already exists
    const existingPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findOne({
        title: { $regex: new RegExp(`^${data.title}$`, "i") },
        isActive: true,
    });
    if (existingPolicy) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Privacy policy with this title already exists");
    }
    // If no order specified, set it to the next available order
    if (!data.order) {
        const lastPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findOne({}, {}, { sort: { order: -1 } });
        data.order = lastPolicy ? lastPolicy.order + 1 : 1;
    }
    const privacyPolicy = yield privacyPolicy_model_1.PrivacyPolicy.create(Object.assign(Object.assign({}, data), { createdBy: adminId }));
    return privacyPolicy;
});
const getAllPrivacyPolicies = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (queries = {}) {
    const { search = "", page = 1, limit = 20, isActive } = queries;
    const skip = (page - 1) * limit;
    // Build search criteria
    const searchCriteria = {};
    if (search) {
        searchCriteria.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }
    if (isActive !== undefined) {
        searchCriteria.isActive = isActive;
    }
    // Get total count for pagination
    const totalItem = yield privacyPolicy_model_1.PrivacyPolicy.countDocuments(searchCriteria);
    const totalPage = Math.ceil(totalItem / limit);
    // Get privacy policies with pagination
    const privacyPolicies = yield privacyPolicy_model_1.PrivacyPolicy.find(searchCriteria)
        .populate("createdBy", "email fullName")
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
    return {
        meta: {
            totalItem,
            totalPage,
            limit: Number(limit),
            page: Number(page),
        },
        data: privacyPolicies,
    };
});
const getPrivacyPolicyById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const privacyPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findById(id).populate("createdBy", "email fullName");
    if (!privacyPolicy) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Privacy policy not found");
    }
    return privacyPolicy;
});
const updatePrivacyPolicy = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const privacyPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findById(id);
    if (!privacyPolicy) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Privacy policy not found");
    }
    // Check if title already exists (excluding current policy)
    if (data.title) {
        const existingPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findOne({
            _id: { $ne: id },
            title: { $regex: new RegExp(`^${data.title}$`, "i") },
            isActive: true,
        });
        if (existingPolicy) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Privacy policy with this title already exists");
        }
    }
    const updatedPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    }).populate("createdBy", "email fullName");
    if (!updatedPolicy) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Privacy policy not found");
    }
    return updatedPolicy;
});
const deletePrivacyPolicy = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const privacyPolicy = yield privacyPolicy_model_1.PrivacyPolicy.findById(id);
    if (!privacyPolicy) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Privacy policy not found");
    }
    // Soft delete by setting isActive to false
    yield privacyPolicy_model_1.PrivacyPolicy.findByIdAndUpdate(id, { isActive: false });
});
const reorderPrivacyPolicies = (reorderData) => __awaiter(void 0, void 0, void 0, function* () {
    const bulkOps = reorderData.map(({ id, order }) => ({
        updateOne: {
            filter: { _id: id },
            update: { order },
        },
    }));
    yield privacyPolicy_model_1.PrivacyPolicy.bulkWrite(bulkOps);
    return { message: "Privacy policies reordered successfully" };
});
const getActivePrivacyPolicies = () => __awaiter(void 0, void 0, void 0, function* () {
    const privacyPolicies = yield privacyPolicy_model_1.PrivacyPolicy.find({ isActive: true })
        .select("title description order")
        .sort({ order: 1 });
    return privacyPolicies;
});
exports.PrivacyPolicyService = {
    createPrivacyPolicy,
    getAllPrivacyPolicies,
    getPrivacyPolicyById,
    updatePrivacyPolicy,
    deletePrivacyPolicy,
    reorderPrivacyPolicies,
    getActivePrivacyPolicies,
};
