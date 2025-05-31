"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodCreateUserSchema = void 0;
const zod_1 = require("zod");
exports.zodCreateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
        agreeToTerms: zod_1.z.literal(true, {
            errorMap: () => ({ message: "You must agree to the terms" }),
        }).optional(),
    }),
});
