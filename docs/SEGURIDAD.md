# Seguridad: controles, pruebas y límites

## Enfoque

Órbita maneja datos de contacto privados de cada cuenta. Sus controles se relacionan con riesgos del [OWASP Top 10:2025](https://top10.owasp.org/2025/), una referencia para identificar riesgos de aplicaciones web. Usar esa referencia no equivale a una certificación ni a afirmar que se evaluaron todos sus controles.

La regla principal del CRM es: **el usuario solo puede leer y modificar sus propios contactos**. El frontend facilita la interacción; la decisión de acceso se toma en el backend.

## Riesgos y controles implementados

| Riesgo relevante                         | Control del proyecto                                                                                       | Evidencia para mostrar                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| A01: control de acceso roto              | El `userId` se obtiene del JWT y las operaciones filtran por el dueño; no se acepta desde el formulario    | Tests de una cuenta intentando leer, editar o borrar contactos ajenos                 |
| A02: configuración insegura              | Helmet, CORS por orígenes exactos, secretos validados en producción y proxy configurado explícitamente     | `app.ts`, `env.ts` y pruebas de configuración                                         |
| A03: dependencias y cadena de suministro | Dependencias fijadas por lockfiles, instalación con `npm ci` y revisión de auditoría                       | `package-lock.json`, workflow y resultado de auditoría actual                         |
| A04: fallas criptográficas               | Contraseñas con bcrypt; JWT firmado; HTTPS exigido para orígenes de producción                             | `password.ts`, `jwt.ts` y configuración de despliegue                                 |
| A05: inyección                           | Campos validados por Zod y consultas parametrizadas mediante Prisma; React representa los datos como texto | Schemas, servicio de contactos y prueba con texto de entrada                          |
| A07: fallas de autenticación             | JWT con firma, HS256, emisor, destinatario y vencimiento verificados; límite de intentos de acceso         | Middleware de auth, pruebas de token y respuesta `429`                                |
| A09: registro y alertas insuficientes    | ID de pedido generado por el servidor y errores estructurados sin tokens ni cuerpos                        | Header `X-Request-ID` y middleware de errores; las alertas externas quedan pendientes |
| A10: manejo incorrecto de excepciones    | JSON inválido, cuerpo excesivo y errores conocidos reciben respuestas controladas                          | Pruebas `400`, `413`, `404` y middleware de errores                                   |

La tabla vincula decisiones del código con riesgos; no representa una auditoría completa de cada categoría de OWASP.

## Límites de solicitudes y tamaño

| Configuración          | Valor por defecto  | Comportamiento                                                    |
| ---------------------- | ------------------ | ----------------------------------------------------------------- |
| `API_RATE_LIMIT_MAX`   | 300 por IP         | Pedidos a `/api` durante la ventana                               |
| `AUTH_RATE_LIMIT_MAX`  | 15 por IP          | Intentos fallidos de login y registro; los exitosos se descuentan |
| `RATE_LIMIT_WINDOW_MS` | 900000, 15 minutos | Ventana de ambos límites                                          |
| Cuerpo JSON            | 16 kB              | Un cuerpo mayor recibe `413`                                      |

Al superar un límite, la API responde `429` y un mensaje legible. El almacenamiento del limitador está en la memoria de cada proceso: se reinicia con el servidor. Para varias réplicas habría que usar un almacén compartido.

`TRUST_PROXY_HOPS` vale `0` por defecto y se configura según los proxies reales del proveedor. Confiar en cualquier header `X-Forwarded-For` permitiría falsificar la IP usada por el limitador.

## CORS y cabeceras

`CORS_ORIGIN` contiene orígenes completos permitidos, separados por coma. También se admite el origen propio de la API, para usar Swagger desde el backend. Un `Origin` externo desconocido se rechaza con `403`. Los pedidos sin `Origin`, habituales desde herramientas HTTP, pueden ingresar, pero siguen necesitando un JWT válido en rutas privadas.

CORS es una política del navegador, no un sistema de autenticación. El backend nunca lo usa como reemplazo de la autorización. [Recomendaciones de seguridad REST de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

El backend desactiva `X-Powered-By`, establece `X-Content-Type-Options: nosniff`, bloquea el embebido con `X-Frame-Options: DENY` y `frame-ancestors 'none'`, y aplica CSP. En producción habilita HSTS de un año. Las respuestas `/api` llevan `Cache-Control: no-store`.

Las cabeceras de la API no sustituyen las del documento HTML del frontend. La política del frontend se configura en su hosting y se debe comprobar en su URL de producción.

## Configuración de producción

Con `NODE_ENV=production`, el backend rechaza `JWT_SECRET` menor a 32 caracteres o con un valor de ejemplo, y solo admite orígenes CORS HTTPS. El secreto se guarda en las variables privadas del proveedor, nunca en el frontend, README, repositorio ni captura de pantalla.

`JWT_EXPIRES_IN` tiene un valor por defecto de `1h`. Una configuración `.env` existente puede reemplazarlo, por ejemplo con `7d`; por eso hay que revisar las variables reales del despliegue. Al vencer el token, el backend devuelve `401` y la interfaz limpia la sesión.

El emisor esperado es `orbita-crm` y el destinatario `orbita-web`. Los tokens de la versión anterior, que no incluían estos claims, dejan de ser válidos: hay que iniciar sesión de nuevo.

El usuario de ejemplo y su contraseña son datos públicos para una demostración local. No se debe usar esa cuenta conocida como cuenta privada ni ejecutar el seed automáticamente sobre producción.

## Qué queda limitado o pendiente

- **Token en `localStorage`:** un XSS podría leerlo. React evita interpretar los campos de contacto como HTML y CSP reduce algunas vías de ejecución, pero no elimina ese riesgo. OWASP recomienda no guardar identificadores de sesión en ese almacenamiento. Una mejora es una sesión con cookie `HttpOnly`, `Secure` y `SameSite`, incorporando las defensas CSRF correspondientes. [OWASP sobre almacenamiento del navegador](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage).
- **Logout:** elimina el token del navegador; no revoca una copia robada antes de su vencimiento. No hay lista de revocación ni refresh tokens.
- **Autenticación básica:** los registros nuevos exigen al menos 15 caracteres y como máximo 72 bytes UTF-8, para respetar el límite de bcrypt. No hay MFA, recuperación de contraseña, verificación de email ni gestión de sesiones por dispositivo. El login admite credenciales heredadas, incluida la cuenta de demostración local; esa excepción no reduce la validación de las cuentas nuevas.
- **Operación:** no hay un sistema externo de alertas, una prueba de penetración completa ni evidencia de tolerancia a carga alta. Los logs sanitizados ayudan a investigar, pero no reemplazan monitoreo.
- **Datos y proveedor:** backups, permisos de la base, HTTPS y configuración del hosting se deben verificar en el entorno publicado. El código local no demuestra por sí solo esas condiciones.

## Prueba sencilla para la defensa

1. Crear dos cuentas de prueba.
2. Crear un contacto con la primera cuenta y obtener su ID.
3. Con el token de la segunda cuenta, consultar, editar o borrar ese ID.
4. Mostrar que la API responde `404`, sin revelar datos ni permitir modificaciones.

> «Autenticar es saber quién sos; autorizar es decidir qué datos podés usar. El token resuelve la identificación y el filtro por dueño resuelve el permiso. El ID del contacto por sí solo no concede acceso.»

## Auditoría de dependencias del 4 de noviembre de 2026

Después de actualizar las dependencias afectadas, `npm audit --omit=dev` reportó **0 vulnerabilidades conocidas** en ambos proyectos. Se actualizaron Zod a 4, Vite a 7 y React Router a 7, y las dependencias transitivas compatibles. Los tests, las compilaciones y el recorrido de navegador volvieron a pasar después de los cambios.

La auditoría completa, incluyendo herramientas de desarrollo, conserva 21 alertas por proyecto (17 moderadas y 4 bajas), concentradas en la cadena de Jest 29 y sus dependencias. No hay alertas altas ni críticas en ese resultado. No se aplicó `npm audit fix --force`: propone cambios incompatibles y hasta un downgrade de Jest que requieren una evaluación aparte. Los números son una foto de la ejecución, no una garantía futura; CI repite la auditoría de producción.
