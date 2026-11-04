import { AxiosError, AxiosHeaders } from "axios";
import { getErrorMessage } from "../src/api/errors";

describe("Mensajes de errores HTTP", () => {
  test("un error de red muestra una indicación para recuperar la conexión", () => {
    expect(getErrorMessage(new AxiosError("Network error"))).toContain(
      "No pudimos conectar",
    );
  });

  test("muestra el mensaje de API y no detalles técnicos de Axios", () => {
    const error = new AxiosError(
      "Request failed",
      "400",
      undefined,
      undefined,
      {
        data: { success: false, error: "El email ya está registrado" },
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
    );
    expect(getErrorMessage(error)).toBe("El email ya está registrado");
  });

  test("un error desconocido usa el mensaje de recuperación indicado", () => {
    expect(getErrorMessage(undefined, "Intentá de nuevo")).toBe(
      "Intentá de nuevo",
    );
  });
});
