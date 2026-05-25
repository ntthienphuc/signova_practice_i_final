import { useEffect, useState } from "react";
import {
  loadAppConfig, loadCurriculum, getReviewWords,
  getVocabularyDetail, getParentDashboard, getSchoolDashboard,
  getPendingLinks, approveParentLink, rejectParentLink,
  approveSchoolLink, rejectSchoolLink, getLearnerDashboard,
  getMyProgress, refreshAIRecommendation
} from "../api";
import { Sidebar } from "../components/learn-dashboard/Sidebar";
import { AuthModal } from "../components/AuthModal";
import type { AppTab, Topic } from "../types/learn";

const MOCK_EXTRA_TOPICS: Topic[] = [
  {
    id: "mock-topic-3",
    title: "Gia đình & Người thân",
    subtitle: "Học từ vựng về các thành viên trong gia đình",
    word_count: 8,
    checkpoint_sizes: [5, 8],
    glosses: ["BỐ", "MẸ", "ANH", "CHỊ", "EM", "ÔNG", "BÀ", "CON"],
    words: Array.from({ length: 8 }, (_, i) => ({
      order: i,
      gloss: ["BỐ", "MẸ", "ANH", "CHỊ", "EM", "ÔNG", "BÀ", "CON"][i],
      checkpoint_group: i < 5 ? 1 : 2,
      study: { gloss: "", video_id: "", score: 0, poster_url: "", reference: { video_url: "", playback_url: "", segment: null, video_filename: "" } },
    })),
  },
  {
    id: "mock-topic-4",
    title: "Màu sắc & Hình dạng",
    subtitle: "Khám phá thế giới màu sắc và hình khối qua ngôn ngữ ký hiệu",
    word_count: 10,
    checkpoint_sizes: [5, 10],
    glosses: ["ĐỎ", "XANH", "VÀNG", "TRẮNG", "ĐEN", "CAM", "TÍM", "HỒNG", "TRÒN", "VUÔNG"],
    words: Array.from({ length: 10 }, (_, i) => ({
      order: i,
      gloss: ["ĐỎ", "XANH", "VÀNG", "TRẮNG", "ĐEN", "CAM", "TÍM", "HỒNG", "TRÒN", "VUÔNG"][i],
      checkpoint_group: i < 5 ? 1 : 2,
      study: { gloss: "", video_id: "", score: 0, poster_url: "", reference: { video_url: "", playback_url: "", segment: null, video_filename: "" } },
    })),
  },
];

// Import hooks
import { useAuth } from "../contexts/AuthContext";
import { useConnectionManager } from "../../hook/useConnectionManager"
import { usePracticeSession } from "../../hook/usePracticeSession";

// Import các Tab Component
import { AccountTab } from "./tabs/AccountTab";
import { CustomPackageTab } from "./tabs/CustomPackageTab";
import { FamilyTab } from "./tabs/FamilyTab";
import { LearnTab } from "./tabs/LearnTab";
import { ProgressTab } from "./tabs/ProgressTab";
import { ReviewTab } from "./tabs/ReviewTab";
import { SchoolTab } from "./tabs/SchoolTab";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

interface LearnDashboardProps {
  initialTab?: AppTab;
}

export default function LearnDashboard({ initialTab = "learn" }: LearnDashboardProps) {
  const [config, setConfig] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  const [bootError, setBootError] = useState("");

  const { currentUser, login, logout } = useAuth();
  const connection = useConnectionManager(() => loadDashboardData());
  const practice = usePracticeSession();

  // Độc lập review & dashboard states chưa tách hết
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [activeReviewWord, setActiveReviewWord] = useState<any>(null);
  const [loadingReviewWord, setLoadingReviewWord] = useState<string | null>(null);

  const [parentDashData, setParentDashData] = useState<any>(null);
  const [schoolDashData, setSchoolDashData] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleRefreshAI = async () => {
    setLoadingAI(true);
    try {
      const data = await refreshAIRecommendation();
      if (currentUser?.role === "parent") {
        setParentDashData((prev: any) => ({
          ...prev,
          ai_recommendation: data
        }));
      } else if (currentUser?.role === "school") {
        setSchoolDashData((prev: any) => ({
          ...prev,
          ai_recommendation: data
        }));
      }
    } finally {
      setLoadingAI(false);
    }
  };

  const [pendingLinks, setPendingLinks] = useState<any>({ parent_links: [], school_links: [] });
  const [learnerDashData, setLearnerDashData] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedChildProgress, setSelectedChildProgress] = useState<any>(null);
  const [loadingChildProgress, setLoadingChildProgress] = useState(false);

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const [nextConfig, nextCurriculum] = await Promise.all([
          loadAppConfig(),
          loadCurriculum(),
        ]);
        if (!active) return;
        setConfig(nextConfig);
        setCurriculum(nextCurriculum);
        setBootError("");
      } catch (error) {
        if (!active) return;
        setBootError(getErrorMessage(error));
      }
    }
    boot();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("require_login") === "true") {
      setIsAuthOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Hydrate progressByTopic from DB on auth
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

  // Load Review Data
  const loadReviewData = async () => {
    if (!currentUser) return;
    setLoadingReview(true);
    setReviewError("");
    try {
      const res = await getReviewWords();
      setReviewWords(res.words || []);
    } catch (err: any) {
      setReviewError(getErrorMessage(err));
    } finally {
      setLoadingReview(false);
    }
  };

  useEffect(() => {
    if (activeTab === "review" && currentUser) loadReviewData();
  }, [activeTab, currentUser]);

  // Load Dash Data phụ huynh / trường học
  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoadingDash(true);
    try {
      if (currentUser.role === "parent") {
        const data = await getParentDashboard();
        setParentDashData(data);
        if (data.linked_learners?.length > 0 && !selectedChildId) {
          setSelectedChildId(data.linked_learners[0].learner_id);
        }
      } else if (currentUser.role === "school") {
        const data = await getSchoolDashboard();
        setSchoolDashData(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    } finally {
      setLoadingDash(false);
    }
  };

  useEffect(() => {
    if (["family", "school", "progress", "account"].includes(activeTab) && currentUser) {
      loadDashboardData();
    }
  }, [activeTab, currentUser]);

  // Load Tiến độ Học sinh (Learner Progress)
  const loadLearnerProgress = async () => {
    if (!currentUser || currentUser.role !== "learner") return;
    setLoadingProgress(true);
    setProgressError("");
    try {
      const [dash, links] = await Promise.all([
        getLearnerDashboard(currentUser.id),
        getPendingLinks(),
      ]);
      setLearnerDashData(dash);
      setPendingLinks(links || { parent_links: [], school_links: [] });
    } catch (err: any) {
      setProgressError(getErrorMessage(err));
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    if (activeTab === "progress" && currentUser?.role === "learner") {
      loadLearnerProgress();
    }
  }, [activeTab, currentUser]);

  // Load Tiến độ của con (Dành cho phụ huynh)
  useEffect(() => {
    const fetchChildProgress = async () => {
      if (!selectedChildId || activeTab !== "progress" || currentUser?.role !== "parent") {
        setSelectedChildProgress(null);
        return;
      }
      setLoadingChildProgress(true);
      try {
        const data = await getLearnerDashboard(selectedChildId);
        setSelectedChildProgress(data);
      } catch (err) {
        console.error("Lỗi khi tải tiến độ của con:", err);
      } finally {
        setLoadingChildProgress(false);
      }
    };
    fetchChildProgress();
  }, [selectedChildId, activeTab, currentUser]);

  const handleApproveLink = async (type: "parent" | "school", id: string) => {
    try {
      type === "parent" ? await approveParentLink(id) : await approveSchoolLink(id);
      loadLearnerProgress();
    } catch (err) { alert("Lỗi khi duyệt: " + getErrorMessage(err)); }
  };

  const handleRejectLink = async (type: "parent" | "school", id: string) => {
    try {
      type === "parent" ? await rejectParentLink(id) : await rejectSchoolLink(id);
      loadLearnerProgress();
    } catch (err) { alert("Lỗi khi từ chối: " + getErrorMessage(err)); }
  };

  const handleStartReviewPractice = async (gloss: string) => {
    setLoadingReviewWord(gloss);
    try {
      const detail = await getVocabularyDetail(gloss);
      setActiveReviewWord({ order: 0, gloss: detail.gloss, checkpoint_group: 1, study: detail });
    } catch (err) { alert("Không thể tải thông tin từ vựng: " + getErrorMessage(err)); }
    finally { setLoadingReviewWord(null); }
  };

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "school" && ["learn", "review", "progress", "family"].includes(activeTab)) setActiveTab("school");
    else if (currentUser.role === "parent" && ["learn", "review", "school", "custom_package"].includes(activeTab)) setActiveTab("family");
    else if (currentUser.role === "learner" && ["family", "school", "custom_package"].includes(activeTab)) setActiveTab("learn");
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    setActiveTab("learn");
    setParentDashData(null);
    setSchoolDashData(null);
  };

  const immersiveStage = activeTab === "learn" && practice.session !== null && ["learn", "practice_i", "practice_ii"].includes(practice.session.stage);
  const topics = [...(curriculum?.topics ?? []), ...MOCK_EXTRA_TOPICS];

  return (
    <div className={immersiveStage ? "app-shell app-shell-learn-immersive" : "app-shell flow-shell"}>
      {!immersiveStage && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          curriculumTopics={config?.curriculum_topics ?? []}
          onOpenAuth={() => {
            setIsAuthOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}
    
      <main className={immersiveStage ? "learn-immersive-main" : "flow-main"}>
        {activeTab === "learn" && (
          <LearnTab
            bootError={bootError} curriculum={curriculum} session={practice.session} topics={topics} progressByTopic={practice.progressByTopic}
            onOpenAuth={() => setIsAuthOpen(true)}
            onBackToTopics={practice.handleBackToTopics} onStartWordPractice={practice.handleStartWordPractice} onGoToLearnWord={practice.handleGoToLearnWord}
            onPracticeIComplete={practice.handlePracticeIComplete} onStartQuiz={practice.handleStartQuiz} onPracticeIIComplete={practice.handlePracticeIIComplete} onRestartTopic={practice.handleRestartTopic}
          />
        )}

        {activeTab === "review" && (
          <ReviewTab
            activeReviewWord={activeReviewWord} loadingReview={loadingReview} reviewError={reviewError} reviewWords={reviewWords} loadingReviewWord={loadingReviewWord}
            onOpenAuth={() => setIsAuthOpen(true)} onSetActiveTab={setActiveTab} onStartReviewPractice={handleStartReviewPractice} onLoadReviewData={loadReviewData} onClearActiveReviewWord={() => setActiveReviewWord(null)} onCompleteReview={async () => { setActiveReviewWord(null); await loadReviewData(); }}
          />
        )}

        {activeTab === "progress" && (
          <ProgressTab
            topics={topics} parentDashData={parentDashData} loadingProgress={loadingProgress} progressError={progressError} learnerDashData={learnerDashData} pendingLinks={pendingLinks}
            selectedChildId={selectedChildId} selectedChildProgress={selectedChildProgress} loadingChildProgress={loadingChildProgress} onOpenAuth={() => setIsAuthOpen(true)} onSetSelectedChildId={setSelectedChildId} onApproveLink={handleApproveLink} onRejectLink={handleRejectLink}
          />
        )}

        {activeTab === "account" && (
          <AccountTab
            parentDashData={parentDashData} schoolDashData={schoolDashData} onOpenAuth={() => setIsAuthOpen(true)}
            onReloadDashboard={loadDashboardData}
          />
        )}

        {activeTab === "custom_package" && <CustomPackageTab />}
        {activeTab === "family" && (
          <FamilyTab
            loadingDash={loadingDash}
            parentDashData={parentDashData}
            topics={topics}
            loadingAI={loadingAI}
            onRefreshAI={handleRefreshAI}
          />
        )}
        {activeTab === "school" && (
          <SchoolTab
            loadingDash={loadingDash}
            schoolDashData={schoolDashData}
            loadingAI={loadingAI}
            onRefreshAI={handleRefreshAI}
          />
        )}
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={(newToken) => login(newToken)} />
    </div>
  );
}