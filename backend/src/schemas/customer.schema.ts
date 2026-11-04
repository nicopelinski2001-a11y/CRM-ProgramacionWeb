import { z } from "zod";

// El mismo conjunto de campos se usa al crear y al editar un contacto.
const customerFields = {
  name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre admite hasta 100 caracteres"),
  company: z
    .string()
    .trim()
    .max(100, "La empresa admite hasta 100 caracteres")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email no es válido")
    .max(254, "El email admite hasta 254 caracteres"),
  phone: z
    .string()
    .trim()
    .max(30, "El teléfono admite hasta 30 caracteres")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Las notas admiten hasta 2000 caracteres")
    .optional(),
  status: z
    .enum(["PROSPECT", "FOLLOW_UP", "CLIENT"], {
      message: "El estado no es válido",
    })
    .optional(),
};

const customerId = z.object({
  id: z.string().uuid("El id del contacto no es válido"),
});

export const createCustomerSchema = z.object({
  body: z.object(customerFields),
});

export const updateCustomerSchema = z.object({
  body: z
    .object(customerFields)
    .partial()
    .refine(
      (body) => Object.keys(body).length > 0,
      "Indicá al menos un campo para actualizar",
    ),
  params: customerId,
});

export const customerIdParamSchema = z.object({ params: customerId });

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>["body"];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>["body"];
