import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const createPrivacyPolicySchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: "Title is required",
      })
      .min(1, "Title cannot be empty")
      .max(200, "Title cannot exceed 200 characters")
      .trim(),
    description: z
      .string({
        required_error: "Description is required",
      })
      .min(1, "Description cannot be empty")
      .trim(),
    order: z
      .number()
      .int()
      .min(0, "Order must be a non-negative integer")
      .optional(),
  }),
});

const updatePrivacyPolicySchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Privacy policy ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title cannot exceed 200 characters")
      .trim()
      .optional(),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .trim()
      .optional(),
    order: z
      .number()
      .int()
      .min(0, "Order must be a non-negative integer")
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

const getPrivacyPolicyByIdSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Privacy policy ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
  }),
});

const deletePrivacyPolicySchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: "Privacy policy ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
  }),
});

const reorderPrivacyPoliciesSchema = z.object({
  body: z.object({
    policies: z
      .array(
        z.object({
          id: z
            .string()
            .regex(/^[0-9a-fA-F]{24}$/, "Invalid privacy policy ID format"),
          order: z
            .number()
            .int()
            .min(0, "Order must be a non-negative integer"),
        })
      )
      .min(1, "At least one policy is required for reordering"),
  }),
});

// Validation middleware factory
const validateRequest = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

export const PrivacyPolicyValidation = {
  createPrivacyPolicy: validateRequest(createPrivacyPolicySchema),
  updatePrivacyPolicy: validateRequest(updatePrivacyPolicySchema),
  getPrivacyPolicyById: validateRequest(getPrivacyPolicyByIdSchema),
  deletePrivacyPolicy: validateRequest(deletePrivacyPolicySchema),
  reorderPrivacyPolicies: validateRequest(reorderPrivacyPoliciesSchema),
};
