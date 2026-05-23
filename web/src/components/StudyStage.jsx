function absoluteUrl(apiBase, url) {
  if (!url) {
    return "";
  }
  return new URL(url, apiBase).href;
}

export function StudyStage({ apiBase, topic, word, wordIndex, onStartPractice, onBackToTopics }) {
  const posterUrl = absoluteUrl(apiBase, word.study?.poster_url);
  const referenceUrl = absoluteUrl(apiBase, word.study?.reference?.playback_url ?? word.study?.reference?.video_url);
  const referenceSegment = word.study?.reference?.segment;
  const progressRatio = topic.words.length > 0 ? ((wordIndex + 1) / topic.words.length) * 100 : 0;

  return (
    <section className="study-stage study-stage-dashboard">
      <div className="study-header card-surface study-header-dashboard">
        <div>
          <button className="ghost-button" type="button" onClick={onBackToTopics}>
            ← Back to topics
          </button>
          <p className="eyebrow">Learn Word</p>
          <h2>{topic.title}</h2>
          <p className="muted">
            Word {wordIndex + 1}/{topic.words.length}
          </p>
        </div>
        <div className="study-progress">
          <div className="target-pill study-word-pill">{word.gloss}</div>
          <div className="progress-track progress-track-wide">
            <div className="progress-fill" style={{ width: `${progressRatio}%` }} />
          </div>
        </div>
      </div>

      <div className="study-grid study-grid-dashboard">
        <article className="study-card card-surface">
          <p className="eyebrow">Word Card</p>
          <div className="study-sticker">Ready to practice</div>
          <h3>{word.gloss}</h3>
          <p className="muted">
            Look at the illustration, watch the reference video, and get ready to move into Practice I right after this screen.
          </p>

          <div className="topic-metrics">
            <div>
              <span className="metric-label">Checkpoint</span>
              <strong>{word.checkpoint_group === 1 ? "Block 1/5" : "Block 2/5"}</strong>
            </div>
            <div>
              <span className="metric-label">Reference</span>
              <strong>{word.study?.video_id ?? "sample"}</strong>
            </div>
          </div>

          <div className="kid-note">
            Tip: watch the motion once or twice, then copy it slowly before you record your own attempt.
          </div>

          <button className="primary-button" type="button" onClick={onStartPractice}>
            Start Practice I
          </button>
        </article>

        <article className="study-card card-surface">
          <p className="eyebrow">Illustration</p>
          <div className="poster-shell">
            {posterUrl ? <img src={posterUrl} alt={word.gloss} className="poster-image" /> : <div className="empty-state">Chưa có poster</div>}
          </div>
        </article>

        <article className="study-card card-surface">
          <p className="eyebrow">Reference Video</p>
          <div className="study-video-shell">
            {referenceUrl ? (
              <video
                src={referenceUrl}
                poster={posterUrl || undefined}
                className="study-video"
                controls
                playsInline
                muted
              />
            ) : (
              <div className="empty-state">Chưa có video reference</div>
            )}
          </div>
          {referenceSegment ? (
            <p className="debug-line">
              Reference segment: {referenceSegment.start_ms}ms → {referenceSegment.end_ms}ms
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
