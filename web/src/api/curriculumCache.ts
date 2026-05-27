import { loadCurriculum } from "./endpoints/app";

// Module-level promise cache — one HTTP request per session regardless of
// how many pages call useCurriculum() concurrently or in sequence.
let promise: Promise<any> | null = null;

export function loadCurriculumCached(): Promise<any> {
  if (!promise) {
    promise = loadCurriculum().catch((err) => {
      promise = null; // allow retry on next call if it failed
      throw err;
    });
  }
  return promise;
}

export function clearCurriculumCache() {
  promise = null;
}
