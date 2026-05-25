import { Lock } from "lucide-react";

interface LessonCardProps {
  index: number;
  gloss: string;
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
  onClick: () => void;
}

function PlayIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={color}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function LessonCard({
  index,
  gloss,
  isCompleted,
  isActive,
  isLocked,
  accentColor,
  accentBorder,
  accentBg,
  onClick,
}: LessonCardProps) {
  const subtitle = isCompleted
    ? "Đã hoàn thành ✅"
    : isActive
    ? "Sẵn sàng học ngay! 🚀"
    : isLocked
    ? "Đăng nhập để mở khóa"
    : "Chưa học";

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-150 ${
        isLocked
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:brightness-[0.97] active:translate-y-[1px]"
      }`}
      style={{
        backgroundColor: "white",
        border: `2px solid ${isActive ? accentColor : "#e2e8f0"}`,
        borderBottom: `3px solid ${isActive ? accentBorder : "#d1d5db"}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="m-0 font-black text-slate-800 text-sm sm:text-base leading-tight">
          {index + 1}.  {gloss || subtitle}
          {isCompleted && <span className="ml-1.5 text-[#58cc02]">✓</span>}
        </p>
      </div>

      <div
        className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
        style={{
          backgroundColor: isLocked
            ? "#e2e8f0"
            : isActive
            ? accentColor
            : accentBg,
          border: `2px solid ${isLocked ? "#cbd5e1" : isActive ? accentBorder : accentColor + "40"}`,
        }}
      >
        {isLocked ? (
          <Lock size={15} color="#94a3b8" />
        ) : (
          <PlayIcon color={isActive ? "white" : accentColor} />
        )}
      </div>
    </button>
  );
}
