import type { PricingData } from "../../types/landing";

interface PricingProps {
  data: PricingData;
}

export function Pricing({ data }: PricingProps) {
  return (
    <section className="relative bg-sky-50 pt-32 pb-36 lg:pt-36 lg:pb-40" id="pricing">
      {/* Top wave: white → sky-50, organic hill */}
      <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1440 110" preserveAspectRatio="none" style={{ display: 'block' }}>
        <path fill="white" d="M0,0 L0,65 C240,65 480,5 760,3 C1040,1 1240,52 1440,65 L1440,0 Z" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-[0.2em]">
              Bảng Giá
            </span>
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-800 tracking-tight leading-tight">
            {data.heading}
          </h2>

          <p className="text-xl sm:text-2xl text-slate-500 font-bold max-w-2xl mx-auto">
            {data.subheading}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-[1200px] mx-auto">
          {data.items.map((item) => (
            <div key={item.name} className="relative flex flex-col">
              {/* Popular float badge */}
              {item.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-[#58cc02] border-b-2 border-[#46a302] text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md whitespace-nowrap">
                    Phổ Biến 🔥
                  </span>
                </div>
              )}

              <div
                className={`flex-1 rounded-[28px] flex flex-col justify-between transition-all duration-150 ${
                  item.highlight
                    ? "bg-gradient-to-b from-[#1cb0f6] to-[#536ef9] border-2 border-sky-300 p-6 pt-10 shadow-xl shadow-sky-200/50"
                    : "bg-white border-2 border-b-4 border-slate-200 p-6 hover:border-[#1cb0f6]"
                }`}
              >
                <div>
                  {/* Target audience pill */}
                  <div className="mb-4">
                    <span
                      className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                        item.highlight
                          ? "bg-white/20 text-white"
                          : "bg-sky-50 border border-sky-100 text-sky-600"
                      }`}
                    >
                      {item.target}
                    </span>
                  </div>

                  {/* Plan name */}
                  <h3
                    className={`text-2xl font-black mb-3 ${item.highlight ? "text-white" : "text-slate-800"}`}
                  >
                    {item.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6 flex flex-wrap items-baseline gap-1">
                    <span
                      className={`text-4xl font-black leading-none ${item.highlight ? "text-white" : "text-slate-805"}`}
                    >
                      {item.price}
                    </span>
                    {item.period && (
                      <span
                        className={`text-sm font-bold ${item.highlight ? "text-sky-100" : "text-slate-400"}`}
                      >
                        {item.period}
                      </span>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-3.5 mb-8 flex-1 pl-0">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <svg
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            item.highlight ? "text-emerald-300" : "text-[#58cc02]"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span
                          className={`text-sm font-bold leading-tight ${
                            item.highlight ? "text-white/90" : "text-slate-500"
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-4">
                  {item.highlight ? (
                    <a
                      href="#cta"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById("cta");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="block text-center py-2.5 px-5 bg-white border-b-4 border-slate-250 hover:bg-slate-50 active:border-b-0 active:translate-y-[2px] text-[#1cb0f6] text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                      {item.cta}
                    </a>
                  ) : (
                    <a
                      href="#cta"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById("cta");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="block text-center py-2.5 px-5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                      {item.cta}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave: sky-50 → white, hill right-of-center */}
      <svg className="absolute bottom-[-2px] left-0 w-full" viewBox="0 0 1440 110" preserveAspectRatio="none" style={{ display: 'block' }}>
        <path fill="white" d="M0,55 C200,55 440,105 720,108 C1000,110 1250,60 1440,55 L1440,110 L0,110 Z" />
      </svg>
    </section>
  );
}
