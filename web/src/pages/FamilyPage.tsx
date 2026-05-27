import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import { getParentDashboard, refreshAIRecommendation } from "../api";
import { loadCurriculumCached } from "../api/curriculumCache";
import { MOCK_EXTRA_TOPICS } from "../data/mockTopics";
import { FamilyTab } from "./tabs/FamilyTab";

export default function FamilyPage() {
  const { openAuth } = useDashboard();
  const { currentUser } = useAuth();

  const [curriculum, setCurriculum] = useState<any>(null);
  const [parentDashData, setParentDashData] = useState<any>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    loadCurriculumCached().then(setCurriculum).catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "parent") return;
    let active = true;
    setLoadingDash(true);
    getParentDashboard()
      .then((data) => { if (active) setParentDashData(data); })
      .catch((err) => console.error("Lỗi khi tải dữ liệu gia đình:", err))
      .finally(() => { if (active) setLoadingDash(false); });
    return () => { active = false; };
  }, [currentUser?.id]);

  const handleRefreshAI = async () => {
    setLoadingAI(true);
    try {
      const data = await refreshAIRecommendation();
      setParentDashData((prev: any) => ({ ...prev, ai_recommendation: data }));
    } finally {
      setLoadingAI(false);
    }
  };

  const topics = [...(curriculum?.topics ?? []), ...MOCK_EXTRA_TOPICS];

  return (
    <FamilyTab
      loadingDash={loadingDash}
      parentDashData={parentDashData}
      topics={topics}
      loadingAI={loadingAI}
      onRefreshAI={handleRefreshAI}
    />
  );
}
