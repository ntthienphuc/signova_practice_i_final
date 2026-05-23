import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import type { Topic, WordItem } from "../types/learn";

const TOPIC_STYLES = [
  {
    accent: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
    tintClass: "bg-[radial-gradient(circle_at_top_right,rgba(170,164,255,0.15),transparent_32%),rgba(255,255,255,0.92)]",
    badge: "🌈",
  },
  {
    accent: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
    tintClass: "bg-[radial-gradient(circle_at_top_right,rgba(105,210,255,0.14),transparent_32%),rgba(255,255,255,0.92)]",
    badge: "🪁",
  },
] as const;

interface TopicProgress {
  completedWords?: number;
  completed?: boolean;
}

interface TopicWordRowProps {
  word: WordItem;
  unlocked: boolean;
}

function TopicWordRow({ word, unlocked }: TopicWordRowProps) {
  return (
    <div
      className={`grid grid-cols-[42px_minmax(0,1fr)_auto] gap-[14px] items-center p-[14px_16px] rounded-[20px] border ${
        unlocked
          ? "border-[rgba(83,110,249,0.2)] bg-[rgba(243,247,255,0.96)]"
          : "border-[rgba(92,118,184,0.12)] bg-[rgba(248,250,255,0.88)]"
      }`}
    >
      <div className="w-[42px] h-[42px] grid place-items-center rounded-[16px] bg-[rgba(83,110,249,0.12)] text-[#536ef9]">
        <Sparkles size={14} />
      </div>
      <div className="min-w-0 grid gap-0.5">
        <strong className="text-[1.05rem]">{word.gloss}</strong>
        <span className="text-[#66758a] text-[0.92rem]">
          Nhóm {word.checkpoint_group} • Từ số {word.order}
        </span>
      </div>
      <div
        className={`px-3 py-2 rounded-full text-[0.85rem] font-extrabold ${
          unlocked
            ? "bg-[rgba(83,110,249,0.12)] text-[#536ef9]"
            : "bg-[rgba(30,39,66,0.06)] text-[#66758a]"
        }`}
      >
        {unlocked ? "Tiếp theo" : "Sắp mở"}
      </div>
    </div>
  );
}

interface TopicGridProps {
  topics: Topic[];
  progressByTopic: Record<string, TopicProgress | undefined>;
  onOpenTopic: (topic: Topic) => void;
}

export function TopicGrid({ topics, progressByTopic, onOpenTopic }: TopicGridProps) {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(topics[0]?.id ?? null);

  const normalizedTopics = useMemo(
    () =>
      topics.map((topic, index) => ({
        topic,
        style: TOPIC_STYLES[index % TOPIC_STYLES.length],
        progress: progressByTopic[topic.id] ?? { completedWords: 0, completed: false },
      })),
    [topics, progressByTopic]
  );

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 p-8 rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(117,170,255,0.26),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,252,255,0.94))]">
        <div>
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Learning Journey</p>
          <h2
            className="mt-[6px] mb-2 text-[clamp(2.2rem,4vw,3.6rem)] leading-[1.04] tracking-[-0.04em]"
            style={{ fontFamily: '"Baloo 2", Nunito, sans-serif' }}
          >
            Chọn topic rồi học từng từ theo đúng lộ trình
          </h2>
          <p className="text-[#66758a] leading-[1.62]">
            Mỗi topic có 10 từ. Mình học từng từ một, luyện ngay bằng Practice I, checkpoint ở từ
            thứ 5, rồi làm Practice II tổng kết khi xong cả topic.
          </p>
        </div>
      </div>

      <div className="grid gap-[18px]">
        {normalizedTopics.map(({ topic, style, progress }, index) => {
          const isExpanded = expandedTopicId === topic.id;
          const completedWords = Number(progress.completedWords ?? 0);
          const ratio = topic.word_count > 0 ? Math.min(1, completedWords / topic.word_count) : 0;
          const nextWord: WordItem | undefined =
            topic.words[Math.min(completedWords, topic.words.length - 1)] ?? topic.words[0];

          return (
            <article
              key={topic.id}
              className={`overflow-hidden rounded-[28px] border border-[rgba(92,118,184,0.12)] shadow-[0_18px_40px_rgba(46,73,133,0.08)] ${style.tintClass}`}
            >
              <button
                type="button"
                className="w-full border-0 px-[26px] py-6 flex justify-between gap-5 text-left text-white max-[860px]:grid max-[860px]:grid-cols-1"
                style={{ background: style.accent }}
                onClick={() =>
                  setExpandedTopicId((prev) => (prev === topic.id ? null : topic.id))
                }
              >
                <div>
                  <div className="flex items-center gap-[10px] flex-wrap">
                    <span className="text-[1.55rem]">{style.badge}</span>
                  </div>
                  <p className="mt-[14px] text-[0.76rem] tracking-[0.18em] uppercase font-extrabold text-white/[0.72]">
                    Topic {index + 1}
                  </p>
                  <h3
                    className="mt-[6px] mb-2 text-[2rem] leading-[1]"
                    style={{ fontFamily: '"Baloo 2", Nunito, sans-serif' }}
                  >
                    {topic.title}
                  </h3>
                  <p className="m-0 text-white/[0.84]">{topic.subtitle}</p>
                  <span className="mt-[10px] bg-[#fff0c4] text-[#9a6213] inline-flex items-center rounded-full px-3 py-2 font-bold text-[0.92rem]">
                    {progress.completed ? "Đã hoàn thành" : "Đang chờ bắt đầu"}
                  </span>
                </div>
                <div className="min-w-[150px] flex flex-col items-end justify-between gap-[18px] max-[860px]:items-start">
                  <div className="grid justify-items-end gap-1 max-[860px]:justify-items-start">
                    <span className="text-[0.72rem] font-extrabold tracking-[0.15em] uppercase text-white/[0.72]">
                      Tiến độ
                    </span>
                    <strong className="text-[1.28rem]">
                      {completedWords}/{topic.word_count}
                    </strong>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {isExpanded ? (
                <div className="p-[22px_24px_24px]">
                  <div className="grid grid-cols-[minmax(260px,320px)_minmax(0,1fr)] gap-[18px] max-[1180px]:grid-cols-1">
                    <div className="grid gap-[14px] content-start p-[22px] rounded-[24px] border border-[rgba(92,118,184,0.14)] bg-[linear-gradient(180deg,rgba(247,250,255,0.94),rgba(255,255,255,0.96))]">
                      <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Từ đang chờ</p>
                      <h4
                        className="m-0 text-[1.7rem]"
                        style={{ fontFamily: '"Baloo 2", Nunito, sans-serif' }}
                      >
                        {nextWord?.gloss ?? topic.glosses[0]}
                      </h4>
                      <p className="text-[#66758a] leading-[1.62]">
                        Bắt đầu từ đầu topic. Sau mỗi từ, app sẽ mở Practice I ngay, rồi tự chuyển
                        sang từ tiếp theo.
                      </p>
                      <div className="h-3 rounded-full overflow-hidden bg-[rgba(95,164,255,0.14)] border border-[rgba(95,164,255,0.12)]">
                        <div
                          className="h-full rounded-[inherit] bg-[linear-gradient(90deg,#ffbf56,#64c8ff_55%,#4ed28d)]"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <button
                        className="border-0 rounded-full min-h-[48px] px-5 font-extrabold transition-all duration-[160ms] bg-[linear-gradient(135deg,#536ef9,#68c6ff)] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px"
                        type="button"
                        onClick={() => onOpenTopic(topic)}
                      >
                        {progress.completed ? "Học lại topic này" : "Bắt đầu học topic"}
                      </button>
                    </div>

                    <div className="grid gap-3">
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
