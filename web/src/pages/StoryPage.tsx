import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Camera, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { analyzeAttempt } from "../api/endpoints/practice";
import type { AnalyzeResponse } from "../api/types";
import { CameraRecorderModal } from "../components/CameraRecorderModal";
import { STORIES, getStoryById } from "../data/storyData";
import { useAuth } from "../contexts/AuthContext";
import rabbitBearImage from "../assets/words/rabbit_bear.png";

type ResultKind = "success" | "wrong_word" | "retry";

interface SceneResult {
  kind: ResultKind;
  response: AnalyzeResponse;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra khi chấm điểm.";
}

export default function StoryPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { currentUser, isLoading } = useAuth();
  const story = useMemo(() => getStoryById(storyId), [storyId]);
  const storyIndex = story ? STORIES.findIndex((item) => item.id === story.id) : -1;

  const [sceneIndex, setSceneIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isRecorderOpen, setRecorderOpen] = useState(false);
  const [isAnalyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SceneResult | null>(null);
  const [isComplete, setComplete] = useState(false);

  useEffect(() => {
    if (isLoading || currentUser || storyIndex <= 0) return;
    navigate("/learn-dashboard?require_login=true", { replace: true });
  }, [currentUser, isLoading, navigate, storyIndex]);

  useEffect(() => {
    setSceneIndex(0);
    setAttempts(0);
    setResult(null);
    setError("");
    setComplete(false);
  }, [storyId]);

  if (!story) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7fbff] px-4">
        <section className="max-w-md rounded-[28px] border-2 border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-5xl">📚</div>
          <h1 className="m-0 mt-4 text-2xl font-black text-slate-800">Không tìm thấy câu chuyện</h1>
          <button
            type="button"
            onClick={() => navigate("/learn-dashboard/story")}
            className="mt-5 min-h-[46px] rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-5 text-sm font-black text-white"
          >
            Quay lại
          </button>
        </section>
      </main>
    );
  }

  const scene = story.scenes[sceneIndex];
  const progressPercent = ((sceneIndex + 1) / story.scenes.length) * 100;
  const storyImage = story.id === "tho-va-gau-ket-ban" ? rabbitBearImage : null;

  const handleRecordedFile = async (file: File) => {
    setAnalyzing(true);
    setError("");
    setResult(null);
    try {
      const response = await analyzeAttempt({
        mode: "practice_ii",
        targetGloss: scene.targetGloss,
        lessonGlosses: scene.lessonGlosses,
        file,
      });
      const decision = response.decision;
      const kind: ResultKind = decision.accept_as_target
        ? "success"
        : decision.wrong_word_detected
          ? "wrong_word"
          : "retry";
      setAttempts((value) => value + 1);
      setResult({ kind, response });
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForRetry = () => {
    setResult(null);
    setError("");
    setRecorderOpen(true);
  };

  const goNext = () => {
    if (sceneIndex >= story.scenes.length - 1) {
      setComplete(true);
      return;
    }
    setSceneIndex((value) => value + 1);
    setAttempts(0);
    setResult(null);
    setError("");
  };

  const skipScene = () => {
    goNext();
  };

  if (isComplete) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#e7f8ef_100%)] px-4 py-6">
        <button
          type="button"
          onClick={() => navigate("/learn-dashboard/story")}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-black text-slate-600 shadow-sm"
        >
          <ArrowLeft size={18} />
          Câu chuyện
        </button>
        <section className="mx-auto mt-16 max-w-xl rounded-[32px] border-2 border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="text-7xl">🎉</div>
          <h1 className="m-0 mt-5 text-3xl font-black text-slate-800">Bạn đã hoàn thành câu chuyện!</h1>
          <p className="m-0 mt-3 text-sm font-bold leading-relaxed text-slate-500">
            Mascot ghi nhận tinh thần giải quyết vấn đề của bé. XP sẽ được đồng bộ trong hệ thống tiến độ.
          </p>
          <button
            type="button"
            onClick={() => navigate("/learn-dashboard/story")}
            className="mt-6 min-h-[50px] rounded-2xl border-b-4 border-emerald-700 bg-emerald-500 px-6 text-sm font-black text-white transition-all hover:bg-emerald-400 active:translate-y-1 active:border-b-0"
          >
            Về bảng điều khiển
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef8ff_52%,#fff8ed_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/learn-dashboard/story")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white text-slate-600 shadow-sm"
            aria-label="Quay lai"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="m-0 truncate text-xs font-black uppercase tracking-[0.18em] text-sky-600">
                {story.emoji} {story.title}
              </p>
              <p className="m-0 shrink-0 text-xs font-black text-slate-500">
                Cảnh {sceneIndex + 1}/{story.scenes.length}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white ring-2 ring-slate-200">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <section className="rounded-[32px] border-2 border-sky-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="rounded-[28px] border-2 border-amber-100 bg-[linear-gradient(135deg,#fff7d6_0%,#e9f8ff_100%)] p-4 sm:p-6">
            <div className="flex flex-col gap-5">
              {storyImage ? (
                <div className="relative overflow-hidden rounded-[28px] bg-white/85 shadow-sm ring-2 ring-white/80">
                  <img
                    src={storyImage}
                    alt={story.title}
                    className="h-[260px] w-full object-cover sm:h-[360px]"
                  />
                  <div className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/90 text-3xl shadow-sm backdrop-blur">
                    {scene.sceneEmoji}
                  </div>
                </div>
              ) : (
                <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-white/85 text-6xl shadow-sm">
                  {scene.sceneEmoji}
                </div>
              )}
              <div className={storyImage ? "px-1 sm:px-2" : ""}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-3xl">{scene.characterEmoji}</span>
                  <h1 className="m-0 text-2xl font-black leading-tight text-slate-800 sm:text-3xl">
                    {scene.contextTitle}
                  </h1>
                </div>
                <p className="m-0 text-base font-bold leading-relaxed text-slate-600">
                  {scene.contextDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {scene.lessonGlosses.map((gloss) => (
              <span
                key={gloss}
                className="inline-flex min-h-[44px] items-center rounded-2xl border-2 border-sky-100 bg-sky-50 px-5 py-2.5 text-base font-black text-sky-700 shadow-sm"
              >
                {gloss}
              </span>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setRecorderOpen(true)}
              disabled={isAnalyzing}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-6 text-sm font-black text-white transition-all hover:bg-[#24c4ff] active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera size={18} />
              Bắt đầu quay 🎥
            </button>
          </div>

          {isAnalyzing && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4">
              <div className="h-8 w-8 rounded-full border-4 border-sky-100 border-t-[#1cb0f6] animate-spin" />
              <p className="m-0 text-sm font-black text-slate-600">Đang chấm điểm...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border-2 border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <ResultPanel
              result={result}
              characterEmoji={scene.characterEmoji}
              successMessage={scene.successMessage}
              failMessage={scene.failMessage}
              wrongWordMessage={scene.wrongWordMessage}
              attempts={attempts}
              onNext={goNext}
              onRetry={resetForRetry}
              onSkip={skipScene}
            />
          )}
        </section>
      </div>

      {isRecorderOpen && (
        <CameraRecorderModal
          onSave={handleRecordedFile}
          onClose={() => setRecorderOpen(false)}
        />
      )}
    </main>
  );
}

function ResultPanel({
  result,
  characterEmoji,
  successMessage,
  failMessage,
  wrongWordMessage,
  attempts,
  onNext,
  onRetry,
  onSkip,
}: {
  result: SceneResult;
  characterEmoji: string;
  successMessage: string;
  failMessage: string;
  wrongWordMessage: string;
  attempts: number;
  onNext: () => void;
  onRetry: () => void;
  onSkip: () => void;
}) {
  const predicted = result.response.decision.predicted_wrong_gloss;

  if (result.kind === "success") {
    return (
      <div className="mt-6 rounded-[24px] border-2 border-emerald-100 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{characterEmoji}🥳</span>
          <div className="flex-1">
            <h2 className="m-0 text-xl font-black text-emerald-800">Dung roi!</h2>
            <p className="m-0 mt-1 text-sm font-bold leading-relaxed text-emerald-700">{successMessage}</p>
            <button
              type="button"
              onClick={onNext}
              className="mt-4 min-h-[46px] rounded-2xl border-b-4 border-emerald-700 bg-emerald-500 px-5 text-sm font-black text-white transition-all hover:bg-emerald-400 active:translate-y-1 active:border-b-0"
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isWrong = result.kind === "wrong_word";
  return (
    <div className={`mt-6 rounded-[24px] border-2 p-5 ${isWrong ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <span className="text-4xl">{isWrong ? "🤔" : "😅"}</span>
        <div className="flex-1">
          <h2 className={`m-0 text-xl font-black ${isWrong ? "text-amber-800" : "text-slate-800"}`}>
            {isWrong ? "Thử lại đúng từ nhé" : "Gần đúng rồi"}
          </h2>
          <p className={`m-0 mt-1 text-sm font-bold leading-relaxed ${isWrong ? "text-amber-800" : "text-slate-600"}`}>
            {isWrong
              ? `${wrongWordMessage}${predicted ? ` Mascot dang thay giong "${predicted}".` : ""}`
              : failMessage}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-5 text-sm font-black text-white transition-all hover:bg-[#24c4ff] active:translate-y-1 active:border-b-0"
            >
              <RotateCcw size={17} />
              Thử lại
            </button>
            {attempts >= 2 && (
              <button
                type="button"
                onClick={onSkip}
                className="min-h-[46px] rounded-2xl border-2 border-slate-200 bg-white px-5 text-sm font-black text-slate-500 transition-all hover:bg-slate-50"
              >
                Bỏ qua
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
