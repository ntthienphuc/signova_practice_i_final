export interface StoryScene {
  id: string;
  sceneNumber: number;
  contextTitle: string;
  contextDescription: string;
  characterEmoji: string;
  sceneEmoji: string;
  targetGloss: string;
  lessonGlosses: string[];
  successMessage: string;
  failMessage: string;
  wrongWordMessage: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: "emotions" | "daily_life" | "family" | "school";
  difficulty: "easy" | "medium" | "hard";
  scenes: StoryScene[];
}
