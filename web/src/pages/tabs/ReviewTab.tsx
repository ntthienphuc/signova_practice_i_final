import { PracticeWorkspace } from "../../components/PracticeWorkspace";
import type { AppTab } from "../../types/learn";

interface ReviewTabProps {
  currentUser: any;
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

export function ReviewTab({
  currentUser,
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
  if (!currentUser) {
    return (
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7 text-center py-12">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">🔑 Yêu cầu đăng nhập</p>
        <h2>Hãy đăng nhập học sinh để sử dụng tính năng luyện tập</h2>
        <p className="text-[var(--ink-soft)] leading-[1.62] mb-6">
          Tính năng này giúp bạn xem lại các từ đã học, thống kê số lần sai và luyện tập lại để tăng điểm số.
        </p>
        <button
          onClick={onOpenAuth}
          type="button"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-bold rounded-xl border-0 cursor-pointer shadow-lg hover:shadow-indigo-200 transition-all"
        >
          Đăng nhập / Đăng ký ngay
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
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Đang tải</p>
        <h2>Đang tải danh sách từ cần ôn tập...</h2>
      </section>
    );
  }

  if (reviewError) {
    return (
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Lỗi</p>
        <h2>Không thể tải danh sách ôn tập</h2>
        <p className="text-[#b33f47]">{reviewError}</p>
        <button onClick={onLoadReviewData} className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer mt-4">Tải lại</button>
      </section>
    );
  }

  const failedWordsCount = reviewWords.filter((w) => w.failed_attempt_count > 0).length;

  return (
    <section className="space-y-6">
      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-indigo-600 font-bold">Tab Luyện Tập</p>
        <h2>Ôn tập các từ đã học</h2>
        <p className="text-[var(--ink-soft)] leading-[1.62]">
          Xếp hạng các từ theo số lần làm sai nhiều nhất. Hãy luyện tập lại những từ khó để thành thạo hơn nhé!
        </p>

        <div className="flex gap-4 mt-6 text-sm">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 flex-1">
            <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider">Đã học</span>
            <strong className="text-2xl text-indigo-700 font-bold block mt-1">{reviewWords.length} từ</strong>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 flex-1">
            <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider">Từ hay sai</span>
            <strong className="text-2xl text-rose-700 font-bold block mt-1">{failedWordsCount} từ</strong>
          </div>
        </div>
      </div>

      {reviewWords.length === 0 ? (
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7 text-center py-16">
          <p className="text-slate-400 mb-4 text-sm font-semibold">Bạn chưa học từ nào trong bất kỳ Topic nào.</p>
          <button
            onClick={() => onSetActiveTab("learn")}
            type="button"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border-0 cursor-pointer transition-colors text-sm"
          >
            Qua tab Học ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviewWords.map((word) => {
            const failed = word.failed_attempt_count || 0;
            const correct = word.correct_attempt_count || 0;
            const bestScore = word.best_practice1_score !== null ? Math.round(word.best_practice1_score) : null;
            const lastScore = word.last_practice1_score !== null ? Math.round(word.last_practice1_score) : null;
            const isFailedMuch = failed >= 2;

            return (
              <div
                key={word.word_id}
                className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {word.accepted_once && (lastScore === null || lastScore >= 68) ? (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Đã Đạt
                  </div>
                ) : word.accepted_once && lastScore !== null && lastScore < 68 ? (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Cần Ôn Tập
                  </div>
                ) : !word.accepted_once && isFailedMuch ? (
                  <div className="absolute top-0 right-0 bg-rose-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Cần Cải Thiện
                  </div>
                ) : !word.accepted_once && failed > 0 ? (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                    Đang Luyện Tập
                  </div>
                ) : null}
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{word.gloss}</h3>
                  <div className="grid grid-cols-2 gap-3 my-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <div>
                      ❌ Sai nhiều: <strong className="text-rose-600">{failed} lần</strong>
                    </div>
                    <div>
                       Đúng: <strong className="text-emerald-600">{correct} lần</strong>
                    </div>
                    <div>
                      ⭐ Luyện tốt nhất: <strong>{bestScore !== null ? `${bestScore}đ` : "--"}</strong>
                    </div>
                    <div>
                       Lần cuối: <strong>{lastScore !== null ? `${lastScore}đ` : "--"}</strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onStartReviewPractice(word.gloss)}
                  disabled={loadingReviewWord === word.gloss}
                  type="button"
                  className="w-full py-2.5 bg-indigo-55 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 disabled:text-slate-400 font-bold rounded-xl text-xs transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loadingReviewWord === word.gloss ? (
                    <span className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Luyện tập lại
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
