import axios from "axios";
import type { AxiosInstance } from "axios";

export function ensureBaseUrl(value: string): string {
  if (!value) {
    return "http://127.0.0.1:8014/";
  }
  return value.endsWith("/") ? value : `${value}/`;
}

export function createApiClient(baseUrl: string): AxiosInstance {
  return axios.create({ baseURL: ensureBaseUrl(baseUrl) });
}

export function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as unknown;
    const message = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(message || `HTTP ${error.response.status}`);
  }
  throw error;
}
