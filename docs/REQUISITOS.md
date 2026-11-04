# Requisitos del segundo parcial y evidencia

Este documento separa lo implementado en el código de las verificaciones que necesitan un repositorio y servicios de producción. Debe actualizarse con los enlaces reales antes de presentar.

| Requisito o buena práctica               | Evidencia del proyecto                                                                                          | Qué mostrar en la defensa                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Aplicación full-stack de alcance elegido | CRM de contactos; React, API Express y PostgreSQL                                                               | Crear un contacto en la interfaz y mostrar que persiste al recargar                    |
| Separación de responsabilidades          | Frontend en `frontend/`; backend en `backend/`, con rutas, validación, controladores y acceso a datos separados | Seguir el caso «crear contacto» entre capas                                            |
| Seguridad orientada por OWASP            | JWT, autorización por dueño, validación, límites y configuración de seguridad                                   | Un contacto ajeno responde `404`; explicar un control y su límite                      |
| Documentación Swagger/OpenAPI            | `/api/docs` y `/api/openapi.json`                                                                               | Abrir Swagger, iniciar sesión, autorizar con Bearer y consultar contactos              |
| Testing automatizado con Jest            | Suites unitarias, componentes e integración                                                                     | Ejecutar `npm test` y explicar una aserción útil                                       |
| Pirámide de testing                      | [Estrategia de pruebas](TESTING.md)                                                                             | Diferenciar una unidad, integración y recorrido de navegador                           |
| Integración continua                     | `.github/workflows/ci.yml`                                                                                      | Abrir una ejecución remota exitosa; archivo local y ejecución son evidencias distintas |
| Backend y frontend en producción         | Configuración y [guía de despliegue](DESPLIEGUE.md)                                                             | Abrir ambas URLs HTTPS y comprobar un contacto persistido                              |
| README y documentación clara             | [README](../README.md) y esta carpeta                                                                           | Explicar cómo otra persona instala, prueba y ejecuta el proyecto                       |
| Auditoría N+1 e indexación               | [Auditoría reproducible](PERFORMANCE.md)                                                                        | Mostrar una consulta del listado y su plan con el índice en `userId`                   |
| Automatización sin código, optativa      | Propuesta de ampliación con n8n en la [guía de defensa](EXPOSICION.md)                                          | Explicar trigger → HTTP Request → resumen; no se implementó una automatización externa |

## Pendientes que no se pueden reemplazar con documentación

- **CI remota:** subir el código al repositorio elegido y comprobar que el workflow termina en verde.
- **Producción:** crear/configurar los recursos del proveedor, publicar ambos servicios, aplicar migraciones y verificar la aplicación por HTTPS.
- **Historial de cursada:** presentar commits, entregas y checkpoints reales de las semanas 7 a 13. El proyecto no genera ni reconstruye evidencia de semanas anteriores.
- **Defensa individual:** entender las decisiones y practicar la explicación; leer una guía no reemplaza el dominio del código.

El enunciado asigna el 70% a la presentación del código desarrollado durante la cursada y el 30% a checkpoints y defensa. Esta lista ayuda a preparar evidencia técnica; no permite inferir ni asegurar una nota.

## Registro para completar antes de entregar

| Evidencia externa            | Enlace o resultado real                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Repositorio                  | [CRM-ProgramacionWeb](https://github.com/nicopelinski2001-a11y/CRM-ProgramacionWeb) |
| Run de CI exitoso            | Pendiente de registrar                                                              |
| Frontend de producción       | Pendiente de verificar                                                              |
| Backend de producción        | Pendiente de verificar                                                              |
| Swagger de producción        | Pendiente de verificar                                                              |
| Prueba final de persistencia | Pendiente de verificar                                                              |

No conviene marcar una fila como cumplida hasta tener su resultado real.
