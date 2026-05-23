import { useEffect, useMemo, useState } from "react";
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
} from "./api";
import { DashboardPlaceholder } from "./components/DashboardPlaceholder";
import { PracticeWorkspace } from "./components/PracticeWorkspace";
import { Sidebar } from "./components/Sidebar";
import { StudyStage } from "./components/StudyStage";
import { TopicGrid } from "./components/TopicGrid";
import { TopicSummary } from "./components/TopicSummary";
import { AuthModal } from "./components/AuthModal";
import type {
  AnalysisSummary,
  AppTab,
  DashboardPayload,
  PracticeSession,
  ProgressByTopic,
  Topic,
} from "./types/learn";

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

interface LearnHomeProps {
  topics: Topic[];
  progressByTopic: ProgressByTopic;
  onOpenTopic: (topic: Topic) => void;
}

function LearnHome({ topics, progressByTopic, onOpenTopic }: LearnHomeProps) {
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

interface PracticePageProps {
  initialTab?: AppTab;
}

export default function PracticePage({ initialTab = "learn" }: PracticePageProps) {
  const [apiBase, setApiBase] = useState(import.meta.env.VITE_API_BASE_URL || "https://thienphuc12339-signova-backend.hf.space");
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
    if (!session || !currentWord) {
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

  function renderReviewTab() {
    if (!currentUser) {
      return (
        <section className="card-surface hero-panel text-center py-12">
          <p className="eyebrow">🔑 Yêu cầu đăng nhập</p>
          <h2>Hãy đăng nhập học sinh để sử dụng tính năng luyện tập</h2>
          <p className="muted mb-6">Tính năng này giúp bạn xem lại các từ đã học, thống kê số lần sai và luyện tập lại để tăng điểm số.</p>
          <button
            onClick={() => setIsAuthOpen(true)}
            type="button"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-bold rounded-xl border-0 cursor-pointer shadow-lg hover:shadow-indigo-200 transition-all"
          >
            Đăng nhập / Đăng ký ngay
          </button>
        </section>
      );
    }

    if (activeReviewWord) {
      return (
        <PracticeWorkspace
          apiBase={absoluteApiBase}
          mode="practice_i"
          targetGloss={activeReviewWord.gloss}
          lessonGlosses={[activeReviewWord.gloss]}
          referenceStudy={activeReviewWord.study}
          wordIndex={0}
          wordCount={1}
          title={`Ôn tập • ${activeReviewWord.gloss}`}
          subtitle="Tập lại ký hiệu này bằng cách quay video và kiểm tra kết quả."
          actionLabel="Phân tích lại"
          completionLabel="Hoàn thành ôn tập"
          onBackToLearn={() => setActiveReviewWord(null)}
          onComplete={async () => {
            setActiveReviewWord(null);
            await loadReviewData();
          }}
        />
      );
    }

    if (loadingReview) {
      return (
        <section className="card-surface hero-panel">
          <p className="eyebrow">Đang tải</p>
          <h2>Đang tải danh sách từ cần ôn tập...</h2>
        </section>
      );
    }

    if (reviewError) {
      return (
        <section className="card-surface hero-panel">
          <p className="eyebrow">Lỗi</p>
          <h2>Không thể tải danh sách ôn tập</h2>
          <p className="error-text">{reviewError}</p>
          <button onClick={loadReviewData} className="primary-button mt-4">Tải lại</button>
        </section>
      );
    }

    const failedWordsCount = reviewWords.filter(w => w.failed_attempt_count > 0).length;

    return (
      <section className="review-home space-y-6">
        <div className="hero-panel card-surface">
          <p className="eyebrow text-indigo-600 font-bold">Tab Luyện Tập</p>
          <h2>Ôn tập các từ đã học</h2>
          <p className="muted">
            Xếp hạng các từ theo số lần làm sai nhiều nhất. Hãy luyện tập lại những từ khó để thành thạo hơn nhé!
          </p>

          <div className="flex gap-4 mt-6 text-sm">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 flex-1">
              <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider">Đã học</span>
              <strong className="text-2xl text-indigo-700 font-bold block mt-1">{reviewWords.length} từ</strong>
            </div>
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 flex-1">
              <span className="block text-slate-500 text-xs uppercase font-bold tracking-wider">Từ hay sai</span>
              <strong className="text-2xl text-rose-700 font-bold block mt-1">{failedWordsCount} từ</strong>
            </div>
          </div>
        </div>

        {reviewWords.length === 0 ? (
          <div className="card-surface text-center py-16">
            <p className="text-slate-400 mb-4 text-sm font-semibold">Bạn chưa học từ nào trong bất kỳ Topic nào.</p>
            <button
              onClick={() => setActiveTab("learn")}
              type="button"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border-0 cursor-pointer transition-colors text-sm"
            >
              Qua tab Học ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewWords.map((word) => {
              const failed = word.failed_attempt_count || 0;
              const correct = word.correct_attempt_count || 0;
              const bestScore = word.best_practice1_score !== null ? Math.round(word.best_practice1_score) : null;
              const lastScore = word.last_practice1_score !== null ? Math.round(word.last_practice1_score) : null;
              const isFailedMuch = failed >= 2;

              return (
                <div key={word.word_id} className="card-surface p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  {isFailedMuch && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl">
                      Cần cải thiện
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{word.gloss}</h3>
                    <div className="grid grid-cols-2 gap-3 my-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <div>
                        ❌ Sai nhiều: <strong className="text-rose-600">{failed} lần</strong>
                      </div>
                      <div>
                         Đúng: <strong className="text-emerald-600">{correct} lần</strong>
                      </div>
                      <div>
                        ⭐ Luyện tốt nhất: <strong>{bestScore !== null ? `${bestScore}đ` : "--"}</strong>
                      </div>
                      <div>
                         Lần cuối: <strong>{lastScore !== null ? `${lastScore}đ` : "--"}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartReviewPractice(word.gloss)}
                    disabled={loadingReviewWord === word.gloss}
                    type="button"
                    className="w-full py-2.5 bg-indigo-55 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 disabled:text-slate-400 font-bold rounded-xl text-xs transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loadingReviewWord === word.gloss ? (
                      <span className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Luyện tập lại
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  function renderLearnerProgressDetails(data: any) {
    const activeStreak = data.learning_streak || 0;
    const currentXp = data.xp || 0;
    const progressList = data.topic_progress || [];
    const earnedBadges = data.badges || [];
    const recentAttempts = data.recent_attempts || [];

    const DEFAULT_BADGES = [
      { code: "first_attempt", name: "Khởi đầu mới", description: "Thực hiện lượt luyện tập đầu tiên.", icon: "🚀" },
      { code: "first_correct_word", name: "Đúng chuẩn", description: "Đạt trạng thái Đạt (Accepted) cho một từ.", icon: "✅" },
      { code: "five_words_done", name: "Chăm chỉ", description: "Học xong 5 từ vựng.", icon: "📚" },
      { code: "checkpoint_clear", name: "Vượt ải", description: "Vượt qua bài checkpoint kiểm tra 5 từ.", icon: "🏁" },
      { code: "topic_finisher", name: "Làm chủ chủ đề", description: "Hoàn thành tất cả các từ trong chủ đề.", icon: "👑" },
      { code: "three_day_streak", name: "Kiên trì", description: "Duy trì chuỗi học tập 3 ngày liên tục.", icon: "🔥" },
      { code: "practice_master_80", name: "Cao thủ 80+", description: "Đạt điểm số 80 trở lên trong một lần tập.", icon: "🎖️" },
      { code: "practice_master_90", name: "Đỉnh cao 90+", description: "Đạt điểm số 90 trở lên trong một lần tập.", icon: "🏆" },
    ];

    const mergedProgress = topics.map((topic) => {
      const prog = progressList.find((tp: any) => tp.topic_id === topic.id);
      return {
        id: topic.id,
        title: topic.title,
        completedWords: prog ? prog.completed_words : 0,
        completed: prog ? prog.completed : false,
        checkpoint5_passed: prog ? prog.checkpoint5_passed : false,
        practice2_final_passed: prog ? prog.practice2_final_passed : false,
      };
    });

    const totalStudiedWords = progressList.reduce((acc: number, cur: any) => acc + (cur.completed_words || 0), 0);

    return (
      <div className="space-y-6">
        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-surface p-5 flex items-center justify-between bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Chuỗi liên tục</span>
              <strong className="block text-3xl font-black text-amber-700 mt-1">{activeStreak} ngày</strong>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
          <div className="card-surface p-5 flex items-center justify-between bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tổng điểm kinh nghiệm</span>
              <strong className="block text-3xl font-black text-indigo-700 mt-1">{currentXp} XP</strong>
            </div>
            <div className="text-4xl">⭐</div>
          </div>
          <div className="card-surface p-5 flex items-center justify-between bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Từ vựng đã học</span>
              <strong className="block text-3xl font-black text-emerald-700 mt-1">{totalStudiedWords} từ</strong>
            </div>
            <div className="text-4xl">📖</div>
          </div>
        </div>

        {/* Badges Gallery */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            🏅 Bộ sưu tập Huy hiệu
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DEFAULT_BADGES.map((badge) => {
              const isUnlocked = earnedBadges.some((eb: any) => eb.code === badge.code);
              return (
                <div
                  key={badge.code}
                  className={`p-4 rounded-2xl border text-center flex flex-col justify-between items-center transition-all ${
                    isUnlocked
                      ? "bg-gradient-to-br from-amber-50/60 to-orange-50/30 border-amber-200 shadow-md shadow-amber-50/30 scale-100"
                      : "bg-slate-50/50 border-slate-100 opacity-60 filter grayscale"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner mb-3 ${
                    isUnlocked ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                  }`}>
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs leading-snug">{badge.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">{badge.description}</p>
                  </div>
                  <span className={`mt-3 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                    isUnlocked ? "bg-amber-100 text-amber-800" : "bg-slate-150 text-slate-500"
                  }`}>
                    {isUnlocked ? "Đã Đạt" : "Chưa Đạt"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic progress mapping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              📚 Tiến trình các Chủ đề
            </h3>
            <div className="space-y-4">
              {mergedProgress.map((tp) => {
                const percent = Math.round((tp.completedWords / 10) * 100);
                return (
                  <div key={tp.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <strong className="font-semibold text-slate-800">{tp.title}</strong>
                      <span className="font-semibold text-indigo-700">{tp.completedWords}/10 từ ({percent}%)</span>
                    </div>
                    
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-sky-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="flex gap-2.5 mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      <span className={`flex items-center gap-1 ${tp.checkpoint5_passed ? "text-emerald-600" : "text-slate-350"}`}>
                        {tp.checkpoint5_passed ? "✅ Checkpoint 5" : "⚪ Checkpoint 5"}
                      </span>
                      <span className={`flex items-center gap-1 ${tp.practice2_final_passed ? "text-emerald-600" : "text-slate-350"}`}>
                        {tp.practice2_final_passed ? "✅ Practice II" : "⚪ Practice II"}
                      </span>
                      <span className={`flex items-center gap-1 ${tp.completed ? "text-emerald-600" : "text-slate-350"}`}>
                        {tp.completed ? "✅ Đã xong" : "⚪ Đang học"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent attempts */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              ⚡ Lịch sử luyện tập gần đây
            </h3>
            <div className="space-y-3">
              {recentAttempts.length > 0 ? (
                recentAttempts.map((att: any) => {
                  const date = new Date(att.created_at).toLocaleDateString("vi-VN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  return (
                    <div key={att.id} className="bg-slate-50/60 hover:bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                            att.practice_mode === "practice_i"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-sky-100 text-sky-850"
                          }`}>
                            {att.practice_mode === "practice_i" ? "Luyện từ" : "Kiểm tra"}
                          </span>
                          <strong className="text-slate-800 font-semibold">{att.target_gloss}</strong>
                        </div>
                        <span className="block text-[10px] text-slate-400">{date}</span>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-slate-700">{Math.round(att.score)} điểm</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          att.accepted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-850"
                        }`}>
                          {att.accepted ? "Đạt" : "Cần ôn tập"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-6">Chưa có bài làm nào gần đây. Hãy bắt đầu luyện tập!</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderProgressTab() {
    if (!currentUser) {
      return (
        <section className="card-surface hero-panel text-center py-12">
          <p className="eyebrow">🔑 Yêu cầu đăng nhập</p>
          <h2>Hãy đăng nhập để theo dõi tiến độ</h2>
          <button
            onClick={() => setIsAuthOpen(true)}
            type="button"
            className="primary-button mt-4"
          >
            Đăng nhập / Đăng ký
          </button>
        </section>
      );
    }

    const role = currentUser.role;

    if (role === "parent") {
      const kids = parentDashData?.linked_learners || [];
      return (
        <section className="progress-tab space-y-6">
          <div className="hero-panel card-surface">
            <p className="eyebrow text-indigo-600 font-bold">Tiến độ của con</p>
            <h2>Theo dõi chi tiết kết quả học tập của các con</h2>
            <p className="muted">Xem chuỗi ngày học, huy hiệu đạt được và lịch sử làm bài chi tiết.</p>
          </div>

          {kids.length === 0 ? (
            <div className="card-surface p-8 text-center text-slate-500 font-medium">
              Chưa có tài khoản con nào được liên kết. Vui lòng vào tab <strong>Tài khoản</strong> để thêm con.
            </div>
          ) : (
            <div className="space-y-6">
              <label className="field max-w-xs">
                <span>Chọn con để xem tiến độ</span>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {kids.map((kid: any) => (
                    <option key={kid.learner_id} value={kid.learner_id}>
                      {kid.display_name || kid.username} ({kid.username})
                    </option>
                  ))}
                </select>
              </label>

              {loadingChildProgress ? (
                <div className="card-surface p-6 text-center text-slate-500">Đang tải dữ liệu tiến độ của con...</div>
              ) : selectedChildProgress ? (
                renderLearnerProgressDetails(selectedChildProgress)
              ) : (
                <div className="card-surface p-6 text-center text-slate-500">Vui lòng chọn một người con.</div>
              )}
            </div>
          )}
        </section>
      );
    }

    if (role === "learner") {
      return (
        <section className="progress-tab space-y-6">
          <div className="hero-panel card-surface">
            <p className="eyebrow text-indigo-600 font-bold">Tiến độ cá nhân</p>
            <h2>Thành tích học tập của bạn</h2>
            <p className="muted">Duy trì ngọn lửa học tập hàng ngày để tích lũy XP và mở khóa huy hiệu quý giá.</p>
          </div>

          {loadingProgress ? (
            <div className="card-surface p-6 text-center text-slate-500 font-medium">Đang tải dữ liệu thành tích...</div>
          ) : progressError ? (
            <div className="card-surface p-6 text-center text-rose-600 font-medium">Lỗi: {progressError}</div>
          ) : learnerDashData ? (
            <>
              {/* Connection approval requests */}
              {((pendingLinks.parent_links && pendingLinks.parent_links.length > 0) ||
                (pendingLinks.school_links && pendingLinks.school_links.length > 0)) && (
                <div className="card-surface p-5 border border-amber-200 bg-amber-50/40 rounded-2xl space-y-3">
                  <h4 className="text-amber-800 font-bold text-sm flex items-center gap-1.5">
                    ⚠️ Có yêu cầu kết nối tài khoản mới!
                  </h4>
                  <div className="divide-y divide-amber-100">
                    {pendingLinks.parent_links.map((pl: any) => (
                      <div key={pl.id} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-700">
                          Phụ huynh <strong>{pl.parent_display_name}</strong> muốn liên kết để theo dõi tiến trình của bạn.
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveLink("parent", pl.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                          >
                            Đồng ý
                          </button>
                          <button
                            onClick={() => handleRejectLink("parent", pl.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingLinks.school_links.map((sl: any) => (
                      <div key={sl.id} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="text-slate-700">
                          Trường học <strong>{sl.school_name}</strong> muốn liên kết (Lớp: <strong>{sl.class_name}</strong>, MSSV: <strong>{sl.student_code}</strong>).
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveLink("school", sl.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                          >
                            Đồng ý
                          </button>
                          <button
                            onClick={() => handleRejectLink("school", sl.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {renderLearnerProgressDetails(learnerDashData)}
            </>
          ) : (
            <div className="card-surface p-6 text-center text-slate-500 font-medium">Không thể lấy dữ liệu tiến độ.</div>
          )}
        </section>
      );
    }

    return null;
  }

  function renderAccountTab() {
    if (!currentUser) {
      return (
        <section className="card-surface hero-panel text-center py-12">
          <p className="eyebrow">🔑 Yêu cầu đăng nhập</p>
          <h2>Hãy đăng nhập để xem thông tin tài khoản</h2>
          <button
            onClick={() => setIsAuthOpen(true)}
            type="button"
            className="primary-button mt-4"
          >
            Đăng nhập / Đăng ký
          </button>
        </section>
      );
    }

    const role = currentUser.role;

    return (
      <section className="account-tab space-y-6">
        <div className="hero-panel card-surface">
          <p className="eyebrow text-indigo-600 font-bold">Cài đặt tài khoản</p>
          <h2>Thiết lập thông tin cá nhân và kết nối</h2>
          <p className="muted">Quản lý hồ sơ cá nhân và kết nối giữa phụ huynh - con, nhà trường - học sinh.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Form */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              👤 Thông tin hồ sơ
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {role === "learner" && (
                <>
                  <label className="field">
                    <span>Tên hiển thị</span>
                    <input
                      type="text"
                      required
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Nhập tên hiển thị"
                    />
                  </label>
                  <label className="field">
                    <span>Ngày sinh</span>
                    <input
                      type="date"
                      value={dobInput}
                      onChange={(e) => setDobInput(e.target.value)}
                    />
                  </label>
                </>
              )}

              {role === "parent" && (
                <>
                  <label className="field">
                    <span>Họ tên phụ huynh</span>
                    <input
                      type="text"
                      required
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Nhập họ tên phụ huynh"
                    />
                  </label>
                  <label className="field">
                    <span>Số điện thoại</span>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Nhập số điện thoại liên hệ"
                    />
                  </label>
                </>
              )}

              {role === "school" && (
                <>
                  <label className="field">
                    <span>Tên trường học</span>
                    <input
                      type="text"
                      required
                      value={schoolNameInput}
                      onChange={(e) => setSchoolNameInput(e.target.value)}
                      placeholder="Nhập tên trường học"
                    />
                  </label>
                  <label className="field">
                    <span>Người đại diện liên hệ</span>
                    <input
                      type="text"
                      value={contactNameInput}
                      onChange={(e) => setContactNameInput(e.target.value)}
                      placeholder="Họ tên người liên hệ"
                    />
                  </label>
                  <label className="field">
                    <span>Số điện thoại liên hệ</span>
                    <input
                      type="tel"
                      value={contactPhoneInput}
                      onChange={(e) => setContactPhoneInput(e.target.value)}
                      placeholder="Số điện thoại liên hệ"
                    />
                  </label>
                </>
              )}

              {profileSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold">
                  {profileSuccessMsg}
                </div>
              )}
              {profileErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
                  {profileErrorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl border-0 cursor-pointer transition-colors text-xs shadow-md"
              >
                {profileLoading ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
              </button>
            </form>
          </div>

          {/* Connections Section */}
          <div className="card-surface p-6 space-y-4">
            {role === "learner" ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                  🔗 Kết nối gia đình & trường học
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Để liên kết tài khoản của bạn với phụ huynh hoặc trường học, vui lòng gửi tên tài khoản <strong>@{currentUser.username}</strong> của bạn cho họ. 
                  Yêu cầu liên kết từ họ sẽ hiển thị trong tab <strong>Tiến độ</strong> để bạn xác nhận hoặc từ chối.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1.5 border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tên tài khoản của bạn</div>
                  <div className="text-xl font-bold text-indigo-600 font-mono">@{currentUser.username}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span>➕ Thêm {role === "parent" ? "con" : "học sinh"} mới</span>
                </h3>

                <form onSubmit={handleSendLinkRequest} className="space-y-3">
                  <label className="field relative">
                    <span>Tìm kiếm tài khoản học sinh</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchLearnerChange}
                      placeholder="Nhập tên tài khoản học sinh..."
                      className="pr-10"
                    />
                    {searching && (
                      <span className="absolute right-3 top-9 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                    )}

                    {searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {searchResults.map((learner) => (
                          <div
                            key={learner.id}
                            onClick={() => handleSelectLearner(learner)}
                            className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-xs">
                              {learner.username[0].toUpperCase()}
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-slate-800 text-xs">{learner.display_name}</div>
                              <div className="text-[10px] text-slate-400">@{learner.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </label>

                  {selectedLearner && (
                    <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-150 flex items-center justify-between text-xs">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-indigo-400">Đã chọn học sinh</span>
                        <strong>{selectedLearner.display_name}</strong>{" "}
                        <span className="text-slate-500">(@{selectedLearner.username})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLearner(null)}
                        className="py-1 px-2.5 bg-rose-50 text-rose-600 border-0 rounded-lg hover:bg-rose-100 cursor-pointer font-bold transition-all text-[10px]"
                      >
                        Hủy chọn
                      </button>
                    </div>
                  )}

                  {role === "school" && selectedLearner && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="field">
                        <span>Lớp học</span>
                        <input
                          type="text"
                          required
                          value={linkClassName}
                          onChange={(e) => setLinkClassName(e.target.value)}
                          placeholder="Ví dụ: 3A"
                        />
                      </label>
                      <label className="field">
                        <span>Mã học sinh (Student Code)</span>
                        <input
                          type="text"
                          required
                          value={linkStudentCode}
                          onChange={(e) => setLinkStudentCode(e.target.value)}
                          placeholder="Ví dụ: HS001"
                        />
                      </label>
                    </div>
                  )}

                  {linkSuccessMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold">
                      {linkSuccessMsg}
                    </div>
                  )}
                  {linkErrorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
                      {linkErrorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedLearner}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-xl border-0 cursor-pointer transition-all text-xs shadow-md shadow-indigo-100"
                  >
                    🚀 Gửi yêu cầu kết nối
                  </button>
                </form>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Danh sách đã kết nối ({role === "parent" ? parentDashData?.linked_learners?.length || 0 : schoolDashData?.linked_learners?.length || 0})
                  </h4>

                  <div className="space-y-2">
                    {role === "parent" ? (
                      parentDashData?.linked_learners && parentDashData.linked_learners.length > 0 ? (
                        parentDashData.linked_learners.map((learner: any) => (
                          <div key={learner.learner_id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono">
                                {learner.username[0].toUpperCase()}
                              </div>
                              <div>
                                <strong className="font-bold text-slate-700">{learner.display_name || learner.username}</strong>
                                <span className="block text-[10px] text-slate-400">@{learner.username}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block font-semibold text-slate-600">🔥 {learner.learning_streak} ngày</span>
                              <span className="block text-[10px] text-indigo-600 font-bold">{learner.xp} XP</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 text-center py-4">Chưa liên kết với tài khoản con nào.</div>
                      )
                    ) : (
                      schoolDashData?.linked_learners && schoolDashData.linked_learners.length > 0 ? (
                        schoolDashData.linked_learners.map((student: any) => (
                          <div key={student.learner_id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono">
                                {student.username[0].toUpperCase()}
                              </div>
                              <div>
                                <strong className="font-bold text-slate-700">{student.display_name || student.username}</strong>
                                <span className="block text-[10px] text-slate-400">@{student.username} • Lớp {student.class_name || "--"}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block font-semibold text-slate-600">Mã: {student.student_code}</span>
                              <span className="block text-[10px] text-indigo-600 font-bold">{student.xp} XP</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 text-center py-4">Chưa liên kết với học sinh nào.</div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderCustomPackageTab() {
    return (
      <section className="custom-package-tab space-y-6">
        <div className="hero-panel card-surface">
          <p className="eyebrow text-indigo-600 font-bold">Gói học tùy chỉnh</p>
          <h2>Chương trình đào tạo riêng biệt cho trường của bạn</h2>
          <p className="muted">Tự thiết lập kho từ vựng, lộ trình bài giảng và giao bài tập theo lớp.</p>
        </div>

        <div className="card-surface p-8 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mx-auto text-3xl">
            🏫
          </div>
          <h3 className="text-lg font-bold text-slate-800">Tính năng đang được phát triển</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Hệ thống đang tích hợp cổng thiết kế giáo án tùy chỉnh cho các đối tác trường học. 
            Để đăng ký khóa học, phân bổ giáo viên, hoặc tạo giáo trình riêng cho trường của bạn, 
            vui lòng liên hệ với ban quản trị viên.
          </p>
          <div className="bg-indigo-50/50 p-4 rounded-xl text-left text-xs text-slate-600 space-y-2 inline-block w-full border border-indigo-100/50">
            <div>📞 <strong>Hotline hỗ trợ trường học:</strong> 1900 8198 (Nhánh số 3)</div>
            <div>✉️ <strong>Email hỗ trợ:</strong> partner@signova.edu.vn</div>
            <div>🏢 <strong>Địa chỉ làm việc:</strong> Tòa nhà văn phòng Signova, Hà Nội / TP. HCM</div>
          </div>
        </div>
      </section>
    );
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
        {activeTab === "learn" ? renderLearnTab() : null}
        {activeTab === "review" ? renderReviewTab() : null}
        {activeTab === "progress" ? renderProgressTab() : null}
        {activeTab === "account" ? renderAccountTab() : null}
        {activeTab === "custom_package" ? renderCustomPackageTab() : null}
        
        {activeTab === "family" ? (
          currentUser?.role === "parent" ? (
            <section className="family-dashboard space-y-6">
              <div className="hero-panel card-surface">
                <p className="eyebrow text-indigo-600 font-bold">Dashboard Phụ Huynh</p>
                <h2>Theo dõi tiến độ học của con</h2>
                <p className="muted">Dữ liệu được đồng bộ trực tiếp từ các buổi tập và bài kiểm tra của con.</p>
              </div>

              {loadingDash ? (
                <div className="card-surface p-6 text-center">Đang tải dữ liệu học tập...</div>
              ) : !parentDashData || !parentDashData.linked_learners || parentDashData.linked_learners.length === 0 ? (
                <div className="card-surface p-8 text-center text-slate-500 font-medium">
                  Chưa có tài khoản học sinh nào được liên kết. Hãy vào trang liên kết trong tài khoản của con để kết nối.
                </div>
              ) : (
                <div className="space-y-6">
                  {parentDashData.linked_learners.map((learner: any) => (
                    <div key={learner.learner_id} className="card-surface p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            {learner.username[0].toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{learner.username}</h3>
                            <span className="text-xs text-slate-500">Học sinh</span>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div>🔥 Chuỗi học: <strong>{learner.learning_streak} ngày</strong></div>
                          <div className="mt-0.5">⭐ Tổng điểm XP: <strong>{learner.xp}</strong></div>
                        </div>
                      </div>

                      {/* Topic completion list */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Độ hoàn thành Topic</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {learner.topic_progress && learner.topic_progress.length > 0 ? (
                            learner.topic_progress.map((tp: any) => (
                              <div key={tp.topic_id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-bold text-slate-700">{tp.topic_id === "topic_1" ? "Chủ đề 1" : "Chủ đề 2"}</span>
                                  <span className="block text-[10px] text-slate-500 mt-0.5">Đã học: {tp.completed_words}/10 từ</span>
                                </div>
                                <div className="text-right">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tp.completed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                    {tp.completed ? "Hoàn thành" : "Đang học"}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 col-span-2">Chưa bắt đầu học topic nào.</div>
                          )}
                        </div>
                      </div>

                      {/* Recent attempts */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hoạt động luyện tập gần đây</h4>
                        <div className="space-y-2">
                          {learner.recent_attempts && learner.recent_attempts.length > 0 ? (
                            learner.recent_attempts.map((att: any) => (
                              <div key={att.id} className="bg-slate-50 p-2.5 rounded-lg flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${att.practice_mode === "practice_i" ? "bg-indigo-100 text-indigo-800" : "bg-sky-100 text-sky-800"}`}>
                                    {att.practice_mode === "practice_i" ? "Luyện từ" : "Kiểm tra"}
                                  </span>
                                  <span className="font-semibold text-slate-700">{att.target_gloss}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span>Điểm số: <strong>{Math.round(att.score)}đ</strong></span>
                                  <span className={att.accepted ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                    {att.accepted ? "Đạt" : "Cần tập lại"}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400">Chưa ghi nhận hoạt động luyện tập nào.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <DashboardPlaceholder
              title="Dashboard Gia đình"
              description="Phần dashboard dành riêng cho phụ huynh. Vui lòng đăng nhập bằng tài khoản Phụ huynh."
            />
          )
        ) : null}

        {activeTab === "school" ? (
          currentUser?.role === "school" ? (
            <section className="school-dashboard space-y-6">
              <div className="hero-panel card-surface">
                <p className="eyebrow text-indigo-600 font-bold">Dashboard Nhà Trường</p>
                <h2>Quản lý lớp học & học sinh</h2>
                <p className="muted">Thống kê điểm số và quá trình hoàn thành bài học của toàn bộ học sinh được liên kết.</p>
              </div>

              {loadingDash ? (
                <div className="card-surface p-6 text-center">Đang tải danh sách học sinh...</div>
              ) : !schoolDashData || !schoolDashData.linked_learners || schoolDashData.linked_learners.length === 0 ? (
                <div className="card-surface p-8 text-center text-slate-500 font-medium">
                  Chưa có học sinh nào được liên kết với trường học.
                </div>
              ) : (
                <div className="card-surface overflow-x-auto p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="p-3">Học sinh</th>
                        <th className="p-3">Lớp</th>
                        <th className="p-3">Mã số</th>
                        <th className="p-3">Chuỗi học</th>
                        <th className="p-3">Tổng XP</th>
                        <th className="p-3">Độ hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schoolDashData.linked_learners.map((student: any) => {
                        const doneTopicsCount = student.topic_progress ? student.topic_progress.filter((tp: any) => tp.completed).length : 0;
                        return (
                          <tr key={student.learner_id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">{student.username}</td>
                            <td className="p-3 text-slate-600">{student.class_name || "--"}</td>
                            <td className="p-3 text-slate-600 font-mono">{student.student_code || "--"}</td>
                            <td className="p-3 text-slate-700">🔥 {student.learning_streak} ngày</td>
                            <td className="p-3 text-indigo-600 font-bold">{student.xp} XP</td>
                            <td className="p-3">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                                Xong {doneTopicsCount}/2 Topic
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <DashboardPlaceholder
              title="Dashboard Trường học"
              description="Phần dashboard dành riêng cho giáo viên/nhà trường. Vui lòng đăng nhập bằng tài khoản Trường học."
            />
          )
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

