import type { TargetUsersData } from "../../types/landing";

interface TargetUsersProps {
  data: TargetUsersData;
}

export function TargetUsers({ data }: TargetUsersProps) {
  const cardColors = [
    { bg: "bg-sky-50 border-sky-200", icon: "text-sky-600" },
    { bg: "bg-emerald-50 border-emerald-200", icon: "text-emerald-600" },
    { bg: "bg-indigo-50 border-indigo-200", icon: "text-indigo-600" },
  ];

  return (
    <section className="relative bg-gradient-to-br from-sky-50 to-sky-100 pt-32 pb-36 lg:pt-36 lg:pb-40" id="users">
      {/* Top wave: white → sky gradient, asymmetric hill */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path fill="white" d="M0,0 L0,70 C200,70 450,8 720,4 C990,0 1220,58 1440,70 L1440,0 Z" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: heading + subheading */}
          <div className="space-y-6">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-800 tracking-tight leading-tight">
              {data.heading}
            </h2>
            <p className="text-xl sm:text-2xl text-slate-600 font-bold leading-relaxed max-w-md">
              {data.subheading}
            </p>
          </div>

          {/* Right: stacked user cards */}
          <div className="flex flex-col gap-4">
            {data.items.map((item, index) => {
              const color = cardColors[index % cardColors.length];
              return (
                <div
                  key={item.title}
                  className="group bg-white rounded-[24px] border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] p-5 flex items-center gap-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-100/50"
                >
                  <div className={`w-16 h-16 rounded-[20px] border-2 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform ${color.bg}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xl font-black mb-1 group-hover:text-[#1cb0f6] transition-colors ${color.icon}`}>{item.title}</h3>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed m-0">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Bottom wave: sky gradient → white, hill left-of-center */}
      <svg
        className="absolute bottom-[-2px] left-0 w-full"
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <path fill="white" d="M0,60 C180,60 420,108 680,108 C940,108 1200,62 1440,60 L1440,110 L0,110 Z" />
      </svg>
    </section>
  );
}
