import { z } from "zod";

const itemFields = {
  title: z
    .string()
    .trim()
    .min(1, "El título es requerido")
    .max(120, "El título admite hasta 120 caracteres"),
  description: z
    .string()
    .trim()
    .max(2000, "La descripción admite hasta 2000 caracteres")
    .optional(),
  completed: z.boolean().optional(),
};

export const createItemSchema = z.object({
  body: z.object(itemFields),
});

export const updateItemSchema = z.object({
  body: z
    .object(itemFields)
    .partial()
    .refine(
      (body) => Object.keys(body).length > 0,
      "Indicá al menos un campo para actualizar",
    ),
  params: z.object({
    id: z.string().uuid("El id del item no es valido"),
  }),
});

export const itemIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("El id del item no es valido"),
  }),
});

export type CreateItemInput = z.infer<typeof createItemSchema>["body"];
export type UpdateItemInput = z.infer<typeof updateItemSchema>["body"];
