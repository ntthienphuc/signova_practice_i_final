import { useNavigate } from "react-router-dom";
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
}: LessonListProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full">
      {words.map((word, wordIndex) => {
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

        return (
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
        );
      })}
    </div>
  );
}
