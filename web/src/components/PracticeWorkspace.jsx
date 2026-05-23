import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, RotateCcw, UploadCloud, Pause } from "lucide-react";
import { analyzeAttempt, ensureBaseUrl } from "../api";
import { drawOverlay, normalizeAnalysis } from "../overlay";

function useObjectUrl(file) {
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

function normalizeSegment(segment) {
  if (!segment) {
    return null;
  }
  const startMs = Number(segment.segment_start_ms ?? segment.start_ms ?? 0);
  const endMs = Number(segment.segment_end_ms ?? segment.end_ms ?? startMs);
  return {
    ...segment,
    segment_start_ms: startMs,
    segment_end_ms: endMs,
    segment_duration_ms: Math.max(1, Number(segment.segment_duration_ms ?? (endMs - startMs))),
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

function metricDecision(decision) {
  return decision?.accept_as_target ? "Đúng target" : "Cần sửa thêm";
}

export function PracticeWorkspace({
  apiBase,
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
}) {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [userStatus, setUserStatus] = useState("idle");
  const [referenceStatus, setReferenceStatus] = useState("idle");

  const userVideoRef = useRef(null);
  const referenceVideoRef = useRef(null);
  const userCanvasRef = useRef(null);
  const referenceCanvasRef = useRef(null);

  const localUserVideoUrl = useObjectUrl(file);
  const absoluteApiBase = ensureBaseUrl(apiBase);

  const referenceFallbackUrl = useMemo(() => {
    const rawUrl = referenceStudy?.reference?.playback_url ?? referenceStudy?.reference?.video_url;
    return rawUrl ? new URL(rawUrl, absoluteApiBase).href : "";
  }, [absoluteApiBase, referenceStudy]);

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

  useEffect(() => {
    setFile(null);
    setAnalysis(null);
    setError("");
    setPlaying(false);
    setUserStatus("idle");
    setReferenceStatus("idle");
  }, [mode, targetGloss, lessonGlosses.join("|")]);

  function redrawOverlays() {
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

  function buildVideoHandlers(kind) {
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

  async function handleAnalyze() {
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
        apiBase: absoluteApiBase,
        mode,
        targetGloss,
        lessonGlosses,
        file,
      });
      setAnalysis(normalizeAnalysis(payload, absoluteApiBase));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  async function playSegments() {
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

  function pauseSegments() {
    userVideoRef.current?.pause();
    referenceVideoRef.current?.pause();
    setPlaying(false);
    redrawOverlays();
  }

  function resetSegments() {
    pauseSegments();
    if (!analysis || !userVideoRef.current || !referenceVideoRef.current || !userSegment || !referenceSegment) {
      return;
    }
    userVideoRef.current.currentTime = userSegment.segment_start_ms / 1000;
    referenceVideoRef.current.currentTime = referenceSegment.segment_start_ms / 1000;
    redrawOverlays();
  }

  function handleComplete() {
    if (!analysis) {
      return;
    }
    onComplete?.(analysis.raw);
  }

  return (
    <section className="practice-immersive-screen">
      <div className="bg-dot-grid pointer-events-none learn-word-grid" />

      <div className="practice-immersive-shell">
        <div className="learn-word-progress">
          <div className="learn-word-progress-head">
            <span>{mode === "practice_i" ? "Practice I" : "Practice II"}</span>
            <span>
              Bước {Math.min(wordIndex + 1, wordCount)} / {Math.max(wordCount, 1)}
            </span>
          </div>
          <div className="learn-word-progress-track">
            <div className="learn-word-progress-fill" style={{ width: `${progressRatio}%` }} />
          </div>
        </div>

        <div className="learn-word-title practice-word-title">
          <span className="learn-word-title-vi">{targetGloss}</span>
          <span className="learn-word-title-slash">/</span>
          <span className="learn-word-title-en">{mode === "practice_i" ? "Practice I" : "Practice II"}</span>
        </div>

        <div className="practice-subtitle">
          <p>{title}</p>
          <span>{subtitle}</span>
        </div>

        <div className="practice-immersive-grid">
          <article className="practice-coach-card">
            <div className="practice-card-head">
              <div>
                <p className="learn-meta-label">COACH NOTE</p>
                <h3>Luyện theo đúng target</h3>
              </div>
              <span className="practice-target-pill">{targetGloss}</span>
            </div>

            {mode === "practice_ii" ? (
              <div className="practice-lesson-pills">
                {lessonGlosses.map((gloss) => (
                  <span key={gloss} className={gloss === targetGloss ? "lesson-chip active" : "lesson-chip"}>
                    {gloss}
                  </span>
                ))}
              </div>
            ) : null}

            <label className="practice-upload-card">
              <input
                type="file"
                accept="video/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <div className="practice-upload-icon">
                <UploadCloud size={20} />
              </div>
              <div className="practice-upload-copy">
                <strong>{file ? file.name : "Chọn video để gửi lên"}</strong>
                <span>{file ? "Video đã sẵn sàng để chấm." : "App sẽ tự cắt segment, so với mẫu và tô đỏ/xanh."}</span>
              </div>
            </label>

            <button
              className="learn-nav-button learn-nav-button-primary practice-analyze-button"
              type="button"
              disabled={loading || !file}
              onClick={handleAnalyze}
            >
              <Play size={16} />
              {loading ? "Đang phân tích..." : actionLabel}
            </button>

            {error ? <p className="error-text">{error}</p> : null}

            <div className="practice-feedback-card">
              <div className="practice-feedback-metrics">
                <div>
                  <span>Score</span>
                  <strong>{analysis ? Math.round(Number(analysis.raw.score ?? 0)) : "--"}</strong>
                </div>
                <div>
                  <span>Kết luận</span>
                  <strong>{analysis ? metricDecision(decision) : "Chờ phân tích"}</strong>
                </div>
              </div>

              {mode === "practice_ii" && decision?.predicted_wrong_gloss ? (
                <div className="practice-callout warning">
                  Có thể bạn vừa làm sang từ <strong>{decision.predicted_wrong_gloss}</strong>
                </div>
              ) : null}

              <p className="practice-feedback-text">
                {analysis
                  ? feedback?.overall ?? "Đã có feedback từ backend."
                  : "Phân tích xong, app sẽ hiện feedback tổng và giữ nút sang bước tiếp theo ở dưới."}
              </p>

              <div className="practice-legend">
                <span><i className="legend-dot good" /> Xanh là đang đúng hoặc gần đúng</span>
                <span><i className="legend-dot fix" /> Đỏ là vùng cần sửa thêm</span>
              </div>
            </div>
          </article>

          <article className="practice-media-panel">
            <div className="practice-panel-header">
              <div>
                <p className="learn-meta-label">USER ATTEMPT</p>
                <h4>Bài làm của bạn</h4>
              </div>
              <span className="practice-panel-status">
                {userSegment ? `${userSegment.segment_start_ms}ms → ${userSegment.segment_end_ms}ms` : userStatus}
              </span>
            </div>
            <div className="video-shell practice-video-shell">
              {userVideoUrl ? (
                <>
                  <video
                    ref={userVideoRef}
                    src={userVideoUrl}
                    className="video-node practice-video-node"
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("user")}
                  />
                  {analysis ? <canvas ref={userCanvasRef} className="overlay-canvas" /> : null}
                </>
              ) : (
                <div className="practice-empty-state">Upload video để xem phần user attempt.</div>
              )}
            </div>
          </article>

          <article className="practice-media-panel">
            <div className="practice-panel-header">
              <div>
                <p className="learn-meta-label">REFERENCE</p>
                <h4>Video mẫu chuẩn</h4>
              </div>
              <span className="practice-panel-status">
                {referenceSegment ? `${referenceSegment.segment_start_ms}ms → ${referenceSegment.segment_end_ms}ms` : referenceStatus}
              </span>
            </div>
            <div className="video-shell practice-video-shell">
              {referenceVideoUrl ? (
                <>
                  <video
                    ref={referenceVideoRef}
                    src={referenceVideoUrl}
                    poster={referenceStudy?.poster_url ? new URL(referenceStudy.poster_url, absoluteApiBase).href : undefined}
                    className="video-node practice-video-node"
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("reference")}
                  />
                  {analysis ? <canvas ref={referenceCanvasRef} className="overlay-canvas" /> : null}
                </>
              ) : (
                <div className="practice-empty-state">Reference sẽ hiện ở đây.</div>
              )}
            </div>
          </article>
        </div>

        <div className="practice-footer">
          <div className="practice-transport">
            {onBackToLearn ? (
              <button type="button" className="learn-nav-button learn-nav-button-secondary" onClick={onBackToLearn}>
                <ArrowLeft size={16} />
                Xem lại từ này
              </button>
            ) : (
              <div />
            )}

            <div className="practice-transport-buttons">
              <button type="button" className="learn-nav-button learn-nav-button-secondary" onClick={playSegments} disabled={!analysis}>
                <Play size={16} />
                Play segment
              </button>
              <button type="button" className="learn-nav-button learn-nav-button-secondary" onClick={pauseSegments} disabled={!analysis}>
                <Pause size={16} />
                Pause
              </button>
              <button type="button" className="learn-nav-button learn-nav-button-secondary" onClick={resetSegments} disabled={!analysis}>
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <button
              type="button"
              className="learn-nav-button learn-nav-button-primary"
              onClick={handleComplete}
              disabled={!analysis}
            >
              {completionLabel}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="learn-word-next">
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
