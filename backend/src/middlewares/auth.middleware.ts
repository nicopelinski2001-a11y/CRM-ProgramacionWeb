import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { fail } from "../utils/apiResponse";

// Extiende el tipo Request de Express para poder colgar el userId
// una vez que el JWT fue verificado.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !/^Bearer [^\s]+$/.test(authHeader)) {
    return fail(res, "No se proporcionó un token de autenticación válido", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return fail(res, "Token inválido o expirado", 401);
  }
}
