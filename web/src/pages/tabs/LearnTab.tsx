import { useMemo } from "react";
import { PracticeWorkspace } from "../../components/PracticeWorkspace";
import { StudyStage } from "../../components/StudyStage";
import { TopicGrid } from "../../components/TopicGrid";
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
    <section className="checkpoint-stage">
      <div className="checkpoint-card checkpoint-card-bright">
        <div className="checkpoint-copy">
          <p className="eyebrow">Practice II</p>
          <div className="summary-badge">🏁 Bài kiểm tra nhỏ</div>
          <h2>{scope === 5 ? "Checkpoint sau 5 từ đầu" : "Bài tổng kết 10 từ"}</h2>
          <p className="muted">
            {scope === 5
              ? "Bạn đã đi qua 5 từ đầu tiên rồi. Giờ mình làm một bài kiểm tra nhỏ để xem đã nhớ được bao nhiêu nhé."
              : "Bạn đã học xong toàn bộ 10 từ trong topic. Giờ là lúc làm bài tổng kết để xem mình đã sẵn sàng chưa."}
          </p>
        </div>

        <div className="lesson-chip-grid">
          {lessonGlosses.map((gloss) => (
            <span key={gloss} className="lesson-chip active">
              {gloss}
            </span>
          ))}
        </div>

        <div className="summary-actions">
          <button type="button" className="ghost-button" onClick={onBack}>
            Quay lại topic
          </button>
          <button type="button" className="primary-button" onClick={onStart}>
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
  absoluteApiBase: string;
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
  absoluteApiBase,
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
      <section className="card-surface hero-panel">
        <p className="eyebrow">Lỗi tải app</p>
        <h2>Không thể lấy curriculum từ backend</h2>
        <p className="error-text">{bootError}</p>
      </section>
    );
  }

  if (!curriculum) {
    return (
      <section className="card-surface hero-panel">
        <p className="eyebrow">Loading</p>
        <h2>Đang chuẩn bị bài học cho bạn...</h2>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="learn-home">
        <TopicGrid topics={topics} progressByTopic={progressByTopic} />
      </section>
    );
  }

  if (session.stage === "learn" && currentWord) {
    return (
      <StudyStage
        apiBase={absoluteApiBase}
        topic={session.topic}
        word={currentWord}
        wordIndex={session.wordIndex}
        onStartPractice={onStartWordPractice}
        onBackToTopics={onBackToTopics}
        onPreviousWord={onGoToLearnWord}
      />
    );
  }

  if (session.stage === "practice_i" && currentWord) {
    return (
      <PracticeWorkspace
        apiBase={absoluteApiBase}
        mode="practice_i"
        targetGloss={currentWord.gloss}
        lessonGlosses={[currentWord.gloss]}
        referenceStudy={currentWord.study}
        wordIndex={session.wordIndex}
        wordCount={session.topic.word_count}
        title={`Practice I • ${currentWord.gloss}`}
        subtitle="Luyện ngay từ vừa học xong trước khi chuyển sang từ tiếp theo."
        actionLabel="Upload và phân tích"
        completionLabel={
          session.wordIndex === 4 && session.quiz5Results.length === 0
            ? "Sang checkpoint 5 từ →"
            : session.wordIndex === session.topic.words.length - 1
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
        topic={session.topic}
        onStart={onStartQuiz}
        onBack={onBackToTopics}
      />
    );
  }

  if (session.stage === "practice_ii" && currentQuizGloss && currentQuizWord) {
    return (
      <PracticeWorkspace
        apiBase={absoluteApiBase}
        mode="practice_ii"
        targetGloss={currentQuizGloss}
        lessonGlosses={quizLessonGlosses}
        referenceStudy={currentQuizWord.study}
        wordIndex={session.quizRoundIndex}
        wordCount={session.quizQueue.length}
        title={`Practice II • Vòng ${session.quizRoundIndex + 1}/${session.quizQueue.length}`}
        subtitle={`Target hiện tại: ${currentQuizGloss}. Nếu ký nhầm sang từ khác trong lesson set, backend sẽ cố detect.`}
        actionLabel="Upload và chấm round này"
        completionLabel={
          session.quizRoundIndex === session.quizQueue.length - 1
            ? "Kết thúc bài Practice II"
            : "Sang round tiếp theo"
        }
        onComplete={onPracticeIIComplete}
      />
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
