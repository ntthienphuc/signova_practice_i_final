import { useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { TopicGrid } from "../../components/learn/TopicGrid";
import { TopicSummary } from "../../components/TopicSummary";
import type { AnalyzeResponse } from "../../api";
import type { DashboardPayload, PracticeSession, ProgressByTopic, Topic } from "../../types/learn";
import { mascots } from "../../utils/mascot";

interface QuizIntroProps {
  scope: 5 | 10;
  topic: Topic;
  onStart: () => void;
  onBack: () => void;
}

function QuizIntro({ scope, topic, onStart, onBack }: QuizIntroProps) {
  const lessonGlosses = topic.words.slice(0, scope).map((word) => word.gloss);
  return (
    <section className="grid place-items-center min-h-[calc(100vh-80px)] px-4">
      <div className="max-w-[860px] w-full grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 p-[34px] rounded-[30px] bg-white border-2 border-slate-200 shadow-sm items-center">
        <div className="grid gap-[18px]">
          <div className="grid gap-[10px]">
            <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#1cb0f6] font-extrabold">Practice II</p>
            <div className="inline-flex items-center rounded-full py-1.5 px-3 font-bold text-xs bg-emerald-100 text-emerald-800 w-fit">🏁 Bài kiểm tra nhỏ</div>
            <h2 className="m-0 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.1] font-black text-slate-800">{scope === 5 ? "Checkpoint sau 5 từ đầu" : "Bài tổng kết 10 từ"}</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed m-0">
              {scope === 5
                ? "Bé đã đi qua 5 từ đầu tiên rồi. Giờ mình làm một bài kiểm tra nhỏ với Mascot để xem đã nhớ được bao nhiêu nhé!"
                : "Bé đã học xong toàn bộ 10 từ trong chủ đề rồi. Giờ là lúc làm bài tổng kết để Mascot đánh giá nhé!"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {lessonGlosses.map((gloss) => (
              <span key={gloss} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-sky-50 border-2 border-sky-100 text-sky-700 text-xs font-black">
                {gloss}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="border-2 border-b-4 border-slate-200 rounded-2xl min-h-[48px] px-5 transition-all font-black text-slate-500 hover:bg-slate-50 cursor-pointer active:border-b-2 active:translate-y-0.5 text-sm" onClick={onBack}>
              Quay lại bài học
            </button>
            <button type="button" className="border-b-4 border-[#1899d6] rounded-2xl min-h-[48px] px-5 transition-all font-black bg-[#1cb0f6] text-white hover:bg-[#24c4ff] cursor-pointer active:border-b-0 active:translate-y-1 text-sm" onClick={onStart}>
              Bắt đầu kiểm tra 🚀
            </button>
          </div>
        </div>

        {/* Mascot Column */}
        <div className="hidden md:flex flex-col items-center justify-center select-none">
          <img 
            src={mascots[8]} 
            alt="Checkpoint Mascot" 
            className="w-44 h-44 object-contain animate-bounce-subtle" 
            style={{ 
              animationDuration: '4s',
              filter: "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.1))"
            }} 
          />
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
  onOpenAuth,
  onBackToTopics,
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
        <TopicGrid topics={topics} progressByTopic={progressByTopic} onOpenAuth={onOpenAuth} />
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
