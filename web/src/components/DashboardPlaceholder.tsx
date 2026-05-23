interface DashboardPlaceholderProps {
  title: string;
  description: string;
}

export function DashboardPlaceholder({ title, description }: DashboardPlaceholderProps) {
  return (
    <section className="grid gap-6 max-w-[1200px] bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
      <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Coming Later</p>
      <h2>{title}</h2>
      <p className="text-[var(--ink-soft)] leading-[1.62]">{description}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        <div className="py-[14px] px-4 rounded-[18px] bg-white/[0.76] border border-[rgba(53,84,128,0.08)]">
          <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Widget 1</span>
          <strong>Sẽ làm sau</strong>
        </div>
        <div className="py-[14px] px-4 rounded-[18px] bg-white/[0.76] border border-[rgba(53,84,128,0.08)]">
          <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Widget 2</span>
          <strong>Sẽ làm sau</strong>
        </div>
        <div className="py-[14px] px-4 rounded-[18px] bg-white/[0.76] border border-[rgba(53,84,128,0.08)]">
          <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Widget 3</span>
          <strong>Sẽ làm sau</strong>
        </div>
      </div>
    </section>
  );
}
