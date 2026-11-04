import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";
import { fail } from "../utils/apiResponse";

interface LimiterOptions {
  limit?: number;
  windowMs?: number;
}

// Cada instancia usa memoria del proceso: para varias réplicas se necesita
// un almacén compartido. Las factories permiten verificar el 429 con límites chicos.
export function createApiLimiter(options: LimiterOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    limit: options.limit ?? env.API_RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    identifier: "api",
    handler: (_req, res) =>
      fail(
        res,
        "Demasiadas solicitudes. Esperá unos minutos e intentá de nuevo.",
        429,
      ),
  });
}

export function createAuthLimiter(options: LimiterOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? env.RATE_LIMIT_WINDOW_MS,
    limit: options.limit ?? env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    identifier: "auth",
    skipSuccessfulRequests: true,
    handler: (_req, res) =>
      fail(
        res,
        "Demasiados intentos de acceso. Esperá unos minutos e intentá de nuevo.",
        429,
      ),
  });
}

export function requestId(_req: Request, res: Response, next: NextFunction) {
  // No se reutiliza un header enviado por el cliente para evitar falsificar logs.
  res.locals.requestId = randomUUID();
  res.setHeader("X-Request-ID", res.locals.requestId);
  next();
}

export function restrictOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;
  // Swagger se sirve desde la propia API. El protocolo respeta únicamente
  // los saltos de proxy configurados; Host identifica ese mismo servidor.
  const apiOrigin = `${req.protocol}://${req.get("host")}`;
  // Las herramientas HTTP y los servicios no siempre envían Origin.
  // CORS complementa la seguridad del navegador; JWT sigue siendo obligatorio.
  if (origin && origin !== apiOrigin && !env.CORS_ORIGINS.includes(origin)) {
    return fail(res, "Origen no permitido", 403);
  }
  next();
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  next();
}
