import { useEffect, useState } from "react";
import {
  ensureBaseUrl,
  loadAppConfig,
  loadCurriculum,
  getCurrentUser,
  getReviewWords,
  getVocabularyDetail,
  getParentDashboard,
  getSchoolDashboard,
  updateProfile,
  searchLearners,
  requestParentLink,
  requestSchoolLink,
  getPendingLinks,
  approveParentLink,
  rejectParentLink,
  approveSchoolLink,
  rejectSchoolLink,
  getLearnerDashboard,
  type AnalyzeResponse,
  type AppConfig,
} from "../api";
import { Sidebar } from "../components/learn-dashboard/Sidebar";
import { AuthModal } from "../components/AuthModal";
import type {
  AnalysisSummary,
  AppTab,
  DashboardPayload,
  PracticeSession,
  ProgressByTopic,
  Topic,
} from "../types/learn";
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

function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function summarizeAnalysis(raw: AnalyzeResponse): AnalysisSummary {
  return {
    target_gloss: raw.target_gloss,
    practice_mode: raw.practice_mode,
    score: raw.score,
    decision: raw.decision ?? {},
    feedback: raw.feedback ?? {},
    classifier: raw.classifier ?? null,
  };
}

function buildInitialSession(topic: Topic): PracticeSession {
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


interface PracticePageProps {
  initialTab?: AppTab;
}

export default function PracticePage({ initialTab = "learn" }: PracticePageProps) {
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8010");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [curriculum, setCurriculum] = useState<DashboardPayload | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  const [bootError, setBootError] = useState("");
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [progressByTopic, setProgressByTopic] = useState<ProgressByTopic>({});

  // Auth & Review States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("signova_token"));
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [activeReviewWord, setActiveReviewWord] = useState<any>(null);
  const [loadingReviewWord, setLoadingReviewWord] = useState<string | null>(null);

  // Dynamic dashboard states
  const [parentDashData, setParentDashData] = useState<any>(null);
  const [schoolDashData, setSchoolDashData] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  // Profile Settings States
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactPhoneInput, setContactPhoneInput] = useState("");

  // Connection management states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<any>(null);
  const [linkClassName, setLinkClassName] = useState("");
  const [linkStudentCode, setLinkStudentCode] = useState("");
  const [linkSuccessMsg, setLinkSuccessMsg] = useState("");
  const [linkErrorMsg, setLinkErrorMsg] = useState("");

  // Progress/Stats States
  const [pendingLinks, setPendingLinks] = useState<any>({ parent_links: [], school_links: [] });
  const [learnerDashData, setLearnerDashData] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedChildProgress, setSelectedChildProgress] = useState<any>(null);
  const [loadingChildProgress, setLoadingChildProgress] = useState(false);

  const absoluteApiBase = ensureBaseUrl(apiBase);

  const fetchUser = async () => {
    const localToken = localStorage.getItem("signova_token");
    if (!localToken) {
      setCurrentUser(null);
      return;
    }
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      if (user.role === "school" && (activeTab === "learn" || activeTab === "review" || activeTab === "progress" || activeTab === "family")) {
        setActiveTab("school");
      } else if (user.role === "parent" && (activeTab === "learn" || activeTab === "review" || activeTab === "school" || activeTab === "custom_package")) {
        setActiveTab("family");
      } else if (user.role === "learner" && (activeTab === "family" || activeTab === "school" || activeTab === "custom_package")) {
        setActiveTab("learn");
      }
    } catch (err) {
      localStorage.removeItem("signova_token");
      setToken(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token, absoluteApiBase]);

  // Sync profile form states
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "learner" && currentUser.learner_profile) {
        setDisplayNameInput(currentUser.learner_profile.display_name || "");
        setDobInput(currentUser.learner_profile.dob || "");
      } else if (currentUser.role === "parent" && currentUser.parent_profile) {
        setDisplayNameInput(currentUser.parent_profile.display_name || "");
        setPhoneInput(currentUser.parent_profile.phone || "");
      } else if (currentUser.role === "school" && currentUser.school_profile) {
        setSchoolNameInput(currentUser.school_profile.school_name || "");
        setContactNameInput(currentUser.school_profile.contact_name || "");
        setContactPhoneInput(currentUser.school_profile.contact_phone || "");
      }
    }
  }, [currentUser]);

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
    if (activeTab === "review" && currentUser) {
      loadReviewData();
    }
  }, [activeTab, currentUser]);

  // Load parent/school dashboard data dynamically
  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoadingDash(true);
    try {
      if (currentUser.role === "parent") {
        const data = await getParentDashboard();
        setParentDashData(data);
        if (data.linked_learners && data.linked_learners.length > 0 && !selectedChildId) {
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
    if ((activeTab === "family" || activeTab === "school" || activeTab === "progress" || activeTab === "account") && currentUser) {
      loadDashboardData();
    }
  }, [activeTab, currentUser]);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setProfileLoading(true);
    try {
      const payload: any = {};
      if (currentUser.role === "learner") {
        payload.display_name = displayNameInput;
        payload.dob = dobInput || null;
      } else if (currentUser.role === "parent") {
        payload.display_name = displayNameInput;
        payload.phone = phoneInput || null;
      } else if (currentUser.role === "school") {
        payload.school_name = schoolNameInput;
        payload.contact_name = contactNameInput || null;
        payload.contact_phone = contactPhoneInput || null;
      }
      await updateProfile(payload);
      setProfileSuccessMsg("Cập nhật thông tin tài khoản thành công!");
      fetchUser();
    } catch (err: any) {
      setProfileErrorMsg(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSearchLearnerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchLearners(val);
      setSearchResults(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLearner = (learner: any) => {
    setSelectedLearner(learner);
    setSearchQuery(learner.username);
    setSearchResults([]);
  };

  const handleSendLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner) return;
    setLinkSuccessMsg("");
    setLinkErrorMsg("");
    try {
      if (currentUser.role === "parent") {
        await requestParentLink(selectedLearner.username);
        setLinkSuccessMsg(`Đã gửi yêu cầu kết nối tới con "${selectedLearner.username}" thành công! Con cần duyệt trong tab Tiến độ.`);
      } else if (currentUser.role === "school") {
        if (!linkClassName || !linkStudentCode) {
          setLinkErrorMsg("Vui lòng điền Lớp và Mã số học sinh.");
          return;
        }
        await requestSchoolLink(selectedLearner.username, linkClassName, linkStudentCode);
        setLinkSuccessMsg(`Đã gửi yêu cầu kết nối tới học sinh "${selectedLearner.username}" thành công! Học sinh cần duyệt.`);
        setLinkClassName("");
        setLinkStudentCode("");
      }
      setSelectedLearner(null);
      setSearchQuery("");
      loadDashboardData();
    } catch (err: any) {
      setLinkErrorMsg(getErrorMessage(err));
    }
  };

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

  const handleApproveLink = async (type: "parent" | "school", id: string) => {
    try {
      if (type === "parent") {
        await approveParentLink(id);
      } else {
        await approveSchoolLink(id);
      }
      loadLearnerProgress();
    } catch (err) {
      alert("Lỗi khi duyệt yêu cầu: " + getErrorMessage(err));
    }
  };

  const handleRejectLink = async (type: "parent" | "school", id: string) => {
    try {
      if (type === "parent") {
        await rejectParentLink(id);
      } else {
        await rejectSchoolLink(id);
      }
      loadLearnerProgress();
    } catch (err) {
      alert("Lỗi khi từ chối yêu cầu: " + getErrorMessage(err));
    }
  };

  const handleStartReviewPractice = async (gloss: string) => {
    setLoadingReviewWord(gloss);
    try {
      const detail = await getVocabularyDetail(gloss);
      const mockWordItem = {
        order: 0,
        gloss: detail.gloss,
        checkpoint_group: 1,
        study: detail,
      };
      setActiveReviewWord(mockWordItem);
    } catch (err) {
      alert("Không thể tải thông tin từ vựng: " + getErrorMessage(err));
    } finally {
      setLoadingReviewWord(null);
    }
  };

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("signova_token");
    setToken(null);
    setCurrentUser(null);
    setActiveTab("learn");
    setSession(null);
    setParentDashData(null);
    setSchoolDashData(null);
  };
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
        setBootError(getErrorMessage(error));
      }
    }
    void boot();
    return () => {
      active = false;
    };
  }, [absoluteApiBase]);

  const immersiveStage =
    activeTab === "learn" &&
    session !== null &&
    ["learn", "practice_i", "practice_ii"].includes(session.stage);

  function updateTopicProgress(topicId: string, patch: Partial<ProgressByTopic[string]>) {
    setProgressByTopic((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] ?? { completedWords: 0, completed: false }),
        ...patch,
      },
    }));
  }

  function handleOpenTopic(topic: Topic) {
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
    setSession((prev) => (prev ? { ...prev, stage: "practice_i" } : prev));
  }

  function handleGoToLearnWord(nextIndex: number) {
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

  function handlePracticeIComplete(raw: AnalyzeResponse) {
    if (!session) {
      return;
    }
    updateTopicProgress(session.topic.id, {
      completedWords: Math.max(
        session.wordIndex + 1,
        progressByTopic[session.topic.id]?.completedWords ?? 0
      ),
    });
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      const word = prev.topic.words[prev.wordIndex];
      const nextPracticeResults = {
        ...prev.practiceResults,
        [word.gloss]: summarizeAnalysis(raw),
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

  function handlePracticeIIComplete(raw: AnalyzeResponse) {
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

  return (
    <div className={immersiveStage ? "app-shell app-shell-learn-immersive" : "app-shell flow-shell"}>
      {!immersiveStage ? (
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          apiBase={apiBase}
          onApiBaseChange={setApiBase}
          curriculumTopics={config?.curriculum_topics ?? []}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      ) : null}

      <main className={immersiveStage ? "learn-immersive-main" : "flow-main"}>
        {activeTab === "learn" ? (
          <LearnTab
            bootError={bootError}
            curriculum={curriculum}
            session={session}
            topics={topics}
            progressByTopic={progressByTopic}
            absoluteApiBase={absoluteApiBase}
            onBackToTopics={handleBackToTopics}
            onStartWordPractice={handleStartWordPractice}
            onGoToLearnWord={handleGoToLearnWord}
            onPracticeIComplete={handlePracticeIComplete}
            onStartQuiz={handleStartQuiz}
            onPracticeIIComplete={handlePracticeIIComplete}
            onRestartTopic={handleRestartTopic}
          />
        ) : null}

        {activeTab === "review" ? (
          <ReviewTab
            currentUser={currentUser}
            activeReviewWord={activeReviewWord}
            loadingReview={loadingReview}
            reviewError={reviewError}
            reviewWords={reviewWords}
            loadingReviewWord={loadingReviewWord}
            absoluteApiBase={absoluteApiBase}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSetActiveTab={setActiveTab}
            onStartReviewPractice={handleStartReviewPractice}
            onLoadReviewData={loadReviewData}
            onClearActiveReviewWord={() => setActiveReviewWord(null)}
            onCompleteReview={async () => {
              setActiveReviewWord(null);
              await loadReviewData();
            }}
          />
        ) : null}

        {activeTab === "progress" ? (
          <ProgressTab
            currentUser={currentUser}
            topics={topics}
            parentDashData={parentDashData}
            loadingProgress={loadingProgress}
            progressError={progressError}
            learnerDashData={learnerDashData}
            pendingLinks={pendingLinks}
            selectedChildId={selectedChildId}
            selectedChildProgress={selectedChildProgress}
            loadingChildProgress={loadingChildProgress}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSetSelectedChildId={setSelectedChildId}
            onApproveLink={handleApproveLink}
            onRejectLink={handleRejectLink}
          />
        ) : null}

        {activeTab === "account" ? (
          <AccountTab
            currentUser={currentUser}
            displayNameInput={displayNameInput}
            dobInput={dobInput}
            phoneInput={phoneInput}
            schoolNameInput={schoolNameInput}
            contactNameInput={contactNameInput}
            contactPhoneInput={contactPhoneInput}
            profileSuccessMsg={profileSuccessMsg}
            profileErrorMsg={profileErrorMsg}
            profileLoading={profileLoading}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searching={searching}
            selectedLearner={selectedLearner}
            linkClassName={linkClassName}
            linkStudentCode={linkStudentCode}
            linkSuccessMsg={linkSuccessMsg}
            linkErrorMsg={linkErrorMsg}
            parentDashData={parentDashData}
            schoolDashData={schoolDashData}
            onOpenAuth={() => setIsAuthOpen(true)}
            onUpdateProfile={handleUpdateProfile}
            onSearchLearnerChange={handleSearchLearnerChange}
            onSelectLearner={handleSelectLearner}
            onSendLinkRequest={handleSendLinkRequest}
            onSetDisplayNameInput={setDisplayNameInput}
            onSetDobInput={setDobInput}
            onSetPhoneInput={setPhoneInput}
            onSetSchoolNameInput={setSchoolNameInput}
            onSetContactNameInput={setContactNameInput}
            onSetContactPhoneInput={setContactPhoneInput}
            onSetSelectedLearner={setSelectedLearner}
            onSetLinkClassName={setLinkClassName}
            onSetLinkStudentCode={setLinkStudentCode}
          />
        ) : null}

        {activeTab === "custom_package" ? <CustomPackageTab /> : null}

        {activeTab === "family" ? (
          <FamilyTab
            currentUser={currentUser}
            loadingDash={loadingDash}
            parentDashData={parentDashData}
          />
        ) : null}

        {activeTab === "school" ? (
          <SchoolTab
            currentUser={currentUser}
            loadingDash={loadingDash}
            schoolDashData={schoolDashData}
          />
        ) : null}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
