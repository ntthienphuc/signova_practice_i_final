import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadAppConfig, loadCurriculum, getMyProgress } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import { usePracticeSession } from "../../hook/usePracticeSession";
import { MOCK_EXTRA_TOPICS } from "../data/mockTopics";
import { LearnTab } from "./tabs/LearnTab";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export default function LearnDashboard() {
  const { setIsImmersive, openAuth } = useDashboard();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const practice = usePracticeSession();

  const [config, setConfig] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([loadAppConfig(), loadCurriculum()])
      .then(([nextConfig, nextCurriculum]) => {
        if (!active) return;
        setConfig(nextConfig);
        setCurriculum(nextCurriculum);
      })
      .catch((err) => {
        if (active) setBootError(getErrorMessage(err));
      });
    return () => { active = false; };
  }, []);

  // Sync server progress into local practice session on login
  useEffect(() => {
    if (!currentUser || (currentUser.role !== "learner" && currentUser.role !== "parent")) return;
    let active = true;
    getMyProgress()
      .then((data: any) => {
        if (active && data?.topic_progress) {
          practice.syncProgressFromServer(data.topic_progress);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [currentUser?.id]);

  // School/parent users land here after login — redirect to their home tab
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "school") navigate("/learn-dashboard/school", { replace: true });
    else if (currentUser.role === "parent") navigate("/learn-dashboard/family", { replace: true });
  }, [currentUser?.role]);

  // Signal immersive mode to DashboardLayout (hides sidebar during word practice)
  const immersiveStage =
    practice.session !== null &&
    ["learn", "practice_i", "practice_ii"].includes(practice.session.stage);

  useEffect(() => {
    setIsImmersive(immersiveStage);
    return () => setIsImmersive(false);
  }, [immersiveStage]);

  // Handle ?practice_review_topic= URL param (deep-link into a topic review)
  const topics = [...(curriculum?.topics ?? []), ...MOCK_EXTRA_TOPICS];

  useEffect(() => {
    if (!curriculum) return;
    const params = new URLSearchParams(window.location.search);
    const reviewTopicId = params.get("practice_review_topic");
    if (!reviewTopicId) return;

    const topic = topics.find((item) => item.id === reviewTopicId);
    if (!topic) return;
    const reviewStart = Math.max(0, Number(params.get("practice_review_start") ?? "0") || 0);
    const reviewScope = params.get("practice_review_scope") === "5" ? 5 : 10;

    practice.handleOpenTopicReview(topic, reviewStart, reviewScope);
    params.delete("practice_review_topic");
    params.delete("practice_review_start");
    params.delete("practice_review_scope");
    const nextSearch = params.toString();
    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`
    );
  }, [curriculum]);

  return (
    <LearnTab
      bootError={bootError}
      curriculum={curriculum}
      session={practice.session}
      topics={topics}
      progressByTopic={practice.progressByTopic}
      onOpenAuth={openAuth}
      onBackToTopics={practice.handleBackToTopics}
      onStartWordPractice={practice.handleStartWordPractice}
      onGoToLearnWord={practice.handleGoToLearnWord}
      onPracticeIComplete={practice.handlePracticeIComplete}
      onStartQuiz={practice.handleStartQuiz}
      onPracticeIIComplete={practice.handlePracticeIIComplete}
      onRestartTopic={practice.handleRestartTopic}
    />
  );
}
