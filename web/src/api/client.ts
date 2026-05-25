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
  // Use remote HF Spaces backend as default, not local localhost
  const defaultUrl = "https://thienphuc12339-signova-backend.hf.space";
  // const defaultUrl = "http://127.0.0.1:8010";

  const baseUrl = value || defaultUrl;
  // Normalize: ensure trailing slash, handle both with and without it
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

export function createApiClient(baseUrl: string): AxiosInstance {
  const client = axios.create({ 
    baseURL: ensureBaseUrl(baseUrl),
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("signova_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  return client;
}

export function handleAxiosError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data as unknown;
    let message: string;
    if (typeof data === "string") {
      message = data;
    } else if (data && typeof data === "object" && "detail" in data && typeof (data as Record<string, unknown>).detail === "string") {
      message = (data as Record<string, unknown>).detail as string;
    } else {
      message = JSON.stringify(data);
    }
    throw new Error(message || `HTTP ${error.response.status}`);
  }
  throw error;
}

export const BASE_URL = ensureBaseUrl(
  (import.meta.env.VITE_API_BASE_URL as string) || "https://thienphuc12339-signova-backend.hf.space"
);
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
 * VOCABULARY DETAIL
 * ========================================== */

export interface VocabularyDetail {
  gloss: string;
  video_id: string;
  score: number;
  poster_url: string;
  reference: {
    video_url: string;
    playback_url: string;
    segment: string | null;
    video_filename: string;
  };
}

export async function getVocabularyDetail(gloss: string): Promise<VocabularyDetail> {
  try {
    const response = await apiClient.get<VocabularyDetail>(
      `/vocabulary/${encodeURIComponent(gloss)}`
    );
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

/** ==========================================
 * USER AUTHENTICATION & PROGRESS API SERVICES LAYER
 * ========================================== */

export async function registerUser(username: string, password: string, role: string = "learner"): Promise<any> {
  try {
    const response = await apiClient.post("/auth/register", { username, password, role });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function loginUser(username: string, password: string): Promise<any> {
  try {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    const response = await apiClient.post("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getCurrentUser(): Promise<any> {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getReviewWords(): Promise<any> {
  try {
    const response = await apiClient.get("/progress/review-words");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function markWordViewed(wordId: string): Promise<any> {
  try {
    const response = await apiClient.post("/progress/word-viewed", { word_id: wordId });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function updateResumeState(topicId: string, lastActiveStage: string, currentWordIndex: number): Promise<any> {
  try {
    const response = await apiClient.post("/progress/resume", {
      topic_id: topicId,
      last_active_stage: lastActiveStage,
      current_word_index: currentWordIndex
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getParentDashboard(): Promise<any> {
  try {
    const response = await apiClient.get("/dashboard/parent");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getSchoolDashboard(): Promise<any> {
  try {
    const response = await apiClient.get("/dashboard/school");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function updateProfile(data: {
  display_name?: string;
  dob?: string;
  phone?: string;
  school_name?: string;
  contact_name?: string;
  contact_phone?: string;
}): Promise<any> {
  try {
    const response = await apiClient.post("/auth/update-profile", data);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function searchLearners(query: string): Promise<any> {
  try {
    const response = await apiClient.get(`/links/search-learner?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function requestParentLink(learnerUsername: string): Promise<any> {
  try {
    const response = await apiClient.post("/links/parent/request", { learner_username: learnerUsername });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function requestSchoolLink(learnerUsername: string, className: string, studentCode: string): Promise<any> {
  try {
    const response = await apiClient.post("/links/school/request", {
      learner_username: learnerUsername,
      class_name: className,
      student_code: studentCode
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getPendingLinks(): Promise<any> {
  try {
    const response = await apiClient.get("/links/pending");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function approveParentLink(id: string): Promise<any> {
  try {
    const response = await apiClient.post(`/links/parent/${id}/approve`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function rejectParentLink(id: string): Promise<any> {
  try {
    const response = await apiClient.post(`/links/parent/${id}/reject`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function approveSchoolLink(id: string): Promise<any> {
  try {
    const response = await apiClient.post(`/links/school/${id}/approve`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function rejectSchoolLink(id: string): Promise<any> {
  try {
    const response = await apiClient.post(`/links/school/${id}/reject`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getLearnerDashboard(learnerId: string): Promise<any> {
  try {
    const response = await apiClient.get(`/dashboard/learner/${learnerId}`);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}
export async function getMyProgress(): Promise<any> {
  try {
    const response = await apiClient.get("/progress/me");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function createChild(data: {
  username: string;
  password: string;
  display_name?: string;
  dob?: string;
}): Promise<any> {
  try {
    const response = await apiClient.post("/auth/create-child", data);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function createStudent(data: {
  username: string;
  password: string;
  display_name?: string;
  class_name?: string;
  student_code?: string;
}): Promise<any> {
  try {
    const response = await apiClient.post("/auth/create-student", data);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function refreshAIRecommendation(): Promise<any> {
  try {
    const response = await apiClient.post("/dashboard/refresh-ai");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

// ─── Teacher / Custom Package APIs ─────────────────────────────────────────

export interface BankWordItem {
  gloss: string;
  has_reference: boolean;
}

export interface CustomPackage {
  id: string;
  title: string;
  description: string | null;
  glosses: string[];
  word_count: number;
  assigned_class_name?: string | null;
  assigned_student_ids?: string[];
  created_at: string;
}

export async function getWordBank(): Promise<{ words: BankWordItem[]; total: number }> {
  try {
    const response = await apiClient.get("/teacher/word-bank");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getCustomPackages(): Promise<{ packages: CustomPackage[] }> {
  try {
    const response = await apiClient.get("/teacher/packages");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function createCustomPackage(data: {
  title: string;
  description?: string;
  glosses: string[];
}): Promise<CustomPackage> {
  try {
    const response = await apiClient.post("/teacher/packages", data);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function deleteCustomPackage(packageId: string): Promise<void> {
  try {
    await apiClient.delete(`/teacher/packages/${packageId}`);
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function assignCustomPackage(
  packageId: string,
  data: { assigned_class_name: string | null; assigned_student_ids: string[] }
): Promise<CustomPackage> {
  try {
    const response = await apiClient.post(`/teacher/packages/${packageId}/assign`, data);
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getAssignedPackages(): Promise<{ packages: CustomPackage[] }> {
  try {
    const response = await apiClient.get("/teacher/assigned-packages");
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}
