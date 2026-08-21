import type { ProblemData } from "../../types/landing";

interface ProblemStatementProps {
  data: ProblemData;
}

export function ProblemStatement({ data }: ProblemStatementProps) {
  return (
    <section className="bg-white py-20 lg:py-28" id="problem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black uppercase tracking-wider shadow-sm">
            <span>⚠️ {data.eyebrow}</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-7xl font-black text-slate-800 tracking-tight leading-tight">
            {data.heading}
          </h2>
          
          <p className="text-base sm:text-lg text-slate-500 font-bold leading-relaxed">
            {data.body}
          </p>
        </div>

        {/* Feedback gap vs. Signova's more actionable guidance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Traditional Card */}
          <div className="bg-slate-50 border-2 border-b-4 border-slate-200 rounded-[28px] p-6 sm:p-8 space-y-5 shadow-[0_12px_30px_rgba(15,23,42,.05)]">
            <h3 className="text-lg font-black text-slate-500 flex items-center gap-2 select-none uppercase tracking-wider m-0">
              ❌ {data.contrastLeftTitle}
            </h3>

            <ul className="space-y-3.5 pl-0 text-slate-500 font-bold text-sm leading-relaxed">
              {data.contrastLeftItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-rose-500 text-base">⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Signova Card */}
          <div className="bg-gradient-to-b from-sky-50 to-white border-2 border-b-4 border-[#1cb0f6] rounded-[28px] p-6 sm:p-8 space-y-5 shadow-[0_18px_38px_rgba(28,176,246,.14)]">
            <h3 className="text-lg font-black text-[#1cb0f6] flex items-center gap-2 select-none uppercase tracking-wider m-0">
              ✨ {data.contrastRightTitle}
            </h3>

            <ul className="space-y-3.5 pl-0 text-slate-600 font-bold text-sm leading-relaxed">
              {data.contrastRightItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-[#58cc02] text-base">✅</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
