import { createApiClient, handleAxiosError } from "../client";
import type { AppConfig } from "../types";

export async function loadAppConfig(baseUrl: string): Promise<AppConfig> {
  try {
    const client = createApiClient(baseUrl);
    const { data } = await client.get<AppConfig>("/app-config");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
