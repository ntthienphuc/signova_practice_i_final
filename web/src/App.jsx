import { useEffect, useRef, useState } from "react";
import { analyzeAttempt, createRandomTask, ensureBaseUrl, loadAppConfig } from "./api";
import { drawOverlay, normalizeAnalysis } from "./overlay";

const USER_PALETTE = {
  baseEdge: "rgba(142, 245, 115, 0.82)",
  baseJoint: "rgba(142, 245, 115, 0.9)",
  focusEdge: "rgba(255, 74, 74, 0.96)",
  focusJoint: "rgba(255, 74, 74, 1)"
};

const REFERENCE_PALETTE = {
  baseEdge: "rgba(51, 214, 112, 0.55)",
  baseJoint: "rgba(51, 214, 112, 0.7)",
  focusEdge: "rgba(51, 214, 112, 1)",
  focusJoint: "rgba(51, 214, 112, 1)"
};

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

function buildLessonBadge(task) {
  if (!task) {
    return [];
  }
  return task.lesson_glosses?.length ? task.lesson_glosses : [task.target_gloss];
}

export default function App() {
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8014");
  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState("practice_i");
  const [lessonSize, setLessonSize] = useState(5);
  const [task, setTask] = useState(null);
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [userVideoStatus, setUserVideoStatus] = useState("idle");
  const [referenceVideoStatus, setReferenceVideoStatus] = useState("idle");

  const userVideoRef = useRef(null);
  const referenceVideoRef = useRef(null);
  const userCanvasRef = useRef(null);
  const referenceCanvasRef = useRef(null);

  const localUserVideoUrl = useObjectUrl(file);
  const decision = analysis?.raw?.decision;
  const userVideoUrl = analysis?.userPlaybackUrl ?? localUserVideoUrl;
  const referenceUrl = analysis?.referenceVideoUrl ?? "";
  const userVideoSourceLabel = analysis?.userPlaybackUrl ? "server playback h264" : userVideoUrl ? "local blob" : "none";
  const referenceVideoSourceLabel = analysis?.referenceVideoUrl ? "server playback h264" : referenceUrl ? "reference original" : "none";

  useEffect(() => {
    let active = true;
    loadAppConfig(ensureBaseUrl(apiBase))
      .then((payload) => {
        if (active) {
          setConfig(payload);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError.message);
        }
      });
    return () => {
      active = false;
    };
  }, [apiBase]);

  useEffect(() => {
    setUserVideoStatus("idle");
    setReferenceVideoStatus("idle");
  }, [analysis, userVideoUrl, referenceUrl]);

  function redrawOverlays() {
    if (!analysis) {
      return;
    }
    drawOverlay({
      canvas: userCanvasRef.current,
      video: userVideoRef.current,
      frames: analysis.userFrames,
      segment: analysis.userSegment,
      connections: analysis.connections,
      badByFrame: analysis.badByFrame,
      palette: USER_PALETTE
    });
    drawOverlay({
      canvas: referenceCanvasRef.current,
      video: referenceVideoRef.current,
      frames: analysis.referenceFrames,
      segment: analysis.referenceSegment,
      connections: analysis.connections,
      badByFrame: analysis.badByFrame,
      palette: REFERENCE_PALETTE
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
        const userEnd = analysis.userSegment.segment_end_ms / 1000;
        const refEnd = analysis.referenceSegment.segment_end_ms / 1000;
        if (userVideo.currentTime >= userEnd || referenceVideo.currentTime >= refEnd) {
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
  }, [analysis, playing, userVideoUrl, referenceUrl]);

  useEffect(() => {
    if (!analysis) {
      return undefined;
    }
    const handleResize = () => redrawOverlays();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [analysis, userVideoUrl, referenceUrl]);

  async function handleRandomTask() {
    setError("");
    setAnalysis(null);
    setPlaying(false);
    try {
      const payload = await createRandomTask(ensureBaseUrl(apiBase), mode, lessonSize);
      setTask(payload);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleAnalyze() {
    if (!task || !file) {
      setError("Chọn bài random và upload video trước.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis(null);
    setPlaying(false);
    try {
      const payload = await analyzeAttempt({
        apiBase: ensureBaseUrl(apiBase),
        mode,
        targetGloss: task.target_gloss,
        lessonGlosses: task.lesson_glosses ?? [task.target_gloss],
        file
      });
      setAnalysis(normalizeAnalysis(payload, ensureBaseUrl(apiBase)));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }

  async function playSegments() {
    if (!analysis || !userVideoRef.current || !referenceVideoRef.current) {
      return;
    }
    const userVideo = userVideoRef.current;
    const referenceVideo = referenceVideoRef.current;
    const commonDuration = Math.max(
      analysis.userSegment.segment_duration_ms,
      analysis.referenceSegment.segment_duration_ms,
      1
    );

    userVideo.pause();
    referenceVideo.pause();
    userVideo.currentTime = analysis.userSegment.segment_start_ms / 1000;
    referenceVideo.currentTime = analysis.referenceSegment.segment_start_ms / 1000;
    userVideo.playbackRate = analysis.userSegment.segment_duration_ms / commonDuration;
    referenceVideo.playbackRate = analysis.referenceSegment.segment_duration_ms / commonDuration;

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
    if (analysis && userVideoRef.current && referenceVideoRef.current) {
      userVideoRef.current.currentTime = analysis.userSegment.segment_start_ms / 1000;
      referenceVideoRef.current.currentTime = analysis.referenceSegment.segment_start_ms / 1000;
      redrawOverlays();
    }
  }

  function attachVideoDebugHandlers(kind) {
    const setStatus = kind === "user" ? setUserVideoStatus : setReferenceVideoStatus;
    return {
      onLoadStart: () => setStatus("loading"),
      onLoadedMetadata: () => {
        setStatus("metadata");
        resetSegments();
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
      onSeeked: redrawOverlays,
      onError: () => setStatus("error")
    };
  }

  return (
    <div className="app-shell">
      <aside className="control-panel">
        <div className="hero-block">
          <p className="eyebrow">SIGNOVA Demo</p>
          <h1>Practice web bám hoàn toàn vào API backend.</h1>
          <p className="hero-copy">
            FE chỉ upload video, nhận target, khoảng cắt, reference clip và overlay timeline từ server.
          </p>
        </div>

        <label className="field">
          <span>API Base</span>
          <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
        </label>

        <div className="mode-row">
          <button
            className={mode === "practice_i" ? "pill active" : "pill"}
            onClick={() => {
              setMode("practice_i");
              setAnalysis(null);
            }}
            type="button"
          >
            Practice I
          </button>
          <button
            className={mode === "practice_ii" ? "pill active" : "pill"}
            onClick={() => {
              setMode("practice_ii");
              setAnalysis(null);
            }}
            type="button"
          >
            Practice II
          </button>
        </div>

        {mode === "practice_ii" ? (
          <label className="field">
            <span>Lesson Size</span>
            <select value={lessonSize} onChange={(event) => setLessonSize(Number(event.target.value))}>
              {(config?.random_practice_ii_sizes ?? [5, 10]).map((size) => (
                <option key={size} value={size}>
                  {size} từ
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="card">
          <div className="card-header">
            <strong>Bài random</strong>
            <button className="ghost-button" onClick={handleRandomTask} type="button">
              Random
            </button>
          </div>
          {task ? (
            <>
              <div className="target-chip">{task.target_gloss}</div>
              <div className="lesson-grid">
                {buildLessonBadge(task).map((item) => (
                  <span key={item} className={item === task.target_gloss ? "lesson-pill target" : "lesson-pill"}>
                    {item}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">Chưa có task. Bấm random để lấy bài từ bank 20 gloss.</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <strong>Upload attempt</strong>
          </div>
          <label className="upload-drop">
            <input
              accept="video/*"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <span>{file ? file.name : "Chọn video MP4/MOV"}</span>
          </label>
          <button className="primary-button" disabled={!file || !task || loading} onClick={handleAnalyze} type="button">
            {loading ? "Đang phân tích..." : "Upload Và Phân Tích"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        {analysis ? (
          <div className="result-strip">
            <div>
              <span className="metric-label">Score</span>
              <strong>{analysis.raw.score.toFixed(1)}</strong>
            </div>
            <div>
              <span className="metric-label">Target Rank</span>
              <strong>{analysis.raw.target_rank}</strong>
            </div>
            <div>
              <span className="metric-label">Decision</span>
              <strong>{decision?.wrong_word_detected ? "Sai từ" : decision?.accept_as_target ? "Đúng từ" : "Cần sửa"}</strong>
            </div>
          </div>
        ) : null}
      </aside>

      <main className="stage-panel">
        <div className="stage-header">
          <div>
            <p className="eyebrow">Playback</p>
            <h2>Segment sync theo API</h2>
          </div>
          <div className="transport">
            <button className="ghost-button" disabled={!analysis} onClick={playSegments} type="button">
              Play Segment
            </button>
            <button className="ghost-button" disabled={!analysis} onClick={pauseSegments} type="button">
              Pause
            </button>
            <button className="ghost-button" disabled={!analysis} onClick={resetSegments} type="button">
              Reset
            </button>
          </div>
        </div>

        <div className="video-grid">
          <section className="video-card">
            <div className="panel-title">
              <div className="panel-meta">
                <span>User attempt</span>
                <small className="debug-line">source: {userVideoSourceLabel} | status: {userVideoStatus}</small>
              </div>
              {analysis ? <small>{analysis.userSegment.segment_start_ms}ms → {analysis.userSegment.segment_end_ms}ms</small> : null}
            </div>
            <div className="video-shell">
              {userVideoUrl ? (
                <>
                  <video
                    ref={userVideoRef}
                    className="video-node"
                    src={userVideoUrl}
                    preload="auto"
                    playsInline
                    {...attachVideoDebugHandlers("user")}
                  />
                  <canvas ref={userCanvasRef} className="overlay-canvas" />
                </>
              ) : (
                <div className="empty-state">Upload video để xem preview.</div>
              )}
            </div>
          </section>

          <section className="video-card">
            <div className="panel-title">
              <div className="panel-meta">
                <span>Reference</span>
                <small className="debug-line">source: {referenceVideoSourceLabel} | status: {referenceVideoStatus}</small>
              </div>
              {analysis ? <small>{analysis.referenceSegment.segment_start_ms}ms → {analysis.referenceSegment.segment_end_ms}ms</small> : null}
            </div>
            <div className="video-shell">
              {referenceUrl ? (
                <>
                  <video
                    ref={referenceVideoRef}
                    className="video-node"
                    src={referenceUrl}
                    preload="auto"
                    playsInline
                    {...attachVideoDebugHandlers("reference")}
                  />
                  <canvas ref={referenceCanvasRef} className="overlay-canvas" />
                </>
              ) : (
                <div className="empty-state">Reference video sẽ hiện sau khi API trả kết quả.</div>
              )}
            </div>
          </section>
        </div>

        <div className="feedback-grid">
          <section className="feedback-card">
            <h3>Kết luận</h3>
            {decision ? (
              <>
                <p>{analysis.raw.feedback.overall}</p>
                <ul className="flat-list">
                  <li>accept_as_target: {String(decision.accept_as_target)}</li>
                  <li>possible_wrong_word: {String(decision.possible_wrong_word)}</li>
                  <li>wrong_word_detected: {String(decision.wrong_word_detected)}</li>
                  {decision.predicted_wrong_gloss ? (
                    <li>predicted_wrong_gloss: {decision.predicted_wrong_gloss}</li>
                  ) : null}
                </ul>
              </>
            ) : (
              <p className="muted">Chưa có kết quả.</p>
            )}
          </section>

          <section className="feedback-card">
            <h3>Main errors</h3>
            {analysis?.raw?.feedback?.main_errors?.length ? (
              <ul className="flat-list">
                {analysis.raw.feedback.main_errors.map((item) => (
                  <li key={item.body_part}>
                    <strong>{item.body_part}</strong>: {item.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Không có lỗi lớn.</p>
            )}
          </section>

          <section className="feedback-card">
            <h3>Bank</h3>
            <p className="muted">
              Active glosses: {config?.glosses?.length ?? 0}. Practice II random lesson lấy từ bank 20 gloss này.
            </p>
            <div className="lesson-grid">
              {(config?.glosses ?? []).map((item) => (
                <span key={item} className="lesson-pill">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
