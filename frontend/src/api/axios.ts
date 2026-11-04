import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Interceptor de request: agrega el Bearer token automaticamente
// si existe en localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: si el token es invalido o expiro (401),
// se limpia la sesion y se redirige al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = ["/auth/login", "/auth/register"].includes(
      error.config?.url,
    );
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
