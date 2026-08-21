export type LearningCheckpointStage = "learn" | "practice";

export interface LearningCheckpoint {
  topicId: string;
  wordIndex: number;
  stage: LearningCheckpointStage;
  updatedAt: number;
}

function checkpointKey(userId: string): string {
  return `signova_learning_checkpoint_${userId}`;
}

export function readLearningCheckpoint(userId: string | undefined): LearningCheckpoint | null {
  if (!userId) return null;
  const raw = localStorage.getItem(checkpointKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LearningCheckpoint>;
    const wordIndex = parsed.wordIndex;
    if (
      typeof parsed.topicId !== "string" ||
      typeof wordIndex !== "number" ||
      !Number.isInteger(wordIndex) ||
      wordIndex < 0 ||
      (parsed.stage !== "learn" && parsed.stage !== "practice")
    ) {
      return null;
    }
    return {
      topicId: parsed.topicId,
      wordIndex,
      stage: parsed.stage,
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeLearningCheckpoint(userId: string | undefined, checkpoint: LearningCheckpoint): void {
  if (!userId) return;
  localStorage.setItem(checkpointKey(userId), JSON.stringify(checkpoint));
}

export function clearLearningCheckpoint(userId: string | undefined): void {
  if (!userId) return;
  localStorage.removeItem(checkpointKey(userId));
}
