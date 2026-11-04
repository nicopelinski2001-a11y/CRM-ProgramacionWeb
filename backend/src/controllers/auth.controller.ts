import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { ok, fail } from "../utils/apiResponse";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export async function register(
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail(res, "El email ya esta registrado", 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = signToken({ userId: user.id });

    return ok(res, { user: toPublicUser(user), token }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return fail(res, "Credenciales invalidas", 401);
    }

    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
      return fail(res, "Credenciales invalidas", 401);
    }

    const token = signToken({ userId: user.id });

    return ok(res, { user: toPublicUser(user), token }, 200);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return fail(res, "Usuario no encontrado", 404);
    }

    return ok(res, toPublicUser(user));
  } catch (err) {
    next(err);
  }
}
