"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodCreateUserSchema = void 0;
const zod_1 = require("zod");
const libphonenumber_js_1 = require("libphonenumber-js");
const phoneValidator = zod_1.z.string().refine((val) => {
    var _a;
    const phoneNumber = (0, libphonenumber_js_1.parsePhoneNumberFromString)(val);
    return (_a = phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.isValid()) !== null && _a !== void 0 ? _a : false;
}, { message: "Invalid phone number" });
// const phoneRegex = /^\+?[1-9]\d{1,14}$/;
exports.zodCreateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2, "Name is required"),
        email: zod_1.z.string().email("Invalid email address"),
        phone: phoneValidator,
        password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
        agreeToTerms: zod_1.z.literal(true, {
            errorMap: () => ({ message: "You must agree to the terms" }),
        }).optional(),
    }),
});
