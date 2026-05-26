import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { TopicGrid } from "../../components/learn/TopicGrid";
import { TopicSummary } from "../../components/TopicSummary";
import { PracticeWorkspace } from "../../components/PracticeWorkspace";
import { StudyStage } from "../../components/StudyStage";
import { getAssignedPackages } from "../../api";
import type { AnalyzeResponse } from "../../api";
import type { DashboardPayload, PracticeSession, ProgressByTopic, Topic } from "../../types/learn";
import { mascots } from "../../utils/mascot";

interface QuizIntroProps {
  scope: 5 | 10;
  startIndex?: number;
  topic: Topic;
  onStart: () => void;
  onBack: () => void;
}

function QuizIntro({ scope, startIndex = 0, topic, onStart, onBack }: QuizIntroProps) {
  const lessonGlosses = topic.words.slice(startIndex, startIndex + scope).map((word) => word.gloss);
  const title =
    scope === 10
      ? "Bài tổng kết 10 từ"
      : startIndex >= 5
        ? "Checkpoint 5 từ sau"
        : "Checkpoint sau 5 từ đầu";
  const description =
    scope === 10
      ? "Bé đã học xong toàn bộ 10 từ trong chủ đề rồi. Giờ là lúc làm bài tổng kết để Mascot đánh giá nhé!"
      : startIndex >= 5
        ? "Bé đã đi qua 5 từ tiếp theo rồi. Mình ôn riêng nhóm từ thứ hai trước khi tổng kết cả chủ đề nhé!"
        : "Bé đã đi qua 5 từ đầu tiên rồi. Giờ mình làm một bài kiểm tra nhỏ với Mascot để xem đã nhớ được bao nhiêu nhé!";
  return (
    <section className="grid place-items-center min-h-[calc(100vh-80px)] px-4">
      <div className="max-w-[860px] w-full grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 p-[34px] rounded-[30px] bg-white border-2 border-slate-200 shadow-sm items-center">
        <div className="grid gap-[18px]">
          <div className="grid gap-[10px]">
            <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#1cb0f6] font-extrabold">Practice II</p>
            <div className="inline-flex items-center rounded-full py-1.5 px-3 font-bold text-xs bg-emerald-100 text-emerald-800 w-fit">🏁 Bài kiểm tra nhỏ</div>
            <h2 className="m-0 text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.1] font-black text-slate-800">{title}</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed m-0">
              {description}
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
  onStartWordPractice,
  onGoToLearnWord,
  onPracticeIComplete,
  onStartQuiz,
  onPracticeIIComplete,
  onRestartTopic,
}: LearnTabProps) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assignedPackages, setAssignedPackages] = useState<any[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  useEffect(() => {
    const loadAssigned = async () => {
      setLoadingAssigned(true);
      try {
        const res = await getAssignedPackages();
        setAssignedPackages(res.packages || []);
      } catch (err) {
        console.error("Lỗi khi tải bài tập được giao:", err);
      } finally {
        setLoadingAssigned(false);
      }
    };
    if (currentUser?.role === "learner") {
      loadAssigned();
    }
  }, [currentUser]);

  const currentWord = useMemo(() => {
    if (!session) return null;
    return session.topic.words[session.wordIndex] ?? null;
  }, [session]);
  const quizLessonGlosses = useMemo(() => {
    if (!session || !session.quizScope) return [];
    const startIndex = session.quizStartIndex ?? 0;
    return session.topic.words
      .slice(startIndex, startIndex + session.quizScope)
      .map((word) => word.gloss);
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
      <section className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-8 max-w-4xl mx-auto items-start py-2">
        <div className="w-full flex flex-col gap-6">
          {currentUser?.role === "learner" && assignedPackages.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/30 border-2 border-indigo-150 border-b-4 rounded-[32px] p-6 shadow-sm">
              <h3 className="m-0 text-lg font-black text-slate-800 flex items-center gap-2">
                🎒 Bài tập được giao từ giáo viên
              </h3>
              <p className="m-0 mt-1 text-xs font-bold text-slate-500">
                Hãy hoàn thành các gói từ vựng do giáo viên giao cho bé dưới đây nhé!
              </p>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedPackages.map((pkg) => (
                  <div key={pkg.id} className="bg-white border-2 border-slate-200 border-b-4 rounded-[24px] p-5 flex flex-col justify-between hover:border-indigo-400 transition-all">
                    <div>
                      <span className="inline-block bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded-lg px-2.5 py-0.5 mb-2">
                        👤 Giao bởi: {pkg.teacher_name}
                      </span>
                      <h4 className="text-base font-black text-slate-800 m-0">{pkg.title}</h4>
                      <p className="text-[11px] text-indigo-600 font-black mt-1 mb-0">
                        Practice II • {pkg.word_count} vòng kiểm tra
                      </p>
                      {pkg.description && (
                        <p className="text-xs text-slate-500 font-bold mt-1 mb-0 leading-relaxed truncate">{pkg.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {pkg.glosses.slice(0, 4).map((g: string) => (
                          <span key={g} className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{g}</span>
                        ))}
                        {pkg.glosses.length > 4 && (
                          <span className="text-[10px] font-black bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md">+{pkg.glosses.length - 4}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/learn/custom-pkg-${pkg.id}/0`)}
                      className="mt-4 w-full py-2.5 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-xl text-xs cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[1px] transition-all text-center"
                    >
                      Làm bài ôn tập Practice II 🚀
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <TopicGrid
            topics={topics}
            progressByTopic={progressByTopic}
            onOpenAuth={onOpenAuth}
          />
        </div>
        
        {/* Welcome Mascot Widget */}
        <div className="hidden md:flex flex-col gap-4 sticky top-6 bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-5 text-center items-center shadow-sm select-none">
          <div className="w-28 h-28 my-1">
            <img 
              src={mascots[2]} 
              alt="Mascot Welcoming" 
              className="w-full h-full object-contain animate-bounce-subtle"
              style={{ animationDuration: '5s', filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.08))" }}
            />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800 m-0">Xin chào bé! 🦉</h4>
            <p className="text-slate-500 font-bold text-xs mt-2 leading-relaxed">
              Mascot rất vui được đồng hành cùng bé! Hãy chọn một chủ đề học ở bên cạnh để bắt đầu học ngôn ngữ ký hiệu nhé! ✨
            </p>
          </div>
        </div>
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

  if (session.stage === "learn" && currentWord) {
    return (
      <StudyStage
        topic={session.topic}
        word={currentWord}
        wordIndex={session.wordIndex}
        onStartPractice={onStartWordPractice}
        onBackToTopics={onBackToTopics}
        onPreviousWord={onGoToLearnWord}
        isAlreadyLearned={false}
      />
    );
  }

  if (session.stage === "practice_i" && currentWord) {
    return (
      <PracticeWorkspace
        mode="practice_i"
        targetGloss={currentWord.gloss}
        lessonGlosses={[currentWord.gloss]}
        referenceStudy={currentWord.study}
        wordIndex={session.wordIndex}
        wordCount={session.topic.word_count}
        title={`Practice I • ${currentWord.gloss}`}
        subtitle="Luyện ngay từ vừa học xong trước khi chuyển sang từ tiếp theo."
        actionLabel="Phân tích"
        completionLabel={
          session.wordIndex === 4 && session.quiz5Results.length === 0
            ? "Sang checkpoint 5 từ →"
            : session.wordIndex >= session.topic.words.length - 1
              ? "Sang bài tổng kết topic →"
              : "Sang từ tiếp theo →"
        }
        onBackToLearn={() => onGoToLearnWord(session.wordIndex)}
        onComplete={onPracticeIComplete}
      />
    );
  }

  if (session.stage === "quiz_intro" && session.quizScope) {
    return (
      <QuizIntro
        scope={session.quizScope}
        startIndex={session.quizStartIndex}
        topic={session.topic}
        onStart={onStartQuiz}
        onBack={onBackToTopics}
      />
    );
  }

  if (session.stage === "practice_ii" && currentQuizGloss && currentQuizWord) {
    const isFinalQuiz = session.quizScope === 10;
    const isSecondCheckpoint = session.quizScope === 5 && (session.quizStartIndex ?? 0) >= 5;
    return (
      <PracticeWorkspace
        mode="practice_ii"
        targetGloss={currentQuizGloss}
        lessonGlosses={quizLessonGlosses}
        referenceStudy={currentQuizWord.study}
        wordIndex={session.quizRoundIndex}
        wordCount={session.quizQueue.length}
        title={`Practice II • Vòng ${session.quizRoundIndex + 1}/${session.quizQueue.length}`}
        subtitle="Không xem mẫu trước. Bé tự ký target hiện tại, AI sẽ kiểm tra có nhầm sang từ khác không."
        actionLabel="Chấm vòng này"
        practiceIIResults={session.currentQuizResults}
        completionLabel={
          session.quizRoundIndex === session.quizQueue.length - 1
            ? isFinalQuiz
              ? "Kết thúc Practice II"
              : isSecondCheckpoint
                ? "Sang ôn tổng kết chủ đề"
                : "Học tiếp 5 từ sau"
            : "Sang vòng tiếp theo"
        }
        onComplete={onPracticeIIComplete}
      />
    );
  }

  return null;
}
