const TABS = [
  { id: "learn", label: "Học" },
  { id: "family", label: "Gia đình" },
  { id: "school", label: "Trường học" },
];

export function Sidebar({ activeTab, onTabChange, apiBase, onApiBaseChange, curriculumTopics }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark-row">
          <div className="brand-mark">
            <img src="/signova-mascot.png" alt="Signova mascot" className="brand-mark-image" />
          </div>
          <div className="brand-badge">Core Practice</div>
        </div>
        <p className="eyebrow">SIGNOVA LEARN</p>
        <h1>Learn with Signova</h1>
        <p className="muted">
          Study one word at a time, then practice right away with AI feedback and reference playback.
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

      <div className="card-surface sidebar-roadmap">
        <p className="eyebrow">Topics</p>
        <div className="sidebar-topic-list">
          {curriculumTopics.map((topic) => (
            <div key={topic.id} className="sidebar-topic-item">
              <div className="sidebar-topic-copy">
                <strong>{topic.title}</strong>
                <div className="sidebar-topic-subtitle">5 words → checkpoint → 5 more words</div>
              </div>
              <span className="sidebar-topic-count">{topic.word_count} từ</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface sidebar-helper-card">
        <p className="eyebrow">Workspace</p>
        <label className="field">
          <span>API Base</span>
          <input value={apiBase} onChange={(event) => onApiBaseChange(event.target.value)} />
        </label>
        <ul className="helper-list">
          <li>Study the word card first.</li>
          <li>Practice I starts right after learning.</li>
          <li>Every 5 words unlock a Practice II checkpoint.</li>
        </ul>
      </div>
    </aside>
  );
}
