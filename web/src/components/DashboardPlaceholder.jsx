export function DashboardPlaceholder({ title, description }) {
  return (
    <section className="dashboard-placeholder card-surface">
      <p className="eyebrow">Coming Later</p>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <div className="placeholder-grid">
        <div className="placeholder-card">
          <span className="metric-label">Widget 1</span>
          <strong>Sẽ làm sau</strong>
        </div>
        <div className="placeholder-card">
          <span className="metric-label">Widget 2</span>
          <strong>Sẽ làm sau</strong>
        </div>
        <div className="placeholder-card">
          <span className="metric-label">Widget 3</span>
          <strong>Sẽ làm sau</strong>
        </div>
      </div>
    </section>
  );
}
