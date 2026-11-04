# órbita · CRM

CRM de contactos para el segundo parcial de Programación Web. Permite registrar personas y empresas, guardar sus datos y notas, y seguir la relación comercial en tres estados: **Prospecto**, **En seguimiento** y **Cliente**.

El login del primer parcial se mantiene. Cada cuenta ve y administra sus propios contactos, guardados en PostgreSQL.

La [guía para la exposición](docs/EXPOSICION.md) incluye una demostración y preguntas posibles del profesor. La [matriz de requisitos](docs/REQUISITOS.md) distingue el código disponible de la evidencia remota de CI y producción.

## Documentación para la entrega

- [Exposición y defensa](docs/EXPOSICION.md): recorrido del proyecto y preguntas.
- [Seguridad y límites](docs/SEGURIDAD.md): controles relacionados con OWASP y riesgos pendientes.
- [Testing con Jest](docs/TESTING.md): pruebas unitarias, componentes e integración.
- [Auditoría de rendimiento](docs/PERFORMANCE.md): N+1, índices y medición reproducible.
- [Despliegue](docs/DESPLIEGUE.md): publicar backend, frontend y base sin subir secretos.
- Swagger interactivo: `http://localhost:4000/api/docs`.
- Contrato OpenAPI: `http://localhost:4000/api/openapi.json`.

## Tecnologías

| Parte          | Tecnología                | Responsabilidad                                  |
| -------------- | ------------------------- | ------------------------------------------------ |
| Interfaz       | React + TypeScript + Vite | Pantallas, formularios y filtros                 |
| API            | Express + TypeScript      | Recibir pedidos y aplicar las reglas             |
| Validación     | Zod                       | Comprobar y normalizar los datos recibidos       |
| Documentación  | OpenAPI + Swagger UI      | Contrato de la API y pedidos interactivos        |
| Pruebas        | Jest + Testing Library    | Reglas, componentes e integración con PostgreSQL |
| CI             | GitHub Actions            | Ejecutar pruebas y builds sobre cambios          |
| Autenticación  | JWT + bcrypt              | Identificar al usuario y proteger contraseñas    |
| Acceso a datos | Prisma                    | Consultar y modificar la base de datos           |
| Base de datos  | PostgreSQL                | Guardar usuarios y contactos                     |

```text
parcial-web/
├── backend/
│   ├── prisma/           # Modelo, migraciones y datos de ejemplo
│   └── src/
│       ├── routes/       # URLs y métodos de la API
│       ├── controllers/  # Operaciones de cada recurso
│       ├── schemas/      # Validaciones de entrada
│       ├── middlewares/  # Autenticación, validación y errores
│       └── services/     # Reglas de contactos y consultas a Prisma
├── frontend/src/
│   ├── pages/            # Login, registro y CRM
│   ├── components/       # Componentes de la interfaz
│   ├── api/              # Pedidos HTTP al backend
│   └── context/          # Estado de la sesión
└── docs/EXPOSICION.md
```

## Preparar el proyecto

Necesitás Node.js 22, npm y PostgreSQL en ejecución. La versión de Node coincide con `.nvmrc`, CI y la configuración de despliegue.

### 1. Base de datos

Para una instalación nueva, creá una base vacía:

```sql
CREATE DATABASE parcial_web;
```

Si ya usabas este proyecto, conservá tu base y tu archivo `.env`: la migración del CRM agrega la tabla de contactos sin borrar los usuarios ni los datos anteriores.

### 2. Backend

```bash
cd backend
npm install
```

Si todavía no tenés `.env`, copiá `.env.example` a `.env` y completá los valores de tu instalación:

```dotenv
DATABASE_URL="postgresql://usuario:password@localhost:5432/parcial_web?schema=public"
PORT=4000
JWT_SECRET="un-secreto-largo-y-aleatorio"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173"
```

Aplicá las migraciones guardadas y generá el cliente de Prisma:

```bash
npx prisma migrate deploy
npm run prisma:generate
npm run seed
npm run dev
```

El seed crea una cuenta de ejemplo y seis contactos, dos por cada estado. Conserva los contactos existentes de esa cuenta; si ya tiene contactos, no vuelve a agregarlos.

En una instalación nueva, podés ingresar con:

- Email: `test@example.com`
- Contraseña: `password123`

La API queda en `http://localhost:4000/api`. Podés comprobar que el servidor responde abriendo `http://localhost:4000/health`.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
```

Si todavía no tenés `.env`, copiá `.env.example` a `.env`. La configuración local es:

```dotenv
VITE_API_URL="http://localhost:4000/api"
```

Después:

```bash
npm run dev
```

Abrí `http://localhost:5173`. Ambos servidores deben permanecer en ejecución. Si tenés un archivo `frontend/.env.local`, Vite le da prioridad sobre `.env`: revisalo si la interfaz apunta a otra API.

## Usar el CRM

1. Iniciá sesión o creá una cuenta.
2. Agregá un contacto con su nombre, email y estado. Empresa, teléfono y notas son opcionales.
3. Buscá contactos y filtrá por su estado comercial.
4. Consultá o editá sus datos y actualizá el estado cuando avance la relación.
5. Eliminá un contacto cuando corresponda, confirmando la operación.
6. Cerrá sesión. Al ingresar con otra cuenta, verás sus propios contactos.

Una cuenta nueva empieza sin contactos. Los datos de ejemplo pertenecen únicamente a la cuenta del seed.

Los registros nuevos requieren una contraseña de al menos 15 caracteres y hasta 72 bytes UTF-8. La contraseña pública de la cuenta de ejemplo se conserva solo para la demostración local; no se debe usar como cuenta privada de producción.

## API

Las respuestas exitosas tienen el formato `{ "success": true, "data": ... }`. Los errores devuelven `{ "success": false, "error": "...", "details": ... }`; `details` es opcional.

### Autenticación

| Método | Ruta                 | Protegida | Función                             |
| ------ | -------------------- | --------- | ----------------------------------- |
| POST   | `/api/auth/register` | No        | Crear una cuenta y obtener un token |
| POST   | `/api/auth/login`    | No        | Iniciar sesión y obtener un token   |
| GET    | `/api/auth/me`       | Sí        | Consultar el usuario de la sesión   |

### Contactos

Todas las rutas requieren `Authorization: Bearer <token>`.

| Método | Ruta                 | Función                                       |
| ------ | -------------------- | --------------------------------------------- |
| GET    | `/api/customers`     | Listar los contactos de la cuenta             |
| GET    | `/api/customers/:id` | Consultar un contacto propio                  |
| POST   | `/api/customers`     | Crear un contacto                             |
| PUT    | `/api/customers/:id` | Actualizar los campos enviados de un contacto |
| DELETE | `/api/customers/:id` | Eliminar un contacto propio                   |

Ejemplo de creación:

```json
{
  "name": "María López",
  "company": "Estudio Norte",
  "email": "maria@example.com",
  "phone": "+54 351 555 0100",
  "notes": "Consultar por la propuesta de diseño.",
  "status": "PROSPECT"
}
```

| Campo     | Regla                                                                       |
| --------- | --------------------------------------------------------------------------- |
| `name`    | Obligatorio, de 1 a 100 caracteres después de quitar espacios exteriores    |
| `email`   | Obligatorio, formato válido y hasta 254 caracteres; se guarda en minúsculas |
| `company` | Opcional, hasta 100 caracteres                                              |
| `phone`   | Opcional, hasta 30 caracteres                                               |
| `notes`   | Opcional, hasta 2000 caracteres                                             |
| `status`  | `PROSPECT`, `FOLLOW_UP` o `CLIENT`; por defecto, `PROSPECT`                 |

Los campos `id`, `userId`, `createdAt` y `updatedAt` los administra el servidor. El usuario dueño se obtiene del JWT, no del formulario. Las rutas `/api/items` del primer proyecto se conservan por compatibilidad; la interfaz del CRM trabaja con `/api/customers`.

## Verificación y herramientas

Desde `backend/`:

```bash
npm run build
npm test
```

`npm test` usa Jest. También podés separar `npm run test:unit` y `npm run test:integration`, o generar cobertura con `npm run test:coverage`.

Las pruebas de integración necesitan la base de datos configurada y las migraciones aplicadas. Crean usuarios temporales para verificar la API y eliminan únicamente sus datos al terminar. Las unitarias no requieren PostgreSQL activo.

Desde `frontend/`:

```bash
npm test
npm run build
```

Las pruebas de componentes usan Jest y Testing Library; `npm run test:coverage` genera el informe de cobertura.

Otros comandos del backend:

| Comando                  | Uso                                               |
| ------------------------ | ------------------------------------------------- |
| `npm run prisma:migrate` | Crear y aplicar migraciones durante el desarrollo |
| `npm run prisma:studio`  | Explorar los datos con Prisma Studio              |
| `npm run seed`           | Preparar la cuenta y los contactos de ejemplo     |
| `npm start`              | Ejecutar el backend ya compilado                  |

## Seguridad, rendimiento y automatización

La API comprueba propiedad de los contactos, valida entradas, limita intentos y tamaño del JSON, restringe orígenes y aplica cabeceras de seguridad. En producción exige secreto propio y orígenes HTTPS. La [guía de seguridad](docs/SEGURIDAD.md) explica los valores y límites, incluido el riesgo de guardar un JWT en `localStorage`.

Para repetir la auditoría SQL, desde `backend/`:

```bash
npx tsx scripts/performance-audit.ts
```

El script es de solo lectura. Con los seis contactos de la demostración, el listado produjo una consulta SQL y utilizó el índice en `userId`. Los tiempos y sus límites están en [PERFORMANCE.md](docs/PERFORMANCE.md).

El workflow `.github/workflows/ci.yml` prepara PostgreSQL temporal, aplica migraciones, ejecuta Jest y compila. El estado de una ejecución remota debe consultarse en la pestaña Actions del repositorio. Para publicar ambos servicios, seguí [DESPLIEGUE.md](docs/DESPLIEGUE.md); tener archivos de configuración no equivale a tener URLs de producción verificadas.

## Alcance

Es un CRM de contactos: organiza información y permite seguir el estado de cada relación comercial. El alcance del parcial incluye autenticación, validación, persistencia y operaciones CRUD. Ventas, facturación, recordatorios y automatizaciones quedan fuera del proyecto.

La sesión usa un JWT guardado en `localStorage`; el servidor comprueba su firma y vencimiento en cada pedido protegido. Las contraseñas se guardan con bcrypt y las consultas filtran por el dueño del contacto. Como mejora futura se pueden incorporar cookies `HttpOnly` con protección CSRF, paginación y roles de equipo. n8n se menciona como ampliación optativa en la guía de exposición; no se requiere ni se ejecuta ninguna automatización externa para usar el CRM.
