export async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function loadAppConfig(apiBase) {
  return fetchJson(new URL("/app-config", ensureBaseUrl(apiBase)));
}

export async function createRandomTask(apiBase, mode, lessonSize) {
  const path =
    mode === "practice_i"
      ? "/practice-i/task/random"
      : `/practice-ii/task/random?lesson_size=${lessonSize}`;
  return fetchJson(new URL(path, ensureBaseUrl(apiBase)));
}

export async function analyzeAttempt({ apiBase, mode, targetGloss, lessonGlosses, file }) {
  const endpoint = mode === "practice_i" ? "/practice-i/analyze-video" : "/practice-ii/analyze-video";
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
  return fetchJson(new URL(endpoint, ensureBaseUrl(apiBase)), {
    method: "POST",
    body: form
  });
}

export function ensureBaseUrl(value) {
  if (!value) {
    return "http://127.0.0.1:8014/";
  }
  return value.endsWith("/") ? value : `${value}/`;
}
