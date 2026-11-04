import { api } from "./axios";
import { ApiResponse, AuthResponse, User } from "../types";

export async function registerRequest(payload: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>(
    "/auth/register",
    payload,
  );
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function loginRequest(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    payload,
  );
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function meRequest(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>("/auth/me");
  if (!data.success) throw new Error(data.error);
  return data.data;
}
