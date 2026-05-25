import { PracticeWorkspace } from "../../components/PracticeWorkspace";
import type { AppTab } from "../../types/learn";
import { useAuth } from "../../contexts/AuthContext";
import { mascots } from "../../utils/mascot";

interface ReviewTabProps {
  activeReviewWord: any;
  loadingReview: boolean;
  reviewError: string;
  reviewWords: any[];
  loadingReviewWord: string | null;
  onOpenAuth: () => void;
  onSetActiveTab: (tab: AppTab) => void;
  onStartReviewPractice: (gloss: string) => void;
  onLoadReviewData: () => void;
  onClearActiveReviewWord: () => void;
  onCompleteReview: () => Promise<void>;
}

function categorizeWord(word: any): "need_practice" | "improving" | "mastered" {
  const lastScore = word.last_practice1_score !== null ? Math.round(word.last_practice1_score) : null;
  const failed = word.failed_attempt_count || 0;
  if (word.accepted_once && (lastScore === null || lastScore >= 75)) return "mastered";
  if (lastScore !== null && lastScore >= 55) return "improving";
  return "need_practice";
}

function WordCard({
  word,
  loadingReviewWord,
  onStartReviewPractice,
}: {
  word: any;
  loadingReviewWord: string | null;
  onStartReviewPractice: (gloss: string) => void;
}) {
  const failed = word.failed_attempt_count || 0;
  const correct = word.correct_attempt_count || 0;
  const bestScore = word.best_practice1_score !== null ? Math.round(word.best_practice1_score) : null;
  const lastScore = word.last_practice1_score !== null ? Math.round(word.last_practice1_score) : null;
  const cat = categorizeWord(word);
  const isLoading = loadingReviewWord === word.gloss;

  const catConfig = {
    need_practice: {
      border: "border-[#ef5d66]",
      badge: "bg-[#ef5d66] text-white",
      badgeText: "Cần luyện",
      btnBg: "bg-[#ef5d66] border-b-2 border-[#c94040] text-white hover:bg-[#f47070]",
      btnLabel: "🔥 Luyện ngay!",
      scoreColor: "text-[#ef5d66]",
    },
    improving: {
      border: "border-[#ff9600]",
      badge: "bg-[#ff9600] text-white",
      badgeText: "Đang tiến bộ",
      btnBg: "bg-[#ff9600] border-b-2 border-[#cc7a00] text-white hover:bg-[#ffb133]",
      btnLabel: "📈 Luyện thêm",
      scoreColor: "text-[#ff9600]",
    },
    mastered: {
      border: "border-[#58cc02]",
      badge: "bg-[#58cc02] text-white",
      badgeText: "Thành thạo ⭐",
      btnBg: "bg-white border-2 border-b-2 border-slate-200 text-[#58cc02] hover:bg-green-50",
      btnLabel: "✅ Ôn lại",
      scoreColor: "text-[#58cc02]",
    },
  }[cat];

  return (
    <div className={`bg-white rounded-[24px] border-2 border-b-4 ${catConfig.border} p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]`}>
      {/* Word name + badge */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-2xl font-black text-slate-800 m-0">{word.gloss}</h3>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${catConfig.badge}`}>
          {catConfig.badgeText}
        </span>
      </div>

      {/* Score + stats row */}
      <div className="flex gap-3 text-sm font-bold">
        {lastScore !== null && (
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] uppercase text-slate-400 font-black tracking-wider">Điểm gần nhất</div>
            <strong className={`text-xl font-black block mt-0.5 ${catConfig.scoreColor}`}>{lastScore}đ</strong>
          </div>
        )}
        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
          <div className="text-[10px] uppercase text-slate-400 font-black tracking-wider">Đúng / Sai</div>
          <strong className="text-base font-black block mt-0.5 text-slate-700">
            <span className="text-[#58cc02]">{correct}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-[#ef5d66]">{failed}</span>
          </strong>
        </div>
        {bestScore !== null && (
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] uppercase text-slate-400 font-black tracking-wider">Cao nhất</div>
            <strong className="text-xl font-black block mt-0.5 text-[#1cb0f6]">{bestScore}đ</strong>
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        onClick={() => onStartReviewPractice(word.gloss)}
        disabled={isLoading}
        type="button"
        className={`w-full py-3 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:translate-y-[2px] active:border-b-0 disabled:opacity-50 ${catConfig.btnBg}`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : catConfig.btnLabel}
      </button>
    </div>
  );
}

function SectionGroup({
  title,
  emoji,
  words,
  color,
  loadingReviewWord,
  onStartReviewPractice,
}: {
  title: string;
  emoji: string;
  words: any[];
  color: string;
  loadingReviewWord: string | null;
  onStartReviewPractice: (gloss: string) => void;
}) {
  if (words.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 px-1`}>
        <span className="text-2xl">{emoji}</span>
        <div>
          <h3 className={`text-lg font-black m-0 ${color}`}>{title}</h3>
          <span className="text-xs text-slate-500 font-bold">{words.length} từ</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {words.map((word) => (
          <WordCard
            key={word.word_id}
            word={word}
            loadingReviewWord={loadingReviewWord}
            onStartReviewPractice={onStartReviewPractice}
          />
        ))}
      </div>
    </div>
  );
}

export function ReviewTab({
  activeReviewWord,
  loadingReview,
  reviewError,
  reviewWords,
  loadingReviewWord,
  onOpenAuth,
  onSetActiveTab,
  onStartReviewPractice,
  onLoadReviewData,
  onClearActiveReviewWord,
  onCompleteReview,
}: ReviewTabProps) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return (
      <section className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-8 text-center py-16">
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="m-0 font-black text-slate-800 text-2xl">Đăng nhập để luyện tập</h2>
        <p className="text-slate-500 font-bold mt-2 max-w-xs mx-auto text-sm">
          Xem lại các từ đã học và luyện tập những từ còn yếu nhé!
        </p>
        <button
          onClick={onOpenAuth}
          type="button"
          className="px-6 py-3 bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[3px] transition-all text-base mt-6"
        >
          Đăng nhập ngay 🚀
        </button>
      </section>
    );
  }

  if (activeReviewWord) {
    return (
      <PracticeWorkspace
        mode="practice_i"
        targetGloss={activeReviewWord.gloss}
        lessonGlosses={[activeReviewWord.gloss]}
        referenceStudy={activeReviewWord.study}
        wordIndex={0}
        wordCount={1}
        title={`Ôn tập • ${activeReviewWord.gloss}`}
        subtitle="Tập lại ký hiệu này bằng cách quay video và kiểm tra kết quả."
        actionLabel="Phân tích lại"
        completionLabel="Hoàn thành ôn tập"
        onBackToLearn={onClearActiveReviewWord}
        onComplete={onCompleteReview}
      />
    );
  }

  if (loadingReview) {
    return (
      <section className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-12 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-[#1cb0f6] animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-black text-base">Đang tải danh sách từ...</p>
      </section>
    );
  }

  if (reviewError) {
    return (
      <section className="bg-white border-2 border-b-4 border-rose-200 rounded-[28px] p-8 text-center">
        <div className="text-5xl mb-3">😢</div>
        <h2 className="m-0 mt-1 font-black text-slate-800 text-xl">Không thể tải danh sách</h2>
        <p className="text-rose-500 font-bold text-sm mt-2">{reviewError}</p>
        <button
          onClick={onLoadReviewData}
          className="px-5 py-2.5 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px] transition-all text-sm mt-4"
        >
          Tải lại
        </button>
      </section>
    );
  }

  const needPractice = reviewWords.filter((w) => categorizeWord(w) === "need_practice");
  const improving = reviewWords.filter((w) => categorizeWord(w) === "improving");
  const mastered = reviewWords.filter((w) => categorizeWord(w) === "mastered");

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-6">
        <p className="m-0 text-sm uppercase tracking-[0.18em] text-[#1cb0f6] font-black">🏋️ Luyện Tập</p>
        <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">Ôn lại từ đã học</h2>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-[#fff0f0] border-2 border-b-4 border-[#ef5d66]/30 rounded-2xl px-3 py-3 text-center">
            <div className="text-2xl font-black text-[#ef5d66]">{needPractice.length}</div>
            <div className="text-[10px] font-black text-[#ef5d66]/80 uppercase tracking-wider mt-0.5">Cần luyện</div>
          </div>
          <div className="bg-[#fff8ee] border-2 border-b-4 border-[#ff9600]/30 rounded-2xl px-3 py-3 text-center">
            <div className="text-2xl font-black text-[#ff9600]">{improving.length}</div>
            <div className="text-[10px] font-black text-[#ff9600]/80 uppercase tracking-wider mt-0.5">Tiến bộ</div>
          </div>
          <div className="bg-[#f0fff4] border-2 border-b-4 border-[#58cc02]/30 rounded-2xl px-3 py-3 text-center">
            <div className="text-2xl font-black text-[#58cc02]">{mastered.length}</div>
            <div className="text-[10px] font-black text-[#58cc02]/80 uppercase tracking-wider mt-0.5">Thành thạo</div>
          </div>
        </div>
      </div>

      {reviewWords.length === 0 ? (
        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-10 text-center select-none flex flex-col items-center justify-center">
          <img 
            src={mascots[7]} 
            alt="No Review Words Mascot" 
            className="w-32 h-32 object-contain animate-bounce-subtle mb-4" 
            style={{ 
              animationDuration: '4s',
              filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08))"
            }} 
          />
          <h3 className="font-black text-slate-700 text-xl m-0">Chưa có từ nào để ôn tập</h3>
          <p className="text-slate-500 font-bold text-sm mt-2">Bé hãy hoàn thành học vài từ mới ở phần học để bắt đầu ôn tập nhé! ✨</p>
          <button
            onClick={() => onSetActiveTab("learn")}
            type="button"
            className="px-6 py-3 bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[3px] transition-all text-base mt-5"
          >
            Đi học ngay thôi 🚀
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <SectionGroup
            title="Cần luyện tập"
            emoji="🔥"
            words={needPractice}
            color="text-[#ef5d66]"
            loadingReviewWord={loadingReviewWord}
            onStartReviewPractice={onStartReviewPractice}
          />
          <SectionGroup
            title="Đang tiến bộ"
            emoji="📈"
            words={improving}
            color="text-[#ff9600]"
            loadingReviewWord={loadingReviewWord}
            onStartReviewPractice={onStartReviewPractice}
          />
          <SectionGroup
            title="Đã thành thạo"
            emoji="⭐"
            words={mastered}
            color="text-[#58cc02]"
            loadingReviewWord={loadingReviewWord}
            onStartReviewPractice={onStartReviewPractice}
          />
        </div>
      )}
    </section>
  );
}
