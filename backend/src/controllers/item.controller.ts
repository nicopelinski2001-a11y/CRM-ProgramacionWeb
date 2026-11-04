import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { ok, fail } from "../utils/apiResponse";
import { CreateItemInput, UpdateItemInput } from "../schemas/item.schema";

export async function getItems(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const items = await prisma.item.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getItemById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const item = await prisma.item.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!item) {
      return fail(res, "Item no encontrado", 404);
    }

    return ok(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createItem(
  req: Request<{}, {}, CreateItemInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { title, description, completed } = req.body;

    const item = await prisma.item.create({
      data: {
        title,
        description,
        completed: completed ?? false,
        userId: req.userId as string,
      },
    });

    return ok(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(
  req: Request<{ id: string }, {}, UpdateItemInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Se verifica primero que el item exista Y pertenezca al usuario
    // antes de actualizar, para no filtrar por id de otro usuario.
    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return fail(res, "Item no encontrado", 404);
    }

    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return ok(res, updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await prisma.item.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!existing) {
      return fail(res, "Item no encontrado", 404);
    }

    await prisma.item.delete({ where: { id: req.params.id } });

    return ok(res, { id: req.params.id });
  } catch (err) {
    next(err);
  }
}
