import type { AppTab, CurriculumTopicSummary } from "../../types/learn";
import logo from '../../assets/image/logo.jpeg'
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  apiBase?: string;
  onApiBaseChange?: (value: string) => void;
  curriculumTopics: CurriculumTopicSummary[];
  onOpenAuth: () => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onOpenAuth,
  onLogout,
}: SidebarProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const tabs: Array<{ id: AppTab; label: string; icon: string }> = [];

  if (role === "learner") {
    tabs.push({ id: "learn", label: "Học", icon: "📖" });
    tabs.push({ id: "review", label: "Luyện tập", icon: "🏋️" });
    tabs.push({ id: "progress", label: "Tiến độ", icon: "⚡" });
    tabs.push({ id: "account", label: "Tài khoản", icon: "👤" });
  } else if (role === "parent") {
    tabs.push({ id: "learn", label: "Học", icon: "📖" });
    tabs.push({ id: "review", label: "Luyện tập", icon: "🏋️" });
    tabs.push({ id: "family", label: "Gia đình", icon: "👨‍👩‍👧" });
    tabs.push({ id: "account", label: "Tài khoản", icon: "👤" });
  } else if (role === "school") {
    tabs.push({ id: "school", label: "Trường học", icon: "🏫" });
    tabs.push({ id: "custom_package", label: "Tùy chỉnh", icon: "📋" });
    tabs.push({ id: "account", label: "Tài khoản", icon: "👤" });
  } else {
    tabs.push({ id: "learn", label: "Học", icon: "📖" });
    tabs.push({ id: "account", label: "Đăng nhập", icon: "🔑" });
  }

  return (
    <>
      {/* ── Desktop top bar ────────────────────────────────── */}
      <aside className="sidebar hidden sm:flex">
        {/* Brand logo */}
        <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => navigate("/")}>
          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center p-0.5">
            <img src={logo} alt="Mascot" className="w-full h-full object-cover rounded-[14px]" />
          </div>
          <span className="font-black text-lg tracking-[0.12em] text-sky-600 uppercase leading-none">SIGNOVA</span>
        </div>

        {/* Desktop tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar flex-1 justify-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-[0.92rem] transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white"
                    : "bg-white border-2 border-b-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop user block */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-white/80 border border-slate-100 rounded-3xl p-1.5 pr-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {currentUser.username[0].toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-extrabold text-slate-800 text-sm leading-none truncate max-w-[80px]">
                  {currentUser.username}
                </span>
                <span className="text-[9px] text-sky-600 font-black uppercase tracking-wider mt-1">
                  {role === "learner" ? "Cá nhân" : role === "parent" ? "Phụ huynh" : "Trường"}
                </span>
              </div>

              {(role === "learner" || role === "parent") && currentUser.learner_profile && (
                <div className="flex items-center gap-2 border-l border-slate-150 pl-2 ml-1 text-xs">
                  <span className="font-black text-amber-600">🔥 {currentUser.learner_profile.learning_streak}</span>
                  <span className="font-black text-indigo-600">⭐ {currentUser.learner_profile.xp}</span>
                </div>
              )}

              <button
                onClick={onLogout}
                type="button"
                className="p-2 bg-white border-2 border-b-2 border-rose-200 text-rose-500 hover:bg-rose-50 active:border-b-0 active:translate-y-[1px] rounded-xl transition-all cursor-pointer text-xs"
                title="Đăng xuất"
              >
                ❌
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              type="button"
              className="px-5 py-2.5 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px] transition-all text-sm"
            >
              🔑 Đăng nhập
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile top mini-bar ────────────────────────────── */}
      <header className="sm:hidden sticky top-0 z-50 bg-white border-b-2 border-slate-200 px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-100">
            <img src="/signova-mascot.png" alt="Mascot" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-base tracking-[0.12em] text-sky-600 uppercase">SIGNOVA</span>
        </div>

        {/* User pill or login */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            {currentUser.learner_profile && (
              <div className="flex items-center gap-2 text-xs font-black">
                <span className="text-amber-600">🔥{currentUser.learner_profile.learning_streak}</span>
                <span className="text-indigo-600">⭐{currentUser.learner_profile.xp}</span>
              </div>
            )}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm">
              {currentUser.username[0].toUpperCase()}
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            type="button"
            className="px-4 py-2 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-xl text-sm cursor-pointer"
          >
            Đăng nhập
          </button>
        )}
      </header>

      {/* ── Mobile bottom tab bar (Duolingo-style) ────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer min-w-[56px] ${
                  isActive ? "text-[#1cb0f6]" : "text-slate-400"
                }`}
              >
                <span className={`text-2xl leading-none transition-transform ${isActive ? "scale-110" : ""}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-black leading-none whitespace-nowrap ${isActive ? "text-[#1cb0f6]" : "text-slate-400"}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1cb0f6] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
