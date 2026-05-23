import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadCurriculum } from "../api";
import { PracticeWorkspace } from "../components/PracticeWorkspace";
import { StudyStage } from "../components/StudyStage";
import type { DashboardPayload } from "../types/learn";

type PageStage = "learn" | "practice";

export default function LearnWordPage() {
  const { topicId, wordOrder } = useParams<{ topicId: string; wordOrder: string }>();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<PageStage>("learn");

  useEffect(() => {
    setLoading(true);
    setError("");
    loadCurriculum()
      .then(setCurriculum)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  // Reset to learn stage when the word changes via URL
  useEffect(() => {
    setStage("learn");
  }, [topicId, wordOrder]);

  const wordIndex = Math.max(0, Number(wordOrder ?? "0"));
  const topic = curriculum?.topics.find((t) => t.id === topicId) ?? null;
  const word = topic?.words[wordIndex] ?? null;

  const goToWord = (index: number) => {
    if (!topic) return;
    if (index < 0 || index >= topic.words.length) {
      navigate("/practice");
    } else {
      navigate(`/learn/${topic.id}/${index}`);
    }
  };

  if (loading) {
    return (
      <div className="app-shell app-shell-learn-immersive">
        <main className="learn-immersive-main">
          <section className="card-surface hero-panel">
            <p className="eyebrow">Loading</p>
            <h2>Đang chuẩn bị bài học...</h2>
          </section>
        </main>
      </div>
    );
  }

  if (error || !topic || !word) {
    return (
      <div className="app-shell app-shell-learn-immersive">
        <main className="learn-immersive-main">
          <section className="card-surface hero-panel">
            <p className="eyebrow">Lỗi</p>
            <h2>{error || "Không tìm thấy bài học"}</h2>
            <button className="primary-button mt-4" onClick={() => navigate("/practice")}>
              Quay lại
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (stage === "practice") {
    return (
      <div className="app-shell app-shell-learn-immersive">
        <main className="learn-immersive-main">
          <PracticeWorkspace
            mode="practice_i"
            targetGloss={word.gloss}
            lessonGlosses={[word.gloss]}
            referenceStudy={word.study}
            wordIndex={wordIndex}
            wordCount={topic.word_count}
            title={`Practice I • ${word.gloss}`}
            subtitle="Luyện ngay từ vừa học xong trước khi chuyển sang từ tiếp theo."
            actionLabel="Upload và phân tích"
            completionLabel={
              wordIndex >= topic.words.length - 1 ? "Hoàn thành topic →" : "Sang từ tiếp theo →"
            }
            onBackToLearn={() => setStage("learn")}
            onComplete={() => goToWord(wordIndex + 1)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell app-shell-learn-immersive">
      <main className="learn-immersive-main">
        <StudyStage
          topic={topic}
          word={word}
          wordIndex={wordIndex}
          onStartPractice={() => setStage("practice")}
          onBackToTopics={() => navigate("/practice")}
          onPreviousWord={goToWord}
        />
      </main>
    </div>
  );
}
