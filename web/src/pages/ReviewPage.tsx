import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import { getReviewWords, getVocabularyDetail } from "../api";
import { ReviewTab } from "./tabs/ReviewTab";
import { tabToPath } from "../utils/dashboardRoutes";
import type { AppTab } from "../types/learn";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export default function ReviewPage() {
  const { openAuth } = useDashboard();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [reviewWords, setReviewWords] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [activeReviewWord, setActiveReviewWord] = useState<any>(null);
  const [loadingReviewWord, setLoadingReviewWord] = useState<string | null>(null);

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
    if (currentUser) loadReviewData();
  }, [currentUser?.id]);

  const handleStartReviewPractice = async (gloss: string) => {
    setLoadingReviewWord(gloss);
    try {
      const detail = await getVocabularyDetail(gloss);
      setActiveReviewWord({ order: 0, gloss: detail.gloss, checkpoint_group: 1, study: detail });
    } catch (err) {
      alert("Không thể tải thông tin từ vựng: " + getErrorMessage(err));
    } finally {
      setLoadingReviewWord(null);
    }
  };

  return (
    <ReviewTab
      activeReviewWord={activeReviewWord}
      loadingReview={loadingReview}
      reviewError={reviewError}
      reviewWords={reviewWords}
      loadingReviewWord={loadingReviewWord}
      onOpenAuth={openAuth}
      onSetActiveTab={(tab: AppTab) => navigate(tabToPath(tab))}
      onStartReviewPractice={handleStartReviewPractice}
      onLoadReviewData={loadReviewData}
      onClearActiveReviewWord={() => setActiveReviewWord(null)}
      onCompleteReview={async () => { setActiveReviewWord(null); await loadReviewData(); }}
    />
  );
}
