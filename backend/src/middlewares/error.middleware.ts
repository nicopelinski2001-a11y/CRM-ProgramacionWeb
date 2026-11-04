import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { fail } from "../utils/apiResponse";

// Middleware central de manejo de errores. Traduce excepciones conocidas
// (errores de Prisma, errores manuales) al formato { success:false, error }.
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return fail(res, "El cuerpo de la solicitud debe ser JSON válido", 400);
  }

  if (err instanceof Error && "status" in err && err.status === 413) {
    return fail(res, "La solicitud es demasiado grande", 413);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return fail(res, "El email ya esta registrado", 409);
    }
    if (err.code === "P2025") {
      return fail(res, "Recurso no encontrado", 404);
    }
  }

  // Los detalles internos se registran en el servidor, nunca se envían al cliente.
  // Un error de ORM puede incluir consultas y datos personales en su mensaje.
  // El log conserva un identificador de correlación, nunca cuerpos, tokens o secretos.
  console.error(
    JSON.stringify({
      event: "request_error",
      requestId: res.locals.requestId,
      errorName: err instanceof Error ? err.name : "UnknownError",
      ...(err instanceof Prisma.PrismaClientKnownRequestError
        ? { code: err.code }
        : {}),
    }),
  );
  return fail(res, "Error interno del servidor", 500);
}

export function notFoundMiddleware(req: Request, res: Response) {
  return fail(res, "Ruta no encontrada", 404);
}
