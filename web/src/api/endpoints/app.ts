import { apiClient, handleAxiosError } from "../client";
import type { AppConfig } from "../types";
import type { DashboardPayload } from "../../types/learn";

export async function loadAppConfig(): Promise<AppConfig> {
  try {
    const { data } = await apiClient.get<AppConfig>("/app-config");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function loadCurriculum(): Promise<DashboardPayload> {
  try {
    const { data } = await apiClient.get<DashboardPayload>("/curriculum");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
