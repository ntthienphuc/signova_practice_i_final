import type { ValuePropsData } from "../../types/landing";

interface ValuePropsProps {
  data: ValuePropsData;
}

export function ValueProps({ data }: ValuePropsProps) {
  return (
    <section className="bg-dark-bg py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-brand-teal" />
            <span className="text-sm font-semibold text-brand-tealLight uppercase tracking-widest">
              Value Props
            </span>
            <div className="w-10 h-1 rounded-full bg-brand-teal" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-main mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* 5-column card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {data.items.map((item) => (
            <div
              key={item.role}
              className="bg-dark-card border border-white/5 hover:border-brand-primaryHover/30 rounded-2xl p-6 transition-colors group flex flex-col justify-start"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-sm font-bold text-text-main mb-4 uppercase tracking-wide">
                {item.role}
              </h3>
              <div className="space-y-3">
                {item.props.map((prop) => (
                    <div key={prop} className="text-text-muted text-sm leading-snug">• {prop}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
