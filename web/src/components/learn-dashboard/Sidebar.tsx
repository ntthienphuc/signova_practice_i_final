import type { AppTab, CurriculumTopicSummary } from "../../types/learn";

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  curriculumTopics: CurriculumTopicSummary[];
  currentUser: any;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  curriculumTopics,
  currentUser,
  onOpenAuth,
  onLogout,
}: SidebarProps) {
  const role = currentUser?.role;
  const tabs: Array<{ id: AppTab; label: string }> = [];

  if (role === "learner") {
    tabs.push({ id: "learn", label: "Học" });
    tabs.push({ id: "review", label: "Luyện tập" });
    tabs.push({ id: "progress", label: "Tiến độ" });
    tabs.push({ id: "account", label: "Tài khoản" });
  } else if (role === "parent") {
    tabs.push({ id: "family", label: "Dashboard Gia đình" });
    tabs.push({ id: "progress", label: "Tiến độ con" });
    tabs.push({ id: "account", label: "Tài khoản" });
  } else if (role === "school") {
    tabs.push({ id: "school", label: "Dashboard Trường học" });
    tabs.push({ id: "custom_package", label: "Gói học tùy chỉnh" });
    tabs.push({ id: "account", label: "Tài khoản" });
  } else {
    tabs.push({ id: "learn", label: "Học" });
    tabs.push({ id: "account", label: "Đăng nhập" });
  }

  const handleTabClick = (tabId: AppTab) => {
    if (!currentUser && tabId !== "learn") {
      onOpenAuth();
      return;
    }
    onTabChange(tabId);
  };

  return (
    <aside className="sticky top-0 h-screen overflow-auto py-8 px-6 border-r border-[rgba(53,84,128,0.08)] backdrop-blur-[14px] bg-[radial-gradient(circle_at_top_left,rgba(255,220,242,0.6),transparent_28%),linear-gradient(180deg,rgba(255,252,247,0.96),rgba(238,247,255,0.96))]">
      {/* Brand */}
      <div className="mb-[22px]">
        <div className="flex items-center gap-[10px] flex-wrap">
          <div className="w-[66px] h-[66px] rounded-[22px] grid place-items-center bg-white/[0.9] shadow-[0_14px_28px_rgba(83,110,249,0.12)] overflow-hidden">
            <img src="/signova-mascot.png" alt="Signova mascot" className="w-full h-full object-cover" />
          </div>
          <div className="inline-flex items-center rounded-full py-2 px-3 font-bold text-[0.92rem] mt-[10px] bg-[#fff0c4] text-[#9a6213]">20 từ • 2 topic</div>
        </div>
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">SIGNOVA</p>
        <h1>Học ký hiệu cùng mascot Signova</h1>
      </div>

      {/* Auth section */}
      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px]" style={{ padding: "12px", marginBottom: "16px" }}>
        {currentUser ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                {currentUser.username[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-slate-800 text-sm leading-tight truncate">
                  {currentUser.username}
                </h4>
                <span className="text-[10px] text-indigo-600 font-bold capitalize bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {role === "learner" ? "Học sinh" : role === "parent" ? "Phụ huynh" : "Trường học"}
                </span>
              </div>
            </div>
            {role === "learner" && currentUser.learner_profile && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 flex justify-between">
                <span>🔥 Streak: <strong>{currentUser.learner_profile.learning_streak} ngày</strong></span>
                <span>⭐ XP: <strong>{currentUser.learner_profile.xp}</strong></span>
              </div>
            )}
            <button
              onClick={onLogout}
              type="button"
              className="w-full mt-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-lg border-0 cursor-pointer transition-colors text-xs"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-xs text-slate-500 mb-2.5 font-medium">Đăng nhập để lưu tiến độ và thi đua nhé!</p>
            <button
              onClick={onOpenAuth}
              type="button"
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-bold rounded-lg border-0 cursor-pointer hover:opacity-95 transition-all text-xs shadow-md shadow-indigo-100"
            >
              🔑 Đăng nhập / Đăng ký
            </button>
          </div>
        )}
      </div>

      {/* Tab list */}
      <div className="grid gap-[10px] mb-[18px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "w-full border border-transparent bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_12px_34px_rgba(83,110,249,0.1)] py-4 px-[18px] rounded-full text-left transition-all font-bold text-[1.02rem] hover:-translate-y-px cursor-pointer"
                : "w-full border border-transparent bg-white/[0.72] text-[var(--ink)] py-4 px-[18px] rounded-full text-left transition-all font-bold text-[1.02rem] hover:-translate-y-px cursor-pointer"
            }
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Helper card */}
      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] mt-[14px] p-[18px]">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Cách học</p>
        <ul className="grid gap-[10px] m-0 pl-[18px]">
          <li className="text-[1rem] leading-[1.65]">Xem hình và video mẫu trước.</li>
          <li className="text-[1rem] leading-[1.65]">Học xong một từ thì luyện ngay.</li>
          <li className="text-[1rem] leading-[1.65]">Mỗi 5 từ sẽ có một bài kiểm tra nhỏ.</li>
        </ul>
      </div>
    </aside>
  );
}
