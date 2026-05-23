import { useEffect, useMemo, useState } from "react";
import { ensureBaseUrl, loadAppConfig, loadCurriculum } from "./api";
import { DashboardPlaceholder } from "./components/DashboardPlaceholder";
import { PracticeWorkspace } from "./components/PracticeWorkspace";
import { Sidebar } from "./components/Sidebar";
import { StudyStage } from "./components/StudyStage";
import { TopicGrid } from "./components/TopicGrid";
import { TopicSummary } from "./components/TopicSummary";

function shuffle(values) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function summarizeAnalysis(raw) {
  return {
    target_gloss: raw.target_gloss,
    practice_mode: raw.practice_mode,
    score: raw.score,
    decision: raw.decision ?? {},
    feedback: raw.feedback ?? {},
    classifier: raw.classifier ?? null,
  };
}

function buildInitialSession(topic) {
  return {
    topic,
    wordIndex: 0,
    stage: "learn",
    quizScope: null,
    quizQueue: [],
    quizRoundIndex: 0,
    currentQuizResults: [],
    quiz5Results: [],
    finalQuizResults: [],
    practiceResults: {},
  };
}

function QuizIntro({ scope, topic, onStart, onBack }) {
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
            <span key={gloss} className="lesson-chip active">{gloss}</span>
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

function LearnHome({ topics, progressByTopic, onOpenTopic }) {
  return (
    <section className="learn-home">
      <div className="hero-panel card-surface">
        <p className="eyebrow">Tab Học</p>
        <h2>Chọn topic và bắt đầu hành trình học thật vui</h2>
        <p className="muted">
          Mỗi topic có 10 từ. Mình sẽ học từng từ một, luyện ngay sau khi học, rồi làm bài kiểm tra
          nhỏ để nhớ lâu hơn.
        </p>
        <div className="lesson-chip-grid">
          <span className="lesson-chip active">👀 Xem mẫu</span>
          <span className="lesson-chip active">✋ Tập theo</span>
          <span className="lesson-chip active">📹 Quay video</span>
          <span className="lesson-chip active">🎨 So sánh màu sắc</span>
        </div>
      </div>

      <TopicGrid topics={topics} progressByTopic={progressByTopic} onOpenTopic={onOpenTopic} />
    </section>
  );
}

export default function PracticePage({ initialTab = "learn" }) {
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8014");
  const [config, setConfig] = useState(null);
  const [curriculum, setCurriculum] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [bootError, setBootError] = useState("");
  const [session, setSession] = useState(null);
  const [progressByTopic, setProgressByTopic] = useState({});

  const absoluteApiBase = ensureBaseUrl(apiBase);
  const topics = curriculum?.topics ?? [];

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const [nextConfig, nextCurriculum] = await Promise.all([
          loadAppConfig(absoluteApiBase),
          loadCurriculum(absoluteApiBase),
        ]);
        if (!active) {
          return;
        }
        setConfig(nextConfig);
        setCurriculum(nextCurriculum);
        setBootError("");
      } catch (error) {
        if (!active) {
          return;
        }
        setBootError(error.message);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, [absoluteApiBase]);

  const currentWord = useMemo(() => {
    if (!session) {
      return null;
    }
    return session.topic.words[session.wordIndex] ?? null;
  }, [session]);

  const quizLessonGlosses = useMemo(() => {
    if (!session || !session.quizScope) {
      return [];
    }
    return session.topic.words.slice(0, session.quizScope).map((word) => word.gloss);
  }, [session]);

  const currentQuizGloss = useMemo(() => {
    if (!session || session.stage !== "practice_ii") {
      return null;
    }
    return session.quizQueue[session.quizRoundIndex] ?? null;
  }, [session]);

  const currentQuizWord = useMemo(() => {
    if (!session || !currentQuizGloss) {
      return null;
    }
    return session.topic.words.find((word) => word.gloss === currentQuizGloss) ?? null;
  }, [session, currentQuizGloss]);

  const immersiveStage =
    activeTab === "learn" &&
    !!session &&
    ["learn", "practice_i", "practice_ii"].includes(session.stage);

  function updateTopicProgress(topicId, patch) {
    setProgressByTopic((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] ?? { completedWords: 0, completed: false }),
        ...patch,
      },
    }));
  }

  function handleOpenTopic(topic) {
    setSession(buildInitialSession(topic));
    updateTopicProgress(topic.id, { completed: false });
  }

  function handleBackToTopics() {
    setSession(null);
  }

  function handleRestartTopic() {
    if (!session) {
      return;
    }
    setSession(buildInitialSession(session.topic));
    updateTopicProgress(session.topic.id, { completedWords: 0, completed: false });
  }

  function handleStartWordPractice() {
    setSession((prev) => ({ ...prev, stage: "practice_i" }));
  }

  function handleGoToLearnWord(nextIndex) {
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      const requestedIndex = Number.isFinite(nextIndex) ? nextIndex : prev.wordIndex;
      const safeIndex = Math.max(0, Math.min(requestedIndex, prev.wordIndex));
      return {
        ...prev,
        wordIndex: safeIndex,
        stage: "learn",
      };
    });
  }

  function handlePracticeIComplete(raw) {
    if (!session || !currentWord) {
      return;
    }
    updateTopicProgress(session.topic.id, {
      completedWords: Math.max(session.wordIndex + 1, progressByTopic[session.topic.id]?.completedWords ?? 0),
    });
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      const nextPracticeResults = {
        ...prev.practiceResults,
        [currentWord.gloss]: summarizeAnalysis(raw),
      };

      if (prev.wordIndex === 4 && prev.quiz5Results.length === 0) {
        return {
          ...prev,
          practiceResults: nextPracticeResults,
          stage: "quiz_intro",
          quizScope: 5,
        };
      }

      if (prev.wordIndex >= prev.topic.words.length - 1) {
        return {
          ...prev,
          practiceResults: nextPracticeResults,
          stage: "quiz_intro",
          quizScope: 10,
        };
      }

      return {
        ...prev,
        practiceResults: nextPracticeResults,
        wordIndex: prev.wordIndex + 1,
        stage: "learn",
      };
    });
  }

  function handleStartQuiz() {
    setSession((prev) => {
      if (!prev || !prev.quizScope) {
        return prev;
      }
      const queue = shuffle(prev.topic.words.slice(0, prev.quizScope).map((word) => word.gloss));
      return {
        ...prev,
        stage: "practice_ii",
        quizQueue: queue,
        quizRoundIndex: 0,
        currentQuizResults: [],
      };
    });
  }

  function handlePracticeIIComplete(raw) {
    if (!session || session.stage !== "practice_ii") {
      return;
    }
    setSession((prev) => {
      if (!prev || prev.stage !== "practice_ii") {
        return prev;
      }
      const result = summarizeAnalysis(raw);
      const nextResults = [...prev.currentQuizResults, result];
      const nextRound = prev.quizRoundIndex + 1;

      if (nextRound < prev.quizQueue.length) {
        return {
          ...prev,
          currentQuizResults: nextResults,
          quizRoundIndex: nextRound,
        };
      }

      if (prev.quizScope === 5) {
        return {
          ...prev,
          stage: "learn",
          wordIndex: 5,
          quiz5Results: nextResults,
          currentQuizResults: [],
          quizQueue: [],
          quizRoundIndex: 0,
        };
      }

      return {
        ...prev,
        stage: "summary",
        finalQuizResults: nextResults,
        currentQuizResults: [],
        quizQueue: [],
        quizRoundIndex: 0,
      };
    });
    if (session.quizScope === 10) {
      updateTopicProgress(session.topic.id, {
        completedWords: session.topic.word_count,
        completed: true,
      });
    }
  }

  function renderLearnTab() {
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
        <LearnHome
          topics={topics}
          progressByTopic={progressByTopic}
          onOpenTopic={handleOpenTopic}
        />
      );
    }

    if (session.stage === "learn" && currentWord) {
      return (
        <StudyStage
          apiBase={absoluteApiBase}
          topic={session.topic}
          word={currentWord}
          wordIndex={session.wordIndex}
          onStartPractice={handleStartWordPractice}
          onBackToTopics={handleBackToTopics}
          onPreviousWord={handleGoToLearnWord}
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
          onBackToLearn={() => handleGoToLearnWord(session.wordIndex)}
          onComplete={handlePracticeIComplete}
        />
      );
    }

    if (session.stage === "quiz_intro" && session.quizScope) {
      return (
        <QuizIntro
          scope={session.quizScope}
          topic={session.topic}
          onStart={handleStartQuiz}
          onBack={handleBackToTopics}
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
          onComplete={handlePracticeIIComplete}
        />
      );
    }

    if (session.stage === "summary") {
      return (
        <TopicSummary
          topic={session.topic}
          session={session}
          onRestartTopic={handleRestartTopic}
          onBackToTopics={handleBackToTopics}
        />
      );
    }

    return null;
  }

  return (
    <div className={immersiveStage ? "app-shell app-shell-learn-immersive" : "app-shell flow-shell"}>
      {!immersiveStage ? (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          apiBase={apiBase}
          onApiBaseChange={setApiBase}
          curriculumTopics={config?.curriculum_topics ?? []}
        />
      ) : null}

      <main className={immersiveStage ? "learn-immersive-main" : "flow-main"}>
        {activeTab === "learn" ? renderLearnTab() : null}
        {activeTab === "family" ? (
          <DashboardPlaceholder
            title="Dashboard Gia đình"
            description="Phần dashboard cho phụ huynh vẫn được giữ chỗ trong app. Mình sẽ làm tiếp sau."
          />
        ) : null}
        {activeTab === "school" ? (
          <DashboardPlaceholder
            title="Dashboard Trường học"
            description="Phần dashboard cho trường học vẫn được giữ chỗ trong app. Mình sẽ làm tiếp sau."
          />
        ) : null}
      </main>
    </div>
  );
}
