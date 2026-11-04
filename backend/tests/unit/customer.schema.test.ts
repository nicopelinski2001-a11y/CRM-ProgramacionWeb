import { randomUUID } from "node:crypto";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
} from "../../src/schemas/customer.schema";

const valid = { name: "Lucía Demo", email: "lucia@example.com" };

describe("Validación de contactos", () => {
  test("normaliza espacios y email sin aceptar campos administrados por el servidor", () => {
    const result = createCustomerSchema.parse({
      body: {
        ...valid,
        name: "  Lucía Demo  ",
        email: "  LUCIA@EXAMPLE.COM  ",
        userId: randomUUID(),
        id: randomUUID(),
      },
    });
    expect(result.body).toEqual(valid);
  });

  test.each([
    ["nombre vacío", { name: "  " }],
    ["nombre de más de 100 caracteres", { name: "a".repeat(101) }],
    ["email inválido", { email: "sin-arroba" }],
    ["empresa de más de 100 caracteres", { company: "a".repeat(101) }],
    ["teléfono de más de 30 caracteres", { phone: "a".repeat(31) }],
    ["notas de más de 2000 caracteres", { notes: "a".repeat(2001) }],
    ["estado desconocido", { status: "ARCHIVED" }],
    ["nombre con tipo incorrecto", { name: 123 }],
  ])("rechaza %s", (_label, fields) => {
    expect(
      createCustomerSchema.safeParse({ body: { ...valid, ...fields } }).success,
    ).toBe(false);
  });

  test.each(["PROSPECT", "FOLLOW_UP", "CLIENT"])(
    "acepta el estado comercial %s",
    (status) => {
      expect(
        createCustomerSchema.parse({ body: { ...valid, status } }).body.status,
      ).toBe(status);
    },
  );

  test("acepta campos opcionales vacíos para poder borrar información anterior", () => {
    const body = { ...valid, company: "", phone: "", notes: "" };
    expect(createCustomerSchema.parse({ body }).body).toEqual(body);
  });

  test("una edición parcial conserva únicamente los campos enviados", () => {
    const result = updateCustomerSchema.parse({
      params: { id: randomUUID() },
      body: { notes: "  Próximo paso  " },
    });
    expect(result.body).toEqual({ notes: "Próximo paso" });
  });

  test.each([{}, { userId: randomUUID() }])(
    "rechaza una edición que no modifica campos permitidos",
    (body) => {
      expect(
        updateCustomerSchema.safeParse({ params: { id: randomUUID() }, body })
          .success,
      ).toBe(false);
    },
  );

  test.each(["123", "no-es-uuid", ""])(
    "rechaza el identificador inválido %s",
    (id) => {
      expect(customerIdParamSchema.safeParse({ params: { id } }).success).toBe(
        false,
      );
    },
  );
});
