import type { ChangeEvent } from "react";
import type { AppTab, CurriculumTopicSummary } from "../types/learn";

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  apiBase: string;
  onApiBaseChange: (value: string) => void;
  curriculumTopics: CurriculumTopicSummary[];
  currentUser: any;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  apiBase,
  onApiBaseChange,
  curriculumTopics,
  currentUser,
  onOpenAuth,
  onLogout,
}: SidebarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onApiBaseChange(event.target.value);
  };

  // Dynamically filter tabs based on role
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
    // Guest
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
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark-row">
          <div className="brand-mark">
            <img src="/signova-mascot.png" alt="Signova mascot" className="brand-mark-image" />
          </div>
          <div className="brand-badge">20 từ • 2 topic</div>
        </div>
        <p className="eyebrow">SIGNOVA</p>
        <h1>Học ký hiệu cùng mascot Signova</h1>
      </div>

      {/* User Auth Section */}
      <div className="card-surface" style={{ padding: "12px", marginBottom: "16px" }}>
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

      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "nav-tab active" : "nav-tab"}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="field">
        <span>API Base</span>
        <input value={apiBase} onChange={handleChange} />
      </label>

      <div className="card-surface">
        <p className="eyebrow">Lộ trình học</p>
        <div className="sidebar-topic-list">
          {curriculumTopics.map((topic) => (
            <div key={topic.id} className="sidebar-topic-item">
              <div className="sidebar-topic-copy">
                <strong>{topic.title}</strong>
                <div className="sidebar-topic-subtitle">5 từ đầu → checkpoint → 5 từ sau</div>
              </div>
              <span className="sidebar-topic-count">{topic.word_count} từ</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface sidebar-helper-card">
        <p className="eyebrow">Cách chơi</p>
        <ul className="helper-list">
          <li>Xem hình và video mẫu trước.</li>
          <li>Học xong một từ thì luyện ngay.</li>
          <li>Mỗi 5 từ sẽ có một bài kiểm tra nhỏ.</li>
        </ul>
      </div>
    </aside>
  );
}
