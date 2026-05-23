import { Flame, Zap, Star } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {children}
    </div>
  );
}

function PanelHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>
    </div>
  );
}

function ProgressBar({ percent = 0 }: { percent?: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-brand-primary transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function StreakPanel() {
  return (
    <Panel>
      <PanelHeader icon={<Flame size={16} className="text-orange-400" />} label="Streak" />
      <p className="m-0 mb-1 text-4xl font-bold text-gray-900">0</p>
      <p className="m-0 mb-4 text-sm text-gray-500">days in a row</p>
      <div className="flex gap-1.5">
        {DAYS.map((day, i) => (
          <div
            key={i}
            className="flex-1 flex items-center justify-center h-8 rounded-lg bg-gray-100 text-xs font-semibold text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DailyGoalPanel() {
  return (
    <Panel>
      <PanelHeader icon={<Zap size={16} className="text-brand-primary" />} label="Daily Goal" />
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-gray-900">0 / 50 XP</span>
        <span className="text-sm text-gray-400">0%</span>
      </div>
      <div className="mb-3">
        <ProgressBar percent={0} />
      </div>
      <p className="m-0 text-sm text-gray-500">Keep practicing to hit today's goal.</p>
    </Panel>
  );
}

function LevelPanel() {
  return (
    <Panel>
      <PanelHeader icon={<Star size={16} className="text-amber-400" />} label="Level 1" />
      <p className="m-0 mb-1 text-2xl font-bold text-gray-900">0 total XP</p>
      <p className="m-0 mb-3 text-sm text-gray-500">1,000 XP to Level 2</p>
      <ProgressBar percent={0} />
    </Panel>
  );
}

function StatsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Lessons Done", value: "0" },
        { label: "Units", value: "18" },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm"
        >
          <p className="m-0 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {label}
          </p>
          <p className="m-0 text-3xl font-bold text-gray-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function RightSidebar() {
  return (
    <aside className="hidden xl:flex w-72 flex-shrink-0 flex-col gap-3 h-full overflow-y-auto py-8 px-6 border-l border-gray-100">
      <StreakPanel />
      <DailyGoalPanel />
      <LevelPanel />
      <StatsGrid />
    </aside>
  );
}
