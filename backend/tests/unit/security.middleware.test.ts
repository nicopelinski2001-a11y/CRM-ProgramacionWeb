import express from "express";
import type { Server } from "node:http";
import {
  createApiLimiter,
  createAuthLimiter,
} from "../../src/middlewares/security.middleware";

// Se prueba cada middleware en una app pequeña, sin PostgreSQL ni usuarios reales.
async function serve(app: express.Express) {
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No se pudo iniciar el servidor de prueba");
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

describe("Protección contra abuso de solicitudes", () => {
  test("el límite general responde 429 con tiempo de reintento al superar su cupo", async () => {
    const app = express();
    app.use(createApiLimiter({ limit: 2 }));
    app.get("/", (_req, res) => res.json({ success: true }));
    const server = await serve(app);
    try {
      expect((await fetch(server.url)).status).toBe(200);
      expect((await fetch(server.url)).status).toBe(200);
      const blocked = await fetch(server.url);
      expect(blocked.status).toBe(429);
      expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
      expect(await blocked.json()).toEqual(
        expect.objectContaining({ success: false, error: expect.any(String) }),
      );
    } finally {
      await server.close();
    }
  });

  test("el límite de acceso cuenta fallos y permite intentos exitosos", async () => {
    const app = express();
    app.use(createAuthLimiter({ limit: 2 }));
    app.get("/ok", (_req, res) => res.json({ success: true }));
    app.get("/error", (_req, res) => res.status(401).json({ success: false }));
    const server = await serve(app);
    try {
      for (let index = 0; index < 4; index++)
        expect((await fetch(`${server.url}/ok`)).status).toBe(200);
      expect((await fetch(`${server.url}/error`)).status).toBe(401);
      expect((await fetch(`${server.url}/error`)).status).toBe(401);
      expect((await fetch(`${server.url}/error`)).status).toBe(429);
    } finally {
      await server.close();
    }
  });
});
