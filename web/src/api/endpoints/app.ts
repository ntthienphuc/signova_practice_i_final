import { createApiClient, handleAxiosError } from "../client";
import type { AppConfig } from "../types";
import type { DashboardPayload } from "../../types/learn";

export async function loadAppConfig(baseUrl: string): Promise<AppConfig> {
  try {
    const client = createApiClient(baseUrl);
    const { data } = await client.get<AppConfig>("/app-config");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function loadCurriculum(baseUrl: string): Promise<DashboardPayload> {
  try {
    const client = createApiClient(baseUrl);
    const { data } = await client.get<DashboardPayload>("/curriculum");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
