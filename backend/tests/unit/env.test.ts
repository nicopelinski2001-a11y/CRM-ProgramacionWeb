import { parseEnvironment } from "../../src/config/env";

const development = {
  DATABASE_URL: "postgresql://test:test@localhost/test",
  JWT_SECRET: "only-test",
};
const production = {
  ...development,
  NODE_ENV: "production",
  JWT_SECRET: "9d76f6af61204c01b2f3c4aa2750ea31",
  CORS_ORIGIN: "https://crm.example.org",
};

describe("Configuración del servidor", () => {
  test("desarrollo permite localhost y usa un vencimiento limitado", () => {
    expect(parseEnvironment(development)).toEqual(
      expect.objectContaining({
        PORT: 4000,
        JWT_EXPIRES_IN: "1h",
        CORS_ORIGINS: ["http://localhost:5173"],
      }),
    );
  });

  test("producción acepta una allowlist HTTPS y secreto propio", () => {
    expect(
      parseEnvironment({
        ...production,
        CORS_ORIGIN: "https://crm.example.org,https://admin.example.org",
      }).CORS_ORIGINS,
    ).toHaveLength(2);
  });

  test.each([
    ["secreto corto", { JWT_SECRET: "corto" }],
    ["origen inseguro", { CORS_ORIGIN: "http://crm.example.org" }],
    ["origen con path", { CORS_ORIGIN: "https://crm.example.org/path" }],
    ["wildcard", { CORS_ORIGIN: "*" }],
    ["proxy fuera del rango", { TRUST_PROXY_HOPS: "99" }],
    ["puerto inválido", { PORT: "0" }],
  ])("rechaza %s en producción", (_label, fields) => {
    expect(() => parseEnvironment({ ...production, ...fields })).toThrow();
  });

  test("un error de validación no imprime los valores de secretos", () => {
    const invalidSecret = "private-value-never-log";
    expect(() =>
      parseEnvironment({
        ...development,
        JWT_SECRET: invalidSecret,
        PORT: "wrong",
      }),
    ).toThrow("PORT");
    try {
      parseEnvironment({
        ...development,
        JWT_SECRET: invalidSecret,
        PORT: "wrong",
      });
    } catch (error) {
      expect((error as Error).message).not.toContain(invalidSecret);
    }
  });
});
