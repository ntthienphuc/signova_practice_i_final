import type { PracticeSession, Topic } from "../types/learn";

interface TopicSummaryProps {
  topic: Topic;
  session: PracticeSession;
  onRestartTopic: () => void;
  onBackToTopics: () => void;
}

export function TopicSummary({
  topic,
  session,
  onRestartTopic,
  onBackToTopics,
}: TopicSummaryProps) {
  const practiceOneResults = Object.values(session.practiceResults ?? {});
  const quiz5 = session.quiz5Results ?? [];
  const quiz10 = session.finalQuizResults ?? [];

  const practiceOnePassed = practiceOneResults.filter((item) => item?.decision?.accept_as_target).length;
  const quiz5Passed = quiz5.filter((item) => item?.decision?.accept_as_target).length;
  const quiz10Passed = quiz10.filter((item) => item?.decision?.accept_as_target).length;

  return (
    <section className="topic-summary">
      <div className="summary-hero card-surface summary-hero-bright">
        <div className="summary-hero-copy">
          <p className="eyebrow">Topic Summary</p>
          <div className="summary-badge">🎉 Xong một topic rồi!</div>
          <h2>{topic.title}</h2>
          <p className="muted">
            Bạn đã học xong {topic.word_count} từ, hoàn thành Practice I từng từ, checkpoint 5 từ,
            và bài Practice II tổng kết 10 từ.
          </p>
        </div>

        <div className="summary-actions">
          <button className="primary-button" type="button" onClick={onBackToTopics}>
            Về danh sách topics
          </button>
          <button className="ghost-button" type="button" onClick={onRestartTopic}>
            Học lại topic này
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <article className="card-surface summary-stat-card">
          <span className="metric-label">Practice I</span>
          <strong>
            {practiceOnePassed}/{practiceOneResults.length || topic.word_count}
          </strong>
          <p className="muted">Số từ được accept trực tiếp khi luyện từng từ.</p>
        </article>
        <article className="card-surface summary-stat-card">
          <span className="metric-label">Practice II - 5 từ</span>
          <strong>
            {quiz5Passed}/{quiz5.length || 5}
          </strong>
          <p className="muted">Checkpoint sau khi học xong 5 từ đầu.</p>
        </article>
        <article className="card-surface summary-stat-card">
          <span className="metric-label">Practice II - 10 từ</span>
          <strong>
            {quiz10Passed}/{quiz10.length || 10}
          </strong>
          <p className="muted">Bài tổng kết cuối topic trên toàn bộ 10 từ.</p>
        </article>
      </div>

      <div className="card-surface summary-word-card">
        <p className="eyebrow">Danh sách từ</p>
        <div className="lesson-chip-grid">
          {topic.glosses.map((gloss) => (
            <span key={gloss} className="lesson-chip active">
              {gloss}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
