import { useEffect, useMemo, useRef, useState } from "react";
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
  baseEdge: "rgba(66, 182, 245, 0.34)",
  baseJoint: "rgba(66, 182, 245, 0.46)",
  focusEdge: "rgba(244, 78, 78, 0.95)",
  focusJoint: "rgba(244, 78, 78, 1)",
};

const REFERENCE_PALETTE = {
  baseEdge: "rgba(52, 214, 112, 0.34)",
  baseJoint: "rgba(52, 214, 112, 0.46)",
  focusEdge: "rgba(52, 214, 112, 0.98)",
  focusJoint: "rgba(52, 214, 112, 1)",
};

export function PracticeWorkspace({
  apiBase,
  mode,
  targetGloss,
  lessonGlosses,
  referenceStudy,
  title,
  subtitle,
  actionLabel,
  completionLabel,
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
    <section className="practice-workspace">
      <div className="practice-sidebar card-surface">
        <p className="eyebrow">Practice</p>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>

        <div className="target-pill">{targetGloss}</div>
        <div className="coach-note">
          <strong>Màu sắc dễ hiểu:</strong> xanh là đang làm tốt, đỏ là chỗ mình thử sửa thêm nhé.
        </div>

        {mode === "practice_ii" ? (
          <div className="lesson-chip-grid">
            {lessonGlosses.map((gloss) => (
              <span key={gloss} className={gloss === targetGloss ? "lesson-chip active" : "lesson-chip"}>
                {gloss}
              </span>
            ))}
          </div>
        ) : null}

        <div className="upload-panel">
          <label className="upload-drop">
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <div>
              <strong>{file ? file.name : "Upload attempt"}</strong>
              <div className="muted">
                {file ? "Video đã sẵn sàng" : "Chọn video từ máy để gửi lên app"}
              </div>
            </div>
          </label>

          <button
            className="primary-button"
            type="button"
            disabled={loading || !file}
            onClick={handleAnalyze}
          >
            {loading ? "Đang phân tích..." : actionLabel}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        {analysis ? (
          <div className="result-card">
            <div className="metric-row">
              <span>Score</span>
              <strong>{Math.round(Number(analysis.raw.score ?? 0))}</strong>
            </div>
            <div className="metric-row">
              <span>Kết luận</span>
              <strong>{decision?.accept_as_target ? "Đúng target" : "Cần sửa thêm"}</strong>
            </div>
            {mode === "practice_ii" && decision?.predicted_wrong_gloss ? (
              <div className="callout warning">
                Hình như bạn vừa làm sang từ: <strong>{decision.predicted_wrong_gloss}</strong>
              </div>
            ) : null}
            <p className="muted">{feedback?.overall ?? "Đã có feedback từ backend."}</p>
            <div className="legend-row">
              <span className="legend-pill legend-pill-good">Xanh: đúng / gần đúng</span>
              <span className="legend-pill legend-pill-fix">Đỏ: cần sửa</span>
            </div>
            <button className="primary-button" type="button" onClick={handleComplete}>
              {completionLabel}
            </button>
          </div>
        ) : (
          <div className="result-card muted">
            Sau khi phân tích xong, app sẽ hiện phần so sánh video của bạn với video mẫu ở đây.
          </div>
        )}
      </div>

      <div className="practice-stage">
        <div className="stage-head">
          <div>
            <p className="eyebrow">Playback</p>
            <h3>Cùng nhìn lại và so sánh nhé</h3>
          </div>
          {analysis ? (
            <div className="transport-row">
              <button type="button" className="ghost-button" onClick={playSegments}>Play Segment</button>
              <button type="button" className="ghost-button" onClick={pauseSegments}>Pause</button>
              <button type="button" className="ghost-button" onClick={resetSegments}>Reset</button>
            </div>
          ) : null}
        </div>

        <div className="practice-grid">
          <article className="video-card card-surface">
            <div className="panel-header">
              <div>
                <h4>User attempt</h4>
                <p className="debug-line">
                  source: {analysis?.userPlaybackUrl ? "server playback h264" : localUserVideoUrl ? "local blob" : "none"} | status: {userStatus}
                </p>
              </div>
              <span className="debug-line">
                {userSegment ? `${userSegment.segment_start_ms}ms -> ${userSegment.segment_end_ms}ms` : "chưa có segment"}
              </span>
            </div>
            <div className="video-shell">
              {userVideoUrl ? (
                <>
                  <video
                    ref={userVideoRef}
                    src={userVideoUrl}
                    className="video-node"
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("user")}
                  />
                  {analysis ? <canvas ref={userCanvasRef} className="overlay-canvas" /> : null}
                </>
              ) : (
                <div className="empty-state">Upload video để xem bên user.</div>
              )}
            </div>
          </article>

          <article className="video-card card-surface">
            <div className="panel-header">
              <div>
                <h4>Reference</h4>
                <p className="debug-line">
                  source: {referenceVideoUrl ? "server playback h264" : "none"} | status: {referenceStatus}
                </p>
              </div>
              <span className="debug-line">
                {referenceSegment ? `${referenceSegment.segment_start_ms}ms -> ${referenceSegment.segment_end_ms}ms` : "chưa có segment"}
              </span>
            </div>
            <div className="video-shell">
              {referenceVideoUrl ? (
                <>
                  <video
                    ref={referenceVideoRef}
                    src={referenceVideoUrl}
                    poster={referenceStudy?.poster_url ? new URL(referenceStudy.poster_url, absoluteApiBase).href : undefined}
                    className="video-node"
                    playsInline
                    muted
                    controls={!analysis}
                    {...buildVideoHandlers("reference")}
                  />
                  {analysis ? <canvas ref={referenceCanvasRef} className="overlay-canvas" /> : null}
                </>
              ) : (
                <div className="empty-state">Reference sẽ hiện ở đây.</div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
