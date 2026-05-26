import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadCurriculum, getMyProgress, getAssignedPackages, getVocabularyDetail } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { PracticeWorkspace } from "../components/PracticeWorkspace";
import { StudyStage } from "../components/StudyStage";
import type { AnalysisSummary, DashboardPayload } from "../types/learn";
import { summarizeAnalysis } from "../utils/helpers";

type PageStage = "learn" | "practice";

export default function LearnWordPage() {
  const { topicId, wordOrder } = useParams<{ topicId: string; wordOrder: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [curriculum, setCurriculum] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<PageStage>("learn");
  const [completedWordsForTopic, setCompletedWordsForTopic] = useState(0);
  const [assignmentResults, setAssignmentResults] = useState<AnalysisSummary[]>([]);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        if (topicId && topicId.startsWith("custom-pkg-")) {
          // It's a custom package!
          const packageId = topicId.replace("custom-pkg-", "");
          const [assignedData, progressData] = await Promise.all([
            getAssignedPackages(),
            getMyProgress()
          ]);
          
          if (!active) return;
          
          const pkg = assignedData.packages.find((p) => p.id === packageId);
          if (!pkg) {
            setError("Không tìm thấy bài tập được giao này.");
            return;
          }
          
          // Fetch detail for each gloss concurrently
          const wordsWithStudy = await Promise.all(
            pkg.glosses.map(async (gloss, index) => {
              const detail = await getVocabularyDetail(gloss);
              return {
                order: index,
                gloss,
                checkpoint_group: 1,
                study: detail,
              };
            })
          );
          
          if (!active) return;
          
          const customTopic = {
            id: topicId,
            title: pkg.title,
            subtitle: pkg.description || "Gói bài tập giáo viên giao",
            word_count: pkg.word_count,
            checkpoint_sizes: [pkg.word_count],
            glosses: pkg.glosses,
            words: wordsWithStudy,
          };
          
          setCurriculum({ topics: [customTopic as any] });
          
          const tp = progressData.topic_progress?.find((t: any) => t.topic_id === topicId);
          if (tp) setCompletedWordsForTopic(tp.completed_words);
          
        } else {
          // Standard curriculum
          const curriculumData = await loadCurriculum();
          if (!active) return;
          setCurriculum(curriculumData);

          if (topicId && currentUser) {
            const progressData = await getMyProgress();
            if (!active) return;
            const tp = progressData.topic_progress?.find((t: any) => t.topic_id === topicId);
            if (tp) setCompletedWordsForTopic(tp.completed_words);
          }
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Lỗi tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      active = false;
    };
  }, [topicId, currentUser]);

  useEffect(() => {
    if (!curriculum) return;
    if (!currentUser) {
      const firstTopicId = curriculum.topics[0]?.id;
      const order = Number(wordOrder ?? "0");
      if (topicId !== firstTopicId || order >= 3) {
        navigate("/learn-dashboard?require_login=true");
      }
    }
  }, [curriculum, topicId, wordOrder, navigate]);

  useEffect(() => {
    setStage("learn");
  }, [topicId, wordOrder]);

  useEffect(() => {
    setAssignmentResults([]);
  }, [topicId]);

  const wordIndex = Math.max(0, Number(wordOrder ?? "0"));
  const topic = curriculum?.topics.find((t) => t.id === topicId) ?? null;
  const word = topic?.words[wordIndex] ?? null;
  const isCustomPackage = Boolean(topicId?.startsWith("custom-pkg-"));
  const customPackageId = isCustomPackage ? topicId!.replace("custom-pkg-", "") : null;

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
      <div className="min-h-screen bg-[#f0f6ff]">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-[#1cb0f6] animate-spin" />
          <p className="m-0 text-sm font-black text-slate-500">Đang chuẩn bị bài học...</p>
        </div>
      </div>
    );
  }

  if (error || !topic || !word) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(78,255,158,0.1),transparent_22%),radial-gradient(circle_at_top_right,rgba(85,206,255,0.15),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e0f2fe_100%)]">
        <main className="min-h-screen">
          <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
            <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-sky-600 font-extrabold">Lỗi</p>
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

  if (isCustomPackage && word) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(78,255,158,0.1),transparent_22%),radial-gradient(circle_at_top_right,rgba(85,206,255,0.15),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e0f2fe_100%)]">
        <main className="min-h-screen">
          <PracticeWorkspace
            mode="practice_ii"
            targetGloss={word.gloss}
            lessonGlosses={topic.glosses}
            referenceStudy={word.study}
            wordIndex={wordIndex}
            wordCount={topic.word_count}
            title={`Bài giáo viên giao • ${word.gloss}`}
            subtitle="Đây là Practice II: bé tự ký hiệu, không xem mẫu trước. Sau khi chấm mới hiện video mẫu và phản hồi."
            actionLabel="Chấm bài"
            completionLabel={
              wordIndex >= topic.words.length - 1 ? "Hoàn thành bài được giao →" : "Sang từ tiếp theo →"
            }
            assignmentPackageId={customPackageId}
            practiceIIResults={assignmentResults}
            onBackToLearn={() => navigate("/learn-dashboard")}
            onComplete={(raw) => {
              setAssignmentResults((prev) => [...prev, summarizeAnalysis(raw)]);
              if (wordIndex >= topic.words.length - 1) {
                navigate("/learn-dashboard");
              } else {
                navigate(`/learn/${topic.id}/${wordIndex + 1}`);
              }
            }}
          />
        </main>
      </div>
    );
  }

  if (stage === "practice") {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(78,255,158,0.1),transparent_22%),radial-gradient(circle_at_top_right,rgba(85,206,255,0.15),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e0f2fe_100%)]">
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(78,255,158,0.1),transparent_22%),radial-gradient(circle_at_top_right,rgba(85,206,255,0.15),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#e0f2fe_100%)]">
      <main className="min-h-screen">
        <StudyStage
          topic={topic}
          word={word}
          wordIndex={wordIndex}
          onStartPractice={() => setStage("practice")}
          onBackToTopics={() => navigate("/learn-dashboard")}
          onPreviousWord={goToWord}
          isAlreadyLearned={wordIndex < completedWordsForTopic}
          onNextWord={() => {
            if (wordIndex >= topic.words.length - 1) {
              navigate("/learn-dashboard");
            } else {
              navigate(`/learn/${topic.id}/${wordIndex + 1}`);
            }
          }}
        />
      </main>
    </div>
  );
}
