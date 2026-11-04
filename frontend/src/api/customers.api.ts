import { api } from "./axios";
import { ApiResponse, Customer, CustomerInput } from "../types";

export async function getCustomersRequest(
  signal?: AbortSignal,
): Promise<Customer[]> {
  const { data } = await api.get<ApiResponse<Customer[]>>("/customers", {
    signal,
  });
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createCustomerRequest(
  payload: CustomerInput,
): Promise<Customer> {
  const { data } = await api.post<ApiResponse<Customer>>("/customers", payload);
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateCustomerRequest(
  id: string,
  payload: Partial<CustomerInput>,
): Promise<Customer> {
  const { data } = await api.put<ApiResponse<Customer>>(
    `/customers/${id}`,
    payload,
  );
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteCustomerRequest(id: string): Promise<void> {
  const { data } = await api.delete<ApiResponse<{ id: string }>>(
    `/customers/${id}`,
  );
  if (!data.success) throw new Error(data.error);
}
