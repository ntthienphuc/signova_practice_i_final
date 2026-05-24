import { apiClient, handleAxiosError } from "../client";
import type { AnalyzeAttemptParams, AnalyzeResponse, PracticeMode, RandomTask } from "../types";

export async function createRandomTask(
  mode: PracticeMode,
  lessonSize: number
): Promise<RandomTask> {
  try {
    const path =
      mode === "practice_i"
        ? "/practice-i/task/random"
        : `/practice-ii/task/random?lesson_size=${lessonSize}`;
    const { data } = await apiClient.get<RandomTask>(path);
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function analyzeAttempt({
  mode,
  targetGloss,
  lessonGlosses,
  file
}: AnalyzeAttemptParams): Promise<AnalyzeResponse> {
  try {
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
    const { data } = await apiClient.post<AnalyzeResponse>(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}
