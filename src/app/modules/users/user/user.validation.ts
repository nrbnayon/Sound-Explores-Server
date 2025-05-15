import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const phoneValidator = z.string().refine((val) => {
  const phoneNumber = parsePhoneNumberFromString(val);
  return phoneNumber?.isValid() ?? false;
}, { message: "Invalid phone number" });

// const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const zodCreateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: phoneValidator,
    password: z.string().min(6, "Password must be at least 6 characters"),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" }),
    }).optional(),
  }),
});
