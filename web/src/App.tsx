import { useEffect, useRef, useState } from "react";
import type { AppConfig, PracticeMode, RandomTask } from "./api/index";
import { analyzeAttempt, createRandomTask, ensureBaseUrl, loadAppConfig } from "./api/index";
import { ControlPanel } from "./components/ControlPanel";
import { StagePanel } from "./components/StagePanel";
import type { VideoStatus } from "./components/VideoPanel";
import type { NormalizedAnalysis, Palette } from "./overlay";
import { drawOverlay, normalizeAnalysis } from "./overlay";

const USER_PALETTE: Palette = {
  baseEdge: "rgba(142, 245, 115, 0.82)",
  baseJoint: "rgba(142, 245, 115, 0.9)",
  focusEdge: "rgba(255, 74, 74, 0.96)",
  focusJoint: "rgba(255, 74, 74, 1)"
};

const REFERENCE_PALETTE: Palette = {
  baseEdge: "rgba(51, 214, 112, 0.55)",
  baseJoint: "rgba(51, 214, 112, 0.7)",
  focusEdge: "rgba(51, 214, 112, 1)",
  focusJoint: "rgba(51, 214, 112, 1)"
};

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

export default function App() {
  const [apiBase, setApiBase] = useState("http://127.0.0.1:8014");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [mode, setMode] = useState<PracticeMode>("practice_i");
  const [lessonSize, setLessonSize] = useState(5);
  const [task, setTask] = useState<RandomTask | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<NormalizedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [userStatus, setUserStatus] = useState<VideoStatus>("idle");
  const [referenceStatus, setReferenceStatus] = useState<VideoStatus>("idle");

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const referenceVideoRef = useRef<HTMLVideoElement>(null);
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const referenceCanvasRef = useRef<HTMLCanvasElement>(null);

  const localUserVideoUrl = useObjectUrl(file);
  const userVideoUrl = analysis?.userPlaybackUrl ?? localUserVideoUrl;
  const referenceUrl = analysis?.referenceVideoUrl ?? "";
  const userSourceLabel = analysis?.userPlaybackUrl
    ? "server playback h264"
    : userVideoUrl
      ? "local blob"
      : "none";
  const referenceSourceLabel = analysis?.referenceVideoUrl
    ? "server playback h264"
    : referenceUrl
      ? "reference original"
      : "none";

  useEffect(() => {
    let active = true;
    loadAppConfig(ensureBaseUrl(apiBase))
      .then((payload) => {
        if (active) setConfig(payload);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [apiBase]);

  useEffect(() => {
    setUserStatus("idle");
    setReferenceStatus("idle");
  }, [analysis, userVideoUrl, referenceUrl]);

  function redrawOverlays() {
    if (!analysis) return;
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
    if (!analysis) return undefined;
    const userVideo = userVideoRef.current;
    const referenceVideo = referenceVideoRef.current;
    if (!userVideo || !referenceVideo) return undefined;

    let frameId = 0;
    const tick = () => {
      if (playing) {
        const userEnd = (analysis.userSegment?.segment_end_ms ?? 0) / 1000;
        const refEnd = (analysis.referenceSegment?.segment_end_ms ?? 0) / 1000;
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
    if (!analysis) return undefined;
    const handleResize = () => redrawOverlays();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [analysis, userVideoUrl, referenceUrl]);

  async function handleRandomTask() {
    setError("");
    setAnalysis(null);
    setPlaying(false);
    try {
      setTask(await createRandomTask(ensureBaseUrl(apiBase), mode, lessonSize));
    } catch (err) {
      setError((err as Error).message);
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
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function playSegments() {
    const userVideo = userVideoRef.current;
    const referenceVideo = referenceVideoRef.current;
    if (!analysis || !userVideo || !referenceVideo) return;

    const commonDuration = Math.max(
      analysis.userSegment?.segment_duration_ms ?? 1,
      analysis.referenceSegment?.segment_duration_ms ?? 1,
      1
    );
    userVideo.pause();
    referenceVideo.pause();
    userVideo.currentTime = (analysis.userSegment?.segment_start_ms ?? 0) / 1000;
    referenceVideo.currentTime = (analysis.referenceSegment?.segment_start_ms ?? 0) / 1000;
    userVideo.playbackRate =
      (analysis.userSegment?.segment_duration_ms ?? commonDuration) / commonDuration;
    referenceVideo.playbackRate =
      (analysis.referenceSegment?.segment_duration_ms ?? commonDuration) / commonDuration;
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
      userVideoRef.current.currentTime = (analysis.userSegment?.segment_start_ms ?? 0) / 1000;
      referenceVideoRef.current.currentTime =
        (analysis.referenceSegment?.segment_start_ms ?? 0) / 1000;
      redrawOverlays();
    }
  }

  function buildVideoHandlers(
    kind: "user" | "reference"
  ): React.VideoHTMLAttributes<HTMLVideoElement> {
    const setStatus = kind === "user" ? setUserStatus : setReferenceStatus;
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
      onSeeked: () => redrawOverlays(),
      onError: () => setStatus("error")
    };
  }

  return (
    <div className="app-shell">
      <ControlPanel
        apiBase={apiBase}
        onApiBaseChange={setApiBase}
        config={config}
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          setAnalysis(null);
        }}
        lessonSize={lessonSize}
        onLessonSizeChange={setLessonSize}
        task={task}
        onRandom={handleRandomTask}
        file={file}
        loading={loading}
        error={error}
        analysis={analysis}
        onFileChange={setFile}
        onAnalyze={handleAnalyze}
      />
      <StagePanel
        analysis={analysis}
        config={config}
        userVideoRef={userVideoRef}
        referenceVideoRef={referenceVideoRef}
        userCanvasRef={userCanvasRef}
        referenceCanvasRef={referenceCanvasRef}
        userVideoUrl={userVideoUrl ?? ""}
        referenceUrl={referenceUrl}
        userSourceLabel={userSourceLabel}
        referenceSourceLabel={referenceSourceLabel}
        userStatus={userStatus}
        referenceStatus={referenceStatus}
        userHandlers={buildVideoHandlers("user")}
        referenceHandlers={buildVideoHandlers("reference")}
        onPlay={playSegments}
        onPause={pauseSegments}
        onReset={resetSegments}
      />
    </div>
  );
}
