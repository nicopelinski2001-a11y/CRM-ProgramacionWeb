import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import specification from "../docs/openapi.json";

const router = Router();

router.get("/openapi.json", (_req, res) => res.json(specification));
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    customSiteTitle: "Órbita CRM · Documentación de API",
    swaggerOptions: {
      url: "/api/openapi.json",
      validatorUrl: null,
      persistAuthorization: false,
      displayRequestDuration: true,
      defaultModelsExpandDepth: -1,
    },
  }),
);

export default router;
