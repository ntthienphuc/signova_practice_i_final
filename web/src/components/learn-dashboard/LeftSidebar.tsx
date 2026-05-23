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
    <>
      {/* Desktop / tablet sidebar */}
      <aside className="hidden md:flex flex-col md:w-16 lg:w-60 flex-shrink-0 h-full overflow-y-auto bg-white border-r border-gray-100 transition-all duration-200">
        <div className="px-4 py-6 flex justify-center lg:justify-start lg:px-6">
          <span className="hidden lg:block text-xl font-bold text-brand-primary">Signova</span>
          <span className="lg:hidden text-xl font-bold text-brand-primary">S</span>
        </div>

        <nav className="flex-1 px-2 lg:px-3">
          {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              title={label}
              className={`flex items-center justify-center lg:justify-start gap-3 w-full px-2 lg:px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-colors cursor-pointer border ${
                active
                  ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                  : "bg-transparent border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-5 flex justify-center lg:justify-start lg:px-6">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
            <span className="hidden lg:block">Connected</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-center justify-around px-1 py-2">
        {NAV_ITEMS.slice(0, 5).map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              active ? "text-brand-primary" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
