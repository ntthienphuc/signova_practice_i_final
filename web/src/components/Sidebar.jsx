const TABS = [
  { id: "learn", label: "Học" },
  { id: "family", label: "Dashboard Gia đình" },
  { id: "school", label: "Dashboard Trường học" },
];

export function Sidebar({ activeTab, onTabChange, apiBase, onApiBaseChange, curriculumTopics }) {
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
        <p className="muted">
          Xem mẫu, học từng từ, quay video và nhận phản hồi màu sắc thật dễ hiểu.
        </p>
      </div>

      <div className="tab-list">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "nav-tab active" : "nav-tab"}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="field">
        <span>API Base</span>
        <input value={apiBase} onChange={(event) => onApiBaseChange(event.target.value)} />
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
