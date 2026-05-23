import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Thêm useLocation để 
import { ensureBaseUrl, loadAppConfig, loadCurriculum } from "./api";
import type { AppConfig, AnalyzeResponse } from "./api";
import type { Topic, DashboardPayload } from "./types/learn";
import { PracticeWorkspace } from "./components/PracticeWorkspace";
import { Sidebar } from "./components/Sidebar";
import { TopicSummary } from "./components/TopicSummary";
import type { AnalysisSummary } from "./components/TopicSummary";
import { LearnHome } from "./components/learn/LearnHome";
import { QuizIntro } from "./components/learn/QuizIntro";



type SessionStage = "learn" | "practice_i" | "practice_ii" | "quiz_intro" | "summary";

interface TopicProgress { completedWords?: number; completed?: boolean; }
interface Session {
  topic: Topic; wordIndex: number; stage: SessionStage; quizScope: number | null;
  quizQueue: string[]; quizRoundIndex: number; currentQuizResults: AnalysisSummary[];
  quiz5Results: AnalysisSummary[]; finalQuizResults: AnalysisSummary[]; practiceResults: Record<string, AnalysisSummary>;
}

function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function summarizeAnalysis(raw: AnalyzeResponse): AnalysisSummary {
  return {
    target_gloss: raw.target_gloss,
    practice_mode: raw.practice_mode,
    score: raw.score,
    decision: raw.decision,
    feedback: raw.feedback,
    classifier: null,
  };
}

export default function PracticePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [apiBase, setApiBase] = useState("http://127.0.0.1:8014");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [curriculum, setCurriculum] = useState<DashboardPayload | null>(null);
  const [bootError, setBootError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [progressByTopic, setProgressByTopic] = useState<Record<string, TopicProgress>>({});
  const [activeTab, setActiveTab] = useState("learn");

  const absoluteApiBase = ensureBaseUrl(apiBase);
  const topics = curriculum?.topics ?? [];

  // BẮT STATE CHUYỂN HƯỚNG: Lắng nghe sự kiện click từ trang StudyStage chuyển về để bật camera luyện tập
  useEffect(() => {
    if (curriculum && location.state && location.state.intent === "START_PRACTICE") {
      const { topicId, targetWordIndex } = location.state;
      const targetTopic = curriculum.topics.find((t) => t.id === topicId);
      
      if (targetTopic) {
        setSession({
          topic: targetTopic,
          wordIndex: targetWordIndex,
          stage: "practice_i", // Nhảy thẳng vào màn hình camera Practice I
          quizScope: null,
          quizQueue: [],
          quizRoundIndex: 0,
          currentQuizResults: [],
          quiz5Results: [],
          finalQuizResults: [],
          practiceResults: {},
        });
        
        // Xóa sạch trạng thái history state để tránh re-trigger khi reload trang
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [curriculum, location.state]);

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const [nextConfig, nextCurriculum] = await Promise.all([
          loadAppConfig(absoluteApiBase),
          loadCurriculum(absoluteApiBase),
        ]);
        if (!active) return;
        setConfig(nextConfig);
        setCurriculum(nextCurriculum);
        setBootError("");
      } catch (error) {
        if (!active) return;
        setBootError(error instanceof Error ? error.message : "Unknown error");
      }
    }
    boot();
    return () => { active = false; };
  }, [absoluteApiBase]);

  const currentWord = useMemo(() => {
    if (!session) return null;
    return session.topic.words[session.wordIndex] ?? null;
  }, [session]);

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

  const isImmersiveWorkspace = !!session && ["practice_i", "practice_ii"].includes(session.stage);

  // Điều hướng người dùng sang trang Router Learn tĩnh thay vì set state tại chỗ
  function handleOpenTopic(topic: Topic) {
    navigate(`/learn/${topic.id}/1`);
  }

  function handleBackToTopics() { setSession(null); }
  function handleRestartTopic() {
    if (!session) return;
    setSession(null);
    navigate(`/learn/${session.topic.id}/1`);
  }

  function handleGoToLearnWord(nextIndex: number) {
    if (!session) return;
    setSession(null);
    navigate(`/learn/${session.topic.id}/${nextIndex + 1}`);
  }

  function handlePracticeIComplete(raw: AnalyzeResponse) {
    if (!session || !currentWord) return;
    updateTopicProgress(session.topic.id, {
      completedWords: Math.max(session.wordIndex + 1, progressByTopic[session.topic.id]?.completedWords ?? 0),
    });
    setSession((prev) => {
      if (!prev) return prev;
      const nextPracticeResults: Record<string, AnalysisSummary> = {
        ...prev.practiceResults,
        [currentWord.gloss]: summarizeAnalysis(raw),
      };

      if (prev.wordIndex === 4 && prev.quiz5Results.length === 0) {
        return { ...prev, practiceResults: nextPracticeResults, stage: "quiz_intro", quizScope: 5 };
      }
      if (prev.wordIndex >= prev.topic.words.length - 1) {
        return { ...prev, practiceResults: nextPracticeResults, stage: "quiz_intro", quizScope: 10 };
      }
      
      // Sau khi hoàn thành Practice I của từ, tự động đẩy người học sang trang xem lý thuyết của từ tiếp theo
      setTimeout(() => {
        navigate(`/learn/${session.topic.id}/${prev.wordIndex + 2}`);
      }, 0);
      return null; // Tạm thời dọn sạch session để nhường view cho router trang học
    });
  }

  function updateTopicProgress(topicId: string, patch: TopicProgress) {
    setProgressByTopic((prev) => ({ ...prev, [topicId]: { ...(prev[topicId] ?? { completedWords: 0, completed: false }), ...patch } }));
  }

  function handleStartQuiz() {
    setSession((prev) => {
      if (!prev || !prev.quizScope) return prev;
      const queue = shuffle(prev.topic.words.slice(0, prev.quizScope).map((word) => word.gloss));
      return { ...prev, stage: "practice_ii", quizQueue: queue, quizRoundIndex: 0, currentQuizResults: [] };
    });
  }

  function handlePracticeIIComplete(raw: AnalyzeResponse) {
    if (!session || session.stage !== "practice_ii") return;
    setSession((prev) => {
      if (!prev || prev.stage !== "practice_ii") return prev;
      const result = summarizeAnalysis(raw);
      const nextResults = [...prev.currentQuizResults, result];
      const nextRound = prev.quizRoundIndex + 1;

      if (nextRound < prev.quizQueue.length) {
        return { ...prev, currentQuizResults: nextResults, quizRoundIndex: nextRound };
      }
      if (prev.quizScope === 5) {
        return { ...prev, stage: "learn", wordIndex: 5, quiz5Results: nextResults, currentQuizResults: [], quizQueue: [], quizRoundIndex: 0 };
      }
      return { ...prev, stage: "summary", finalQuizResults: nextResults, currentQuizResults: [], quizQueue: [], quizRoundIndex: 0 };
    });
    if (session.quizScope === 10) {
      updateTopicProgress(session.topic.id, { completedWords: session.topic.word_count, completed: true });
    }
  }

  function renderPageContent() {
    if (bootError) {
      return (
        <section className="card-surface hero-panel max-w-4xl mx-auto my-12 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Không thể lấy dữ liệu học tập từ máy chủ</h2>
          <p className="text-slate-400 text-sm bg-black/30 p-4 rounded-xl border border-white/5 font-mono">{bootError}</p>
        </section>
      );
    }

    if (!curriculum) {
      return (
        <section className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-4" />
        </section>
      );
    }

    if (!session) {
      if (activeTab === "practice") {
        return (
          <section className="card-surface hero-panel max-w-2xl mx-auto my-12 p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Chọn từ để luyện tập</h2>
            <p className="text-slate-400 text-sm mb-6">
              Vào tab <strong className="text-white">Học</strong>, chọn một từ trong topic và nhấn{" "}
              <strong className="text-white">Luyện tập từ này</strong> để bật camera luyện tập.
            </p>
            <button
              type="button"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-colors"
              onClick={() => setActiveTab("learn")}
            >
              Đến trang học →
            </button>
          </section>
        );
      }
      return <LearnHome topics={topics} progressByTopic={progressByTopic} onOpenTopic={handleOpenTopic} />;
    }

    if (session.stage === "practice_i" && currentWord) {
      return (
        <PracticeWorkspace
          apiBase={absoluteApiBase} mode="practice_i" targetGloss={currentWord.gloss} lessonGlosses={[currentWord.gloss]} referenceStudy={currentWord.study}
          wordIndex={session.wordIndex} wordCount={session.topic.word_count} title={`Practice I • ${currentWord.gloss}`}
          subtitle="Luyện ngay từ vừa học xong trước khi chuyển sang từ tiếp theo." actionLabel="Tải lên bài tập và phân tích"
          completionLabel={session.wordIndex === 4 && session.quiz5Results.length === 0 ? "Tiến hành Checkpoint 5 từ →" : session.wordIndex === session.topic.words.length - 1 ? "Hoàn thành bài học & Xem tổng kết →" : "Học từ tiếp theo →"}
          onBackToLearn={() => handleGoToLearnWord(session.wordIndex)} onComplete={handlePracticeIComplete}
        />
      );
    }

    if (session.stage === "quiz_intro" && session.quizScope) {
      return <QuizIntro scope={session.quizScope} topic={session.topic} onStart={handleStartQuiz} onBack={handleBackToTopics} />;
    }

    if (session.stage === "practice_ii" && currentQuizGloss && currentQuizWord) {
      return (
        <PracticeWorkspace
          apiBase={absoluteApiBase} mode="practice_ii" targetGloss={currentQuizGloss} lessonGlosses={quizLessonGlosses} referenceStudy={currentQuizWord.study}
          wordIndex={session.quizRoundIndex} wordCount={session.quizQueue.length} title={`Practice II • Vòng ${session.quizRoundIndex + 1}/${session.quizQueue.length}`}
          subtitle={`Từ cần nhận diện: ${currentQuizGloss}. Hệ thống AI sẽ tự động kiểm định độ khớp.`} actionLabel="Gửi video chấm điểm round này"
          completionLabel={session.quizRoundIndex === session.quizQueue.length - 1 ? "Hoàn tất bài kiểm tra tổng hợp" : "Tiếp tục vòng sau"}
          onComplete={handlePracticeIIComplete}
        />
      );
    }

    if (session.stage === "summary") {
      return <TopicSummary topic={session.topic} session={session} onRestartTopic={handleRestartTopic} onBackToTopics={handleBackToTopics} />;
    }

    return null;
  }

  return (
    <div className={isImmersiveWorkspace ? "w-full min-h-screen bg-slate-950 text-white" : "app-shell flow-shell"}>
      {!isImmersiveWorkspace && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          apiBase={apiBase}
          onApiBaseChange={setApiBase}
          curriculumTopics={curriculum?.topics ?? []}
        />
      )}
      <main className={isImmersiveWorkspace ? "w-full" : "flow-main"}>
        {renderPageContent()}
      </main>
    </div>
  );
}