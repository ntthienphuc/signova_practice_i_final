import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Star, ArrowRight } from "lucide-react";
import type { Unit } from "../../data/learnDashboardData";
import LessonRow from "./LessonRow";

interface UnitAccordionProps {
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function UnitAccordion({ unit, isExpanded, onToggle }: UnitAccordionProps) {
  const { unitNumber, title, color, lessonCount, lessons } = unit;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 rounded-xl text-left border-0 cursor-pointer"
        style={{ background: color }}
      >
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-white/75">
            Unit {unitNumber}
          </p>
          <p className="mt-1 text-[17px] font-bold text-white">{title}</p>
          <p className="mt-1 text-xs text-white/70">0/{lessonCount} lessons</p>
        </div>
        {isExpanded ? (
          <ChevronDown size={20} className="text-white flex-shrink-0" />
        ) : (
          <ChevronRight size={20} className="text-white flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-2">
          {/* Active lesson card (Lesson 1 — index 0) */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  PRACTICE • LESSON 1
                </p>
                <p className="mt-1.5 text-base font-bold text-gray-900">Letters A-E</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Star size={15} className="text-amber-400" fill="currentColor" />
                <span className="text-xs font-bold text-brand-primary">CONTINUE</span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-gray-500 mb-4">
              In this unit, you will learn the letters of the alphabet in ASL format. Watch the
              handshape carefully and try to mirror it as best as possible. While these letters can
              be helpful for signing things such as names, addresses, or places, you will learn the
              entirety of the language as you progress through the curriculum.
            </p>

            <button
              onClick={() => navigate(`/learn/${unitNumber}/0`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primaryHover text-white text-sm font-bold border-0 cursor-pointer transition-colors"
            >
              Continue lesson <ArrowRight size={14} />
            </button>
          </div>

          {/* Remaining lessons — index starts at 1 since lesson 1 is the active card above */}
          {lessons.map((lesson, idx) => (
            <LessonRow
              key={lesson.title}
              title={lesson.title}
              subtitle={lesson.subtitle}
              type={lesson.type}
              description={lesson.description}
              unitNumber={unitNumber}
              lessonIndex={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
