import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { WordItem } from "../../types/learn";
import { LessonCard } from "./LessonCard";

const LESSON_ICONS = ["📖", "🤲", "✋", "👋", "🌱", "💡", "🎯", "⭐", "🔤", "🧩"];

interface LessonListProps {
  words: WordItem[];
  completedCount: number;
  topicId: string;
  isGuest: boolean;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
  onAuthRequired: () => void;
  onReviewPractice: (startIndex: number, scope: 5 | 10) => void;
}

export function LessonList({
  words,
  completedCount,
  topicId,
  isGuest,
  accentColor,
  accentBorder,
  accentBg,
  onAuthRequired,
  onReviewPractice,
}: LessonListProps) {
  const navigate = useNavigate();

  const renderConnectorIcon = (
    key: string,
    icon: string,
    isActive: boolean,
    isLocked: boolean,
    children: ReactNode
  ) => (
    <div key={key} className="flex items-start gap-3">
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 48 }}>
        <div
          className="w-12 h-12 rounded-full grid place-items-center text-xl flex-shrink-0 transition-all"
          style={{
            backgroundColor: isActive ? accentBg : "#fff7ed",
            border: `2px solid ${isActive ? accentColor : "#fed7aa"}`,
            opacity: isLocked ? 0.5 : 1,
          }}
        >
          {icon}
        </div>
        <div
          className="w-px flex-1 my-1"
          style={{
            minHeight: 20,
            borderLeft: "2px dashed #e2e8f0",
          }}
        />
      </div>
      <div className="flex-1 min-w-0 pb-3">{children}</div>
    </div>
  );

  const renderReviewCard = (startIndex: number, scope: 5 | 10, label: string, description: string) => {
    const endIndex = startIndex + scope;
    const isLocked = isGuest && endIndex > 3;
    const isCompleted = completedCount >= endIndex;
    const isActive = completedCount >= Math.min(startIndex, words.length);
    const handleClick = () => {
      if (isLocked) {
        onAuthRequired();
        return;
      }
      onReviewPractice(startIndex, scope);
    };

    return renderConnectorIcon(
      `review-${startIndex}-${scope}`,
      scope === 10 ? "🏁" : "🧠",
      isActive,
      isLocked,
      <button
        type="button"
        onClick={isLocked ? undefined : handleClick}
        className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-150 ${
          isLocked
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:brightness-[0.97] active:translate-y-[1px]"
        }`}
        style={{
          backgroundColor: "#fff",
          border: `2px solid ${isActive ? accentColor : "#fed7aa"}`,
          borderBottom: `3px solid ${isActive ? accentBorder : "#fdba74"}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] mb-1.5"
            style={{ backgroundColor: accentBg, color: accentColor }}
          >
            Bài ôn tập
          </span>
          <p className="m-0 font-black text-slate-800 text-sm sm:text-base leading-tight">
            {label}
            {isCompleted && <span className="ml-1.5 text-[#58cc02]">✓</span>}
          </p>
          <p className="m-0 mt-0.5 text-xs font-bold text-slate-500 leading-relaxed">
            {isLocked ? "Đăng nhập để mở khóa" : description}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-white text-sm font-black"
          style={{
            backgroundColor: isLocked ? "#cbd5e1" : accentColor,
            borderBottom: `3px solid ${isLocked ? "#94a3b8" : accentBorder}`,
          }}
        >
          ▶
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full">
      {words.flatMap((word, wordIndex) => {
        const isCompleted = wordIndex < completedCount;
        const isActive = wordIndex === completedCount;
        const isLocked = isGuest && wordIndex >= 3;
        const icon = LESSON_ICONS[wordIndex % LESSON_ICONS.length];

        const handleClick = () => {
          if (isLocked) {
            onAuthRequired();
            return;
          }
          navigate(`/learn/${topicId}/${wordIndex}`);
        };

        const entries: ReactNode[] = [(
          <div key={`${topicId}-${wordIndex}`} className="flex items-start gap-3">
            {/* Left: icon column with connector */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 48 }}>
              <div
                className="w-12 h-12 rounded-full grid place-items-center text-xl flex-shrink-0 transition-all"
                style={{
                  backgroundColor: isActive
                    ? accentBg
                    : isCompleted
                    ? "#f0fdf4"
                    : "#f8fafc",
                  border: `2px solid ${
                    isActive ? accentColor : isCompleted ? "#86efac" : "#e2e8f0"
                  }`,
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                {isCompleted ? "✅" : icon}
              </div>

              {wordIndex < words.length - 1 && (
                <div
                  className="w-px flex-1 my-1"
                  style={{
                    minHeight: 20,
                    borderLeft: "2px dashed #e2e8f0",
                  }}
                />
              )}
            </div>

            {/* Right: lesson card */}
            <div className="flex-1 min-w-0 pb-3">
              <LessonCard
                index={wordIndex}
                gloss={word.gloss}
                isCompleted={isCompleted}
                isActive={isActive}
                isLocked={isLocked}
                accentColor={accentColor}
                accentBorder={accentBorder}
                accentBg={accentBg}
                onClick={handleClick}
              />
            </div>
          </div>
        )];

        if (wordIndex === 4) {
          entries.push(renderReviewCard(0, 5, "Ôn tập 5 từ đầu", "Practice II với từ 1 đến từ 5, không xem mẫu trước."));
        }
        if (wordIndex === 9) {
          entries.push(renderReviewCard(5, 5, "Ôn tập 5 từ sau", "Practice II với từ 6 đến từ 10, kiểm tra có nhớ đúng không."));
          entries.push(renderReviewCard(0, 10, "Ôn tổng kết chủ đề", "Practice II tổng hợp toàn bộ 10 từ trong chủ đề."));
        }

        return entries;
      })}
    </div>
  );
}
