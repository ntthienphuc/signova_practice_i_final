import type React from "react";
import type { AppConfig } from "../api/index";
import type { NormalizedAnalysis } from "../overlay";
import { FeedbackGrid } from "./FeedbackGrid";
import { TransportBar } from "./TransportBar";
import type { VideoStatus } from "./VideoPanel";
import { VideoPanel } from "./VideoPanel";

interface StagePanelProps {
  analysis: NormalizedAnalysis | null;
  config: AppConfig | null;
  userVideoRef: React.RefObject<HTMLVideoElement | null>;
  referenceVideoRef: React.RefObject<HTMLVideoElement | null>;
  userCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  referenceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  userVideoUrl: string;
  referenceUrl: string;
  userSourceLabel: string;
  referenceSourceLabel: string;
  userStatus: VideoStatus;
  referenceStatus: VideoStatus;
  userHandlers: React.VideoHTMLAttributes<HTMLVideoElement>;
  referenceHandlers: React.VideoHTMLAttributes<HTMLVideoElement>;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function StagePanel({
  analysis,
  config,
  userVideoRef,
  referenceVideoRef,
  userCanvasRef,
  referenceCanvasRef,
  userVideoUrl,
  referenceUrl,
  userSourceLabel,
  referenceSourceLabel,
  userStatus,
  referenceStatus,
  userHandlers,
  referenceHandlers,
  onPlay,
  onPause,
  onReset
}: StagePanelProps) {
  return (
    <main className="stage-panel">
      <div className="stage-header">
        <div>
          <p className="eyebrow">Playback</p>
          <h2>Segment sync theo API</h2>
        </div>
        <TransportBar
          hasAnalysis={!!analysis}
          onPlay={onPlay}
          onPause={onPause}
          onReset={onReset}
        />
      </div>

      <div className="video-grid">
        <VideoPanel
          videoRef={userVideoRef}
          canvasRef={userCanvasRef}
          videoUrl={userVideoUrl}
          segment={analysis?.userSegment ?? null}
          sourceLabel={userSourceLabel}
          status={userStatus}
          title="User attempt"
          emptyMessage="Upload video để xem preview."
          handlers={userHandlers}
        />
        <VideoPanel
          videoRef={referenceVideoRef}
          canvasRef={referenceCanvasRef}
          videoUrl={referenceUrl}
          segment={analysis?.referenceSegment ?? null}
          sourceLabel={referenceSourceLabel}
          status={referenceStatus}
          title="Reference"
          emptyMessage="Reference video sẽ hiện sau khi API trả kết quả."
          handlers={referenceHandlers}
        />
      </div>

      <FeedbackGrid analysis={analysis} config={config} />
    </main>
  );
}
