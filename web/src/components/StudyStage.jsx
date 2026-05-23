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
    <section className="study-stage">
      <div className="study-header card-surface">
        <button className="ghost-button" type="button" onClick={onBackToTopics}>
          ← Quay lại topics
        </button>
        <div className="study-progress">
          <p className="eyebrow">Học</p>
          <h2>{topic.title}</h2>
          <p className="muted">
            Từ {wordIndex + 1}/{topic.words.length} • {word.gloss}
          </p>
          <div className="progress-track progress-track-wide">
            <div className="progress-fill" style={{ width: `${progressRatio}%` }} />
          </div>
        </div>
      </div>

      <div className="study-grid">
        <article className="study-card card-surface">
          <p className="eyebrow">Từ đang học</p>
          <div className="study-sticker">✨ Hôm nay mình học từ mới</div>
          <h3>{word.gloss}</h3>
          <p className="muted">
            Xem hình minh họa, nhìn video mẫu, rồi thử làm lại bằng tay của mình trước khi chuyển sang luyện.
          </p>

          <div className="topic-metrics">
            <div>
              <span className="metric-label">Checkpoint</span>
              <strong>{word.checkpoint_group === 1 ? "Nhóm 1/5" : "Nhóm 2/5"}</strong>
            </div>
            <div>
              <span className="metric-label">Reference</span>
              <strong>{word.study?.video_id ?? "sample"}</strong>
            </div>
          </div>

          <div className="kid-note">
            Mẹo nhỏ: xem video mẫu 1-2 lần trước, rồi thử bắt chước chậm rãi bằng tay của mình.
          </div>

          <button className="primary-button" type="button" onClick={onStartPractice}>
            Mình sẵn sàng luyện từ này
          </button>
        </article>

        <article className="study-card card-surface">
          <p className="eyebrow">Hình minh họa</p>
          <div className="poster-shell">
            {posterUrl ? <img src={posterUrl} alt={word.gloss} className="poster-image" /> : <div className="empty-state">Chưa có poster</div>}
          </div>
        </article>

        <article className="study-card card-surface">
          <p className="eyebrow">Video reference</p>
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
              Segment chuẩn: {referenceSegment.start_ms}ms → {referenceSegment.end_ms}ms
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
