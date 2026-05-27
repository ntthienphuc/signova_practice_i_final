import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import {
  getLearnerDashboard, getPendingLinks, getParentDashboard,
  approveParentLink, rejectParentLink, approveSchoolLink, rejectSchoolLink,
} from "../api";
import { loadCurriculumCached } from "../api/curriculumCache";
import { MOCK_EXTRA_TOPICS } from "../data/mockTopics";
import { ProgressTab } from "./tabs/ProgressTab";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export default function ProgressPage() {
  const { openAuth } = useDashboard();
  const { currentUser } = useAuth();

  const [curriculum, setCurriculum] = useState<any>(null);
  const [learnerDashData, setLearnerDashData] = useState<any>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [pendingLinks, setPendingLinks] = useState<any>({ parent_links: [], school_links: [] });
  const [parentDashData, setParentDashData] = useState<any>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [selectedChildProgress, setSelectedChildProgress] = useState<any>(null);
  const [loadingChildProgress, setLoadingChildProgress] = useState(false);

  useEffect(() => {
    loadCurriculumCached().then(setCurriculum).catch(console.error);
  }, []);

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

  const loadParentProgress = async () => {
    if (!currentUser || currentUser.role !== "parent") return;
    setLoadingProgress(true);
    try {
      const data = await getParentDashboard();
      setParentDashData(data);
      if (data.linked_learners?.length > 0 && !selectedChildId) {
        setSelectedChildId(data.linked_learners[0].learner_id);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu tiến độ:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "learner") loadLearnerProgress();
    else if (currentUser?.role === "parent") loadParentProgress();
  }, [currentUser?.id]);

  useEffect(() => {
    const fetchChildProgress = async () => {
      if (!selectedChildId || currentUser?.role !== "parent") {
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
  }, [selectedChildId, currentUser?.role]);

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

  return (
    <ProgressTab
      topics={[...(curriculum?.topics ?? []), ...MOCK_EXTRA_TOPICS]}
      parentDashData={parentDashData}
      loadingProgress={loadingProgress}
      progressError={progressError}
      learnerDashData={learnerDashData}
      pendingLinks={pendingLinks}
      selectedChildId={selectedChildId}
      selectedChildProgress={selectedChildProgress}
      loadingChildProgress={loadingChildProgress}
      onOpenAuth={openAuth}
      onSetSelectedChildId={setSelectedChildId}
      onApproveLink={handleApproveLink}
      onRejectLink={handleRejectLink}
    />
  );
}
