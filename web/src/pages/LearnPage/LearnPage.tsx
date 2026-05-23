import { useNavigate, useParams } from "react-router-dom";
import { words } from "../../data/learnData";
import AvatarCard from "../../components/learn/AvatarCard";
import VideoCard from "../../components/learn/VideoCard";
import MetaCard from "../../components/learn/MetaCard";


export default function LearnPage() {
  const { unitId, lessonId } = useParams<{ unitId: string; lessonId: string }>();
  const navigate = useNavigate();

  const total = words.length;
  const wordIndex = Math.max(0, Math.min(Number(lessonId ?? 0), total - 1));
  const word = words[wordIndex] ?? words[0];
  const unitNum = unitId ?? "1";

  function goTo(index: number) {
    navigate(`/learn/${unitNum}/${Math.max(0, Math.min(index, total - 1))}`);
  }

  return (
    <div className="min-h-screen bg-dark-bg text-text-main font-sans flex flex-col">
      {/* Dot-grid overlay */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none" />

      <div className="relative flex flex-col flex-1 max-w-6xl mx-auto w-full px-8">
        {/* Progress track */}
        <div className="pt-10 pb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide text-text-hint">
              Học từ ký hiệu
            </span>
            <span className="text-xs text-text-hint">
              Từ {wordIndex + 1} / {total}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-300"
              style={{ width: `${((wordIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Word title */}
        <div className="text-center mb-8">
          <span className="text-4xl font-bold text-text-main">{word.vi}</span>
          <span className="text-4xl font-bold text-text-muted mx-3">/</span>
          <span className="text-4xl font-bold text-brand-primaryLight">{word.en}</span>
        </div>

        {/* 3-panel layout */}
        <div className="flex items-center justify-center gap-5 flex-1 pb-4">
          <AvatarCard word={word.vi} image={word.image} />
          <VideoCard wordVi={word.vi} wordEn={word.en} />
          <MetaCard word={word} />
        </div>

        {/* Footer navigation */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex items-center justify-between w-full">
            {/* Prev */}
            <button
              onClick={() => goTo(wordIndex - 1)}
              disabled={wordIndex === 0}
              className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-text-muted rounded-full px-5 py-2.5 text-sm transition-colors cursor-pointer bg-transparent disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Từ trước
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {words.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full border-0 cursor-pointer transition-all ${
                    i === wordIndex
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
            onClick={() => goTo(wordIndex + 1)}
            disabled={wordIndex === total - 1}
            className="bg-brand-primary hover:bg-brand-primaryHover text-text-main font-semibold px-8 py-3.5 rounded-full text-sm transition-colors cursor-pointer border-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 4px 12px rgba(2,132,199,0.2)" }}
          >
            Từ tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
