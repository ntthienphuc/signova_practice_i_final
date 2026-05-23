import { useState } from "react";
import { BookOpen } from "lucide-react";
import UnitAccordion from "./UnitAccordion";
import { LEARN_UNITS } from "../../data/learnDashboardData";

export default function MainContent() {
  const [expandedUnit, setExpandedUnit] = useState<number | null>(1);

  function toggleUnit(unitNumber: number) {
    setExpandedUnit((prev) => (prev === unitNumber ? null : unitNumber));
  }

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8 min-w-0">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            UNIT 1 • 0/7 LESSONS • IN PROGRESS
          </p>
          <h1 className="m-0 text-3xl font-bold text-gray-900">The Alphabet</h1>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 text-[13px] font-semibold tracking-wide cursor-pointer transition-colors flex-shrink-0 shadow-sm">
          <BookOpen size={15} />
          GUIDEBOOK
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {LEARN_UNITS.map((unit) => (
          <UnitAccordion
            key={unit.unitNumber}
            unit={unit}
            isExpanded={expandedUnit === unit.unitNumber}
            onToggle={() => toggleUnit(unit.unitNumber)}
          />
        ))}
      </div>
    </main>
  );
}
