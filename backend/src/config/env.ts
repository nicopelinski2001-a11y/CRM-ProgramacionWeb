import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/)
    .default("1h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000).default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(15),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(86400000)
    .default(15 * 60 * 1000),
});

// Se validan los nombres de las variables sin incluir sus valores en errores.
// La función también permite probar la configuración sin modificar process.env.
export function parseEnvironment(source: NodeJS.ProcessEnv) {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new Error(`Configuración inválida: ${fields.join(", ")}`);
  }

  const config = result.data;
  const isProduction = config.NODE_ENV === "production";
  const origins = [
    ...new Set(config.CORS_ORIGIN.split(",").map((origin) => origin.trim())),
  ];
  const validOrigins =
    origins.length > 0 &&
    origins.every((origin) => {
      try {
        const url = new URL(origin);
        return (
          ["http:", "https:"].includes(url.protocol) &&
          (!isProduction || url.protocol === "https:") &&
          url.origin === origin &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    });
  if (!validOrigins) {
    throw new Error(
      "CORS_ORIGIN debe contener orígenes exactos separados por coma; en producción deben usar HTTPS",
    );
  }
  if (
    isProduction &&
    (config.JWT_SECRET.length < 32 ||
      /reemplazar|changeme|cambiar[- ]|un-secreto|example/i.test(
        config.JWT_SECRET,
      ))
  ) {
    throw new Error(
      "JWT_SECRET debe ser un secreto propio de al menos 32 caracteres en producción",
    );
  }

  return { ...config, CORS_ORIGINS: origins, IS_PRODUCTION: isProduction };
}

export const env = parseEnvironment(process.env);
