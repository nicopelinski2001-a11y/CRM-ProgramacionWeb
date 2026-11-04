import { PrismaClient } from "@prisma/client";

// Se reutiliza una unica instancia de PrismaClient en toda la app
// para no abrir multiples conexiones a la base de datos.
export const prisma = new PrismaClient();
