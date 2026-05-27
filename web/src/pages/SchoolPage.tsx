import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getSchoolDashboard, getLearnerDashboard, refreshAIRecommendation } from "../api";
import { loadCurriculumCached } from "../api/curriculumCache";
import { MOCK_EXTRA_TOPICS } from "../data/mockTopics";
import { SchoolTab } from "./tabs/SchoolTab";

export default function SchoolPage() {
  const { currentUser } = useAuth();

  const [curriculum, setCurriculum] = useState<any>(null);
  const [schoolDashData, setSchoolDashData] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentProgress, setSelectedStudentProgress] = useState<any>(null);
  const [loadingStudentProgress, setLoadingStudentProgress] = useState(false);

  useEffect(() => {
    loadCurriculumCached().then(setCurriculum).catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "school") return;
    let active = true;
    setLoadingDash(true);
    getSchoolDashboard()
      .then((data) => {
        if (!active) return;
        setSchoolDashData(data);
        if (data.linked_learners?.length > 0) {
          setSelectedStudentId(data.linked_learners[0].learner_id);
        }
      })
      .catch((err) => console.error("Lỗi khi tải dữ liệu trường học:", err))
      .finally(() => { if (active) setLoadingDash(false); });
    return () => { active = false; };
  }, [currentUser?.id]);

  // Keep selectedStudentId valid when dashboard data refreshes
  useEffect(() => {
    if (currentUser?.role !== "school") return;
    const learners = schoolDashData?.linked_learners || [];
    if (learners.length === 0) {
      setSelectedStudentId("");
      setSelectedStudentProgress(null);
      return;
    }
    const stillExists = learners.some((l: any) => l.learner_id === selectedStudentId);
    if (!selectedStudentId || !stillExists) {
      setSelectedStudentId(learners[0].learner_id);
    }
  }, [schoolDashData, currentUser?.role]);

  useEffect(() => {
    if (!selectedStudentId || currentUser?.role !== "school") {
      setSelectedStudentProgress(null);
      return;
    }
    let active = true;
    setLoadingStudentProgress(true);
    getLearnerDashboard(selectedStudentId)
      .then((data) => { if (active) setSelectedStudentProgress(data); })
      .catch((err) => {
        console.error("Lỗi khi tải chi tiết học sinh:", err);
        if (active) setSelectedStudentProgress(null);
      })
      .finally(() => { if (active) setLoadingStudentProgress(false); });
    return () => { active = false; };
  }, [selectedStudentId, currentUser?.role]);

  const handleRefreshAI = async () => {
    setLoadingAI(true);
    try {
      const data = await refreshAIRecommendation();
      setSchoolDashData((prev: any) => ({ ...prev, ai_recommendation: data }));
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <SchoolTab
      topics={[...(curriculum?.topics ?? []), ...MOCK_EXTRA_TOPICS]}
      loadingDash={loadingDash}
      schoolDashData={schoolDashData}
      loadingAI={loadingAI}
      onRefreshAI={handleRefreshAI}
      selectedStudentId={selectedStudentId}
      selectedStudentProgress={selectedStudentProgress}
      loadingStudentProgress={loadingStudentProgress}
      onSelectStudent={setSelectedStudentId}
    />
  );
}
