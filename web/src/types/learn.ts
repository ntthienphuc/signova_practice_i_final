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
