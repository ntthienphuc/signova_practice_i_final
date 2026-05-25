import type { FeaturesData } from "../../types/landing";

interface FeaturesProps {
  data: FeaturesData;
}

export function Features({ data }: FeaturesProps) {
  return (
    <section className="bg-gradient-to-b from-white to-sky-50 py-20 lg:py-28" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-[0.2em]">
              Tính Năng
            </span>
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight leading-tight">
            {data.heading}
          </h2>
          
          <p className="text-base sm:text-lg text-slate-500 font-bold max-w-2xl mx-auto">
            {data.subheading}
          </p>
        </div>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {data.items.map((item, index) => {
            // Curate beautiful background bubbles for each feature
            const iconBgClasses = [
              "bg-sky-50 border-sky-200 text-sky-600",
              "bg-emerald-50 border-emerald-200 text-emerald-600",
              "bg-amber-50 border-amber-200 text-amber-600",
              "bg-indigo-50 border-indigo-200 text-indigo-600",
            ];
            const activeBg = iconBgClasses[index % iconBgClasses.length];

            return (
              <div
                key={item.title}
                className="group bg-white border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] rounded-[28px] p-7 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-50/50"
              >
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl mb-5 group-hover:scale-105 transition-transform ${activeBg}`}>
                  {item.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-850 mb-2 group-hover:text-[#1cb0f6] transition-colors">{item.title}</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed m-0">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
