import { registerSchema, loginSchema } from "../../src/schemas/auth.schema";

const valid = {
  name: "Usuario",
  email: "user@example.com",
  password: "MiClaveSegura2026!",
};

describe("Validación de acceso", () => {
  test("normaliza nombre y email pero conserva la contraseña exacta", () => {
    const body = registerSchema.parse({
      body: {
        name: "  Usuario  ",
        email: " USER@EXAMPLE.COM ",
        password: " clave con espacios ",
      },
    }).body;
    expect(body).toEqual({ ...valid, password: " clave con espacios " });
  });

  test.each([
    ["nombre vacío", { name: "   " }],
    ["nombre demasiado largo", { name: "a".repeat(81) }],
    ["contraseña corta", { password: "a".repeat(14) }],
    ["email inválido", { email: "sin-email" }],
    ["contraseña que supera 72 bytes de bcrypt", { password: "á".repeat(37) }],
  ])("rechaza %s", (_label, fields) => {
    expect(
      registerSchema.safeParse({ body: { ...valid, ...fields } }).success,
    ).toBe(false);
  });

  test("acepta 72 bytes exactos para evitar truncamiento silencioso en bcrypt", () => {
    expect(
      registerSchema.safeParse({ body: { ...valid, password: "á".repeat(36) } })
        .success,
    ).toBe(true);
  });

  test("el login requiere contraseña y normaliza el email", () => {
    expect(
      loginSchema.safeParse({ body: { email: valid.email, password: "" } })
        .success,
    ).toBe(false);
    expect(
      loginSchema.parse({
        body: { email: " USER@EXAMPLE.COM ", password: valid.password },
      }).body.email,
    ).toBe(valid.email);
  });
});
