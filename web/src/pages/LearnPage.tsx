import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getVocabularyDetail, ensureBaseUrl, type VocabularyDetail } from "../api/client";
import AvatarCard from "../components/learn/AvatarCard";
import VideoCard from "../components/learn/VideoCard";
import MetaCard from "../components/learn/MetaCard";

interface NavState {
  glosses?: string[];
}

export default function LearnPage() {
  const { unitId, lessonId } = useParams<{ unitId: string; lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { glosses = [] } = (location.state ?? {}) as NavState;
  const gloss = decodeURIComponent(lessonId ?? "");
  const total = glosses.length;
  const glossIndex = glosses.indexOf(gloss);

  const [detail, setDetail] = useState<VocabularyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!gloss) return;
    setLoading(true);
    setFetchError(null);
    setDetail(null);
    getVocabularyDetail(gloss)
      .then(setDetail)
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : "Không thể tải từ vựng.");
      })
      .finally(() => setLoading(false));
  }, [gloss]);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, total - 1));
    const targetGloss = glosses[clamped];
    if (targetGloss) {
      navigate(`/learn/${unitId}/${encodeURIComponent(targetGloss)}`, {
        state: { glosses },
      });
    }
  }

  const baseUrl = ensureBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const posterUrl = detail ? `${baseUrl}${detail.poster_url}` : null;

  return (
    <div className="min-h-screen bg-dark-bg text-text-main font-sans flex flex-col">
      {/* Dot-grid overlay */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none" />

      <div className="relative flex flex-col flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8">
        {/* Progress track */}
        {total > 0 && (
          <div className="pt-10 pb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wide text-text-hint">
                Học từ ký hiệu
              </span>
              <span className="text-xs text-text-hint">
                Từ {Math.max(glossIndex, 0) + 1} / {total}
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-300"
                style={{ width: `${((Math.max(glossIndex, 0) + 1) / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Word title */}
        <div className="text-center mb-6 sm:mb-8 pt-10 pb-2">
          {loading ? (
            <span className="text-2xl sm:text-4xl font-bold text-text-hint animate-pulse">{gloss}</span>
          ) : (
            <span className="text-2xl sm:text-4xl font-bold text-text-main">{gloss}</span>
          )}
          {fetchError && (
            <p className="mt-2 text-xs text-red-400">{fetchError}</p>
          )}
        </div>

        {/* 3-panel layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-5 flex-1 pb-4">
          <AvatarCard word={gloss} image={posterUrl} />
          <VideoCard wordVi={gloss} />
          <MetaCard vi={gloss} score={detail?.score} />
        </div>

        {/* Footer navigation — only shown when glosses list is available */}
        {total > 0 && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex items-center justify-between w-full">
              {/* Prev */}
              <button
                onClick={() => goTo(glossIndex - 1)}
                disabled={glossIndex <= 0}
                className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-text-muted rounded-full px-5 py-2.5 text-sm transition-colors cursor-pointer bg-transparent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Từ trước
              </button>

              {/* Progress dots */}
              <div className="hidden sm:flex items-center gap-2">
                {glosses.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full border-0 cursor-pointer transition-all ${
                      i === glossIndex
                        ? "w-5 bg-brand-primary"
                        : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              {/* Practice CTA */}
              <button
                className="flex items-center gap-2 font-bold px-6 py-2.5 rounded-full text-sm text-white border-0 cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: "#00B092", boxShadow: "0 4px 20px rgba(0,176,146,0.2)" }}
              >
                🤸 Luyện tập từ này
              </button>
            </div>

            {/* Next */}
            <button
              onClick={() => goTo(glossIndex + 1)}
              disabled={glossIndex >= total - 1}
              className="bg-brand-primary hover:bg-brand-primaryHover text-text-main font-semibold px-8 py-3.5 rounded-full text-sm transition-colors cursor-pointer border-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 4px 12px rgba(2,132,199,0.2)" }}
            >
              Từ tiếp theo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
