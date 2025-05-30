import { z } from "zod";

export const zodCreateUserSchema = z.object({
  body: z.object({
    fullName: z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" }),
    }).optional(),
  }),
});
