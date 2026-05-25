import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadCurriculum, getMyProgress } from "../api";
import { ChapterHeader } from "../components/chapter-overview/ChapterHeader";
import { LessonList } from "../components/chapter-overview/LessonList";
import { AuthModal } from "../components/AuthModal";
import type { Topic, DashboardPayload } from "../types/learn";

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

const TOPIC_ACCENTS = [
  { accent: "#1cb0f6", border: "#1899d6", bg: "#dff3fd" },
  { accent: "#536ef9", border: "#3f54cf", bg: "#eaecff" },
];

export default function ChapterOverviewPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState<DashboardPayload | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const isGuest = !localStorage.getItem("signova_token");

  useEffect(() => {
    setLoading(true);
    loadCurriculum()
      .then(setCurriculum)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!topicId || isGuest) return;
    let active = true;
    getMyProgress()
      .then((data: any) => {
        if (!active || !data?.topic_progress) return;
        const tp = data.topic_progress.find((t: any) => t.topic_id === topicId);
        if (tp) setCompletedCount(Number(tp.completed_words ?? 0));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [topicId, isGuest]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#faf9f6" }}>
        <div className="w-10 h-10 rounded-full border-4 border-sky-100 border-t-[#1cb0f6] animate-spin" />
        <p className="m-0 text-sm font-black text-slate-500">Đang tải chương học...</p>
      </div>
    );
  }

  const allTopics = [...(curriculum?.topics ?? []), ...MOCK_EXTRA_TOPICS];
  const topicIndex = allTopics.findIndex((t) => t.id === topicId);
  const topic = allTopics[topicIndex] ?? null;

  if (error || !topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: "#faf9f6" }}>
        <p className="text-slate-500 font-bold text-sm">{error || "Không tìm thấy chương học."}</p>
        <button
          type="button"
          onClick={() => navigate("/learn-dashboard")}
          className="px-5 py-2.5 rounded-xl font-black text-white text-sm cursor-pointer"
          style={{ backgroundColor: "#1cb0f6", border: "none", borderBottom: "3px solid #1899d6" }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  const accent = TOPIC_ACCENTS[topicIndex % TOPIC_ACCENTS.length];
  const resumeIndex = Math.min(completedCount, topic.words.length - 1);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#faf9f6" }}>
      <ChapterHeader
        topicIndex={topicIndex + 1}
        title={topic.title}
        subtitle={topic.subtitle}
        accentColor={accent.accent}
        accentBg={accent.bg}
        onBack={() => navigate("/learn-dashboard")}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-8 pb-28">
        <LessonList
          words={topic.words}
          completedCount={completedCount}
          topicId={topic.id}
          isGuest={isGuest}
          accentColor={accent.accent}
          accentBorder={accent.border}
          accentBg={accent.bg}
          onAuthRequired={() => setIsAuthOpen(true)}
        />
      </main>

      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ backgroundColor: "white", borderTop: "1px solid #e2e8f0" }}
      >
        <button
          type="button"
          onClick={() => navigate(`/learn/${topic.id}/${resumeIndex}`)}
          className="w-full max-w-xl mx-auto flex items-center justify-center font-black text-white text-sm sm:text-base rounded-2xl py-4 cursor-pointer transition-all active:translate-y-[1px] block"
          style={{
            backgroundColor: accent.accent,
            border: "none",
            borderBottom: `4px solid ${accent.border}`,
          }}
        >
          Tiếp tục học 🚀
        </button>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={() => { setIsAuthOpen(false); window.location.reload(); }} />
    </div>
  );
}
