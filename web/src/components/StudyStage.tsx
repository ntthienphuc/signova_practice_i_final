import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, ArrowLeft } from "lucide-react";
import { ensureBaseUrl, loadCurriculum } from "../api";
import type { DashboardPayload } from "../types/learn";

function absoluteUrl(apiBase: string, url: string | undefined | null): string {
  if (!url) return "";
  return url.startsWith("http") ? url : new URL(url, apiBase).href;
}

export function StudyStage() {
  const { topicId, wordOrder } = useParams<{ topicId: string; wordOrder: string }>();
  const navigate = useNavigate();

  const [apiBase] = useState("http://127.0.0.1:8014");
  const [curriculum, setCurriculum] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const absoluteApiBase = ensureBaseUrl(apiBase);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await loadCurriculum(absoluteApiBase) as DashboardPayload;
        setCurriculum(data);
        setError("");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load vocabulary resources.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [absoluteApiBase]);

  const targetData = (() => {
    if (!curriculum || !topicId || !wordOrder) return null;
    const topic = curriculum.topics.find((t) => t.id === topicId);
    if (!topic) return null;
    const orderIndex = parseInt(wordOrder, 10) - 1;
    const word = topic.words[orderIndex];
    return { topic, word, wordIndex: orderIndex };
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-mono">Loading study viewport assets...</p>
      </div>
    );
  }

  if (error || !targetData || !targetData.word) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Study Spec Resolution Failure</h2>
        <p className="text-slate-400 text-sm mb-6">{error || "Invalid topic parameters matching current dataset."}</p>
        <button
          onClick={() => navigate("/learn-dashboard")}
          className="px-5 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      </div>
    );
  }

  const { topic, word, wordIndex } = targetData;
  const posterUrl = absoluteUrl(absoluteApiBase, word.study?.poster_url);
  const referenceUrl = absoluteUrl(absoluteApiBase, word.study?.reference?.playback_url ?? word.study?.reference?.video_url);
  const totalWords = topic.words.length || 1;
  const progressRatio = ((wordIndex + 1) / totalWords) * 100;
  const checkpointLabel = word.checkpoint_group === 1 ? "Nhóm 1/5" : "Nhóm 2/5";

  const handleStartPracticeTransition = () => {
    navigate("/learn-dashboard", {
      state: {
        intent: "START_PRACTICE",
        topicId: topic.id,
        targetWordIndex: wordIndex,
      },
    });
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)] text-[#1e2742] p-8">
      <div className="bg-dot-grid pointer-events-none absolute inset-0" />

      <div className="relative flex flex-col max-w-6xl mx-auto z-10">
        <div className="pt-2 pb-6">
          <div className="flex items-center justify-between mb-3 text-[#7b8aa3] text-[0.8rem] font-bold tracking-[0.08em] uppercase">
            <span>Học từ ký hiệu</span>
            <span>Từ {wordIndex + 1} / {totalWords}</span>
          </div>
          <div className="w-full h-1 overflow-hidden rounded-full bg-[rgba(83,110,249,0.12)]">
            <div
              className="h-full rounded-[inherit] bg-[#0284c7] transition-[width_180ms_ease]"
              style={{ width: `${progressRatio}%` }}
            />
          </div>
        </div>

        <div className="mb-6 text-3xl font-bold flex items-center gap-2">
          <span className="text-[#233157]">{word.gloss}</span>
          <span className="text-[#90a0bb] mx-3">/</span>
          <span className="text-[#5f8efb] text-xl font-medium">{topic.subtitle}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <article className="relative overflow-hidden border border-[rgba(83,110,249,0.1)] rounded-[24px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] bg-white/[0.92] aspect-square flex items-center justify-center">
            {posterUrl ? (
              <img src={posterUrl} alt={word.gloss} className="w-full h-full object-cover" />
            ) : (
              <div className="text-[4rem] font-extrabold text-[rgba(35,49,87,0.12)] text-center leading-[1.1]">{word.gloss}</div>
            )}
          </article>

          <article className="relative overflow-hidden border border-[rgba(83,110,249,0.1)] rounded-[24px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] bg-white/[0.96] aspect-square">
            {referenceUrl ? (
              <video
                src={referenceUrl}
                poster={posterUrl || undefined}
                className="w-full h-full object-cover"
                controls
                playsInline
                muted
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#66758a] text-sm">
                Chưa có video mẫu
              </div>
            )}
          </article>

          <article className="border border-[rgba(83,110,249,0.1)] rounded-[24px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] bg-white/[0.94] p-6 flex flex-col gap-4">
            <div>
              <p className="m-0 mb-[6px] text-[#7c8aa2] text-[0.72rem] font-bold tracking-[0.14em] uppercase">Từ tiếng Việt</p>
              <p className="m-0 text-[1.35rem] font-extrabold text-[#223153]">{word.gloss}</p>
            </div>

            <div>
              <p className="m-0 mb-[6px] text-[#7c8aa2] text-[0.72rem] font-bold tracking-[0.14em] uppercase">Phân vùng học</p>
              <p className="m-0 text-sm font-bold text-emerald-500">{checkpointLabel}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center px-[10px] py-[6px] rounded-full border border-[rgba(83,110,249,0.16)] bg-[rgba(83,110,249,0.08)] text-[#5f8efb] text-[0.82rem] font-bold">
                {topic.title}
              </span>
              <span className="inline-flex items-center px-[10px] py-[6px] rounded-full border border-[rgba(83,110,249,0.16)] bg-[rgba(83,110,249,0.08)] text-[#5f8efb] text-[0.82rem] font-mono font-bold">
                {word.study?.video_id || "sample"}
              </span>
            </div>

            <div>
              <p className="m-0 mb-[6px] text-[#7c8aa2] text-[0.72rem] font-bold tracking-[0.14em] uppercase">Yêu cầu luyện tập</p>
              <p className="m-0 text-[0.82rem] text-[#6d7b92] leading-relaxed">
                Quan sát thật kỹ hình ảnh khẩu hình tay và luồng video tua chậm của huấn luyện viên. Sau đó nhấn nút để mở camera máy tính tiến hành ghi hình thực tế.
              </p>
            </div>
          </article>
        </div>

        <div className="border-t border-[rgba(83,110,249,0.1)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/learn-dashboard")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full text-[0.95rem] font-bold transition-all duration-[160ms] hover:-translate-y-px border border-[rgba(83,110,249,0.14)] bg-white/[0.84] text-[#657594]"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>

          <div className="flex items-center gap-2">
            {topic.words.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => navigate(`/learn/${topic.id}/${index + 1}`)}
                className={`h-2 rounded-full transition-all ${
                  index === wordIndex
                    ? "w-5 bg-[#536ef9]"
                    : "w-2 bg-[rgba(83,110,249,0.18)] hover:bg-[rgba(83,110,249,0.4)]"
                }`}
                aria-label={`Từ ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleStartPracticeTransition}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border-0 rounded-full text-[0.95rem] font-bold transition-all duration-[160ms] hover:-translate-y-px bg-[linear-gradient(135deg,#5c72fb,#67bfff)] text-white shadow-[0_10px_28px_rgba(92,114,251,0.26)]"
          >
            <Play size={16} fill="currentColor" />
            Luyện tập từ này
          </button>
        </div>
      </div>
    </section>
  );
}
