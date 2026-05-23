import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, HelpCircle, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";

interface LessonRowProps {
  title: string;
  subtitle: string;
  type: "practice" | "quiz";
  description: string;
  unitNumber: number;
  lessonIndex: number;
}

export default function LessonRow({
  title,
  subtitle,
  type,
  description,
  unitNumber,
  lessonIndex,
}: LessonRowProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  function handleStart() {
    navigate(`/learn/${unitNumber}/${lessonIndex}`);
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        expanded ? "border-brand-primary/30 bg-blue-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
      } shadow-sm overflow-hidden`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-4 w-full px-4 py-3 text-left bg-transparent border-0 cursor-pointer"
      >
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-colors ${
            expanded ? "bg-brand-primary/10" : "bg-gray-100"
          }`}
        >
          {type === "quiz" ? (
            <HelpCircle size={16} className={expanded ? "text-brand-primary" : "text-gray-400"} />
          ) : (
            <Play size={16} className={expanded ? "text-brand-primary" : "text-gray-400"} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className={`m-0 text-sm font-medium truncate ${expanded ? "text-brand-primary" : "text-gray-800"}`}>
            {title}
          </p>
          <p className="m-0 mt-0.5 text-xs text-gray-400">{subtitle}</p>
        </div>

        {expanded ? (
          <ChevronDown size={16} className="text-brand-primary flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-brand-primary/10">
          <p className="m-0 mb-4 text-sm leading-relaxed text-gray-500">{description}</p>
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold border-0 cursor-pointer transition-colors"
          >
            {type === "quiz" ? "Start quiz" : "Start lesson"} <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
