import type { FeaturesData } from "../../types/landing";

interface FeaturesProps {
  data: FeaturesData;
}

export function Features({ data }: FeaturesProps) {
  return (
    <section className="relative bg-sky-50 pt-32 pb-36 lg:pt-36 lg:pb-40" id="features">
      {/* Top wave: white → sky-50, organic hill rising from left */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path fill="white" d="M0,0 L0,75 C220,75 420,10 680,5 C940,0 1180,55 1440,75 L1440,0 Z" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 space-y-4">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1cb0f6] tracking-tight leading-tight">
            {data.heading}
          </h2>
          <p className="text-xl sm:text-2xl text-slate-500 font-bold max-w-2xl mx-auto">
            {data.subheading}
          </p>
        </div>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {data.items.map((item, index) => {
            const titleColors = [
              "text-[#1cb0f6]",
              "text-emerald-600",
              "text-amber-600",
              "text-indigo-600",
            ];
            const iconBgClasses = [
              "bg-sky-50 border-sky-200",
              "bg-emerald-50 border-emerald-200",
              "bg-amber-50 border-amber-200",
              "bg-indigo-50 border-indigo-200",
            ];
            const titleColor = titleColors[index % titleColors.length];
            const activeBg = iconBgClasses[index % iconBgClasses.length];

            return (
              <div
                key={item.title}
                className="group bg-white rounded-[24px] shadow-sm border border-sky-100 hover:shadow-md hover:border-[#1cb0f6]/30 p-6 transition-all duration-150 hover:-translate-y-0.5"
              >
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform ${activeBg}`}>
                  {item.icon}
                </div>
                <h3 className={`text-2xl sm:text-3xl font-black mb-2 ${titleColor}`}>{item.title}</h3>
                <p className="text-slate-500 font-bold text-base leading-relaxed m-0">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom wave: sky-50 → white, hill peaking right-of-center */}
      <svg
        className="absolute bottom-[-2px] left-0 w-full"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path fill="white" d="M0,55 C260,55 500,100 760,105 C1020,110 1240,65 1440,55 L1440,110 L0,110 Z" />
      </svg>
    </section>
  );
}
