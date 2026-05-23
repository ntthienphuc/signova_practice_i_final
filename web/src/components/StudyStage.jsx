import { Play } from "lucide-react";

function absoluteUrl(apiBase, url) {
  if (!url) {
    return "";
  }
  return new URL(url, apiBase).href;
}

export function StudyStage({
  apiBase,
  topic,
  word,
  wordIndex,
  onStartPractice,
  onBackToTopics,
  onPreviousWord,
}) {
  const posterUrl = absoluteUrl(apiBase, word.study?.poster_url);
  const referenceUrl = absoluteUrl(apiBase, word.study?.reference?.playback_url ?? word.study?.reference?.video_url);
  const referenceSegment = word.study?.reference?.segment;
  const totalWords = topic.words.length || 1;
  const progressRatio = topic.words.length > 0 ? ((wordIndex + 1) / topic.words.length) * 100 : 0;
  const checkpointLabel = word.checkpoint_group === 1 ? "Nhóm 1/5" : "Nhóm 2/5";

  return (
    <section className="learn-word-screen">
      <div className="bg-dot-grid pointer-events-none learn-word-grid" />

      <div className="learn-word-shell">
        <div className="learn-word-progress">
          <div className="learn-word-progress-head">
            <span>Học từ ký hiệu</span>
            <span>
              Từ {wordIndex + 1} / {totalWords}
            </span>
          </div>
          <div className="learn-word-progress-track">
            <div className="learn-word-progress-fill" style={{ width: `${progressRatio}%` }} />
          </div>
        </div>

        <div className="learn-word-title">
          <span className="learn-word-title-vi">{word.gloss}</span>
          <span className="learn-word-title-slash">/</span>
          <span className="learn-word-title-en">{topic.title}</span>
        </div>

        <div className="learn-word-panels">
          <article className="learn-media-card learn-media-card-poster">
            {posterUrl ? (
              <img src={posterUrl} alt={word.gloss} className="learn-media-image" />
            ) : (
              <div className="learn-media-fallback">{word.gloss}</div>
            )}
          </article>

          <article className="learn-media-card learn-media-card-video">
            {referenceUrl ? (
              <video
                src={referenceUrl}
                poster={posterUrl || undefined}
                className="learn-media-video"
                controls
                playsInline
                muted
              />
            ) : (
              <div className="learn-media-fallback">Chưa có video mẫu</div>
            )}
            <div className="learn-media-caption">
              <p>Video mẫu</p>
              <strong>{word.gloss}</strong>
            </div>
          </article>

          <article className="learn-meta-card">
            <div>
              <p className="learn-meta-label">TỪ TIẾNG VIỆT</p>
              <p className="learn-meta-value">{word.gloss}</p>
            </div>

            <div>
              <p className="learn-meta-label">CHECKPOINT</p>
              <p className="learn-meta-value accent">{checkpointLabel}</p>
            </div>

            <div className="learn-meta-badges">
              <span>{topic.title}</span>
              <span>{word.study?.video_id ?? "sample"}</span>
            </div>

            <div>
              <p className="learn-meta-label">MÔ TẢ</p>
              <p className="learn-meta-text">
                Xem kỹ hình minh họa và video mẫu của từ này trước. Sau đó bấm vào nút luyện tập để quay thử và nhận phản hồi AI.
              </p>
            </div>

            {referenceSegment ? (
              <p className="learn-meta-segment">
                Segment chuẩn: {referenceSegment.start_ms}ms → {referenceSegment.end_ms}ms
              </p>
            ) : null}
          </article>
        </div>

        <div className="learn-word-footer">
          <div className="learn-word-footer-row">
            <button
              type="button"
              onClick={wordIndex === 0 ? onBackToTopics : () => onPreviousWord?.(wordIndex - 1)}
              className="learn-nav-button learn-nav-button-secondary"
            >
              {wordIndex === 0 ? "← Quay lại topic" : "← Từ trước"}
            </button>

            <div className="learn-word-dots">
              {topic.words.map((topicWord, index) => (
                <button
                  key={topicWord.gloss}
                  type="button"
                  onClick={index < wordIndex ? () => onPreviousWord?.(index) : undefined}
                  className={index === wordIndex ? "learn-word-dot active" : "learn-word-dot"}
                  disabled={index > wordIndex}
                  aria-label={`Từ ${index + 1}`}
                />
              ))}
            </div>

            <button type="button" className="learn-nav-button learn-nav-button-primary" onClick={onStartPractice}>
              <Play size={16} />
              Luyện tập từ này
            </button>
          </div>

          <div className="learn-word-next">
            <span>Hoàn thành Practice I của từ này để mở từ tiếp theo →</span>
          </div>
        </div>
      </div>
    </section>
  );
}
