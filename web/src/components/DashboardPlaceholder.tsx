interface DashboardPlaceholderProps {
  title: string;
  description: string;
}

export function DashboardPlaceholder({ title, description }: DashboardPlaceholderProps) {
  return (
    <section className="max-w-[1200px] grid gap-6 p-7 bg-[rgba(255,252,248,0.92)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px]">
      <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Coming Later</p>
      <h2 className="my-[10px]">{title}</h2>
      <p className="text-[#66758a] leading-[1.62]">{description}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-[14px_16px] rounded-[18px] bg-white/[0.72] border border-[rgba(53,84,128,0.08)]">
            <span className="block text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Widget {n}</span>
            <strong>Sẽ làm sau</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
