import type { TargetUsersData } from "../../types/landing";

interface TargetUsersProps {
  data: TargetUsersData;
}

export function TargetUsers({ data }: TargetUsersProps) {
  return (
    <section className="bg-white py-20 lg:py-28" id="users">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-brand-primary" />
            <span className="text-sm font-semibold text-brand-primary uppercase tracking-widest">
              Who It's For
            </span>
            <div className="w-10 h-1 rounded-full bg-brand-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {data.items.map((item) => (
            <div key={item.title} className="text-center group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center text-4xl mx-auto mb-6 group-hover:from-sky-100 group-hover:to-sky-200 transition-colors shadow-sm">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
