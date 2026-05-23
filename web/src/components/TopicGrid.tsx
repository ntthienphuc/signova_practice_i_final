import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import type { ProgressByTopic, Topic, TopicProgress, WordItem } from "../types/learn";

const TOPIC_STYLES = [
  {
    accent: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
    softClass: "learn-dashboard-card-violet",
    badge: "🌈",
  },
  {
    accent: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
    softClass: "learn-dashboard-card-blue",
    badge: "🪁",
  },
] as const;

interface TopicWordRowProps {
  word: WordItem;
  unlocked: boolean;
}

function TopicWordRow({ word, unlocked }: TopicWordRowProps) {
  return (
    <div className={unlocked ? "topic-word-row active" : "topic-word-row"}>
      <div className="topic-word-icon">
        <Sparkles size={14} />
      </div>
      <div className="topic-word-copy">
        <strong>{word.gloss}</strong>
        <span>Nhóm {word.checkpoint_group} • Từ số {word.order}</span>
      </div>
      <div className={unlocked ? "topic-word-state ready" : "topic-word-state"}>
        {unlocked ? "Tiếp theo" : "Sắp mở"}
      </div>
    </div>
  );
}

interface TopicGridProps {
  topics: Topic[];
  progressByTopic: ProgressByTopic;
  onOpenTopic: (topic: Topic) => void;
}

interface NormalizedTopic {
  topic: Topic;
  style: (typeof TOPIC_STYLES)[number];
  progress: TopicProgress;
}

export function TopicGrid({ topics, progressByTopic, onOpenTopic }: TopicGridProps) {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(topics[0]?.id ?? null);

  const normalizedTopics = useMemo<NormalizedTopic[]>(
    () =>
      topics.map((topic, index) => ({
        topic,
        style: TOPIC_STYLES[index % TOPIC_STYLES.length],
        progress: progressByTopic[topic.id] ?? { completedWords: 0, completed: false },
      })),
    [topics, progressByTopic]
  );

  return (
    <section className="learn-dashboard-shell">
      <div className="learn-dashboard-hero card-surface">
        <div>
          <p className="eyebrow">Learning Journey</p>
          <h2>Chọn topic rồi học từng từ theo đúng lộ trình</h2>
          <p className="muted">
            Mỗi topic có 10 từ. Mình học từng từ một, luyện ngay bằng Practice I, checkpoint ở từ
            thứ 5, rồi làm Practice II tổng kết khi xong cả topic.
          </p>
        </div>
        <div className="learn-dashboard-hero-pills">
          <span className="lesson-chip active">10 từ / topic</span>
          <span className="lesson-chip active">Practice I sau mỗi từ</span>
          <span className="lesson-chip active">Checkpoint sau 5 từ</span>
        </div>
      </div>

      <div className="learn-dashboard-list">
        {normalizedTopics.map(({ topic, style, progress }, index) => {
          const isExpanded = expandedTopicId === topic.id;
          const completedWords = Number(progress.completedWords ?? 0);
          const ratio = topic.word_count > 0 ? Math.min(1, completedWords / topic.word_count) : 0;
          const nextWord =
            topic.words[Math.min(completedWords, topic.words.length - 1)] ?? topic.words[0];

          return (
            <article
              key={topic.id}
              className={`learn-dashboard-card ${style.softClass} ${isExpanded ? "expanded" : ""}`}
            >
              <button
                type="button"
                className="learn-dashboard-card-head"
                style={{ background: style.accent }}
                onClick={() => setExpandedTopicId((prev) => (prev === topic.id ? null : topic.id))}
              >
                <div className="learn-dashboard-card-copy">
                  <div className="learn-dashboard-card-badges">
                    <span className="topic-sticker">{style.badge}</span>
                    <span className="topic-mini-tag">
                      {progress.completed ? "Đã hoàn thành" : "Đang chờ bắt đầu"}
                    </span>
                  </div>
                  <p className="learn-dashboard-kicker">Topic {index + 1}</p>
                  <h3>{topic.title}</h3>
                  <p>{topic.subtitle}</p>
                </div>
                <div className="learn-dashboard-card-side">
                  <div className="learn-dashboard-card-metric">
                    <span>Từ</span>
                    <strong>{topic.word_count}</strong>
                  </div>
                  <div className="learn-dashboard-card-metric">
                    <span>Tiến độ</span>
                    <strong>
                      {completedWords}/{topic.word_count}
                    </strong>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {isExpanded ? (
                <div className="learn-dashboard-card-body">
                  <div className="learn-dashboard-card-main">
                    <div className="learn-dashboard-highlight">
                      <p className="eyebrow">Từ đang chờ</p>
                      <h4>{nextWord?.gloss ?? topic.glosses[0]}</h4>
                      <p className="muted">
                        Bắt đầu từ đầu topic. Sau mỗi từ, app sẽ mở Practice I ngay, rồi tự chuyển
                        sang từ tiếp theo.
                      </p>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${ratio * 100}%` }} />
                      </div>
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => onOpenTopic(topic)}
                      >
                        {progress.completed ? "Học lại topic này" : "Bắt đầu học topic"}
                        <ArrowRight size={16} />
                      </button>
                    </div>

                    <div className="learn-dashboard-word-stack">
                      {topic.words.map((word, wordIndex) => (
                        <TopicWordRow
                          key={`${topic.id}-${word.gloss}`}
                          word={word}
                          unlocked={wordIndex <= completedWords}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
