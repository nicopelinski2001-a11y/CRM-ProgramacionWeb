export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export const CUSTOMER_STATUSES = {
  PROSPECT: "Prospecto",
  FOLLOW_UP: "En seguimiento",
  CLIENT: "Cliente",
} as const;

export type CustomerStatus = keyof typeof CUSTOMER_STATUSES;

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  notes: string | null;
  status: CustomerStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  status: CustomerStatus;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthResponse {
  user: User;
  token: string;
}
