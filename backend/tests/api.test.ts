import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { env } from "../src/config/env";
import { prisma } from "../src/lib/prisma";

// Integración real: HTTP → middlewares → controladores → Prisma → PostgreSQL.
// Solo se eliminan los usuarios temporales creados por este archivo.
let server: Server;
let baseUrl: string;
let ownerToken: string;
let otherToken: string;
let ownerId: string;
let otherId: string;
const ownerEmail = `jest-crm-${randomUUID()}@example.com`;
const userIds: string[] = [];

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
  raw?: string;
  headers?: Record<string, string>;
};
async function request(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body:
      options.raw ??
      (options.body === undefined ? undefined : JSON.stringify(options.body)),
  });
  // Los cuerpos de error y éxito se verifican en cada caso; aquí se cruza la
  // frontera JSON no tipada del cliente HTTP de prueba.
  const body: any = await response.json();
  return { status: response.status, headers: response.headers, body };
}

async function createCustomer(body: Record<string, unknown> = {}) {
  const response = await request("/api/customers", {
    method: "POST",
    token: ownerToken,
    body: { name: "Lucía Demo", email: "lucia@example.com", ...body },
  });
  expect(response.status).toBe(201);
  return response.body.data;
}

beforeAll(async () => {
  await prisma.$connect();
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No se pudo iniciar el servidor de prueba");
  baseUrl = `http://127.0.0.1:${address.port}`;

  const owner = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "  Cuenta Jest  ",
      email: `  ${ownerEmail.toUpperCase()}  `,
      password: "MiClaveSegura2026!",
    },
  });
  expect(owner.status).toBe(201);
  ownerId = owner.body.data.user.id;
  userIds.push(ownerId);
  ownerToken = owner.body.data.token;
  const other = await request("/api/auth/register", {
    method: "POST",
    body: {
      name: "Otra cuenta Jest",
      email: `jest-crm-${randomUUID()}@example.com`,
      password: "MiClaveSegura2026!",
    },
  });
  expect(other.status).toBe(201);
  otherId = other.body.data.user.id;
  userIds.push(otherId);
  otherToken = other.body.data.token;
});

afterAll(async () => {
  try {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } finally {
    if (server)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
});

describe("Seguridad HTTP", () => {
  test("health responde y Helmet agrega cabeceras sin revelar Express", async () => {
    const response = await request("/health");
    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(response.headers.get("x-request-id")).toMatch(/^[\da-f-]{36}$/i);
  });

  test("CORS permite el origen configurado y rechaza un origen ajeno", async () => {
    const allowed = await request("/api/customers", {
      token: ownerToken,
      headers: { Origin: env.CORS_ORIGINS[0] },
    });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      env.CORS_ORIGINS[0],
    );
    // Swagger se sirve desde el mismo backend: su Origin también es válido.
    const sameOrigin = await request("/api/customers", {
      token: ownerToken,
      headers: { Origin: baseUrl },
    });
    expect(sameOrigin.status).toBe(200);
    const blocked = await request("/api/customers", {
      token: ownerToken,
      headers: { Origin: "https://foreign.invalid" },
    });
    expect(blocked.status).toBe(403);
    expect(blocked.body).toEqual(
      expect.objectContaining({ success: false, error: "Origen no permitido" }),
    );
  });

  test("JSON inválido y cuerpos demasiado grandes tienen errores controlados", async () => {
    expect(
      (
        await request("/api/customers", {
          method: "POST",
          token: ownerToken,
          raw: "{invalid",
        })
      ).status,
    ).toBe(400);
    const oversized = await request("/api/customers", {
      method: "POST",
      token: ownerToken,
      body: { notes: "a".repeat(18000) },
    });
    expect(oversized.status).toBe(413);
    expect(oversized.body.success).toBe(false);
    expect(oversized.body.stack).toBeUndefined();
  });

  test("los datos de la API no se guardan en caché", async () => {
    const response = await request("/api/customers", { token: ownerToken });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("Autenticación", () => {
  test("registro y restauración normalizan los datos sin exponer la contraseña", async () => {
    const response = await request("/api/auth/me", { token: ownerToken });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: ownerId,
        name: "Cuenta Jest",
        email: ownerEmail,
      }),
    );
    expect(response.body.data.password).toBeUndefined();
  });

  test("login devuelve una sesión válida", async () => {
    const login = await request("/api/auth/login", {
      method: "POST",
      body: { email: ownerEmail, password: "MiClaveSegura2026!" },
    });
    expect(login.status).toBe(200);
    expect(
      (await request("/api/auth/me", { token: login.body.data.token })).body
        .data.id,
    ).toBe(ownerId);
  });

  test("las credenciales incorrectas no abren una sesión", async () => {
    const login = await request("/api/auth/login", {
      method: "POST",
      body: { email: ownerEmail, password: "incorrecta" },
    });
    expect(login.status).toBe(401);
    expect(login.body.data).toBeUndefined();
  });

  test("el registro rechaza un email duplicado", async () => {
    expect(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: {
            email: ownerEmail,
            name: "Duplicado",
            password: "MiClaveSegura2026!",
          },
        })
      ).status,
    ).toBe(409);
  });

  test.each([undefined, "invalid", jwt.sign({}, env.JWT_SECRET)])(
    "la API rechaza un token ausente o inválido",
    async (token) => {
      expect((await request("/api/customers", { token })).status).toBe(401);
    },
  );
});

describe("CRM con PostgreSQL", () => {
  test("crear aplica valores por defecto, limpia los datos y fija el dueño real", async () => {
    const customer = await createCustomer({
      name: "  Sofía Demo  ",
      email: " SOFIA@EXAMPLE.COM ",
      userId: otherId,
    });
    expect(customer).toEqual(
      expect.objectContaining({
        name: "Sofía Demo",
        email: "sofia@example.com",
        status: "PROSPECT",
        userId: ownerId,
      }),
    );
  });

  test("listar entrega solo contactos de la cuenta autenticada", async () => {
    const customer = await createCustomer();
    const ownList = await request("/api/customers", { token: ownerToken });
    expect(ownList.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: customer.id })]),
    );
    expect(
      ownList.body.data.every(
        (row: { userId: string }) => row.userId === ownerId,
      ),
    ).toBe(true);
    expect(
      (await request("/api/customers", { token: otherToken })).body.data,
    ).toEqual([]);
  });

  test("consultar por id devuelve los datos persistidos", async () => {
    const customer = await createCustomer({ notes: "Enviar propuesta" });
    const response = await request(`/api/customers/${customer.id}`, {
      token: ownerToken,
    });
    expect(response.status).toBe(200);
    expect(response.body.data.notes).toBe("Enviar propuesta");
  });

  test("editar campos y recorrer los estados conserva el propietario", async () => {
    const customer = await createCustomer();
    for (const status of ["FOLLOW_UP", "CLIENT", "PROSPECT"]) {
      const response = await request(`/api/customers/${customer.id}`, {
        method: "PUT",
        token: ownerToken,
        body: { status, notes: "  Información actualizada  ", userId: otherId },
      });
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          status,
          notes: "Información actualizada",
          userId: ownerId,
          name: "Lucía Demo",
        }),
      );
    }
    expect(
      (await request(`/api/customers/${customer.id}`, { token: ownerToken }))
        .body.data.status,
    ).toBe("PROSPECT");
  });

  test.each(["GET", "PUT", "DELETE"])(
    "otro usuario no puede usar %s sobre un contacto ajeno",
    async (method) => {
      const customer = await createCustomer();
      const response = await request(`/api/customers/${customer.id}`, {
        method,
        token: otherToken,
        ...(method === "PUT" ? { body: { name: "Intrusión" } } : {}),
      });
      expect(response.status).toBe(404);
      expect(
        (await request(`/api/customers/${customer.id}`, { token: ownerToken }))
          .body.data.name,
      ).toBe("Lucía Demo");
    },
  );

  test("campos inválidos y ediciones vacías se rechazan antes de guardar", async () => {
    const customer = await createCustomer();
    for (const fields of [
      { name: "  " },
      { email: "invalid" },
      { notes: "a".repeat(2001) },
      { status: "UNKNOWN" },
    ]) {
      expect(
        (
          await request("/api/customers", {
            method: "POST",
            token: ownerToken,
            body: { name: "Demo", email: "demo@example.com", ...fields },
          })
        ).status,
      ).toBe(400);
    }
    expect(
      (
        await request(`/api/customers/${customer.id}`, {
          method: "PUT",
          token: ownerToken,
          body: {},
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(`/api/customers/${customer.id}`, {
          method: "PUT",
          token: ownerToken,
          body: { userId: otherId },
        })
      ).status,
    ).toBe(400);
    expect(
      (await request("/api/customers/no-es-uuid", { token: ownerToken }))
        .status,
    ).toBe(400);
  });

  test("se permite borrar notas y repetir el email en contactos distintos", async () => {
    const first = await createCustomer({ notes: "Nota anterior" });
    const second = await createCustomer({ email: first.email });
    expect(first.id).not.toBe(second.id);
    const edited = await request(`/api/customers/${first.id}`, {
      method: "PUT",
      token: ownerToken,
      body: { notes: "" },
    });
    expect(edited.status).toBe(200);
    expect(edited.body.data.notes).toBe("");
  });

  test("eliminar borra el contacto y una segunda consulta devuelve 404", async () => {
    const customer = await createCustomer();
    const deleted = await request(`/api/customers/${customer.id}`, {
      method: "DELETE",
      token: ownerToken,
    });
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.id).toBe(customer.id);
    expect(
      (await request(`/api/customers/${customer.id}`, { token: ownerToken }))
        .status,
    ).toBe(404);
  });
});

test("el CRUD de tareas anterior sigue funcionando sin afectar el CRM", async () => {
  const created = await request("/api/items", {
    method: "POST",
    token: ownerToken,
    body: { title: "Preparar exposición", userId: otherId },
  });
  expect(created.status).toBe(201);
  const id = created.body.data.id;
  expect(created.body.data.userId).toBe(ownerId);
  expect(
    (
      await request(`/api/items/${id}`, {
        method: "PUT",
        token: ownerToken,
        body: { completed: true },
      })
    ).body.data.completed,
  ).toBe(true);
  expect(
    (await request(`/api/items/${id}`, { token: otherToken })).status,
  ).toBe(404);
  expect(
    (await request(`/api/items/${id}`, { method: "DELETE", token: ownerToken }))
      .status,
  ).toBe(200);
});
