import { z } from "zod";
import { isValidPasswordPolicy } from "../../shared/utils/password.util";

const emailSchema = z.string().trim().email().transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine((value) => isValidPasswordPolicy(value), {
    message: "Password must include uppercase, lowercase, number and symbol",
  });

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(120).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
