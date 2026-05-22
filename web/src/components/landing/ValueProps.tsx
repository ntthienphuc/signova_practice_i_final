import type { ValuePropsData } from "../../types/landing";

interface ValuePropsProps {
  data: ValuePropsData;
}

export function ValueProps({ data }: ValuePropsProps) {
  return (
    <section className="bg-slate-950 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-teal-500" />
            <span className="text-sm font-semibold text-teal-400 uppercase tracking-widest">
              Value Props
            </span>
            <div className="w-10 h-1 rounded-full bg-teal-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* 5-column card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {data.items.map((item) => (
            <div
              key={item.role}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/30 rounded-2xl p-6 transition-colors group flex flex-col justify-start"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
                {item.role}
              </h3>
              <div className="space-y-3">
                {item.props.map((prop) => (
                    <div key={prop} className="text-slate-400 text-sm leading-snug">• {prop}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
