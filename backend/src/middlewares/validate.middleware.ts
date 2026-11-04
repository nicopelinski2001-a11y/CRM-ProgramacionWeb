import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { fail } from "../utils/apiResponse";

// Middleware generico que valida body/params/query contra un schema de Zod.
// Si falla, corta el request con 400 y el detalle de los errores.
export function validate(schema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Usar el resultado de Zod aplica los trims y elimina campos no permitidos.
      // Así un cliente no puede modificar, por ejemplo, el userId de una tarea.
      if (validated.body !== undefined) req.body = validated.body;
      if (validated.params !== undefined)
        req.params = validated.params as Request["params"];
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(
          res,
          "Error de validacion",
          400,
          err.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        );
      }
      next(err);
    }
  };
}
