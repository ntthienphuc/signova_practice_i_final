import { apiClient } from "../api/client";

export function getMascotAssetUrl(filename: string): string {
  return `${apiClient.defaults.baseURL}mascot/image/${encodeURIComponent(filename)}`;
}
