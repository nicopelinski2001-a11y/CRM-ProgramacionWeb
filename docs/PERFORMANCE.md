# Auditoría de consultas y rendimiento

## Qué se revisó

Se midió la consulta que usa el listado del CRM: contactos del usuario autenticado, ordenados por fecha de alta descendente. También se revisaron el esquema de índices y el código para detectar consultas dentro de bucles. Esta es una auditoría local de base de datos; no mide latencia de Internet, tiempos de una instancia en producción ni renderizado de React.

## Reproducir la medición

Con PostgreSQL en ejecución y al menos un contacto guardado, desde `backend/`:

```bash
npx tsx scripts/performance-audit.ts
```

El script hace consultas de lectura, cuenta los eventos SQL de `findMany`, ejecuta `EXPLAIN (ANALYZE, BUFFERS)` sobre un `SELECT` parametrizado y lista los índices. No modifica registros. Omite datos personales, credenciales y parámetros de conexión; reemplaza el ID del usuario dentro del plan por `[usuario]`.

## Resultado observado el 4 de noviembre de 2026

| Medida                                   | Resultado local                              |
| ---------------------------------------- | -------------------------------------------- |
| Contactos totales en la tabla            | 6                                            |
| Contactos devueltos                      | 6                                            |
| Sentencias SQL del listado               | 1                                            |
| Duración informada por el evento Prisma  | 0 ms, redondeados a la resolución del evento |
| Tiempo de ejecución de `EXPLAIN ANALYZE` | 0,037 ms                                     |
| Tiempo de planificación                  | 0,055 ms                                     |
| Ordenamiento                             | Quicksort, 26 kB                             |
| Buffers                                  | 2 hits en caché compartida                   |

Son observaciones de una ejecución pequeña y con caché. `0 ms` no significa que la consulta no tenga costo. Los valores cambian entre ejecuciones y no permiten estimar capacidad de usuarios concurrentes ni prometer tiempos en producción.

El plan observado, resumido y sin identificadores personales, fue:

```text
Sort: createdAt DESC
  Sort Method: quicksort  Memory: 26kB
  Bitmap Heap Scan on customers
    Bitmap Index Scan on customers_userId_idx
Execution Time: 0.037 ms
```

`EXPLAIN` permite inspeccionar el plan elegido y `ANALYZE` ejecuta la consulta para medirla. Por eso este script lo usa únicamente sobre un `SELECT`. Un escaneo secuencial puede ser una decisión válida del planificador en tablas pequeñas; no significa por sí solo que falte un índice. [Documentación de PostgreSQL sobre EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html).

## Índices presentes y decisión tomada

- `customers_pkey`: índice único de la clave primaria `id`, útil para buscar un contacto.
- `customers_userId_idx`: índice B-tree en `userId`, alineado con el filtro de propiedad del listado.
- `users.email`: restricción única utilizada por el login y la detección de cuentas duplicadas.

Se conserva el índice simple en `userId`. La medición muestra que PostgreSQL lo utilizó; con seis filas no hay evidencia que justifique agregar índices por cada campo. Cada índice ocupa espacio y agrega trabajo al insertar, modificar o eliminar registros.

Si el volumen crece, se puede comparar el índice actual con uno compuesto por `(userId, createdAt)` para el filtro y el orden del listado. Sería una hipótesis a medir con datos representativos. En índices B-tree compuestos importa el orden de las columnas y las condiciones sobre sus primeras columnas. [Documentación de índices multicolumna de PostgreSQL](https://www.postgresql.org/docs/current/indexes-multicolumn.html).

## Qué es N+1 y por qué este listado no lo tiene

N+1 aparece cuando se hace una consulta inicial y luego una consulta adicional por cada resultado. Ejemplo que **no está implementado** en el CRM:

```ts
const customers = await prisma.customer.findMany(); // 1 consulta
for (const customer of customers) {
  await prisma.user.findUnique({ where: { id: customer.userId } }); // N más
}
```

Con cien contactos, ese patrón puede producir 101 consultas. El listado real filtra por el dueño y devuelve los campos del contacto en una sola consulta; no busca el usuario para cada fila. La instrumentación local confirmó una sentencia para los seis contactos.

Si una futura pantalla necesitara datos relacionados, se revisaría `select`/`include`, una consulta por lote o un join según el caso, y se contaría el SQL generado en la versión de Prisma usada. Una llamada del ORM no garantiza por sí sola una única sentencia SQL. [Guía oficial de optimización de consultas de Prisma](https://www.prisma.io/docs/orm/v6/prisma-client/queries/query-optimization-performance).

La comprobación de propiedad seguida de una modificación es un número fijo de operaciones; no es N+1 porque no crece una vez por cada contacto del listado.

## Límites del alcance y próximos pasos

La API devuelve todos los contactos de una cuenta y React busca, ordena y filtra sobre esa lista. Es una decisión sencilla para el alcance del parcial. Para cuentas grandes, el siguiente paso sería paginar y mover búsqueda/filtros al servidor, con límites validados y pruebas correspondientes.

Antes de optimizar más: medir con datos representativos, identificar consultas lentas, revisar plan e índices y repetir la medición. No se modificaron los datos de usuarios para simular resultados de rendimiento.

## Respuesta corta para la defensa

> «N+1 sería consultar la lista y después hacer una consulta por cada fila. Acá el listado hace una sola consulta, filtrada por usuario. Lo comprobé contando SQL y usando EXPLAIN ANALYZE. Hay un índice en userId; no agregué más porque la base de prueba es chica y primero necesito evidencia.»
