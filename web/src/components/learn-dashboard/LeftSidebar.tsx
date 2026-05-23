import {
  BookOpen,
  Trophy,
  Compass,
  BarChart2,
  Calendar,
  FileText,
  GraduationCap,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: BookOpen, label: "Learn", active: true },
  { icon: Trophy, label: "Challenges", active: false },
  { icon: Compass, label: "Quests", active: false },
  { icon: BarChart2, label: "Progress", active: false },
  { icon: Calendar, label: "Plans", active: false },
  { icon: FileText, label: "Changelog", active: false },
  { icon: GraduationCap, label: "Educators", active: false },
];

export default function LeftSidebar() {
  return (
    <aside className="flex flex-col w-60 flex-shrink-0 h-full overflow-y-auto bg-white border-r border-gray-100">
      <div className="px-6 py-6">
        <span className="text-xl font-bold text-brand-primary">Signova</span>
      </div>

      <nav className="flex-1 px-3">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl mb-1 text-sm font-medium text-left transition-colors cursor-pointer border ${
              active
                ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                : "bg-transparent border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-5">
        <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
          Connected
        </div>
      </div>
    </aside>
  );
}
