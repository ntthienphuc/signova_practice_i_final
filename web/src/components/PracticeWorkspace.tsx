import { useEffect, useMemo, useRef, useState, type ChangeEventHandler } from "react";
import { ArrowLeft, ArrowRight, Play, RotateCcw, UploadCloud, Pause } from "lucide-react";
import {
  analyzeAttempt,
  type AnalyzeResponse,
  type Decision,
  type SegmentTiming,
} from "../api";
import { apiClient } from "../api/client";
import { drawOverlay, normalizeAnalysis, type NormalizedAnalysis, type NormalizedSegment } from "../overlay";
import type { StudyMetadata } from "../types/learn";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

function useObjectUrl(file: File | null): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  return url;
}

function normalizeSegment(segment: SegmentTiming | null | undefined): NormalizedSegment | null {
  if (!segment) {
    return null;
  }
  const startMs = Number(segment.segment_start_ms ?? segment.start_ms ?? 0);
  const endMs = Number(segment.segment_end_ms ?? segment.end_ms ?? startMs);
  return {
    ...segment,
    segment_start_ms: startMs,
    segment_end_ms: endMs,
    segment_duration_ms: Math.max(1, Number(segment.segment_duration_ms ?? endMs - startMs)),
  };
}

const USER_PALETTE = {
  baseEdge: "rgba(85, 206, 255, 0.22)",
  baseJoint: "rgba(85, 206, 255, 0.38)",
  focusEdge: "rgba(255, 96, 96, 0.96)",
  focusJoint: "rgba(255, 120, 120, 1)",
};

const REFERENCE_PALETTE = {
  baseEdge: "rgba(78, 255, 158, 0.18)",
  baseJoint: "rgba(78, 255, 158, 0.34)",
  focusEdge: "rgba(78, 255, 158, 0.98)",
  focusJoint: "rgba(145, 255, 196, 1)",
};

type PracticeIITone = "warning" | "info" | "success" | "neutral";

interface PracticeIIFeedbackState {
  tone: PracticeIITone;
  title: string;
  message: string;
}

function metricDecision(decision?: Decision): string {
  return decision?.accept_as_target ? "Đúng target" : "Cần sửa thêm";
}

function practiceIIFeedback(
  decision: Decision | undefined,
  targetGloss: string
): PracticeIIFeedbackState | null {
  if (!decision) {
    return null;
  }
  if (decision.wrong_word_detected && decision.predicted_wrong_gloss) {
    return {
      tone: "warning",
      title: "Phát hiện nhầm từ",
      message: `Có thể bạn vừa ký sang từ "${decision.predicted_wrong_gloss}" thay vì "${targetGloss}".`,
    };
  }
  if (decision.possible_wrong_word && decision.predicted_wrong_gloss) {
    return {
      tone: "info",
      title: "Có khả năng nhầm từ",
      message: `AI thấy bài làm đang nghiêng về "${decision.predicted_wrong_gloss}". Bạn nên xem lại target "${targetGloss}".`,
    };
  }
  if (decision.accept_as_target) {
    return {
      tone: "success",
      title: "Đúng target",
      message: `Bài làm hiện vẫn bám đúng target "${targetGloss}". Bạn chỉ cần tinh chỉnh các vùng đang bị tô đỏ nếu còn có.`,
    };
  }
  return {
    tone: "neutral",
    title: "Tiếp tục so lại target",
    message: `AI chưa thấy dấu hiệu nhầm sang từ khác, nhưng bài làm vẫn chưa khớp đủ với "${targetGloss}".`,
  };
}

interface PracticeWorkspaceProps {
  mode: "practice_i" | "practice_ii";
  targetGloss: string;
  lessonGlosses: string[];
  referenceStudy: StudyMetadata;
  wordIndex?: number;
  wordCount?: number;
  title: string;
  subtitle: string;
  actionLabel: string;
  completionLabel: string;
  onBackToLearn?: () => void;
  onComplete?: (raw: AnalyzeResponse) => void;
}

type PlaybackStatus = "idle" | "loading" | "metadata" | "ready" | "buffering" | "paused" | "error";

export function PracticeWorkspace({
  mode,
  targetGloss,
  lessonGlosses,
  referenceStudy,
  wordIndex = 0,
  wordCount = 1,
  title,
  subtitle,
  actionLabel,
  completionLabel,
  onBackToLearn,
  onComplete,
}: PracticeWorkspaceProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<NormalizedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [userStatus, setUserStatus] = useState<PlaybackStatus>("idle");
  const [referenceStatus, setReferenceStatus] = useState<PlaybackStatus>("idle");

  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const referenceVideoRef = useRef<HTMLVideoElement | null>(null);
  const userCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const referenceCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const localUserVideoUrl = useObjectUrl(file);
  const baseUrl = apiClient.defaults.baseURL ?? "";

  const referenceFallbackUrl = useMemo(() => {
    const rawUrl = referenceStudy?.reference?.playback_url ?? referenceStudy?.reference?.video_url;
    return rawUrl ? new URL(rawUrl, baseUrl).href : "";
  }, [baseUrl, referenceStudy]);

  const referenceFallbackSegment = useMemo(
    () => normalizeSegment(referenceStudy?.reference?.segment),
    [referenceStudy]
  );

  const userVideoUrl = analysis?.userPlaybackUrl ?? localUserVideoUrl;
  const referenceVideoUrl = analysis?.referenceVideoUrl ?? referenceFallbackUrl;
  const userSegment = analysis?.userSegment ?? null;
  const referenceSegment = analysis?.referenceSegment ?? referenceFallbackSegment;
  const decision = analysis?.raw?.decision;
  const feedback = analysis?.raw?.feedback;
  const progressRatio = wordCount > 0 ? ((wordIndex + 1) / wordCount) * 100 : 0;
  const practiceIIStatus = mode === "practice_ii" ? practiceIIFeedback(decision, targetGloss) : null;

  useEffect(() => {
    setFile(null);
    setAnalysis(null);
    setError("");
    setPlaying(false);
    setUserStatus("idle");
    setReferenceStatus("idle");
  }, [mode, targetGloss, lessonGlosses.join("|")]);

  function redrawOverlays(): void {
    if (!analysis) {
      return;
    }
    drawOverlay({
      canvas: userCanvasRef.current,
      video: userVideoRef.current,
      frames: analysis.userFrames,
      segment: userSegment,
      connections: analysis.connections,
      badByFrame: analysis.badByFrame,
      palette: USER_PALETTE,
    });
    drawOverlay({
      canvas: referenceCanvasRef.current,
      video: referenceVideoRef.current,
      frames: analysis.referenceFrames,
      segment: referenceSegment,
      connections: analysis.connections,
      badByFrame: analysis.badByFrame,
      palette: REFERENCE_PALETTE,
    });
  }

  useEffect(() => {
    if (!analysis) {
      return undefined;
    }
    const userVideo = userVideoRef.current;
    const referenceVideo = referenceVideoRef.current;
    if (!userVideo || !referenceVideo) {
      return undefined;
    }
    let frameId = 0;
    const tick = () => {
      if (playing) {
        const userEnd = (userSegment?.segment_end_ms ?? 0) / 1000;
        const referenceEnd = (referenceSegment?.segment_end_ms ?? 0) / 1000;
        if (userVideo.currentTime >= userEnd || referenceVideo.currentTime >= referenceEnd) {
          userVideo.pause();
          referenceVideo.pause();
          setPlaying(false);
        }
      }
      redrawOverlays();
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [analysis, playing, userSegment, referenceSegment]);

  useEffect(() => {
    const handleResize = () => redrawOverlays();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [analysis]);

  function buildVideoHandlers(kind: "user" | "reference") {
    const setStatus = kind === "user" ? setUserStatus : setReferenceStatus;
    return {
      onLoadStart: () => setStatus("loading"),
      onLoadedMetadata: () => {
        setStatus("metadata");
        if (analysis) {
          resetSegments();
        }
      },
      onLoadedData: () => redrawOverlays(),
      onCanPlay: () => setStatus("ready"),
      onCanPlayThrough: () => redrawOverlays(),
      onTimeUpdate: () => redrawOverlays(),
      onWaiting: () => setStatus("buffering"),
      onPause: () => {
        setStatus("paused");
        redrawOverlays();
      },
      onSeeked: () => redrawOverlays(),
      onError: () => setStatus("error"),
    };
  }

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setFile(event.target.files?.[0] ?? null);
  };

  async function handleAnalyze(): Promise<void> {
    if (!file) {
      setError("Chọn video trước khi phân tích.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);
    setPlaying(false);
    try {
      const payload = await analyzeAttempt({
        mode,
        targetGloss,
        lessonGlosses,
        file,
      });
      setAnalysis(normalizeAnalysis(payload));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }

  async function playSegments(): Promise<void> {
    const userVideo = userVideoRef.current;
    const referenceVideo = referenceVideoRef.current;
    if (!analysis || !userVideo || !referenceVideo || !userSegment || !referenceSegment) {
      return;
    }
    const commonDuration = Math.max(
      userSegment.segment_duration_ms,
      referenceSegment.segment_duration_ms,
      1
    );
    userVideo.pause();
    referenceVideo.pause();
    userVideo.currentTime = userSegment.segment_start_ms / 1000;
    referenceVideo.currentTime = referenceSegment.segment_start_ms / 1000;
    userVideo.playbackRate = userSegment.segment_duration_ms / commonDuration;
    referenceVideo.playbackRate = referenceSegment.segment_duration_ms / commonDuration;
    await Promise.allSettled([userVideo.play(), referenceVideo.play()]);
    setPlaying(true);
  }

  function pauseSegments(): void {
    userVideoRef.current?.pause();
    referenceVideoRef.current?.pause();
    setPlaying(false);
    redrawOverlays();
  }

  function resetSegments(): void {
    pauseSegments();
    if (
      !analysis ||
      !userVideoRef.current ||
      !referenceVideoRef.current ||
      !userSegment ||
      !referenceSegment
    ) {
      return;
    }
    userVideoRef.current.currentTime = userSegment.segment_start_ms / 1000;
    referenceVideoRef.current.currentTime = referenceSegment.segment_start_ms / 1000;
    redrawOverlays();
  }

  function handleComplete(): void {
    if (!analysis) {
      return;
    }
    onComplete?.(analysis.raw);
  }

  const calloutClass: Record<PracticeIITone, string> = {
    warning: "bg-[rgba(245,158,11,0.14)] border-[rgba(245,158,11,0.18)] text-[#9a5b00]",
    info: "bg-[rgba(83,110,249,0.1)] border-[rgba(83,110,249,0.14)] text-[#3f58d8]",
    success: "bg-[rgba(74,222,128,0.12)] border-[rgba(34,197,94,0.14)] text-[#1f7a47]",
    neutral: "bg-[rgba(111,125,148,0.1)] border-[rgba(111,125,148,0.12)] text-[#52617f]",
  };

  return (
    <section className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,203,134,0.18),transparent_22%),radial-gradient(circle_at_top_right,rgba(134,196,255,0.18),transparent_24%),linear-gradient(180deg,#fff8f1_0%,#eef7ff_100%)] text-[var(--ink)]">
      <div className="bg-dot-grid pointer-events-none absolute inset-0" />

      <div className="relative max-w-[1440px] mx-auto px-8 pt-10 pb-8 grid gap-[26px]">
        <button
          type="button"
          onClick={onBackToLearn}
          className="absolute top-4 right-4 py-2 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-xl text-xs transition-all border-0 cursor-pointer flex items-center gap-1 z-10 shadow-sm"
        >
          🚪 Thoát
        </button>

        {/* Progress */}
        <div className="pt-2 pb-6">
          <div className="flex items-center justify-between mb-3 text-[#7b8aa3] text-[0.8rem] font-bold tracking-[0.08em] uppercase">
            <span>{mode === "practice_i" ? "Practice I" : "Practice II"}</span>
            <span>Bước {Math.min(wordIndex + 1, wordCount)} / {Math.max(wordCount, 1)}</span>
          </div>
          <div className="w-full h-1 overflow-hidden rounded-full bg-[rgba(83,110,249,0.12)]">
            <div className="h-full rounded-[inherit] bg-[#0284c7] transition-[width_180ms_ease]" style={{ width: `${progressRatio}%` }} />
          </div>
        </div>

        {/* Title */}
        <div className="mb-[6px] text-center">
          <span className="text-[clamp(2.2rem,5vw,2rem)] font-extrabold leading-[1.08] text-[#233157]">{targetGloss}</span>
          <span className="text-[clamp(2.2rem,5vw,2rem)] font-extrabold leading-[1.08] mx-3 text-[#90a0bb]">/</span>
          <span className="text-[clamp(2.2rem,5vw,2rem)] font-extrabold leading-[1.08] text-[#5f8efb]">
            {mode === "practice_i" ? "Practice I" : "Practice II"}
          </span>
        </div>



        {/* Grid */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-[18px]">
          {/* Coach card */}
          <article className="rounded-[28px] border border-[rgba(83,110,249,0.1)] bg-white/[0.94] backdrop-blur-[12px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] p-6 grid gap-[18px] content-start">

            {mode === "practice_ii" ? (
              <div className="flex flex-wrap gap-2">
                {lessonGlosses.map((gloss) => (
                  <span
                    key={gloss}
                    className={
                      gloss === targetGloss
                        ? "inline-flex items-center px-[14px] py-[10px] rounded-full bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white border-transparent text-[1rem] font-bold"
                        : "inline-flex items-center px-[14px] py-[10px] rounded-full bg-white/[0.78] border border-[rgba(53,84,128,0.08)] text-[#4d5970] text-[1rem] font-bold"
                    }
                  >
                    {gloss}
                  </span>
                ))}
              </div>
            ) : null}

            <label className="grid grid-cols-[48px_minmax(0,1fr)] gap-[14px] items-start p-[18px] rounded-[22px] border border-dashed border-[rgba(83,110,249,0.2)] bg-[rgba(247,250,255,0.94)] cursor-pointer">
              <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
              <div className="w-12 h-12 grid place-items-center rounded-[18px] bg-[rgba(83,110,249,0.12)] text-[#5f8efb]">
                <UploadCloud size={20} />
              </div>
              <div className="grid gap-1.5">
                <strong className="text-[#223153] text-[1rem]">{file ? file.name : "Chọn video"}</strong>
                <span className="text-[#6f7d94] leading-[1.55]">
                  {file ? "Video đã sẵn sàng để chấm." : "Vui lòng tải video lên"}
                </span>
              </div>
            </label>

            <button
              className="justify-self-start inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border-0 rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-gradient-to-br from-[#5c72fb] to-[#67bfff] text-white shadow-[0_10px_28px_rgba(92,114,251,0.26)] disabled:opacity-55 disabled:cursor-not-allowed"
              type="button"
              disabled={loading || !file}
              onClick={handleAnalyze}
            >
              <Play size={16} />
              {loading ? "Đang phân tích..." : actionLabel}
            </button>

            {error ? <p className="m-0 text-[#b33f47]">{error}</p> : null}

            <div className="grid gap-[14px] p-[18px] rounded-[22px] border border-[rgba(83,110,249,0.08)] bg-[rgba(248,250,255,0.96)]">
              <div className="flex flex-col gap-3">
                <div className="grid gap-1.5 p-[14px] rounded-[18px] bg-white/[0.96]">
                  <span className="text-[#6f7d94]">Score</span>
                  <strong className="text-[1.3rem] text-[#223153]">{analysis ? Math.round(Number(analysis.raw.score ?? 0)) : "--"}</strong>
                </div>
                <div className="grid gap-1.5 p-[14px] rounded-[18px] bg-white/[0.96]">
                  <span className="text-[#6f7d94]">Kết luận</span>
                  <strong className="text-[1.3rem] text-[#223153]">{analysis ? metricDecision(decision) : "Chờ phân tích"}</strong>
                </div>
              </div>

              {practiceIIStatus ? (
                <div className={`grid gap-1 px-4 py-[14px] rounded-[18px] font-bold border ${calloutClass[practiceIIStatus.tone]}`}>
                  <strong className="text-[0.96rem]">{practiceIIStatus.title}</strong>
                  <span className="leading-[1.55] text-[0.94rem]">{practiceIIStatus.message}</span>
                </div>
              ) : null}

              <p className="m-0 leading-[1.65] text-[#6f7d94]">
                {analysis
                  ? feedback?.overall ?? "Đã có feedback từ backend."
                  : "Phân tích xong, app sẽ hiện feedback tổng và giữ nút sang bước tiếp theo ở dưới."}
              </p>

              <div className="grid gap-2">
                <span className="inline-flex items-center gap-[10px] text-[#52617f] text-[0.95rem]">
                  <i className="w-2.5 h-2.5 rounded-full inline-block bg-[#4ade80]" /> Xanh là đang đúng hoặc gần đúng
                </span>
                <span className="inline-flex items-center gap-[10px] text-[#52617f] text-[0.95rem]">
                  <i className="w-2.5 h-2.5 rounded-full inline-block bg-[#fb7185]" /> Đỏ là vùng cần sửa thêm
                </span>
              </div>
            </div>
          </article>

          {/* User video */}
          <article className="rounded-[28px] border border-[rgba(83,110,249,0.1)] bg-white/[0.94] backdrop-blur-[12px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] p-5 grid gap-4">
            <div className="flex justify-between gap-[14px] items-start">
              <div>
                <h4 className="mt-1.5 mb-0 text-[#223153] text-[1.28rem]">Bài làm của bạn</h4>
              </div>
            </div>
            <div className="relative isolate min-h-[440px] rounded-[24px] overflow-hidden bg-[rgba(242,247,255,0.95)] border border-[rgba(53,84,128,0.08)]">
              {userVideoUrl ? (
                <>
                  <video
                    ref={userVideoRef}
                    src={userVideoUrl}
                    className="absolute inset-0 z-[1] w-full h-full object-contain block bg-white"
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("user")}
                  />
                  {analysis ? <canvas ref={userCanvasRef} className="absolute inset-0 z-[2] w-full h-full pointer-events-none" /> : null}
                </>
              ) : (
                <div className="min-h-[440px] grid place-items-center text-center p-6 text-[#6f7d94]">Upload video để xem phần bài làm.</div>
              )}
            </div>
          </article>

          {/* Reference video */}
          <article className="rounded-[28px] border border-[rgba(83,110,249,0.1)] bg-white/[0.94] backdrop-blur-[12px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] p-5 grid gap-4">
            <div className="flex justify-between gap-[14px] items-start">
              <div>
                <h4 className="mt-1.5 mb-0 text-[#223153] text-[1.28rem]">Video mẫu chuẩn</h4>
              </div>
            </div>
            <div className="relative isolate min-h-[440px] rounded-[24px] overflow-hidden bg-[rgba(242,247,255,0.95)]">
              {referenceVideoUrl ? (
                <>
                  <video
                    ref={referenceVideoRef}
                    src={referenceVideoUrl}
                    poster={
                      referenceStudy?.poster_url
                        ? new URL(referenceStudy.poster_url, baseUrl).href
                        : undefined
                    }
                    className="absolute inset-0 z-[1] w-full h-full object-contain block bg-white "
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("reference")}
                  />
                  {analysis ? (
                    <canvas ref={referenceCanvasRef} className="absolute inset-0 z-[2] w-full h-full pointer-events-none" />
                  ) : null}
                </>
              ) : (
                <div className="min-h-[440px] grid place-items-center text-center p-6 text-[#6f7d94]">Reference sẽ hiện ở đây.</div>
              )}
            </div>
          </article>
        </div>

        {/* Footer */}
        <div className="grid gap-[14px]">
          <div className="flex justify-between gap-4 items-center">
            {onBackToLearn ? (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border border-[rgba(83,110,249,0.14)] rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-white/[0.84] text-[#657594]"
                onClick={onBackToLearn}
              >
                <ArrowLeft size={16} />
                Xem lại từ này
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-[10px] flex-wrap justify-center">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border border-[rgba(83,110,249,0.14)] rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-white/[0.84] text-[#657594] disabled:opacity-55 disabled:cursor-not-allowed"
                onClick={playSegments}
                disabled={!analysis}
              >
                <Play size={16} />
                Play segment
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border border-[rgba(83,110,249,0.14)] rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-white/[0.84] text-[#657594] disabled:opacity-55 disabled:cursor-not-allowed"
                onClick={pauseSegments}
                disabled={!analysis}
              >
                <Pause size={16} />
                Pause
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border border-[rgba(83,110,249,0.14)] rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-white/[0.84] text-[#657594] disabled:opacity-55 disabled:cursor-not-allowed"
                onClick={resetSegments}
                disabled={!analysis}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border-0 rounded-full text-[0.95rem] font-bold transition-all hover:-translate-y-px cursor-pointer bg-gradient-to-br from-[#5c72fb] to-[#67bfff] text-white shadow-[0_10px_28px_rgba(92,114,251,0.26)] disabled:opacity-55 disabled:cursor-not-allowed"
              onClick={handleComplete}
              disabled={!analysis}
            >
              {completionLabel}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="text-[#6d7b92] text-[0.95rem] text-center">
            <span>
              {analysis
                ? "Đã xong phần so sánh. Nếu ổn rồi thì sang bước tiếp theo nhé →"
                : "Upload video và chờ AI phân tích để mở bước tiếp theo."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
