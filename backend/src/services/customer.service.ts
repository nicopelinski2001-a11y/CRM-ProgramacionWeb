import { prisma } from "../lib/prisma";
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../schemas/customer.schema";

// El dueño viene del JWT. Todas las consultas exigen su id, nunca el del formulario.
export function listCustomers(userId: string) {
  return prisma.customer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export function findCustomer(userId: string, id: string) {
  return prisma.customer.findFirst({ where: { id, userId } });
}

export function createCustomer(userId: string, data: CreateCustomerInput) {
  return prisma.customer.create({ data: { ...data, userId } });
}

// Prisma permite combinar la clave única con el dueño en la misma operación.
// Si no coincide, devuelve P2025 y el middleware lo convierte en HTTP 404.
export function updateCustomer(
  userId: string,
  id: string,
  data: UpdateCustomerInput,
) {
  return prisma.customer.update({ where: { id, userId }, data });
}

export function deleteCustomer(userId: string, id: string) {
  return prisma.customer.delete({
    where: { id, userId },
    select: { id: true },
  });
}
