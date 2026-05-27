import type {
  AnalyzeResponse,
  Decision,
  FeedbackBlock,
  SegmentTiming,
} from "../api";

export type AppTab = "learn" | "review" | "progress" | "mascot" | "family" | "school" | "account" | "custom_package" | "story";
export type SessionStage = "learn" | "practice_i" | "quiz_intro" | "practice_ii" | "summary";

export interface VideoReference {
  video_url: string;
  playback_url: string;
  segment: SegmentTiming | null;
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
  checkpoint_group: number;
  study: StudyMetadata;
}

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  word_count: number;
  checkpoint_sizes: number[];
  glosses: string[];
  words: WordItem[];
}

export interface DashboardPayload {
  topics: Topic[];
}

export interface TopicProgress {
  completedWords: number;
  completed: boolean;
}

export type ProgressByTopic = Record<string, TopicProgress | undefined>;

export interface AnalysisSummary {
  target_gloss: string;
  practice_mode: AnalyzeResponse["practice_mode"];
  score: number;
  decision: Decision;
  feedback: FeedbackBlock;
  classifier: AnalyzeResponse["classifier"] | null;
}

export interface PracticeSession {
  topic: Topic;
  wordIndex: number;
  stage: SessionStage;
  quizScope: 5 | 10 | null;
  quizStartIndex: number;
  quizReturnWordIndex: number | null;
  quizStandalone: boolean;
  quizQueue: string[];
  quizRoundIndex: number;
  currentQuizResults: AnalysisSummary[];
  quiz5Results: AnalysisSummary[];
  finalQuizResults: AnalysisSummary[];
  practiceResults: Record<string, AnalysisSummary>;
}

export interface CurriculumTopicSummary {
  id: string;
  title: string;
  word_count: number;
}
