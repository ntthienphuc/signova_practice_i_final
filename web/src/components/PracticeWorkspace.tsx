import { useEffect, useMemo, useRef, useState, type ChangeEventHandler } from "react";
import { ArrowRight, UploadCloud } from "lucide-react";
import {
  analyzeAttempt,
  type AnalyzeResponse,
  type Decision,
  type SegmentTiming,
} from "../api";
import { apiClient } from "../api/client";
import { drawOverlay, normalizeAnalysis, type NormalizedAnalysis, type NormalizedSegment } from "../overlay";

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
  baseEdge: "rgba(78, 255, 158, 0.22)",
  baseJoint: "rgba(78, 255, 158, 0.38)",
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
  return decision?.accept_as_target ? "Đạt chuẩn" : "Cần chỉnh thêm";
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
      title: "Nhầm ký hiệu",
      message: `Có thể bạn làm nhầm sang từ "${decision.predicted_wrong_gloss}".`,
    };
  }
  if (decision.possible_wrong_word && decision.predicted_wrong_gloss) {
    return {
      tone: "info",
      title: "Nghi ngờ nhầm",
      message: `Bài làm giống từ "${decision.predicted_wrong_gloss}" hơn.`,
    };
  }
  if (decision.accept_as_target) {
    return {
      tone: "success",
      title: "Chính xác",
      message: `Đúng ký hiệu mẫu của từ "${targetGloss}".`,
    };
  }
  return null;
}

interface PracticeWorkspaceProps {
  mode: "practice_i" | "practice_ii";
  targetGloss: string;
  lessonGlosses: string[];
  referenceStudy: any;
  wordIndex: number;
  wordCount: number;
  title: string;
  subtitle: string;
  actionLabel: string;
  completionLabel: string;
  onBackToLearn?: () => void;
  onComplete?: (rawAttempt: any) => void;
}

export function PracticeWorkspace({
  mode,
  targetGloss,
  lessonGlosses,
  referenceStudy,
  wordIndex,
  wordCount,
  completionLabel,
  onBackToLearn,
  onComplete,
}: PracticeWorkspaceProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<NormalizedAnalysis | null>(null);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);

  const [userStatus, setUserStatus] = useState<string>("idle");
  const [referenceStatus, setReferenceStatus] = useState<string>("idle");

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
  const progressRatio = wordCount > 0 ? ((wordIndex + 1) / wordCount) * 100 : 0;

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
    const nextFile = event.target.files?.[0];
    if (nextFile) {
      setFile(nextFile);
      setAnalysis(null);
      setError("");
      setPlaying(false);
    }
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

    const userStart = userSegment.segment_start_ms / 1000;
    const userEnd = userSegment.segment_end_ms / 1000;
    const referenceStart = referenceSegment.segment_start_ms / 1000;
    const referenceEnd = referenceSegment.segment_end_ms / 1000;

    if (
      userVideo.currentTime >= userEnd ||
      userVideo.currentTime < userStart ||
      referenceVideo.currentTime >= referenceEnd ||
      referenceVideo.currentTime < referenceStart
    ) {
      userVideo.currentTime = userStart;
      referenceVideo.currentTime = referenceStart;
    }

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

  function handleSkip(): void {
    onComplete?.(analysis?.raw as any);
  }

  const score = analysis ? Math.round(Number(analysis.raw.score ?? 0)) : 0;
  const isWrongWord = !!decision?.wrong_word_detected;
  const isLowTracking = !!decision?.low_tracking_quality;
  const predictedWrongGloss = decision?.predicted_wrong_gloss;

  const feedbackText = useMemo(() => {
    if (!analysis) return "";
    if (isWrongWord && predictedWrongGloss) {
      return `Ký hiệu giống từ "${predictedWrongGloss}". Tập lại mẫu bên trái nhé! ❤️`;
    }
    if (isLowTracking) {
      return "Camera không nhìn rõ tay. Hãy chỉnh lại góc máy và thử lại nha! 📸";
    }
    if (score >= 85) {
      return `Xuất sắc! Đạt ${score} điểm! Bạn làm rất giỏi! 🎉`;
    }
    if (score >= 70) {
      return `Làm tốt lắm! Được ${score} điểm rồi nè! 🌟`;
    }
    if (score >= 50) {
      return `Cố lên! Bạn đạt ${score} điểm. Tập trung hơn một tí nhé! 💪`;
    }
    return `Đạt ${score} điểm. Hãy làm theo mẫu thêm một lần nữa nhé! 💖`;
  }, [analysis, score, isWrongWord, isLowTracking, predictedWrongGloss]);

  const isGoodScore = score >= 70;
  const feedbackBg = isGoodScore ? "bg-[#f0fdf4] border-emerald-250 text-emerald-700" : "bg-[#fffbeb] border-amber-200 text-amber-700";
  const feedbackTextColor = isGoodScore ? "text-emerald-600" : "text-amber-600";
  const feedbackTitle = score >= 85 ? "🎉 TUYỆT VỜI!" : score >= 70 ? "🌟 RẤT TỐT!" : score >= 50 ? "💪 CỐ LÊN NÀO!" : "❤️ HÃY THỬ LẠI NHÉ!";
  const nextButtonBg = isGoodScore
    ? "bg-[#58cc02] border-b-2 border-[#58a700] hover:bg-[#61e002] text-white active:border-b-0 active:translate-y-[2px]"
    : "bg-[#1cb0f6] border-b-2 border-[#1899d6] hover:bg-[#24c4ff] text-white active:border-b-0 active:translate-y-[2px]";

  return (
    <section className="relative min-h-screen bg-[#f0f6ff] text-[#233157] font-sans pb-[160px] sm:pb-16">
      {/* Progress bar */}
      <div className="max-w-[1200px] mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-sky-500 uppercase tracking-widest flex items-center gap-1">
            {mode === "practice_i" ? "⭐ Luyện tập" : "🏆 Thử thách"}
          </span>
          <span className="text-sm font-black text-sky-600">
            Từ {wordIndex + 1} / {wordCount}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
          <div 
            className="h-full rounded-full bg-[#1cb0f6] transition-all duration-500" 
            style={{ width: `${progressRatio}%` }} 
          />
        </div>
      </div>

      {/* Top Controls: sticky compact bar below the main nav */}
      <div className="max-w-[1200px] mx-auto px-4 pt-3 flex justify-between items-center gap-3">
        {onComplete ? (
          <button
            type="button"
            onClick={handleSkip}
            className="py-2 px-3 sm:px-4 bg-white border-2 border-b-2 border-slate-200 text-[#1cb0f6] font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 active:translate-y-[1px] active:border-b-0"
          >
            ⏭️ <span className="hidden sm:inline">Bỏ qua</span>
          </button>
        ) : <div />}

        {onBackToLearn ? (
          <button
            type="button"
            onClick={onBackToLearn}
            className="py-2 px-3 sm:px-4 bg-white border-2 border-b-2 border-rose-200 text-rose-500 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 active:translate-y-[1px] active:border-b-0"
          >
            🏠 <span className="hidden sm:inline">Quay lại học</span>
          </button>
        ) : <div />}
      </div>

      <div className="relative max-w-[1200px] mx-auto px-4 pt-3 grid gap-4 sm:gap-6">
        {/* Word title — responsive size */}
        <div className="text-center py-2 sm:py-4 flex flex-col items-center gap-1">
          <h1 className="font-black text-[#1cb0f6] leading-none select-none m-0" style={{ fontSize: 'clamp(2.5rem, 10vw, 4.5rem)' }}>
            {targetGloss}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-bold max-w-lg m-0 mt-1">
            {mode === "practice_i"
              ? "Xem video mẫu rồi tập làm theo nhé!"
              : "Thực hiện bài làm xem đúng không nhé!"}
          </p>
        </div>

        {/* 2-Column Grid — stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-start">
          
          {/* LEFT COLUMN: Reference Video (Mẫu) */}
          <article className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-5 flex flex-col gap-4 relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 m-0 select-none">
              📺 Video mẫu chuẩn
            </h3>
            
            <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner group">
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
                    className="absolute inset-0 w-full h-full object-contain block bg-white"
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("reference")}
                  />
                  {analysis && (
                    <canvas ref={referenceCanvasRef} className="absolute inset-0 z-[2] w-full h-full pointer-events-none" />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-sky-600/70 text-center font-bold">
                  🎥 Đang tải video mẫu...
                </div>
              )}
            </div>
            
            <div className="text-xs font-bold text-slate-500 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200">
              💡 Hãy quan sát hướng tay và cử động cơ thể của mẫu thật kỹ nhé!
            </div>
          </article>

          {/* RIGHT COLUMN: User Video + Actions */}
          <article className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-5 flex flex-col gap-4 relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 m-0 select-none">
              🎥 Video bài làm của bạn
            </h3>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-200 text-rose-700 font-bold rounded-2xl text-xs flex items-center gap-2">
                ❌ Lỗi: {error}. Thử tải lại nhé!
              </div>
            )}

            {/* Content states based on user file upload & analysis */}
            {!file ? (
              /* No file uploaded yet: Giant Friendly Upload Dropzone */
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 rounded-[24px] p-10 text-center cursor-pointer transition-all duration-300 group">
                <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center text-[#1cb0f6] mb-4 group-hover:scale-105 transition-transform duration-300">
                  <UploadCloud size={32} className="animate-pulse" />
                </div>
                <h4 className="text-lg font-black text-slate-700 mb-1">📤 Tải video lên</h4>
                <p className="text-slate-450 text-xs font-bold max-w-xs">
                  Nhấp vào đây để chọn video bài làm của bạn
                </p>
              </label>
            ) : !analysis ? (
              /* File selected, not analyzed yet: Show raw video & analyze button */
              <div className="flex flex-col gap-4">
                <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner">
                  <video
                    ref={userVideoRef}
                    src={userVideoUrl}
                    className="absolute inset-0 w-full h-full object-contain block bg-white"
                    playsInline
                    muted
                    controls
                    {...buildVideoHandlers("user")}
                  />
                </div>
                
                <div className="flex gap-3 items-center">
                  <label className="py-2.5 px-4 bg-white border-2 border-b-2 border-slate-200 text-slate-655 font-black rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-1.5 active:border-b-0 active:translate-y-[2px]">
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                    🔄 Chọn lại
                  </label>
                  
                  <button
                    className="flex-1 py-3 px-6 bg-[#1cb0f6] border-b-2 border-[#1899d6] hover:bg-[#24c4ff] text-white font-black rounded-2xl text-sm cursor-pointer flex items-center justify-center gap-2 active:border-b-0 active:translate-y-[2px] transition-all disabled:opacity-50"
                    type="button"
                    disabled={loading}
                    onClick={handleAnalyze}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        <span>Đang chấm điểm...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Chấm điểm bài làm ✨</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Analyzed: Show video with overlay + custom controls + kid-friendly score card */
              <div className="flex flex-col gap-4">
                <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-inner">
                  <video
                    ref={userVideoRef}
                    src={userVideoUrl}
                    className="absolute inset-0 w-full h-full object-contain block bg-white"
                    playsInline
                    muted
                    {...buildVideoHandlers("user")}
                  />
                  <canvas ref={userCanvasRef} className="absolute inset-0 z-[2] w-full h-full pointer-events-none" />
                </div>

                {/* Simplified Playback Controls */}
                <div className="flex justify-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    className="py-2 px-4 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-2xl text-xs cursor-pointer flex items-center gap-1.5 active:border-b-0 active:translate-y-[2px] transition-all"
                    onClick={playing ? pauseSegments : playSegments}
                  >
                    {playing ? "⏸️ Tạm dừng" : "▶️ Xem lại"}
                  </button>
                  <label className="py-2 px-4 bg-white border-2 border-b-2 border-slate-200 text-slate-650 font-black rounded-2xl text-xs cursor-pointer flex items-center gap-1.5 active:border-b-0 active:translate-y-[1px] transition-all">
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                    📂 Đổi video
                  </label>
                </div>

                {/* Friendly Score & Feedback Card */}
                <div className={`border-2 border-b-2 rounded-[24px] p-5 flex flex-col items-center text-center gap-3 ${feedbackBg}`}>
                  {/* Stars */}
                  <div className="text-2xl tracking-widest select-none">
                    {score >= 85 ? "⭐ ⭐ ⭐ ⭐ ⭐" : score >= 70 ? "⭐ ⭐ ⭐ ⭐" : score >= 50 ? "⭐ ⭐ ⭐" : "⭐ ⭐"}
                  </div>
                  
                  {/* Fun Badge & Message */}
                  <div className="flex flex-col gap-1.5">
                    <strong className={`text-xl font-black ${feedbackTextColor}`}>
                      {feedbackTitle}
                    </strong>
                    <span className="text-slate-800 text-sm font-bold leading-relaxed max-w-sm">
                      {feedbackText}
                    </span>
                  </div>

                  {/* Visual Hint */}
                  <div className="text-[10px] font-bold text-slate-500">
                    🟢 Khung xương xanh lá là đúng • 🔴 Vùng màu đỏ là cần sửa nhé!
                  </div>
                  
                  {/* Next Button inside Card */}
                  <button
                    type="button"
                    className={`w-full py-3 px-5 rounded-2xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${nextButtonBg}`}
                    onClick={handleComplete}
                  >
                    <span>{completionLabel}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </article>
          
        </div>
      </div>
    </section>
  );
}
