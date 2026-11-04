import { Request, Response, NextFunction } from "express";
import * as customers from "../services/customer.service";
import { ok, fail } from "../utils/apiResponse";
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../schemas/customer.schema";

export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await customers.listCustomers(req.userId!);
    return ok(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const customer = await customers.findCustomer(req.userId!, req.params.id);
    if (!customer) return fail(res, "Contacto no encontrado", 404);
    return ok(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(
  req: Request<{}, {}, CreateCustomerInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const customer = await customers.createCustomer(req.userId!, req.body);
    return ok(res, customer, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(
  req: Request<{ id: string }, {}, UpdateCustomerInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const customer = await customers.updateCustomer(
      req.userId!,
      req.params.id,
      req.body,
    );
    return ok(res, customer);
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const removed = await customers.deleteCustomer(req.userId!, req.params.id);
    return ok(res, removed);
  } catch (err) {
    next(err);
  }
}
