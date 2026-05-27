import type { ValuePropsData } from "../../types/landing";

interface ValuePropsProps {
  data: ValuePropsData;
}

const colorSets = [
  { bg: "bg-sky-50 border-sky-200",         topBar: "bg-[#1cb0f6]",   check: "text-[#1cb0f6]" },
  { bg: "bg-rose-50 border-rose-200",       topBar: "bg-rose-400",    check: "text-rose-500" },
  { bg: "bg-amber-50 border-amber-200",     topBar: "bg-amber-400",   check: "text-amber-500" },
  { bg: "bg-emerald-50 border-emerald-200", topBar: "bg-emerald-500", check: "text-emerald-600" },
  { bg: "bg-indigo-50 border-indigo-200",   topBar: "bg-indigo-500",  check: "text-indigo-500" },
];

interface CardProps {
  item: { role: string; icon: string; props: string[] };
  c: typeof colorSets[0];
}

function Card({ item, c }: CardProps) {
  return (
    <div className="group relative bg-white rounded-[28px] border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] shadow-sm hover:shadow-xl hover:shadow-sky-100/60 transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center overflow-hidden h-full">
      {/* Colored top accent bar */}
      <div className={`w-full h-1.5 ${c.topBar} flex-shrink-0`} />

      <div className="p-8 flex flex-col items-center flex-1 w-full">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-[24px] border-2 flex items-center justify-center text-4xl mb-5 select-none group-hover:scale-105 transition-transform ${c.bg}`}>
          {item.icon}
        </div>

        {/* Role title */}
        <h3 className="text-base font-black text-slate-800 mb-5 uppercase tracking-widest leading-tight">
          {item.role}
        </h3>

        {/* Props list */}
        <ul className="space-y-3 pl-0 list-none m-0 text-left w-full">
          {item.props.map((prop) => (
            <li key={prop} className="flex items-start gap-2.5 text-slate-500 font-bold text-sm leading-relaxed">
              <span className={`select-none font-black flex-shrink-0 mt-0.5 ${c.check}`}>✓</span>
              <span>{prop}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ValueProps({ data }: ValuePropsProps) {
  const topRow = data.items.slice(0, 3);
  const bottomRow = data.items.slice(3);

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Heading */}
        <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1cb0f6] tracking-tight leading-tight mb-4">
          {data.heading}
        </h2>
        <p className="text-xl sm:text-2xl text-slate-500 font-bold leading-relaxed max-w-2xl mx-auto mb-14">
          {data.subheading}
        </p>

        {/* Row 1 — 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {topRow.map((item, i) => (
            <Card key={item.role} item={item} c={colorSets[i]} />
          ))}
        </div>

        {/* Row 2 — 2 cards, centered to match top row width */}
        <div className="flex justify-center gap-6">
          {bottomRow.map((item, i) => (
            <div key={item.role} className="w-full sm:w-[calc(33.333%-8px)] max-w-sm">
              <Card item={item} c={colorSets[i + 3]} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
