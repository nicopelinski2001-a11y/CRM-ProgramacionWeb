import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("El email no es válido")
  .max(254, "El email es demasiado largo");

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z
      .string()
      .min(15, "La contraseña debe tener al menos 15 caracteres")
      .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "La contraseña admite hasta 72 bytes",
      ),
    name: z
      .string()
      .trim()
      .min(1, "El nombre es requerido")
      .max(80, "El nombre admite hasta 80 caracteres"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "La contraseña admite hasta 72 bytes",
      ),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
