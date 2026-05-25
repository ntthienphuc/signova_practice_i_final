import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import type { ProgressByTopic, Topic } from "../../types/learn";
import { useAuth } from "../../contexts/AuthContext";
import { mascots } from "../../utils/mascot";

const TOPIC_ACCENTS = [
  {
    accent: "#1cb0f6",
    border: "#1899d6",
    badgeBg: "#dff3fd",
    badgeText: "#0077aa",
    lightBg: "#eef9ff",
  },
  {
    accent: "#536ef9",
    border: "#3f54cf",
    badgeBg: "#eaecff",
    badgeText: "#3f54cf",
    lightBg: "#f0f1ff",
  },
] as const;

interface TopicGridProps {
  topics: Topic[];
  progressByTopic: ProgressByTopic;
  onOpenAuth: () => void;
}

function PlayIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill={color}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function TopicGrid({ topics, progressByTopic, onOpenAuth }: TopicGridProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const normalizedTopics = useMemo(
    () =>
      topics.map((topic, index) => {
        const progress = progressByTopic[topic.id] ?? { completedWords: 0, completed: false };
        const completedWords = Number(progress.completedWords ?? 0);
        const ratio = topic.word_count > 0 ? Math.min(1, completedWords / topic.word_count) : 0;
        const accent = TOPIC_ACCENTS[index % TOPIC_ACCENTS.length];
        const isLockedForGuest = index > 1;
        return { topic, progress, completedWords, ratio, accent, isLockedForGuest };
      }),
    [topics, progressByTopic, currentUser]
  );

const activeTopicId = useMemo(() => {
    if (!currentUser) return normalizedTopics[0]?.topic.id ?? null;
    const inProgress = normalizedTopics.find(
      (t) => !t.isLockedForGuest && !t.progress.completed && t.completedWords > 0
    );
    if (inProgress) return inProgress.topic.id;
    const firstIncomplete = normalizedTopics.find(
      (t) => !t.isLockedForGuest && !t.progress.completed
    );
    return firstIncomplete?.topic.id ?? null;
  }, [normalizedTopics, currentUser]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto py-4 px-4">
      {normalizedTopics.map(({ topic, progress, completedWords, ratio, accent, isLockedForGuest }, index) => {
        const isActive = topic.id === activeTopicId;
        const continueLabel = progress.completed ? "HỌC LẠI" : completedWords > 0 ? "TIẾP TỤC" : "BẮT ĐẦU";

        const handleOpenOverview = () => {
          if (isLockedForGuest) {
            onOpenAuth();
            return;
          }
          navigate(`/chapter-overview/${topic.id}`);
        };

        return (
          <div key={topic.id} className="w-full flex flex-col items-center">
            {index > 0 && <div className="w-px h-10 bg-slate-200" />}

            {!currentUser && index === 1 && (
              <>
                <div
                  className="w-full rounded-2xl px-6 py-6 flex items-center gap-5"
                  style={{ backgroundColor: "#dff3fd", border: "2px solid #1cb0f6" }}
                >
                  <div className="w-16 h-16 select-none flex-shrink-0">
                    <img 
                      src={mascots[8]} 
                      alt="Unlock Mascot" 
                      className="w-full h-full object-contain animate-bounce-subtle"
                      style={{ 
                        animationDuration: '4s',
                        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08))"
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 font-extrabold text-slate-800 text-sm sm:text-base leading-snug">
                      Tiếp tục hành trình học VSL
                    </h3>
                    <p className="m-0 text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
                      Đăng nhập để mở khóa tất cả chủ đề và từ vựng!
                    </p>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="mt-3 px-5 py-2 rounded-xl font-black text-white text-xs cursor-pointer transition-all active:translate-y-[1px]"
                      style={{
                        backgroundColor: "#1cb0f6",
                        border: "none",
                        borderBottom: "3px solid #1899d6",
                      }}
                    >
                      Đăng nhập ngay 🔑
                    </button>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
              </>
            )}

            <div className="relative w-full">
              {isActive && !isLockedForGuest && (
                <div
                  className="absolute -top-3.5 right-4 px-3 py-1 rounded-full text-[11px] font-black text-white z-10 shadow-sm tracking-wide"
                  style={{ backgroundColor: accent.accent }}
                >
                  {continueLabel}
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenOverview}
                className={`w-full text-left rounded-2xl p-5 flex items-center gap-4 transition-all duration-150 cursor-pointer ${
                  isLockedForGuest ? "opacity-60" : "hover:brightness-[0.97] active:translate-y-[1px]"
                }`}
                style={{
                  backgroundColor: "white",
                  border: `2px solid ${isActive && !isLockedForGuest ? accent.accent : "#e2e8f0"}`,
                  borderBottom: `3px solid ${isActive && !isLockedForGuest ? accent.border : "#d1d5db"}`,
                }}
              >
                <div className="flex-1 min-w-0 grid gap-2">
                  <span
                    className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-md w-fit"
                    style={{
                      backgroundColor: accent.badgeBg,
                      color: accent.badgeText,
                    }}
                  >
                    Chủ đề {index + 1}
                  </span>

                  <h3 className="m-0 text-lg sm:text-xl font-black text-slate-800 leading-tight">
                    {topic.title}
                  </h3>

                  <p className="m-0 text-slate-500 text-xs sm:text-sm font-semibold">
                    {isLockedForGuest
                      ? "Đăng nhập để mở khóa 🔒"
                      : `${completedWords} / ${topic.word_count} từ đã học`}
                  </p>

                  <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${isLockedForGuest ? 0 : ratio * 100}%`,
                        background: `linear-gradient(to right, ${accent.accent}, #58cc02)`,
                      }}
                    />
                  </div>

                </div>

                <div className="flex-shrink-0 ml-2">
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full grid place-items-center shadow-sm flex-shrink-0"
                    style={{
                      backgroundColor: isLockedForGuest
                        ? "#e2e8f0"
                        : isActive
                        ? accent.accent
                        : accent.lightBg,
                      border: `2px solid ${
                        isLockedForGuest ? "#cbd5e1" : isActive ? accent.border : accent.badgeBg
                      }`,
                    }}
                  >
                    {isLockedForGuest ? (
                      <Lock size={18} color="#94a3b8" />
                    ) : (
                      <PlayIcon color={isActive ? "white" : accent.accent} />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
