export type PracticeMode = "practice_i" | "practice_ii";

export interface AppConfig {
  glosses: string[];
  topics: unknown[];
  practice_modes: string[];
  random_practice_ii_sizes: number[];
  reference_video_available: boolean;
  overlay_strategy: string;
}

export interface ReferenceDisplayVideo {
  gloss: string;
  video_id?: string | null;
  video_score?: number | null;
  video_url: string;
  playback_url: string;
  video_filename: string;
}

export interface RandomTask {
  practice_mode: PracticeMode;
  target_gloss: string;
  lesson_glosses: string[];
  reference: ReferenceDisplayVideo | null;
}

export interface SegmentTiming {
  start_ms?: number;
  end_ms?: number;
  segment_start_ms?: number;
  segment_end_ms?: number;
  segment_duration_ms?: number;
  start_extracted_frame?: number;
  end_extracted_frame?: number;
  start_source_frame?: number;
  end_source_frame?: number;
  frame_count?: number;
  reason?: string;
}

export type Point = [number, number] | null | undefined;
export type FramePoints = Point[];
export type FrameData = { points: FramePoints } | FramePoints;

export interface OverlayPayload {
  joint_names: string[];
  connections: [number, number][];
  frame_count: number;
  bad_joint_indices: number[][];
  user_frames: FrameData[];
  reference_frames: FrameData[];
}

export interface PlaybackPayload {
  strategy: string;
  overlay_frame_count: number;
  user_video_url: string | null;
  reference_video_url: string | null;
  user_segment: SegmentTiming | null;
  reference_segment: SegmentTiming | null;
}

export interface JointStatus {
  status: string;
  body_part: string;
  frame: number;
}

export interface MainError {
  body_part: string;
  message: string;
}

export interface FeedbackBlock {
  overall: string;
  main_errors: MainError[];
  score?: number;
  bad_fraction?: number;
}

export interface Decision {
  accept_as_target: boolean;
  possible_wrong_word: boolean;
  needs_component_feedback: boolean;
  wrong_word_detected: boolean;
  predicted_wrong_gloss: string | null;
}

export interface ReferenceBlock {
  matched_reference_id: string | null;
  matched_template_index: number | null;
  display_video: ReferenceDisplayVideo | null;
  segment: SegmentTiming | null;
}

export interface VisualizationPayload {
  joint_status: JointStatus[];
  main_errors: MainError[];
}

export interface BankMatch {
  gloss: string;
  score: number;
  bad_fraction: number;
}

export interface AnalyzeResponse {
  attempt_id: string;
  practice_mode: PracticeMode;
  target_gloss: string;
  lesson_glosses: string[];
  score: number;
  decision: Decision;
  segment: SegmentTiming;
  playback: PlaybackPayload;
  overlay: OverlayPayload;
  feedback: FeedbackBlock;
  visualization?: VisualizationPayload;
  reference: ReferenceBlock;
  target_rank: number;
  top3_bank_matches: BankMatch[];
}

export interface AnalyzeAttemptParams {
  apiBase: string;
  mode: PracticeMode;
  targetGloss: string;
  lessonGlosses: string[];
  file: File;
}

export async function fetchJson<T>(url: URL | string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function ensureBaseUrl(value: string): string {
  if (!value) {
    return "http://127.0.0.1:8014/";
  }
  return value.endsWith("/") ? value : `${value}/`;
}

export async function loadAppConfig(apiBase: string): Promise<AppConfig> {
  return fetchJson<AppConfig>(new URL("/app-config", ensureBaseUrl(apiBase)));
}

export async function createRandomTask(
  apiBase: string,
  mode: PracticeMode,
  lessonSize: number
): Promise<RandomTask> {
  const path =
    mode === "practice_i"
      ? "/practice-i/task/random"
      : `/practice-ii/task/random?lesson_size=${lessonSize}`;
  return fetchJson<RandomTask>(new URL(path, ensureBaseUrl(apiBase)));
}

export async function analyzeAttempt({
  apiBase,
  mode,
  targetGloss,
  lessonGlosses,
  file
}: AnalyzeAttemptParams): Promise<AnalyzeResponse> {
  const endpoint =
    mode === "practice_i" ? "/practice-i/analyze-video" : "/practice-ii/analyze-video";
  const form = new FormData();
  form.append("target_gloss", targetGloss);
  form.append("video", file);
  form.append("frame_stride", "2");
  form.append("auto_segment", "true");
  form.append("segment_min_frames", "12");
  form.append("segment_pad_frames", "8");
  form.append("overlay_frame_count", "32");
  form.append("return_visualization", "false");
  if (mode === "practice_ii") {
    form.append("lesson_glosses", lessonGlosses.join(","));
  }
  return fetchJson<AnalyzeResponse>(new URL(endpoint, ensureBaseUrl(apiBase)), {
    method: "POST",
    body: form
  });
}
