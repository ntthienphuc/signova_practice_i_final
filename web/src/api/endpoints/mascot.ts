import { apiClient, handleAxiosError } from "../client";
import type { MascotConfig, MascotPurchaseResponse, MascotShopResponse } from "../types";

export async function getMascotShop(): Promise<MascotShopResponse> {
  try {
    const { data } = await apiClient.get<MascotShopResponse>("/mascot/shop");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function purchaseMascotItem(item_key: string): Promise<MascotPurchaseResponse> {
  try {
    const { data } = await apiClient.post<MascotPurchaseResponse>("/mascot/purchase", { item_key });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function equipMascotItem(item_key: string | null): Promise<MascotConfig> {
  try {
    const { data } = await apiClient.post<MascotConfig>("/mascot/equip", { item_key });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getMascotConfig(): Promise<MascotConfig> {
  try {
    const { data } = await apiClient.get<MascotConfig>("/mascot/config");
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
