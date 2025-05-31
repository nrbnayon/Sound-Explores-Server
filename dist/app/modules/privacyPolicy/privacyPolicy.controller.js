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
exports.PrivacyPolicyController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const privacyPolicy_service_1 = require("./privacyPolicy.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const createPrivacyPolicy = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const adminId = req.user.userId;
    const data = req.body;
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.createPrivacyPolicy(data, adminId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Privacy policy created successfully",
        data: result,
    });
}));
const getAllPrivacyPolicies = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, page, limit, isActive } = req.query;
    const searchTerm = typeof search === "string" ? search : undefined;
    const isActiveValue = isActive === "true" ? true : isActive === "false" ? false : undefined;
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.getAllPrivacyPolicies({
        search: searchTerm,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        isActive: isActiveValue,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Privacy policies fetched successfully",
        data: result,
    });
}));
const getPrivacyPolicyById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.getPrivacyPolicyById(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Privacy policy fetched successfully",
        data: result,
    });
}));
const updatePrivacyPolicy = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.updatePrivacyPolicy(id, data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Privacy policy updated successfully",
        data: result,
    });
}));
const deletePrivacyPolicy = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield privacyPolicy_service_1.PrivacyPolicyService.deletePrivacyPolicy(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Privacy policy deleted successfully",
        data: null,
    });
}));
const reorderPrivacyPolicies = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reorderData = req.body.policies; // [{ id: string, order: number }]
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.reorderPrivacyPolicies(reorderData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Privacy policies reordered successfully",
        data: result,
    });
}));
const getActivePrivacyPolicies = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield privacyPolicy_service_1.PrivacyPolicyService.getActivePrivacyPolicies();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Active privacy policies fetched successfully",
        data: result,
    });
}));
exports.PrivacyPolicyController = {
    createPrivacyPolicy,
    getAllPrivacyPolicies,
    getPrivacyPolicyById,
    updatePrivacyPolicy,
    deletePrivacyPolicy,
    reorderPrivacyPolicies,
    getActivePrivacyPolicies,
};
