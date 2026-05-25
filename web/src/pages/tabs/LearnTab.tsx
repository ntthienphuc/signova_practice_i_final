import { useMemo } from "react";
import { TopicGrid } from "../../components/learn/TopicGrid";
import { TopicSummary } from "../../components/TopicSummary";
import type { AnalyzeResponse } from "../../api";
import type { DashboardPayload, PracticeSession, ProgressByTopic, Topic } from "../../types/learn";

interface QuizIntroProps {
  scope: 5 | 10;
  topic: Topic;
  onStart: () => void;
  onBack: () => void;
}

function QuizIntro({ scope, topic, onStart, onBack }: QuizIntroProps) {
  const lessonGlosses = topic.words.slice(0, scope).map((word) => word.gloss);
  return (
    <section className="grid place-items-center min-h-[calc(100vh-80px)]">
      <div className="max-w-[860px] w-full grid gap-[18px] p-[34px] rounded-[30px] bg-white border-2 border-slate-200">
        <div className="grid gap-[10px]">
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#1cb0f6] font-extrabold">Practice II</p>
          <div className="inline-flex items-center rounded-full py-2 px-3 font-bold text-[0.92rem] bg-emerald-100 text-emerald-800">🏁 Bài kiểm tra nhỏ</div>
          <h2 className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] font-display">{scope === 5 ? "Checkpoint sau 5 từ đầu" : "Bài tổng kết 10 từ"}</h2>
          <p className="text-[var(--ink-soft)] leading-[1.62]">
            {scope === 5
              ? "Bạn đã đi qua 5 từ đầu tiên rồi. Giờ mình làm một bài kiểm tra nhỏ để xem đã nhớ được bao nhiêu nhé."
              : "Bạn đã học xong toàn bộ 10 từ trong topic. Giờ là lúc làm bài tổng kết để xem mình đã sẵn sàng chưa."}
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          {lessonGlosses.map((gloss) => (
            <span key={gloss} className="inline-flex items-center px-[14px] py-[10px] rounded-full bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white border-transparent text-[1rem] font-bold">
              {gloss}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="border border-[rgba(53,84,128,0.08)] rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-white/[0.84] text-[var(--ink)] hover:-translate-y-px cursor-pointer" onClick={onBack}>
            Quay lại topic
          </button>
          <button type="button" className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer" onClick={onStart}>
            Bắt đầu Practice II
          </button>
        </div>
      </div>
    </section>
  );
}

interface LearnTabProps {
  bootError: string;
  curriculum: DashboardPayload | null;
  session: PracticeSession | null;
  topics: Topic[];
  progressByTopic: ProgressByTopic;
  currentUser?: any;
  onOpenAuth: () => void;
  onBackToTopics: () => void;
  onStartWordPractice: () => void;
  onGoToLearnWord: (nextIndex: number) => void;
  onPracticeIComplete: (raw: AnalyzeResponse) => void;
  onStartQuiz: () => void;
  onPracticeIIComplete: (raw: AnalyzeResponse) => void;
  onRestartTopic: () => void;
}

export function LearnTab({
  bootError,
  curriculum,
  session,
  topics,
  progressByTopic,
  currentUser,
  onOpenAuth,
  onBackToTopics,
  onStartWordPractice,
  onGoToLearnWord,
  onPracticeIComplete,
  onStartQuiz,
  onPracticeIIComplete,
  onRestartTopic,
}: LearnTabProps) {
  const currentWord = useMemo(() => {
    if (!session) return null;
    return session.topic.words[session.wordIndex] ?? null;
  }, [session]);
  console.log("Learn Tab:", session)
  const quizLessonGlosses = useMemo(() => {
    if (!session || !session.quizScope) return [];
    return session.topic.words.slice(0, session.quizScope).map((word) => word.gloss);
  }, [session]);

  const currentQuizGloss = useMemo(() => {
    if (!session || session.stage !== "practice_ii") return null;
    return session.quizQueue[session.quizRoundIndex] ?? null;
  }, [session]);

  const currentQuizWord = useMemo(() => {
    if (!session || !currentQuizGloss) return null;
    return session.topic.words.find((word) => word.gloss === currentQuizGloss) ?? null;
  }, [session, currentQuizGloss]);

  if (bootError) {
    return (
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-sky-600 font-extrabold">Lỗi tải app</p>
        <h2>Không thể lấy curriculum từ backend</h2>
        <p className="text-[#b33f47]">{bootError}</p>
      </section>
    );
  }

  if (!curriculum) {
    return (
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-sky-600 font-extrabold">Loading</p>
        <h2>Đang chuẩn bị bài học cho bạn...</h2>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="grid gap-6">
        <TopicGrid topics={topics} progressByTopic={progressByTopic} currentUser={currentUser} onOpenAuth={onOpenAuth} />
      </section>
    );
  }

  if (session.stage === "summary") {
    return (
      <TopicSummary
        topic={session.topic}
        session={session}
        onRestartTopic={onRestartTopic}
        onBackToTopics={onBackToTopics}
      />
    );
  }

  return null;
}
