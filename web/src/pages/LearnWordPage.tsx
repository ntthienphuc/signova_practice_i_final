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
  console.log(stage)
  useEffect(() => {
    setLoading(true);
    setError("");
    loadCurriculum()
      .then(setCurriculum)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)]">
        <main className="min-h-screen">
          <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
            <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Loading</p>
            <h2>Đang chuẩn bị bài học...</h2>
          </section>
        </main>
      </div>
    );
  }

  if (error || !topic || !word) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)]">
        <main className="min-h-screen">
          <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
            <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Lỗi</p>
            <h2>{error || "Không tìm thấy bài học"}</h2>
            <button
              className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer mt-4"
              onClick={() => navigate("/learn-dashboard")}
            >
              Quay lại
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (stage === "practice") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)]">
        <main className="min-h-screen">
          <PracticeWorkspace
            mode="practice_i"
            targetGloss={word.gloss}
            lessonGlosses={[word.gloss]}
            referenceStudy={word.study}
            wordIndex={wordIndex}
            wordCount={topic.word_count}
            title={`Practice I • ${word.gloss}`}
            subtitle="Luyện ngay từ vừa học xong trước khi chuyển sang từ tiếp theo."
            actionLabel="Phân tích"
            completionLabel={
              wordIndex >= topic.words.length - 1 ? "Hoàn thành topic →" : "Sang từ tiếp theo →"
            }
            onBackToLearn={() => setStage("learn")}
            onComplete={() =>
              wordIndex >= topic.words.length - 1
                ? navigate("/learn-dashboard")
                : goToWord(wordIndex + 1)
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)]">
      <main className="min-h-screen">
        <StudyStage
          topic={topic}
          word={word}
          wordIndex={wordIndex}
          onStartPractice={() => setStage("practice")}
          onBackToTopics={() => navigate("/learn-dashboard")}
          onPreviousWord={goToWord}
        />
      </main>
    </div>
  );
}
