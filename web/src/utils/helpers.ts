import { AnalyzeResponse } from "../api";
import { AnalysisSummary } from "../types/learn";

export function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function summarizeAnalysis(raw: AnalyzeResponse): AnalysisSummary {
  return {
    target_gloss: raw.target_gloss,
    practice_mode: raw.practice_mode,
    score: raw.score,
    decision: raw.decision ?? {},
    feedback: raw.feedback ?? {},
    classifier: raw.classifier ?? null,
  };
}
