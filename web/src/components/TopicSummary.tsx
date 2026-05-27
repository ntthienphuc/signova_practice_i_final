import type { PracticeSession, Topic } from "../types/learn";

interface TopicSummaryProps {
  topic: Topic;
  session: PracticeSession;
  onRestartTopic: () => void;
  onBackToTopics: () => void;
}

export function TopicSummary({
  topic,
  session,
  onRestartTopic,
  onBackToTopics,
}: TopicSummaryProps) {
  const practiceOneResults = Object.values(session.practiceResults ?? {});
  const quiz5 = session.quiz5Results ?? [];
  const quiz10 = session.finalQuizResults ?? [];

  const practiceOnePassed = practiceOneResults.filter((item) => item?.decision?.accept_as_target).length;
  const quiz5Passed = quiz5.filter((item) => item?.decision?.accept_as_target).length;
  const quiz10Passed = quiz10.filter((item) => item?.decision?.accept_as_target).length;

  return (
    <section className="grid gap-6">
      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] grid gap-[18px] p-[34px] bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,255,0.96))]">
        <div className="grid gap-[10px]">
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-sky-600 font-extrabold">Topic Summary</p>
          <div className="inline-flex items-center rounded-full py-2 px-3 font-bold text-[0.92rem] bg-emerald-100 text-emerald-800">🎉 Xong một topic rồi!</div>
          <h2>{topic.title}</h2>
          <p className="text-[var(--ink-soft)] leading-[1.62]">
            Bạn đã học xong {topic.word_count} từ, hoàn thành Practice I từng từ, hai bài ôn tập 5 từ,
            và bài Practice II tổng kết 10 từ.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer" type="button" onClick={onBackToTopics}>
            Về danh sách topics
          </button>
          <button className="border border-[rgba(53,84,128,0.08)] rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-white/[0.84] text-[var(--ink)] hover:-translate-y-px cursor-pointer" type="button" onClick={onRestartTopic}>
            Học lại topic này
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        <article className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6">
          <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Practice I</span>
          <strong>
            {practiceOnePassed}/{practiceOneResults.length || topic.word_count}
          </strong>
          <p className="text-[var(--ink-soft)] leading-[1.62]">Số từ được accept trực tiếp khi luyện từng từ.</p>
        </article>
        <article className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6">
          <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Practice II - ôn 5 từ</span>
          <strong>
            {quiz5Passed}/{quiz5.length || 5}
          </strong>
          <p className="text-[var(--ink-soft)] leading-[1.62]">Hai checkpoint: 5 từ đầu và 5 từ sau.</p>
        </article>
        <article className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6">
          <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Practice II - 10 từ</span>
          <strong>
            {quiz10Passed}/{quiz10.length || 10}
          </strong>
          <p className="text-[var(--ink-soft)] leading-[1.62]">Bài tổng kết cuối topic trên toàn bộ 10 từ.</p>
        </article>
      </div>

      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-indigo-600 font-extrabold">Danh sách từ</p>
        <div className="flex flex-wrap gap-[10px]">
          {topic.glosses.map((gloss) => (
            <span key={gloss} className="inline-flex items-center px-[14px] py-[10px] rounded-full bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white border-transparent text-[1rem] font-bold">
              {gloss}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
