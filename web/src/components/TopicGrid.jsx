export function TopicGrid({ topics, progressByTopic, onOpenTopic }) {
  return (
    <section className="topic-dashboard">
      <div className="topic-dashboard-head card-surface">
        <div>
          <p className="eyebrow">Learn Dashboard</p>
          <h2>Pick a topic and continue your learning path</h2>
          <p className="muted">
            Each topic has 10 words. You will learn one word, practice it, then unlock Practice II after each 5-word block.
          </p>
        </div>
      </div>

      <div className="topic-grid">
      {topics.map((topic, index) => {
        const progress = progressByTopic[topic.id] ?? { completedWords: 0, completed: false };
        const ratio = topic.word_count > 0 ? Math.min(1, progress.completedWords / topic.word_count) : 0;
        return (
          <article key={topic.id} className="topic-card card-surface topic-card-dashboard">
            <div className="topic-card-top">
              <span className="topic-mini-tag">{progress.completed ? "Completed" : "Ready to learn"}</span>
              <span className="topic-inline-progress">{progress.completedWords}/{topic.word_count} words</span>
            </div>
            <p className="eyebrow">Topic {index + 1}</p>
            <h3>{topic.title}</h3>
            <p className="muted">{topic.subtitle}</p>

            <div className="topic-metrics">
              <div>
                <span className="metric-label">Words</span>
                <strong>{topic.word_count}</strong>
              </div>
              <div>
                <span className="metric-label">Progress</span>
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
              {progress.completed ? "Review topic" : "Open topic"}
            </button>
          </article>
        );
      })}
      </div>
    </section>
  );
}
