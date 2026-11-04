import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import routes from "./routes";
import docsRoutes from "./routes/docs.routes";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware";
import {
  createApiLimiter,
  createAuthLimiter,
  noStore,
  requestId,
  restrictOrigin,
} from "./middlewares/security.middleware";

const app = express();

app.disable("x-powered-by");
// Nunca se confía en todas las cabeceras X-Forwarded-For del cliente.
app.set("trust proxy", env.TRUST_PROXY_HOPS || false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.IS_PRODUCTION ? [] : null,
      },
    },
    strictTransportSecurity: env.IS_PRODUCTION
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    xFrameOptions: { action: "deny" },
  }),
);
app.use(requestId);
app.use(restrictOrigin);
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use("/api", noStore, createApiLimiter());
app.use(["/api/auth/login", "/api/auth/register"], createAuthLimiter());
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api", docsRoutes);
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
