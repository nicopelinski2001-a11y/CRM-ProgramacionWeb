import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    algorithm: "HS256",
    issuer: "orbita-crm",
    audience: "orbita-web",
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: "orbita-crm",
    audience: "orbita-web",
  });
  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    !payload.userId ||
    typeof payload.exp !== "number"
  ) {
    throw new Error("El token no contiene un usuario válido");
  }
  return { userId: payload.userId };
}
