import type { ValuePropsData } from "../../types/landing";

interface ValuePropsProps {
  data: ValuePropsData;
}

export function ValueProps({ data }: ValuePropsProps) {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-[0.2em]">
              Giá Trị
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

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-[1240px] mx-auto">
          {data.items.map((item, index) => {
            const iconBgClasses = [
              "bg-sky-50 border-sky-100 text-sky-600",
              "bg-rose-50 border-rose-100 text-rose-600",
              "bg-amber-50 border-amber-100 text-amber-600",
              "bg-emerald-50 border-emerald-100 text-emerald-600",
              "bg-indigo-50 border-indigo-100 text-indigo-600",
            ];
            const activeBg = iconBgClasses[index % iconBgClasses.length];

            return (
              <div
                key={item.role}
                className="bg-white border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] rounded-[28px] p-6 transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-start"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl mb-4 ${activeBg} select-none`}>
                  {item.icon}
                </div>
                
                <h3 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-wider leading-tight">
                  {item.role}
                </h3>
                
                <ul className="space-y-3 pl-0 list-none m-0">
                  {item.props.map((prop) => (
                    <li key={prop} className="flex items-start gap-2 text-slate-500 font-bold text-xs leading-relaxed">
                      <span className="text-[#58cc02] select-none text-xs">✓</span>
                      <span>{prop}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
