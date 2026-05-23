# Signova Engineering Spec: Real Data Integration for Learn Dashboard & Navigation Flow

This specification guides the architectural update of the `LearnDashboard.tsx` view and its sub-components. We are replacing the previous mockup models with a real backend payload dataset (`topics`) and mapping the exact navigation state triggers required to open the flashcard practice view (`LearnPage.tsx`) cleanly.

---

## 💾 1. TypeScript Types & Payload Interface Model
Replace any local mock configurations with this exact backend response model in your schema files (e.g., `src/types/learn.ts`):

```typescript
export interface VideoReference {
  video_url: string;
  playback_url: string;
  segment: string | null;
  video_filename: string;
}

export interface StudyMetadata {
  gloss: string;
  video_id: string;
  score: number;
  poster_url: string;
  reference: VideoReference;
}

export interface WordItem {
  order: number;
  gloss: string;
  checkpoint_group: number; // Matches the sub-group index within the topic timeline
  study: StudyMetadata;
}

export interface Topic {
  id: string;
  title: string;       // e.g., "Chủ đề 1"
  subtitle: string;    // e.g., "10 từ đầu tiên"
  word_count: number;
  checkpoint_sizes: number[];
  glosses: string[];
  words: WordItem[];
}

export interface DashboardPayload {
  topics: Topic[];
}