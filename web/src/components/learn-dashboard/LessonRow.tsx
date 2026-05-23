import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import type { WordItem } from "../../types/learn";

interface LessonRowProps {
  word: WordItem;
  topicId: string;
  glosses: string[];
}

export default function LessonRow({ word, topicId, glosses }: LessonRowProps) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const subtitle = `NHÓM ${word.checkpoint_group} • TỪ SỐ ${word.order}`;

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
          <Play size={16} className={expanded ? "text-brand-primary" : "text-gray-400"} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`m-0 text-sm font-medium truncate ${expanded ? "text-brand-primary" : "text-gray-800"}`}>
            {word.gloss}
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
          <p className="m-0 mb-4 text-sm leading-relaxed text-gray-500">
            Luyện tập ký hiệu <span className="font-semibold text-gray-700">{word.gloss}</span> với
            video mẫu tham chiếu. Xem kỹ hình dạng bàn tay và cố gắng bắt chước theo.
          </p>
          <button
            onClick={() =>
              navigate(`/learn/${topicId}/${encodeURIComponent(word.gloss)}`, {
                state: { glosses },
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-bold border-0 cursor-pointer transition-colors"
          >
            Bắt đầu luyện tập <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
