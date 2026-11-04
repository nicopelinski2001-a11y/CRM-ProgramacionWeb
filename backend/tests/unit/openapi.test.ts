import path from "node:path";
import SwaggerParser from "@apidevtools/swagger-parser";

test("el contrato OpenAPI es válido y sus referencias se resuelven", async () => {
  const contract = await SwaggerParser.validate(
    path.resolve(__dirname, "../../src/docs/openapi.json"),
  );
  expect(contract).toHaveProperty("openapi", "3.0.3");
  expect(contract.paths).toHaveProperty("/api/customers");
  expect(contract.paths).toHaveProperty("/api/customers/{id}");
  expect(contract).toHaveProperty("components.securitySchemes.bearerAuth");
});
