import axios from "axios";
import type { AxiosInstance } from "axios";
import type { DashboardPayload } from "../types/learn";

/** ==========================================
 * TYPE DEFINITIONS FOR REQUESTS & RESPONSES
 * ========================================== */

export interface AppConfigResponse {
  curriculum_topics: string[];
}

export interface AnalyzeVideoPayload {
  target_gloss: string;
  video: File;
  lesson_glosses?: string[];
  frame_stride?: number;
  auto_segment?: boolean;
  overlay_frame_count?: number;
}

export interface AnalysisResponse {
  success: boolean;
  score: number;
  landmarks?: any[];
  feedback?: string;
}

/** ==========================================
 * UTILITY FACTORY INSTANCES (YOUR CORE CODE)
 * ========================================== */

export function ensureBaseUrl(value: string): string {
  if (!value) {
    return "http://127.0.0.1:8014/"; // Default port updated dynamically if needed
  }
  return value.endsWith("/") ? value : `${value}/`;
}

export function createApiClient(baseUrl: string): AxiosInstance {
  return axios.create({ 
    baseURL: ensureBaseUrl(baseUrl),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as unknown;
    const message = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(message || `HTTP ${error.response.status}`);
  }
  throw error;
}

// Instantiate the primary client interface using your custom engine
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const apiClient = createApiClient(BASE_URL);

/** ==========================================
 * SIGN LANGUAGE CORE API SERVICES LAYER
 * ========================================== */

// 1. Fetch App Structural Configurations
export async function getAppConfig(): Promise<AppConfigResponse> {
  try {
    const response = await apiClient.get<AppConfigResponse>("/app-config");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

// 2. Fetch Complete Interactive Topics/Curriculum Data
export async function getCurriculumData(): Promise<DashboardPayload> {
  try {
    const response = await apiClient.get<DashboardPayload>("/curriculum");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

// Helper builder to parse object parameters down to a secure MultiPart structure cleanly
function buildAnalyzeFormData(payload: AnalyzeVideoPayload): FormData {
  const formData = new FormData();
  formData.append("target_gloss", payload.target_gloss);
  formData.append("video", payload.video);

  if (payload.lesson_glosses) {
    // Array properties are passed as a stringified array payload context
    formData.append("lesson_glosses", JSON.stringify(payload.lesson_glosses));
  }
  if (payload.frame_stride !== undefined) {
    formData.append("frame_stride", String(payload.frame_stride));
  }
  if (payload.auto_segment !== undefined) {
    formData.append("auto_segment", String(payload.auto_segment));
  }
  if (payload.overlay_frame_count !== undefined) {
    formData.append("overlay_frame_count", String(payload.overlay_frame_count));
  }
  return formData;
}

// 3. Practice Method I: Standard Feature Processing
export async function analyzeVideoPractice1(payload: AnalyzeVideoPayload): Promise<AnalysisResponse> {
  try {
    const formData = buildAnalyzeFormData(payload);
    const response = await apiClient.post<AnalysisResponse>("/practice-i/analyze-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

// 4. Practice Method II: Enforced Context-Aware Processing
export async function analyzeVideoPractice2(
  payload: Required<Pick<AnalyzeVideoPayload, "target_gloss" | "video" | "lesson_glosses">> & Partial<AnalyzeVideoPayload>
): Promise<AnalysisResponse> {
  try {
    const formData = buildAnalyzeFormData(payload);
    const response = await apiClient.post<AnalysisResponse>("/practice-ii/analyze-video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

/** ==========================================
 * SYSTEM STATIC CDN ASSET DESPATCH RESOURCE MAP
 * ========================================== */
export const assetUrls = {
  getPosterUrl: (gloss: string) => 
    `${apiClient.defaults.baseURL}poster/reference/${encodeURIComponent(gloss)}`,
  
  getReferenceVideoUrl: (gloss: string) => 
    `${apiClient.defaults.baseURL}reference-video/${encodeURIComponent(gloss)}`,
  
  getPlaybackUrl: (gloss: string) => 
    `${apiClient.defaults.baseURL}playback/reference/${encodeURIComponent(gloss)}`,
};