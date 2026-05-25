import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
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
            <img src="/mascot/1.png" alt="Mascot" className="w-full h-full object-contain rounded-[14px]" />
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

      {/* ── Mobile top bar ─────────────────────────────────── */}
      <header className="sm:hidden sticky top-0 z-50 bg-white border-b-2 border-slate-200 px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
            <img src="/mascot/1.png" alt="Mascot" className="w-full h-full object-contain" />
          </div>
          <span className="font-black text-base tracking-[0.12em] text-sky-600 uppercase">SIGNOVA</span>
        </div>

        {/* Right: stats + hamburger */}
        <div className="flex items-center gap-2">
          {currentUser?.learner_profile && (
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="text-amber-600">🔥{currentUser.learner_profile.learning_streak}</span>
              <span className="text-indigo-600">⭐{currentUser.learner_profile.xp}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200 transition-colors"
            aria-label="Mở menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────── */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* Panel */}
          <div className="relative ml-auto w-72 h-full bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0">
                  <img src={logo} alt="Mascot" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-sm tracking-[0.12em] text-sky-600 uppercase">SIGNOVA</span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:bg-slate-200 transition-colors"
                aria-label="Đóng menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User card */}
            {currentUser ? (
              <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                    {currentUser.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-sm truncate">{currentUser.username}</p>
                    <p className="text-[10px] text-sky-600 font-black uppercase tracking-wider">
                      {role === "learner" ? "Cá nhân" : role === "parent" ? "Phụ huynh" : "Trường học"}
                    </p>
                  </div>
                </div>
                {currentUser.learner_profile && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-sky-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">🔥</span>
                      <div>
                        <p className="font-black text-amber-600 text-sm leading-none">{currentUser.learner_profile.learning_streak}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Streak</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">⭐</span>
                      <div>
                        <p className="font-black text-indigo-600 text-sm leading-none">{currentUser.learner_profile.xp}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">XP</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-4 mt-4">
                <button
                  onClick={() => { onOpenAuth(); setMenuOpen(false); }}
                  type="button"
                  className="w-full py-3 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-2xl text-sm cursor-pointer active:border-b-0 active:translate-y-[1px] transition-all"
                >
                  🔑 Đăng nhập
                </button>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 px-4 mt-4 flex flex-col gap-1 overflow-y-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { onTabChange(tab.id); setMenuOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer w-full ${
                      isActive
                        ? "bg-[#1cb0f6] text-white"
                        : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl w-7 text-center">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {isActive && <span className="ml-auto w-2 h-2 rounded-full bg-white/80" />}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            {currentUser && (
              <div className="px-4 py-4 border-t-2 border-slate-100">
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  type="button"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-black text-sm text-rose-500 bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer"
                >
                  <span className="text-xl w-7 text-center">🚪</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
