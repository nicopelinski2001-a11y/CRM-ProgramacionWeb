import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  console.log(`API disponible en http://localhost:${env.PORT}/api`);
});

// El hosting envía SIGTERM al reiniciar o desplegar una nueva versión.
// Se dejan terminar los pedidos activos antes de liberar PostgreSQL.
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(async () => {
    await prisma.$disconnect();
    clearTimeout(timeout);
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
