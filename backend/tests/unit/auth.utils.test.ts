import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";
import { hashPassword, comparePassword } from "../../src/utils/password";
import { signToken, verifyToken } from "../../src/utils/jwt";

const tokenOptions: jwt.SignOptions = {
  issuer: "orbita-crm",
  audience: "orbita-web",
  expiresIn: "1h",
};

describe("Contraseñas", () => {
  test("el hash verifica la contraseña correcta y rechaza otra", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    await expect(comparePassword("password123", hash)).resolves.toBe(true);
    await expect(comparePassword("otra-clave", hash)).resolves.toBe(false);
  });

  test("la misma contraseña recibe un salt diferente en cada registro", async () => {
    const [first, second] = await Promise.all([
      hashPassword("password123"),
      hashPassword("password123"),
    ]);
    expect(first).not.toBe(second);
  });
});

describe("Tokens JWT", () => {
  test("un token emitido identifica al usuario y tiene vencimiento", () => {
    const userId = randomUUID();
    const token = signToken({ userId });
    expect(verifyToken(token)).toEqual({ userId });
    expect(jwt.decode(token)).toEqual(
      expect.objectContaining({ exp: expect.any(Number) }),
    );
  });

  test("rechaza una firma creada con otro secreto", () => {
    const token = jwt.sign(
      { userId: randomUUID() },
      "another-test-only-secret",
      tokenOptions,
    );
    expect(() => verifyToken(token)).toThrow();
  });

  test("rechaza un token vencido", () => {
    const token = jwt.sign({ userId: randomUUID() }, env.JWT_SECRET, {
      ...tokenOptions,
      expiresIn: -1,
    });
    expect(() => verifyToken(token)).toThrow();
  });

  test("rechaza algoritmos distintos del autorizado", () => {
    const token = jwt.sign({ userId: randomUUID() }, env.JWT_SECRET, {
      ...tokenOptions,
      algorithm: "HS384",
    });
    expect(() => verifyToken(token)).toThrow();
  });

  test.each([{}, { userId: "" }, { userId: 123 }])(
    "rechaza payload sin identidad válida",
    (payload) => {
      expect(() =>
        verifyToken(jwt.sign(payload, env.JWT_SECRET, tokenOptions)),
      ).toThrow();
    },
  );

  test("rechaza tokens sin vencimiento o emisor y destinatario esperados", () => {
    expect(() =>
      verifyToken(jwt.sign({ userId: randomUUID() }, env.JWT_SECRET)),
    ).toThrow();
    expect(() =>
      verifyToken(
        jwt.sign({ userId: randomUUID() }, env.JWT_SECRET, {
          ...tokenOptions,
          audience: "otra-app",
        }),
      ),
    ).toThrow();
  });
});
