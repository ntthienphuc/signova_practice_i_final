import type { Topic } from "../../types/learn";
import { TopicGrid } from "../TopicGrid";

interface TopicProgress {
  completedWords?: number;
  completed?: boolean;
}

interface LearnHomeProps {
  topics: Topic[];
  progressByTopic: Record<string, TopicProgress | undefined>;
  onOpenTopic: (topic: Topic) => void;
}

export function LearnHome({ topics, progressByTopic, onOpenTopic }: LearnHomeProps) {
  return (
    <section className="grid gap-6">
      <TopicGrid topics={topics} progressByTopic={progressByTopic} onOpenTopic={onOpenTopic} />
    </section>
  );
}
