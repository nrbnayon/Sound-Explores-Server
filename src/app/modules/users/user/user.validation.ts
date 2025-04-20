import { z } from "zod";

export const zodCreateUserSchema = z.object({
  body: z.object({
    fullName: z.string(),
    email: z.string().email(),
    password: z.string(),
  }),
});
