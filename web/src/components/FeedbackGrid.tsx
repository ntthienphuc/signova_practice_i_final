import type { AppConfig } from "../api/index";
import type { NormalizedAnalysis } from "../overlay";

interface FeedbackGridProps {
  analysis: NormalizedAnalysis | null;
  config: AppConfig | null;
}

export function FeedbackGrid({ analysis, config }: FeedbackGridProps) {
  const decision = analysis?.raw.decision;

  return (
    <div className="feedback-grid">
      <section className="feedback-card">
        <h3>Kết luận</h3>
        {decision ? (
          <>
            <p>{analysis?.raw.feedback.overall}</p>
            <ul className="flat-list">
              <li>accept_as_target: {String(decision.accept_as_target)}</li>
              <li>possible_wrong_word: {String(decision.possible_wrong_word)}</li>
              <li>wrong_word_detected: {String(decision.wrong_word_detected)}</li>
              {decision.predicted_wrong_gloss ? (
                <li>predicted_wrong_gloss: {decision.predicted_wrong_gloss}</li>
              ) : null}
            </ul>
          </>
        ) : (
          <p className="muted">Chưa có kết quả.</p>
        )}
      </section>

      <section className="feedback-card">
        <h3>Main errors</h3>
        {analysis?.raw.feedback.main_errors.length ? (
          <ul className="flat-list">
            {analysis.raw.feedback.main_errors.map((item) => (
              <li key={item.body_part}>
                <strong>{item.body_part}</strong>: {item.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Không có lỗi lớn.</p>
        )}
      </section>

      <section className="feedback-card">
        <h3>Bank</h3>
        <p className="muted">
          Active glosses: {config?.glosses.length ?? 0}. Practice II random lesson lấy từ bank 20
          gloss này.
        </p>
        <div className="lesson-grid">
          {(config?.glosses ?? []).map((item) => (
            <span key={item} className="lesson-pill">
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
