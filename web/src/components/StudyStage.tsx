import { Play } from "lucide-react";
import { apiClient } from "../api/client";
import type { Topic, WordItem } from "../types/learn";

function absoluteUrl(url?: string | null): string {
  if (!url) return "";
  return new URL(url, apiClient.defaults.baseURL ?? "").href;
}

interface StudyStageProps {
  topic: Topic;
  word: WordItem;
  wordIndex: number;
  onStartPractice: () => void;
  onBackToTopics: () => void;
  onPreviousWord?: (nextIndex: number) => void;
}

export function StudyStage({
  topic,
  word,
  wordIndex,
  onStartPractice,
  onBackToTopics,
  onPreviousWord,
}: StudyStageProps) {
  const posterUrl = absoluteUrl(word.study?.poster_url);
  const referenceUrl = absoluteUrl(
    word.study?.reference?.playback_url ?? word.study?.reference?.video_url
  );
  const referenceSegment = word.study?.reference?.segment;
  const totalWords = topic.words.length || 1;
  const progressRatio = topic.words.length > 0 ? ((wordIndex + 1) / topic.words.length) * 100 : 0;
  const checkpointLabel = word.checkpoint_group === 1 ? "Nhóm 1/5" : "Nhóm 2/5";

  return (
    <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)] text-[var(--ink)]">
      <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-100" />

      <div className="relative flex flex-col min-h-screen max-w-[1440px] mx-auto px-8 pt-10 pb-8">
        <button
          type="button"
          onClick={onBackToTopics}
          className="absolute top-4 right-4 py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-xl text-xs transition-all border-0 cursor-pointer flex items-center gap-1 z-10 shadow-sm"
        >
          🚪 Thoát
        </button>

        {/* Progress */}
        <div className="pt-2 pb-6">
          <div className="flex items-center justify-between mb-3 text-[#7b8aa3] text-[0.8rem] font-bold tracking-[0.08em] uppercase">
            <span>Học từ ký hiệu</span>
            <span>Từ {wordIndex + 1} / {totalWords}</span>
          </div>
          <div className="w-full h-1 overflow-hidden rounded-full bg-[rgba(83,110,249,0.12)]">
            <div className="h-full rounded-[inherit] bg-[#0284c7] transition-[width_180ms_ease]" style={{ width: `${progressRatio}%` }} />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <span className="text-[clamp(2.2rem,5vw,3rem)] font-extrabold leading-[1.08] text-[#233157]">{word.gloss}</span>
          <span className="text-[clamp(2.2rem,5vw,3rem)] font-extrabold leading-[1.08] mx-3 text-[#90a0bb]">/</span>
          <span className="text-[clamp(2.2rem,5vw,3rem)] font-extrabold leading-[1.08] text-[#5f8efb]">{topic.title}</span>
        </div>

        {/* Panels */}
        <div className="flex items-center justify-center gap-5 flex-1 pb-4 flex-wrap">
          {/* Poster card */}
          <article className="flex-shrink-0 overflow-hidden border border-[rgba(83,110,249,0.1)] rounded-[24px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] relative w-full max-w-[380px] aspect-square bg-white/[0.92] flex items-center justify-center">
            {posterUrl ? (
              <img src={posterUrl} alt={word.gloss} className="w-full h-full object-cover block" />
            ) : (
              <div className="p-6 text-[rgba(35,49,87,0.12)] text-6xl font-extrabold text-center leading-[1.1]">{word.gloss}</div>
            )}
          </article>

          {/* Video card */}
          <article className="flex-shrink-0 overflow-hidden border border-[rgba(83,110,249,0.1)] rounded-[24px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] relative w-full max-w-[380px] aspect-square bg-white/[0.96]">
            {referenceUrl ? (
              <video
                src={referenceUrl}
                poster={posterUrl || undefined}
                className="w-full h-full object-cover block"
                controls
                playsInline
                muted
              />
            ) : (
              <div className="p-6 text-[rgba(35,49,87,0.12)] text-6xl font-extrabold text-center leading-[1.1]">Chưa có video mẫu</div>
            )}
            <div className="absolute right-0 bottom-0 left-0 top-0 p-3 text-center pointer-events-none">
              <p className="m-0 text-[#75839a] text-[0.8rem]">Video mẫu</p>
              <strong className="text-[#223153] text-[0.95rem]">{word.gloss}</strong>
            </div>
          </article>

          {/* Meta card */}
          <article className="flex-shrink-0 overflow-hidden border border-[rgba(83,110,249,0.1)] rounded-[24px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] w-full max-w-[380px] min-h-[380px] p-6 bg-white/[0.94] flex flex-col gap-[18px]">
            <div>
              <p className="m-0 mb-1.5 text-[#7c8aa2] text-[0.72rem] font-bold tracking-[0.14em] uppercase">TỪ TIẾNG VIỆT</p>
              <p className="m-0 text-[#223153] text-[1.35rem] font-extrabold">{word.gloss}</p>
            </div>

            <div>
              <p className="m-0 mb-1.5 text-[#7c8aa2] text-[0.72rem] font-bold tracking-[0.14em] uppercase">CHECKPOINT</p>
              <p className="m-0 text-[#5f8efb] text-[1.35rem] font-extrabold">{checkpointLabel}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full border border-[rgba(83,110,249,0.16)] bg-[rgba(83,110,249,0.08)] text-[#5f8efb] text-[0.82rem] font-bold">{topic.title}</span>
              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full border border-[rgba(83,110,249,0.16)] bg-[rgba(83,110,249,0.08)] text-[#5f8efb] text-[0.82rem] font-bold">{word.study?.video_id ?? "sample"}</span>
            </div>

            <div>
              <p className="m-0 mb-1.5 text-[#7c8aa2] text-[0.72rem] font-bold tracking-[0.14em] uppercase">MÔ TẢ</p>
              <p className="m-0 text-[#6d7b92] leading-[1.7]">
                Xem kỹ hình minh họa và video mẫu của từ này trước. Sau đó bấm vào nút luyện tập để
                quay thử và nhận phản hồi AI.
              </p>
            </div>

            {referenceSegment ? (
              <p className="m-0 text-[#6d7b92] leading-[1.7]">
                Segment chuẩn: {referenceSegment.start_ms}ms → {referenceSegment.end_ms}ms
              </p>
            ) : null}
          </article>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 pt-7 pb-2">
          <div className="flex items-center justify-between w-full gap-4">
            <button
              type="button"
              onClick={wordIndex === 0 ? onBackToTopics : () => onPreviousWord?.(wordIndex - 1)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border border-[rgba(83,110,249,0.14)] rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-white/[0.84] text-[#657594]"
            >
              {wordIndex === 0 ? "← Quay lại topic" : "← Từ trước"}
            </button>

            <div className="flex items-center gap-2">
              {topic.words.map((topicWord, index) => (
                <button
                  key={topicWord.gloss}
                  type="button"
                  onClick={index < wordIndex ? () => onPreviousWord?.(index) : undefined}
                  className={
                    index === wordIndex
                      ? "w-5 h-2 p-0 border-0 rounded-full bg-[#5c72fb] cursor-pointer transition-all"
                      : "w-2 h-2 p-0 border-0 rounded-full bg-[rgba(83,110,249,0.18)] cursor-pointer transition-all disabled:cursor-default disabled:opacity-60"
                  }
                  disabled={index > wordIndex}
                  aria-label={`Từ ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border-0 rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-gradient-to-br from-[#5c72fb] to-[#67bfff] text-white shadow-[0_10px_28px_rgba(92,114,251,0.26)]"
              onClick={onStartPractice}
            >
              <Play size={16} />
              Luyện tập từ này
            </button>
          </div>

          <div className="text-[#6d7b92] text-[0.95rem] text-center">
            <span>Hoàn thành Practice I của từ này để mở từ tiếp theo →</span>
          </div>
        </div>
      </div>
    </section>
  );
}
