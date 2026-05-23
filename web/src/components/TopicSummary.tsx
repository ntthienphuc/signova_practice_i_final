import type { Topic } from "../types/learn";
import type { Decision, FeedbackBlock, PracticeMode } from "../api";

export interface AnalysisSummary {
  target_gloss: string;
  practice_mode: PracticeMode;
  score: number;
  decision: Decision;
  feedback: FeedbackBlock;
  classifier: null;
}

interface SessionSummary {
  practiceResults: Record<string, AnalysisSummary | undefined>;
  quiz5Results: AnalysisSummary[];
  finalQuizResults: AnalysisSummary[];
}

interface TopicSummaryProps {
  topic: Topic;
  session: SessionSummary;
  onRestartTopic: () => void;
  onBackToTopics: () => void;
}

const CARD_SURFACE = "bg-[rgba(255,252,248,0.92)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px]";

export function TopicSummary({ topic, session, onRestartTopic, onBackToTopics }: TopicSummaryProps) {
  const practiceOneResults = Object.values(session.practiceResults ?? {});
  const quiz5 = session.quiz5Results ?? [];
  const quiz10 = session.finalQuizResults ?? [];

  const practiceOnePassed = practiceOneResults.filter((item) => item?.decision?.accept_as_target).length;
  const quiz5Passed = quiz5.filter((item) => item?.decision?.accept_as_target).length;
  const quiz10Passed = quiz10.filter((item) => item?.decision?.accept_as_target).length;

  return (
    <section className="grid gap-6">
      <div className={`${CARD_SURFACE} grid gap-[18px] p-[34px] !rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(255,207,148,0.18),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,255,0.96))]`}>
        <div className="grid gap-[10px]">
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Topic Summary</p>
          <div className="inline-flex items-center rounded-full px-3 py-2 font-bold text-[0.92rem] bg-[#ffdff1] text-[#a8517e]">
            🎉 Xong một topic rồi!
          </div>
          <h2
            className="mt-[10px] mb-[14px] text-[clamp(2.2rem,3vw,3rem)] leading-[1.06] tracking-[-0.04em]"
            style={{ fontFamily: '"Baloo 2", Nunito, sans-serif' }}
          >
            {topic.title}
          </h2>
          <p className="text-[#66758a] leading-[1.62]">
            Bạn đã học xong {topic.word_count} từ, hoàn thành Practice I từng từ, checkpoint 5 từ,
            và bài Practice II tổng kết 10 từ.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="border-0 rounded-full min-h-[48px] px-5 font-extrabold transition-all duration-[160ms] bg-[linear-gradient(135deg,#536ef9,#68c6ff)] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px"
            type="button"
            onClick={onBackToTopics}
          >
            Về danh sách topics
          </button>
          <button
            className="rounded-full min-h-[48px] px-5 font-extrabold transition-all duration-[160ms] bg-white/[0.84] border border-[rgba(53,84,128,0.08)] text-[#1e2742] hover:-translate-y-px"
            type="button"
            onClick={onRestartTopic}
          >
            Học lại topic này
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
        <article className={`${CARD_SURFACE} p-6 !rounded-[24px]`}>
          <span className="block text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Practice I</span>
          <strong className="block text-[2rem]">{practiceOnePassed}/{practiceOneResults.length || topic.word_count}</strong>
          <p className="text-[#66758a] leading-[1.62]">Số từ được accept trực tiếp khi luyện từng từ.</p>
        </article>
        <article className={`${CARD_SURFACE} p-6 !rounded-[24px]`}>
          <span className="block text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Practice II - 5 từ</span>
          <strong className="block text-[2rem]">{quiz5Passed}/{quiz5.length || 5}</strong>
          <p className="text-[#66758a] leading-[1.62]">Checkpoint sau khi học xong 5 từ đầu.</p>
        </article>
        <article className={`${CARD_SURFACE} p-6 !rounded-[24px]`}>
          <span className="block text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Practice II - 10 từ</span>
          <strong className="block text-[2rem]">{quiz10Passed}/{quiz10.length || 10}</strong>
          <p className="text-[#66758a] leading-[1.62]">Bài tổng kết cuối topic trên toàn bộ 10 từ.</p>
        </article>
      </div>

      <div className={`${CARD_SURFACE} p-6`}>
        <p className="m-0 mb-3 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Danh sách từ</p>
        <div className="flex flex-wrap gap-[10px]">
          {topic.glosses.map((gloss) => (
            <span
              key={gloss}
              className="inline-flex items-center px-[14px] py-[10px] rounded-full bg-[linear-gradient(135deg,#536ef9,#68c6ff)] text-white font-bold"
            >
              {gloss}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
