import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import type { ProgressByTopic, Topic, TopicProgress, WordItem } from "../../types/learn";

const TOPIC_STYLES = [
  {
    accent: "#1cb0f6",
    borderAccent: "#1899d6",
    bgClass: "bg-white border-2 border-b-2 border-slate-200",
    badge: "🪁",
  },
  {
    accent: "#536ef9",
    borderAccent: "#3f54cf",
    bgClass: "bg-white border-2 border-b-2 border-slate-200",
    badge: "🌟",
  },
] as const;

interface TopicWordRowProps {
  word: WordItem;
  unlocked: boolean;
  learned: boolean;
  onClick?: () => void;
  onClickLockGuest?: () => void;
}

function TopicWordRow({ word, unlocked, learned, onClick, onClickLockGuest }: TopicWordRowProps) {
  let leftIcon = "🔒";
  let subtitle = "Hoàn thành từ trước để mở khóa.";
  let badgeText = "Đang khóa";
  let badgeStyle = "bg-slate-100 border-2 border-b-2 border-slate-200 text-slate-400 cursor-not-allowed";

  if (onClickLockGuest) {
    leftIcon = "🔒";
    subtitle = "Đăng nhập để học tiếp từ này! 🔑";
    badgeText = "Mở khóa 🔑";
    badgeStyle = "bg-white border-2 border-b-2 border-slate-200 text-[#1cb0f6] hover:bg-sky-50 active:border-b-0 active:translate-y-0.5 cursor-pointer";
  } else if (learned) {
    leftIcon = "✅";
    subtitle = "Đã học từ này! 🎉";
    badgeText = "Ôn lại 🔄";
    badgeStyle = "bg-white border-2 border-b-2 border-slate-200 text-[#1cb0f6] hover:bg-slate-50 active:border-b-0 active:translate-y-0.5 cursor-pointer";
  } else if (unlocked) {
    leftIcon = "📖";
    subtitle = "Sẵn sàng học ngay! 🚀";
    badgeText = "Học ngay 🎯";
    badgeStyle = "bg-[#1cb0f6] border-b-2 border-[#1899d6] hover:bg-[#24c4ff] text-white active:border-b-0 active:translate-y-1 cursor-pointer";
  }

  const isClickable = unlocked || !!onClickLockGuest;

  return (
    <div
      className={`grid grid-cols-[40px_minmax(0,1fr)_auto] sm:grid-cols-[48px_minmax(0,1fr)_auto] gap-3 sm:gap-4 items-center py-3 sm:py-4 px-4 sm:px-6 rounded-[20px] sm:rounded-[24px] border-2 transition-all duration-150 ${
        isClickable
          ? "border-slate-200 border-b-2 bg-white hover:bg-slate-50/50 cursor-pointer active:border-b-0 active:translate-y-[1px]"
          : "border-slate-150 bg-slate-50/50 opacity-70"
      }`}
      onClick={isClickable ? (unlocked ? onClick : onClickLockGuest) : undefined}
    >
      <div className={`w-10 h-10 sm:w-12 sm:h-12 grid place-items-center rounded-xl sm:rounded-2xl text-xl sm:text-2xl border-2 ${
        learned ? "bg-emerald-50 border-emerald-200 text-emerald-600" : unlocked ? "bg-sky-50 border-sky-200 text-sky-500" : "bg-slate-100 border-slate-200 text-slate-400"
      }`}>
        {leftIcon}
      </div>

      <div className="min-w-0 flex flex-col gap-0.5">
        <strong className="text-slate-800 font-extrabold" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.25rem)' }}>{word.gloss}</strong>
        <span className="text-slate-500 text-xs sm:text-sm font-bold hidden sm:block">{subtitle}</span>
      </div>

      <button
        type="button"
        disabled={!isClickable}
        className={`py-2 px-3 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${badgeStyle}`}
      >
        <span className="sm:hidden">{learned ? "🔄" : unlocked ? "🎯" : "🔒"}</span>
        <span className="hidden sm:inline">{badgeText}</span>
      </button>
    </div>
  );
}

interface TopicGridProps {
  topics: Topic[];
  progressByTopic: ProgressByTopic;
  currentUser?: any;
  onOpenAuth: () => void;
}

interface NormalizedTopic {
  topic: Topic;
  style: (typeof TOPIC_STYLES)[number];
  progress: TopicProgress;
}

export function TopicGrid({ topics, progressByTopic, currentUser, onOpenAuth }: TopicGridProps) {
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
      <div className="border-2 border-b-4 border-slate-200 grid gap-2 sm:gap-3 p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] bg-white">
        <div>
          <p className="m-0 text-xs sm:text-sm uppercase tracking-[0.18em] text-[#1cb0f6] font-black">🗺️ Hành trình học tập</p>
          <h2 className="m-0 mt-1 font-black text-slate-800 text-xl sm:text-2xl">Chọn chủ đề để bắt đầu! 🚀</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-[#f0fff4] border-2 border-[#58cc02]/30 text-[#46a302] text-xs font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">✅ Học từng bước</span>
          <span className="bg-[#f0f8ff] border-2 border-[#1cb0f6]/30 text-[#1cb0f6] text-xs font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">🎥 Video hướng dẫn</span>
          <span className="bg-[#fff8ee] border-2 border-[#ff9600]/30 text-[#cc7a00] text-xs font-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">⭐ Tích XP mỗi ngày</span>
        </div>
      </div>

      <div className="grid gap-[20px]">
        {normalizedTopics.map(({ topic, style, progress }, index) => {
          const isExpanded = expandedTopicId === topic.id;
          const completedWords = Number(progress.completedWords ?? 0);
          const ratio = topic.word_count > 0 ? Math.min(1, completedWords / topic.word_count) : 0;
          const nextWord =
            topic.words[Math.min(completedWords, topic.words.length - 1)] ?? topic.words[0];

          const isTopicLockedForGuest = !currentUser && index > 0;

          return (
            <article
              key={topic.id}
              className={`overflow-hidden rounded-[28px] border-2 border-b-2 border-slate-200 bg-white ${
                isTopicLockedForGuest ? "opacity-60" : ""
              }`}
            >
              <button
                type="button"
                className="w-full border-0 py-4 sm:py-5 px-4 sm:px-6 flex justify-between gap-3 sm:gap-5 text-left text-white cursor-pointer active:translate-y-[1px] transition-all"
                style={{ 
                  background: isTopicLockedForGuest ? "#94a3b8" : style.accent,
                  borderBottom: `2px solid ${isTopicLockedForGuest ? "#64748b" : style.borderAccent}`
                }}
                onClick={() => {
                  if (isTopicLockedForGuest) {
                    onOpenAuth();
                    return;
                  }
                  setExpandedTopicId((prev) => (prev === topic.id ? null : topic.id));
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="mt-1 text-[0.75rem] tracking-[0.18em] uppercase font-black text-white/85">Topic {index + 1}</p>
                  <h3 className="mt-1 mb-1 text-xl sm:text-2xl font-black leading-tight flex items-center gap-1.5">
                    {topic.title}
                    {isTopicLockedForGuest && <span>🔒</span>}
                  </h3>
                  <p className="m-0 text-white/90 text-xs sm:text-sm font-bold hidden sm:block">
                    {isTopicLockedForGuest ? "Đăng nhập để học chủ đề này." : topic.subtitle}
                  </p>
                  <span className="inline-flex items-center rounded-full py-1 px-2.5 font-black text-[10px] mt-2 bg-white/20 text-white uppercase tracking-wider">
                    {isTopicLockedForGuest
                      ? "Đang khóa 🔒"
                      : progress.completed
                      ? "Hoàn thành! 👑"
                      : completedWords > 0
                      ? `${completedWords}/10 từ 📚`
                      : "Bắt đầu! 🚀"}
                  </span>
                </div>
                <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
                  <div className="grid justify-items-end gap-0.5">
                    <span className="text-[0.65rem] font-black tracking-[0.15em] uppercase text-white/80">Tiến độ</span>
                    <strong className="text-lg sm:text-xl font-black">
                      {isTopicLockedForGuest ? "0" : completedWords}/{topic.word_count}
                    </strong>
                  </div>
                  {isTopicLockedForGuest ? <ChevronRight size={18} /> : isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {isExpanded && !isTopicLockedForGuest ? (
                <div className="px-5 pt-5 pb-5">
                  <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
                    <div className="grid gap-3 content-start p-5 rounded-[24px] border-2 border-b-2 border-slate-200 bg-slate-50">
                      <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#1cb0f6] font-black">Từ tiếp theo</p>
                      <h4 className="m-0 text-2xl font-black text-slate-800">
                        {!currentUser && completedWords >= 3 ? "Từ đã khóa 🔒" : (nextWord?.gloss ?? topic.glosses[0])}
                      </h4>
                      <p className="text-slate-500 font-bold leading-relaxed m-0 text-xs">
                        {!currentUser && completedWords >= 3 
                          ? "Hãy đăng nhập để tiếp tục chinh phục lộ trình học nhé!"
                          : "Cùng chinh phục từ vựng tiếp theo nào!"}
                      </p>
                      <div className="h-3.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200 p-0.5 shadow-inner">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#1cb0f6] to-[#58cc02] transition-all duration-500" 
                          style={{ width: `${(!currentUser && completedWords >= 3 ? 0.3 : ratio) * 100}%` }} 
                        />
                      </div>
                      <button
                        className={`w-full min-h-[44px] px-4 font-black text-xs rounded-2xl cursor-pointer transition-all ${
                          !currentUser && completedWords >= 3
                            ? "bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px]"
                            : progress.completed
                            ? "bg-white border-2 border-b-2 border-slate-200 text-slate-600 hover:bg-slate-50 active:border-b-0 active:translate-y-[2px]"
                            : "bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px]"
                        }`}
                        type="button"
                        onClick={() => {
                          if (!currentUser && completedWords >= 3) {
                            onOpenAuth();
                            return;
                          }
                          const targetIndex = progress.completed ? 0 : Math.min(completedWords, topic.words.length - 1);
                          navigate(`/learn/${topic.id}/${targetIndex}`);
                        }}
                      >
                        {!currentUser && completedWords >= 3 
                          ? "Mở khóa tất cả 🔑"
                          : progress.completed 
                          ? "Học lại chủ đề 🔄" 
                          : "Học tiếp chủ đề 🚀"}
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {topic.words.map((word, wordIndex) => {
                        const isWordLockedForGuest = !currentUser && wordIndex >= 3;
                        const rowUnlocked = !isWordLockedForGuest && (wordIndex <= completedWords);
                        const rowLearned = !isWordLockedForGuest && (wordIndex < completedWords);

                        return (
                          <div key={`${topic.id}-${word.gloss}`} className="contents">
                            <TopicWordRow
                              word={word}
                              unlocked={rowUnlocked}
                              learned={rowLearned}
                              onClick={() => navigate(`/learn/${topic.id}/${wordIndex}`)}
                              onClickLockGuest={isWordLockedForGuest ? onOpenAuth : undefined}
                            />
                            {!currentUser && wordIndex === 2 && (
                              <div className="bg-[#f0f8ff] border-2 border-[#1cb0f6]/30 rounded-[24px] p-5 text-center shadow-sm space-y-3.5 my-1.5">
                                <div className="text-3xl">🔑</div>
                                <div className="space-y-1">
                                  <h4 className="m-0 text-slate-800 font-extrabold text-sm sm:text-base">Mở khóa toàn bộ lộ trình học</h4>
                                  <p className="text-slate-500 font-bold text-xs max-w-md mx-auto leading-relaxed">
                                    Đăng ký hoặc Đăng nhập tài khoản để tiếp tục học 17+ từ vựng tiếp theo và các chủ đề khác nhé!
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={onOpenAuth}
                                  className="w-full sm:w-auto px-6 py-2.5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] text-white font-black rounded-xl cursor-pointer text-xs transition-all active:border-b-0 active:translate-y-[2px]"
                                >
                                  Đăng nhập ngay 🚀
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
