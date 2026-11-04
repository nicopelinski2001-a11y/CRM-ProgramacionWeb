// Las pruebas unitarias no necesitan .env ni PostgreSQL. La integración usa
// DATABASE_URL del entorno o de .env y crea únicamente usuarios temporales.
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test-only-secret-with-at-least-32-characters";
process.env.DATABASE_URL ??=
  "postgresql://test:test@localhost:5432/orbita_test";
