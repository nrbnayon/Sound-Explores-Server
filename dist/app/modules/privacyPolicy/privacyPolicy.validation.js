"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyPolicyValidation = void 0;
const zod_1 = require("zod");
const createPrivacyPolicySchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z
            .string({
            required_error: "Title is required",
        })
            .min(1, "Title cannot be empty")
            .max(200, "Title cannot exceed 200 characters")
            .trim(),
        description: zod_1.z
            .string({
            required_error: "Description is required",
        })
            .min(1, "Description cannot be empty")
            .trim(),
        order: zod_1.z
            .number()
            .int()
            .min(0, "Order must be a non-negative integer")
            .optional(),
    }),
});
const updatePrivacyPolicySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Privacy policy ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
    }),
    body: zod_1.z.object({
        title: zod_1.z
            .string()
            .min(1, "Title cannot be empty")
            .max(200, "Title cannot exceed 200 characters")
            .trim()
            .optional(),
        description: zod_1.z
            .string()
            .min(1, "Description cannot be empty")
            .trim()
            .optional(),
        order: zod_1.z
            .number()
            .int()
            .min(0, "Order must be a non-negative integer")
            .optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
const getPrivacyPolicyByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Privacy policy ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
    }),
});
const deletePrivacyPolicySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z
            .string({
            required_error: "Privacy policy ID is required",
        })
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
    }),
});
const reorderPrivacyPoliciesSchema = zod_1.z.object({
    body: zod_1.z.object({
        policies: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z
                .string()
                .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
            order: zod_1.z
                .number()
                .int()
                .min(0, "Order must be a non-negative integer"),
        }))
            .min(1, "At least one policy is required for reordering"),
    }),
});
// Validation middleware factory
const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors.map((err) => ({
                    path: err.path.join("."),
                    message: err.message,
                })),
            });
        }
        next(error);
    }
};
exports.PrivacyPolicyValidation = {
    createPrivacyPolicy: validateRequest(createPrivacyPolicySchema),
    updatePrivacyPolicy: validateRequest(updatePrivacyPolicySchema),
    getPrivacyPolicyById: validateRequest(getPrivacyPolicyByIdSchema),
    deletePrivacyPolicy: validateRequest(deletePrivacyPolicySchema),
    reorderPrivacyPolicies: validateRequest(reorderPrivacyPoliciesSchema),
};
