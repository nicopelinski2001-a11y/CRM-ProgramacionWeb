# órbita · CRM

[![CI](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb/actions/workflows/ci.yml/badge.svg)](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb/actions/workflows/ci.yml)

**Órbita** es una aplicación web para organizar contactos y dar seguimiento a relaciones comerciales. Reúne información de personas y empresas, datos de contacto y notas en un espacio privado para cada cuenta.

La interfaz permite consultar la red de contactos, encontrar información y actualizar el estado de cada relación. Los datos se almacenan en PostgreSQL y permanecen disponibles entre sesiones.

## Funcionalidades

- Registro de cuentas, inicio y cierre de sesión.
- Creación, consulta, edición y eliminación de contactos con confirmación.
- Fichas con nombre, empresa, email, teléfono, notas y estado comercial.
- Búsqueda por nombre, empresa, email o teléfono, con coincidencias que ignoran acentos.
- Filtros por estado, orden alfabético o por fecha de alta y contadores de contactos.
- Interfaz adaptable: tabla en escritorio y tarjetas en pantallas pequeñas.

Cada contacto pertenece a una cuenta. La API verifica esa propiedad al consultar o modificar los datos.

### Estados comerciales

| Estado             | Descripción                                                           |
| ------------------ | --------------------------------------------------------------------- |
| **Prospecto**      | Contacto potencial con el que puede iniciarse una relación comercial. |
| **En seguimiento** | Contacto con una conversación o propuesta en curso.                   |
| **Cliente**        | Contacto con una relación comercial concretada.                       |

Los estados se actualizan manualmente. El alcance actual se concentra en contactos; no incluye ventas, facturación ni automatizaciones.

## Tecnologías y arquitectura

| Área                       | Tecnologías                            |
| -------------------------- | -------------------------------------- |
| Frontend                   | React, TypeScript, Vite y Tailwind CSS |
| Backend                    | Node.js, Express y TypeScript          |
| Persistencia               | PostgreSQL y Prisma                    |
| Autenticación y validación | JWT, bcrypt y Zod                      |
| Documentación de API       | OpenAPI y Swagger UI                   |
| Pruebas                    | Jest y Testing Library                 |
| Integración continua       | GitHub Actions                         |

```text
backend/
├── prisma/          # Modelos, migraciones y datos de ejemplo
├── src/
│   ├── routes/      # Endpoints de la API
│   ├── middlewares/ # Autenticación, validación y manejo de errores
│   ├── controllers/ # Entrada y respuesta HTTP
│   ├── services/    # Operaciones sobre contactos y acceso a datos
│   └── schemas/     # Reglas de validación
└── tests/           # Pruebas unitarias y de integración
frontend/
├── src/
│   ├── pages/       # Pantallas de acceso y CRM
│   ├── components/  # Formularios, fichas y elementos de interfaz
│   ├── api/         # Comunicación con el backend
│   └── context/     # Estado de la sesión
└── tests/           # Pruebas de componentes
```

El frontend se comunica con la API mediante HTTP. El backend identifica al usuario, valida los datos y realiza las operaciones con Prisma. El navegador no accede directamente a la base de datos.

## Entorno de desarrollo

El entorno utiliza **Node.js 22.12 o superior dentro de la rama 22**, npm y PostgreSQL. El archivo `.nvmrc` define la versión principal de Node utilizada por CI y la configuración de despliegue.

Las dependencias de frontend y backend se administran por separado. Los archivos `.env` son locales y están excluidos de Git; sus variables de referencia están en [backend/.env.example](backend/.env.example) y [frontend/.env.example](frontend/.env.example).

### Configuración

La configuración local del backend corresponde a `backend/.env`:

```dotenv
DATABASE_URL="postgresql://usuario:password@localhost:5432/parcial_web?schema=public"
PORT=4000
JWT_SECRET="reemplazar-por-un-secreto-propio-y-aleatorio"
JWT_EXPIRES_IN="1h"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

La cadena `DATABASE_URL` identifica una base existente y las credenciales de la instalación. Una base nueva puede crearse con:

```sql
CREATE DATABASE parcial_web;
```

La configuración local del frontend corresponde a `frontend/.env`:

```dotenv
VITE_API_URL="http://localhost:4000/api"
```

Vite da prioridad a `frontend/.env.local` cuando ese archivo existe. Las variables `VITE_` son públicas en el navegador; las credenciales y los secretos pertenecen exclusivamente al backend.

### Ejecución local

Los comandos del backend, desde la raíz del repositorio, son:

```bash
cd backend
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

El frontend se ejecuta en otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

| Servicio                 | Dirección local                                            |
| ------------------------ | ---------------------------------------------------------- |
| Aplicación               | [localhost:5173](http://localhost:5173)                    |
| API                      | `http://localhost:4000/api`                                |
| Estado del servidor HTTP | `http://localhost:4000/health`                             |
| Swagger UI               | [localhost:4000/api/docs](http://localhost:4000/api/docs/) |
| Contrato OpenAPI         | `http://localhost:4000/api/openapi.json`                   |

### Datos de ejemplo

El comando `npm run seed`, disponible en `backend/`, crea una cuenta de prueba y seis contactos ficticios, dos por estado. Los contactos existentes de esa cuenta se conservan.

| Campo      | Cuenta de ejemplo local |
| ---------- | ----------------------- |
| Email      | `test@example.com`      |
| Contraseña | `password123`           |

Una cuenta nueva comienza sin contactos. Los registros nuevos requieren contraseñas de al menos 15 caracteres y hasta 72 bytes UTF-8. La cuenta de ejemplo es exclusiva del entorno de desarrollo y el seed está deshabilitado con `NODE_ENV=production`.

## API REST

La API devuelve JSON con el formato `{ "success": true, "data": ... }`. Los errores incluyen `success: false`, un mensaje en `error` y, cuando corresponde, detalles de validación.

| Método | Ruta                 | Descripción                           |
| ------ | -------------------- | ------------------------------------- |
| POST   | `/api/auth/register` | Registro de una cuenta.               |
| POST   | `/api/auth/login`    | Autenticación y emisión del token.    |
| GET    | `/api/auth/me`       | Datos de la sesión actual.            |
| GET    | `/api/customers`     | Contactos de la cuenta autenticada.   |
| GET    | `/api/customers/:id` | Ficha de un contacto propio.          |
| POST   | `/api/customers`     | Creación de un contacto.              |
| PUT    | `/api/customers/:id` | Actualización de los campos enviados. |
| DELETE | `/api/customers/:id` | Eliminación de un contacto propio.    |

Las rutas privadas requieren el encabezado `Authorization: Bearer <token>`. El nombre y el email del contacto son obligatorios; empresa, teléfono y notas son opcionales. El estado inicial es `PROSPECT`, con `FOLLOW_UP` y `CLIENT` como alternativas.

El [contrato OpenAPI](backend/src/docs/openapi.json) describe los campos, las respuestas y la autenticación. Swagger UI presenta esa documentación y permite realizar solicitudes a la API. Los endpoints `/api/items` se conservan por compatibilidad y no forman parte de la interfaz de contactos.

## Pruebas e integración continua

| Comando                    | Disponible en      | Descripción                                       |
| -------------------------- | ------------------ | ------------------------------------------------- |
| `npm test`                 | Backend y frontend | Ejecución de pruebas con Jest.                    |
| `npm run test:coverage`    | Backend y frontend | Informe de cobertura de los módulos configurados. |
| `npm run test:unit`        | Backend            | Pruebas de reglas, utilidades y configuración.    |
| `npm run test:integration` | Backend            | Pruebas HTTP con PostgreSQL real.                 |
| `npm run build`            | Backend y frontend | Compilación para producción.                      |

Las pruebas de integración requieren una base disponible con las migraciones aplicadas. Crean cuentas temporales y eliminan únicamente sus propios datos al finalizar. Las pruebas unitarias del backend no necesitan una base activa.

El [workflow de CI](.github/workflows/ci.yml) ejecuta las pruebas, las compilaciones y la auditoría de dependencias de producción. El backend utiliza una instancia temporal de PostgreSQL. Las ejecuciones están disponibles en [GitHub Actions](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb/actions).

## Seguridad y rendimiento

La aplicación utiliza contraseñas con hash bcrypt, JWT con vencimiento, validación de entradas, autorización por propietario, límites de solicitudes y cabeceras de seguridad. La configuración de producción exige un secreto propio y orígenes HTTPS.

La sesión se conserva en `localStorage`, por lo que una vulnerabilidad XSS podría exponer el token. El cierre de sesión elimina la copia del navegador, sin revocar otras copias. Estos límites y los controles implementados están descritos en la [documentación de seguridad](docs/SEGURIDAD.md).

El listado de contactos se obtiene con una consulta SQL y la tabla dispone de un índice sobre `userId`. La [auditoría de rendimiento](docs/PERFORMANCE.md) describe las mediciones y sus límites. El script `backend/scripts/performance-audit.ts` permite reproducir el análisis sin modificar datos.

## Despliegue y documentación técnica

El archivo [render.yaml](render.yaml) define un backend, un frontend estático y una base PostgreSQL para Render. La publicación de los servicios está pendiente; el repositorio incluye su configuración y las variables necesarias para ese entorno.

- [Seguridad](docs/SEGURIDAD.md): controles, configuración y limitaciones.
- [Testing](docs/TESTING.md): estrategia de pruebas y alcance de la cobertura.
- [Rendimiento](docs/PERFORMANCE.md): consultas, índices y mediciones.
- [Despliegue](docs/DESPLIEGUE.md): servicios, variables de entorno y publicación.
