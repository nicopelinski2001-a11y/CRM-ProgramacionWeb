import axios from "axios";

export function getErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error. Intentá de nuevo.",
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "No pudimos conectar con el servidor. Revisá que el backend esté encendido.";
    return error.response.data?.error || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
