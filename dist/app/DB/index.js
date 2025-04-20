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
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const auth_interface_1 = require("../interface/auth.interface");
const adminProfile_model_1 = require("../modules/users/adminProfile/adminProfile.model");
const user_model_1 = __importDefault(require("../modules/users/user/user.model"));
const superUser = {
    role: auth_interface_1.userRoles.ADMIN,
    email: config_1.appConfig.admin.email,
    password: config_1.appConfig.admin.password,
    isVerified: true,
};
const superUserProfile = {
    fullName: "Admin-1",
    email: config_1.appConfig.admin.email,
};
const seedAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const isExistSuperAdmin = yield user_model_1.default.findOne({
            role: auth_interface_1.userRoles.ADMIN,
        }).session(session);
        if (!isExistSuperAdmin) {
            const data = yield user_model_1.default.create([superUser], { session });
            yield adminProfile_model_1.AdminProfile.create([Object.assign(Object.assign({}, superUserProfile), { user: data[0]._id })], {
                session,
            });
        }
        yield session.commitTransaction();
    }
    catch (error) {
        yield session.abortTransaction();
        throw error; // or handle the error as needed
    }
    finally {
        session.endSession();
    }
});
exports.default = seedAdmin;
