export function TopicGrid({ topics, progressByTopic, onOpenTopic }) {
  return (
    <section className="topic-grid">
      {topics.map((topic, index) => {
        const progress = progressByTopic[topic.id] ?? { completedWords: 0, completed: false };
        const ratio = topic.word_count > 0 ? Math.min(1, progress.completedWords / topic.word_count) : 0;
        const icon = index % 2 === 0 ? "🌈" : "🪁";
        return (
          <article key={topic.id} className={index % 2 === 0 ? "topic-card card-surface topic-card-sun" : "topic-card card-surface topic-card-sky"}>
            <div className="topic-card-top">
              <div className="topic-sticker">{icon}</div>
              <span className="topic-mini-tag">{progress.completed ? "Đã hoàn thành" : "Sẵn sàng học"}</span>
            </div>
            <p className="eyebrow">Category</p>
            <h3>{topic.title}</h3>
            <p className="muted">{topic.subtitle}</p>

            <div className="topic-metrics">
              <div>
                <span className="metric-label">Từ</span>
                <strong>{topic.word_count}</strong>
              </div>
              <div>
                <span className="metric-label">Tiến độ</span>
                <strong>{progress.completedWords}/{topic.word_count}</strong>
              </div>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${ratio * 100}%` }} />
            </div>

            <div className="lesson-chip-grid">
              {topic.glosses.map((gloss) => (
                <span key={gloss} className="lesson-chip">
                  {gloss}
                </span>
              ))}
            </div>

            <button className="primary-button" type="button" onClick={() => onOpenTopic(topic)}>
              {progress.completed ? "Học lại topic" : "Bắt đầu học"}
            </button>
          </article>
        );
      })}
    </section>
  );
}
