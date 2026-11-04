import { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export function ok<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  return res.status(status).json(body);
}

export function fail(
  res: Response,
  error: string,
  status = 400,
  details?: unknown,
) {
  const body: ApiError = { success: false, error, details };
  return res.status(status).json(body);
}
