import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Auditoría de solo lectura: no crea datos ni imprime credenciales o parámetros.
const prisma = new PrismaClient({ log: [{ emit: "event", level: "query" }] });
const durations: number[] = [];
let countListQueries = false;

prisma.$on("query", (event) => {
  if (countListQueries) durations.push(event.duration);
});

async function main() {
  const owner = await prisma.user.findFirst({
    where: { customers: { some: {} } },
    select: { id: true },
  });
  if (!owner) {
    console.log(
      "No hay contactos para medir. Prepará datos locales con npm run seed.",
    );
    return;
  }

  countListQueries = true;
  const customers = await prisma.customer.findMany({
    where: { userId: owner.id },
    orderBy: { createdAt: "desc" },
  });
  countListQueries = false;

  const plan = await prisma.$queryRaw<Array<{ "QUERY PLAN": string }>>`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT * FROM "customers" WHERE "userId" = ${owner.id}
    ORDER BY "createdAt" DESC
  `;
  const [{ rows: totalRows }] = await prisma.$queryRaw<Array<{ rows: number }>>`
    SELECT count(*)::int AS rows FROM "customers"
  `;
  const indexes = await prisma.$queryRaw<
    Array<{ indexname: string; indexdef: string }>
  >`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'customers' AND schemaname = 'public'
    ORDER BY indexname
  `;

  console.log(
    JSON.stringify(
      {
        scope:
          "Consulta local del listado, sin red HTTP ni renderizado del navegador",
        rowsReturned: customers.length,
        totalRows,
        listSqlQueries: durations.length,
        listQueryDurationsMs: durations,
        indexes,
        plan: plan.map((line) =>
          line["QUERY PLAN"].split(owner.id).join("[usuario]"),
        ),
      },
      null,
      2,
    ),
  );
}

main()
  .catch(() => {
    console.error(
      "No se pudo completar la auditoría. Revisá la conexión y las migraciones de la base local.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
