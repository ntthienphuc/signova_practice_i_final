import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Star, ArrowRight } from "lucide-react";
import type { Topic } from "../../types/learn";
import { TOPIC_COLORS } from "../../data/learnDashboardData";
import LessonRow from "./LessonRow";

interface UnitAccordionProps {
  topic: Topic;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function UnitAccordion({ topic, isExpanded, onToggle }: UnitAccordionProps) {
  const navigate = useNavigate();
  const color = TOPIC_COLORS[topic.id] ?? "#6B7280";
  const activeWord = topic.words[0];
  const remainingWords = topic.words.slice(1);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 rounded-xl text-left border-0 cursor-pointer"
        style={{ background: color }}
      >
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-white/75">
            {topic.title}
          </p>
          <p className="mt-1 text-[17px] font-bold text-white">{topic.subtitle}</p>
          <p className="mt-1 text-xs text-white/70">0/{topic.word_count} từ</p>
        </div>
        {isExpanded ? (
          <ChevronDown size={20} className="text-white flex-shrink-0" />
        ) : (
          <ChevronRight size={20} className="text-white flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2">
          {/* Active word card */}
          {activeWord ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    NHÓM {activeWord.checkpoint_group} • TỪ SỐ {activeWord.order}
                  </p>
                  <p className="mt-1.5 text-base font-bold text-gray-900">{activeWord.gloss}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Star size={15} className="text-amber-400" fill="currentColor" />
                  <span className="text-xs font-bold text-brand-primary">TIẾP TỤC</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-gray-500 mb-4">
                Luyện tập ký hiệu{" "}
                <span className="font-semibold text-gray-700">{activeWord.gloss}</span> với video
                mẫu tham chiếu. Xem kỹ hình dạng bàn tay và cố gắng bắt chước theo.
              </p>

              <button
                onClick={() =>
                  navigate(`/learn/${topic.id}/${encodeURIComponent(activeWord.gloss)}`, {
                    state: { glosses: topic.glosses },
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white text-sm font-bold border-0 cursor-pointer transition-colors"
              >
                Bắt đầu luyện tập <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center text-sm text-gray-400">
              Chưa có từ nào trong chủ đề này.
            </div>
          )}

          {/* Remaining words */}
          {remainingWords.map((word) => (
            <LessonRow key={word.order} word={word} topicId={topic.id} glosses={topic.glosses} />
          ))}
        </div>
      )}
    </div>
  );
}
