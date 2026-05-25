import { Play, ChevronLeft, ChevronRight } from "lucide-react";
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
  isAlreadyLearned?: boolean;
  onNextWord?: () => void;
}

export function StudyStage({
  topic,
  word,
  wordIndex,
  onStartPractice,
  onBackToTopics,
  onPreviousWord,
  isAlreadyLearned,
  onNextWord,
}: StudyStageProps) {
  const posterUrl = absoluteUrl(word.study?.poster_url);
  const referenceUrl = absoluteUrl(
    word.study?.reference?.playback_url ?? word.study?.reference?.video_url
  );
  const totalWords = topic.words.length || 1;
  const progressRatio = topic.words.length > 0 ? ((wordIndex + 1) / topic.words.length) * 100 : 0;

  return (
    <section className="relative min-h-screen bg-[#f0f6ff] text-[#1e2742] font-sans">
      {/* Top bar: back + progress */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b-2 border-slate-200">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToTopics}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Progress track */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">📖 {topic.title}</span>
              <span className="text-xs font-black text-[#1cb0f6]">{wordIndex + 1} / {totalWords}</span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full rounded-full bg-[#1cb0f6] transition-all duration-500 ease-out"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>

          {/* Dot nav */}
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {topic.words.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={index < wordIndex ? () => onPreviousWord?.(index) : undefined}
                disabled={index > wordIndex}
                className={`rounded-full border-0 transition-all p-0 ${
                  index === wordIndex
                    ? "w-5 h-2.5 bg-[#1cb0f6] cursor-default"
                    : index < wordIndex
                    ? "w-2.5 h-2.5 bg-[#1cb0f6]/40 cursor-pointer hover:bg-[#1cb0f6]/70"
                    : "w-2.5 h-2.5 bg-slate-200 cursor-not-allowed"
                }`}
                aria-label={`Từ ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-4 pt-6 pb-[180px] sm:pb-[100px]">
        {/* Word title — giant, Duolingo-style */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#1cb0f6]/10 px-4 py-1.5 rounded-full mb-3">
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-wider">Từ {wordIndex + 1}</span>
            {isAlreadyLearned && (
              <span className="text-xs font-black bg-[#58cc02] text-white px-2 py-0.5 rounded-full">Đã học ✓</span>
            )}
          </div>
          <h1 className="font-black text-[#1cb0f6] leading-none m-0 select-none tracking-tight" style={{ fontSize: 'clamp(3rem, 12vw, 6rem)' }}>
            {word.gloss}
          </h1>
          <p className="text-slate-500 font-bold text-sm sm:text-base mt-2">
            Chủ đề: <span className="text-slate-700 font-black">{topic.title}</span>
          </p>
        </div>

        {/* Media cards: image + video side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          {/* Poster */}
          <div className="bg-white border-2 border-b-4 border-[#58cc02]/40 rounded-[28px] overflow-hidden relative">
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-[#58cc02] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl">
                🖼️ Hình minh họa
              </span>
            </div>
            <div className="aspect-square">
              {posterUrl ? (
                <img src={posterUrl} alt={word.gloss} className="w-full h-full object-cover block" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-slate-200 font-black">
                  {word.gloss[0]}
                </div>
              )}
            </div>
          </div>

          {/* Video */}
          <div className="bg-white border-2 border-b-4 border-[#1cb0f6]/40 rounded-[28px] overflow-hidden relative">
            <div className="absolute top-3 left-3 z-10">
              <span className="bg-[#1cb0f6] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl">
                📺 Video mẫu
              </span>
            </div>
            <div className="aspect-square">
              {referenceUrl ? (
                <video
                  src={referenceUrl}
                  poster={posterUrl || undefined}
                  className="w-full h-full object-cover block bg-white"
                  controls
                  playsInline
                  muted
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-lg">
                  Chưa có video mẫu
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tip box - hidden on small mobile */}
        <div className="hidden sm:flex bg-[#fff8ee] border-2 border-b-4 border-[#ff9600]/30 rounded-2xl px-5 py-3 items-center gap-3 mb-6">
          <span className="text-2xl">💡</span>
          <p className="text-sm font-bold text-[#a06010] m-0">
            Xem kỹ video mẫu rồi hãy thực hành. Để ý hướng tay và cử động của người mẫu nhé!
          </p>
        </div>
      </div>

      {/* Sticky bottom action bar — clears mobile bottom nav */}
      <div className="fixed bottom-[72px] sm:bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200">
        <div className="max-w-[900px] mx-auto px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={wordIndex === 0 ? onBackToTopics : () => onPreviousWord?.(wordIndex - 1)}
            className="h-12 sm:h-14 px-4 sm:px-5 bg-white border-2 border-b-4 border-slate-200 text-slate-600 font-black rounded-2xl cursor-pointer flex items-center gap-1 sm:gap-1.5 hover:bg-slate-50 active:border-b-0 active:translate-y-[2px] transition-all text-sm flex-shrink-0"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">{wordIndex === 0 ? "Topics" : "Trước"}</span>
          </button>

          {isAlreadyLearned && onNextWord && (
            <button
              type="button"
              onClick={onNextWord}
              className="h-12 sm:h-14 px-4 sm:px-5 bg-white border-2 border-b-4 border-slate-200 text-[#1cb0f6] font-black rounded-2xl cursor-pointer flex items-center gap-1 sm:gap-1.5 hover:bg-sky-50 active:border-b-0 active:translate-y-[2px] transition-all text-sm flex-shrink-0"
            >
              <span className="hidden sm:inline">Bỏ qua</span>
              <ChevronRight size={18} />
            </button>
          )}

          {/* Main practice button */}
          <button
            type="button"
            className="flex-1 h-12 sm:h-14 bg-[#58cc02] border-b-4 border-[#46a302] text-white font-black rounded-2xl cursor-pointer flex items-center justify-center gap-2 hover:bg-[#61e002] active:border-b-0 active:translate-y-[3px] transition-all text-sm sm:text-base"
            onClick={onStartPractice}
          >
            <Play size={18} fill="white" />
            {isAlreadyLearned ? "Luyện lại" : "Luyện tập ngay! 💪"}
          </button>
        </div>
      </div>
    </section>
  );
}
