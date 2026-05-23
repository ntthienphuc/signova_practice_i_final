import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import type { ProgressByTopic, Topic, TopicProgress, WordItem } from "../../types/learn";

const TOPIC_STYLES = [
  {
    accent: "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
    bgClass: "bg-[radial-gradient(circle_at_top_right,rgba(170,164,255,0.15),transparent_32%),rgba(255,255,255,0.92)]",
    badge: "🌈",
  },
  {
    accent: "linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)",
    bgClass: "bg-[radial-gradient(circle_at_top_right,rgba(105,210,255,0.14),transparent_32%),rgba(255,255,255,0.92)]",
    badge: "🪁",
  },
] as const;

interface TopicWordRowProps {
  word: WordItem;
  unlocked: boolean;
}

function TopicWordRow({ word, unlocked }: TopicWordRowProps) {
  return (
    <div className={`grid grid-cols-[42px_minmax(0,1fr)_auto] gap-[14px] items-center py-[14px] px-4 rounded-[20px] border ${unlocked ? "border-[rgba(83,110,249,0.2)] bg-[rgba(243,247,255,0.96)]" : "border-[rgba(92,118,184,0.12)] bg-[rgba(248,250,255,0.88)]"}`}>
      <div className="w-[42px] h-[42px] grid place-items-center rounded-[16px] bg-[rgba(83,110,249,0.12)] text-[var(--brand)]">
        <Sparkles size={14} />
      </div>
      <div className="min-w-0 grid gap-0.5">
        <strong className="text-[1.05rem]">{word.gloss}</strong>
        <span className="text-[var(--ink-soft)] text-[0.92rem]">Nhóm {word.checkpoint_group} • Từ số {word.order}</span>
      </div>
      <div className={`py-2 px-3 rounded-full text-[0.85rem] font-extrabold ${unlocked ? "bg-[rgba(83,110,249,0.12)] text-[var(--brand)]" : "bg-[rgba(30,39,66,0.06)] text-[var(--ink-soft)]"}`}>
        {unlocked ? "Tiếp theo" : "Sắp mở"}
      </div>
    </div>
  );
}

interface TopicGridProps {
  topics: Topic[];
  progressByTopic: ProgressByTopic;
}

interface NormalizedTopic {
  topic: Topic;
  style: (typeof TOPIC_STYLES)[number];
  progress: TopicProgress;
}

export function TopicGrid({ topics, progressByTopic }: TopicGridProps) {
  const navigate = useNavigate();
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
    <section className="grid gap-5">
      <div className="border border-white/[0.82] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] grid gap-4 p-8 rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(117,170,255,0.26),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,252,255,0.94))]">
        <div>
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Learning Journey</p>
          <h2>Chọn topic rồi học từng từ theo đúng lộ trình</h2>
          <p className="text-[var(--ink-soft)] leading-[1.62]">
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
          const nextWord =
            topic.words[Math.min(completedWords, topic.words.length - 1)] ?? topic.words[0];

          return (
            <article
              key={topic.id}
              className={`overflow-hidden rounded-[28px] border border-[rgba(92,118,184,0.12)] shadow-[0_18px_40px_rgba(46,73,133,0.08)] ${style.bgClass}`}
            >
              <button
                type="button"
                className="w-full border-0 py-6 px-[26px] flex justify-between gap-5 text-left text-white cursor-pointer"
                style={{ background: style.accent }}
                onClick={() => setExpandedTopicId((prev) => (prev === topic.id ? null : topic.id))}
              >
                <div>
                  <p className="mt-[14px] text-[0.76rem] tracking-[0.18em] uppercase font-extrabold text-white/[0.72]">Topic {index + 1}</p>
                  <h3 className="mt-1.5 mb-2 text-[2rem] leading-[1] font-display">{topic.title}</h3>
                  <p className="m-0 text-white/[0.84]">{topic.subtitle}</p>
                  <span className="inline-flex items-center rounded-full py-2 px-3 font-bold text-[0.92rem] mt-[10px] bg-[#fff0c4] text-[#9a6213]">
                    {progress.completed ? "Đã hoàn thành" : "Đang chờ bắt đầu"}
                  </span>
                </div>
                <div className="min-w-[150px] flex flex-col items-end justify-between gap-[18px]">
                  <div className="grid justify-items-end gap-1">
                    <span className="text-[0.72rem] font-extrabold tracking-[0.15em] uppercase text-white/[0.72]">Tiến độ</span>
                    <strong className="text-[1.28rem]">
                      {completedWords}/{topic.word_count}
                    </strong>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {isExpanded ? (
                <div className="px-6 pt-[22px] pb-6">
                  <div className="grid grid-cols-[minmax(260px,320px)_minmax(0,1fr)] gap-[18px]">
                    <div className="grid gap-[14px] content-start p-[22px] rounded-[24px] border border-[rgba(92,118,184,0.14)] bg-[linear-gradient(180deg,rgba(247,250,255,0.94),rgba(255,255,255,0.96))]">
                      <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Từ đang chờ</p>
                      <h4 className="m-0 text-[1.7rem] font-display">{nextWord?.gloss ?? topic.glosses[0]}</h4>
                      <p className="text-[var(--ink-soft)] leading-[1.62]">
                        Bắt đầu từ đầu topic. Sau mỗi từ, app sẽ mở Practice I ngay, rồi tự chuyển
                        sang từ tiếp theo.
                      </p>
                      <div className="h-3 rounded-full overflow-hidden bg-[rgba(95,164,255,0.14)] border border-[rgba(95,164,255,0.12)]">
                        <div className="h-full rounded-[inherit] bg-gradient-to-r from-[#ffbf56] via-[#64c8ff] to-[#4ed28d]" style={{ width: `${ratio * 100}%` }} />
                      </div>
                      <button
                        className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer"
                        type="button"
                        onClick={() => {
                          const targetIndex = progress.completed ? 0 : Math.min(completedWords, topic.words.length - 1);
                          navigate(`/learn/${topic.id}/${targetIndex}`);
                        }}
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
