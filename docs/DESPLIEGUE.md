# Publicar backend y frontend

El proyecto tiene dos aplicaciones y una base PostgreSQL. La configuración está en [render.yaml](../render.yaml). Las pruebas y compilaciones se ejecutan con GitHub Actions antes de desplegar.

**Estado:** [CI remota verificada](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb/actions/runs/41840228963); publicación pendiente de conectar y configurar Render. La configuración está preparada. Una compilación local, un archivo YAML o una URL escrita como ejemplo no prueban que exista un despliegue. Se considera publicado cuando ambos servicios responden por HTTPS y el recorrido de registro y contactos funciona contra la base remota.

## 1. Repositorio y CI

Repositorio de la entrega: [CRM-ProgramacionWeb](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb).

1. Revisar la pestaña [Actions](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb/actions) del último commit de `main`.
2. El job de backend crea PostgreSQL 16 temporal, instala con `npm ci`, aplica las migraciones, compila y ejecuta Jest con cobertura.
3. El job de frontend ejecuta sus pruebas y genera los archivos estáticos.
4. Ambos auditan dependencias de producción. Un fallo en una etapa hace fallar el job.

Los datos y secretos de CI son exclusivos de esa base efímera. No se necesita copiar `.env` ni la base local a GitHub. El historial muestra los commits reales; no se inventan entregas o checkpoints de semanas anteriores.

## 2. Crear los servicios en Render

Conectar la cuenta de Render y autorizar su acceso a ese repositorio. Después crear un **Blueprint** desde `render.yaml` y revisar que los recursos seleccionados sean los planes previstos. Este archivo propone servicios gratuitos para la demostración académica; no hay autorización implícita para contratar planes pagos.

El Blueprint configura:

| Recurso          | Qué ejecuta                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `orbita-crm-api` | Express compilado, migraciones antes de iniciar y health check      |
| `orbita-crm-web` | Build estático React/Vite, fallback de rutas y headers de seguridad |
| `orbita-crm-db`  | PostgreSQL 16 con acceso externo deshabilitado                      |

Completar las variables solicitadas con los dominios reales asignados:

| Variable       | Servicio | Ejemplo, reemplazar si Render asigna otro dominio |
| -------------- | -------- | ------------------------------------------------- |
| `CORS_ORIGIN`  | Backend  | `https://orbita-crm-web.onrender.com`             |
| `VITE_API_URL` | Frontend | `https://orbita-crm-api.onrender.com/api`         |

Si cambia el dominio de la API, actualizar también **`connect-src` del header Content-Security-Policy** del frontend en `render.yaml`. La política debe permitir exactamente el origen de la API, sin habilitar todos los dominios de Render. Las direcciones de esta tabla son ejemplos, no despliegues verificados.

`JWT_SECRET` se genera en Render y `DATABASE_URL` se obtiene de la base administrada. No guardar estos valores en Git. `NODE_ENV=production` activa la validación estricta de secretos, orígenes HTTPS y HSTS. `TRUST_PROXY_HOPS=1` asume un proxy delante de Express; si se cambia la topología, revisar esa cantidad antes de desplegar.

En el plan gratuito las migraciones se ejecutan al iniciar, porque no se asume acceso a tareas de predeploy pagas. Para una instalación con varias réplicas o despliegues más complejos conviene moverlas a un paso único de release.

## 3. Comprobar el despliegue

Reemplazá los dominios de ejemplo por los confirmados en Render:

```bash
curl --fail https://TU-API.onrender.com/health
curl --fail https://TU-API.onrender.com/api/openapi.json
```

El primer endpoint comprueba que el servidor HTTP está vivo; no certifica conexión con PostgreSQL. Para comprobar la aplicación:

1. Abrir el frontend por HTTPS y entrar directamente a `/register` para probar el fallback SPA.
2. Crear una cuenta propia con contraseña de al menos 15 caracteres.
3. Crear un contacto ficticio, abrir su ficha, editarlo y cambiar el estado.
4. Recargar la página: la sesión y el contacto deben persistir.
5. Confirmar que otra cuenta no ve ese contacto.
6. Eliminar el contacto de prueba y cerrar sesión.
7. Abrir `/api/docs/`, iniciar sesión con la API y probar una ruta protegida con **Authorize**.
8. Revisar en el navegador los headers del documento HTML del frontend, los errores de consola y los requests a la API.

No correr el seed de demostración en producción: el script lo rechaza cuando `NODE_ENV=production`. La cuenta local `test@example.com/password123` no debe publicarse como acceso de producción.

Al terminar, registrar las URLs reales y el enlace al run de CI en [REQUISITOS.md](REQUISITOS.md). No incluir tokens, contraseñas ni cadenas de conexión en capturas de la exposición.

## 4. Qué explicar al profesor

> «CI verifica automáticamente cada cambio en una base temporal. Si falla un test o la compilación, no se publica ese cambio automáticamente. Los servicios de Render están configurados para desplegar después de que pasen esos checks. La configuración se versiona; los secretos permanecen en el proveedor.»

CI configurada y CI ejecutada son evidencias distintas. Lo mismo ocurre con una receta de despliegue y dos servicios realmente publicados.

## Límites del alojamiento de demostración

Los planes gratuitos de Render tienen suspensión por inactividad y la base gratuita vence a los 30 días; no son una solución de operación permanente. Para una exposición conviene abrir la app con anticipación y verificar que la base siga activa. Una contratación permanente, backups y cambios de plan se deciden aparte. [Límites oficiales](https://render.com/docs/free).

Fuentes de configuración: [Express en Render](https://render.com/docs/deploy-node-express-app), [sitios estáticos](https://render.com/docs/static-sites), [Blueprints](https://render.com/docs/blueprint-spec), [despliegue después de CI](https://render.com/docs/deploys#integrating-with-ci) y [PostgreSQL en GitHub Actions](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).
