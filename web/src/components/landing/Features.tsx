import type { FeaturesData } from "../../types/landing";

interface FeaturesProps {
  data: FeaturesData;
}

export function Features({ data }: FeaturesProps) {
  return (
    <section className="bg-gradient-to-b from-white to-sky-50 py-20 lg:py-28" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-sky-400" />
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">
              Features
            </span>
            <div className="w-10 h-1 rounded-full bg-sky-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="group bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-8 transition-all duration-300 hover:bg-sky-50 shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-2xl mb-6 group-hover:bg-sky-100 group-hover:border-sky-200 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
