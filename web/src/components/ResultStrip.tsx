import type { NormalizedAnalysis } from "../overlay";

interface ResultStripProps {
  analysis: NormalizedAnalysis;
}

export function ResultStrip({ analysis }: ResultStripProps) {
  const { decision } = analysis.raw;
  return (
    <div className="result-strip">
      <div>
        <span className="metric-label">Score</span>
        <strong>{analysis.raw.score.toFixed(1)}</strong>
      </div>
      <div>
        <span className="metric-label">Target Rank</span>
        <strong>{analysis.raw.target_rank}</strong>
      </div>
      <div>
        <span className="metric-label">Decision</span>
        <strong>
          {decision.wrong_word_detected
            ? "Sai từ"
            : decision.accept_as_target
              ? "Đúng từ"
              : "Cần sửa"}
        </strong>
      </div>
    </div>
  );
}
