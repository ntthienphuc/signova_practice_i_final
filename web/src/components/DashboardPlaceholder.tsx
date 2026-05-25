interface DashboardPlaceholderProps {
  title: string;
  description: string;
}

export function DashboardPlaceholder({ title, description }: DashboardPlaceholderProps) {
  return (
    <section className="grid gap-6 max-w-[1200px] bg-white border-2 border-b-5 border-slate-200 rounded-[32px] p-7">
      <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#1cb0f6] font-black">Coming Later ⏱️</p>
      <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">{title}</h2>
      <p className="text-slate-500 font-bold leading-[1.62] m-0 text-sm">{description}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        <div className="py-[14px] px-4 rounded-[18px] bg-slate-50 border-2 border-b-4 border-slate-200 font-bold text-sm">
          <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Widget 1</span>
          <strong className="block text-slate-700 font-black mt-1">Sẽ làm sau 🌟</strong>
        </div>
        <div className="py-[14px] px-4 rounded-[18px] bg-slate-50 border-2 border-b-4 border-slate-200 font-bold text-sm">
          <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Widget 2</span>
          <strong className="block text-slate-700 font-black mt-1">Sẽ làm sau 🌟</strong>
        </div>
        <div className="py-[14px] px-4 rounded-[18px] bg-slate-50 border-2 border-b-4 border-slate-200 font-bold text-sm">
          <span className="text-xs uppercase font-black text-slate-400 tracking-wider">Widget 3</span>
          <strong className="block text-slate-700 font-black mt-1">Sẽ làm sau 🌟</strong>
        </div>
      </div>
    </section>
  );
}
