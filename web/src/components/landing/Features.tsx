import type { FeaturesData } from "../../types/landing";

interface FeaturesProps {
  data: FeaturesData;
}

export function Features({ data }: FeaturesProps) {
  return (
    <section className="bg-dark-bg py-20 lg:py-28" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-brand-teal" />
            <span className="text-sm font-semibold text-brand-tealLight uppercase tracking-widest">
              Features
            </span>
            <div className="w-10 h-1 rounded-full bg-brand-teal" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-main mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="group bg-dark-card border border-white/5 hover:border-brand-primaryHover/40 rounded-2xl p-8 transition-all duration-300 hover:bg-dark-cardHover"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-primaryHover/10 border border-brand-primaryHover/20 flex items-center justify-center text-2xl mb-6 group-hover:bg-brand-primaryHover/15 group-hover:border-brand-primaryHover/30 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-text-main mb-3">{item.title}</h3>
              <p className="text-text-muted leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
