import type React from "react";
import type { NormalizedSegment } from "../overlay";

export type VideoStatus =
  | "idle"
  | "loading"
  | "metadata"
  | "ready"
  | "buffering"
  | "paused"
  | "error";

interface VideoPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoUrl: string;
  segment: NormalizedSegment | null;
  sourceLabel: string;
  status: VideoStatus;
  title: string;
  emptyMessage: string;
  handlers: React.VideoHTMLAttributes<HTMLVideoElement>;
}

export function VideoPanel({
  videoRef,
  canvasRef,
  videoUrl,
  segment,
  sourceLabel,
  status,
  title,
  emptyMessage,
  handlers
}: VideoPanelProps) {
  return (
    <section className="video-card">
      <div className="panel-title">
        <div className="panel-meta">
          <span>{title}</span>
          <small className="debug-line">
            source: {sourceLabel} | status: {status}
          </small>
        </div>
        {segment ? (
          <small>
            {segment.segment_start_ms}ms → {segment.segment_end_ms}ms
          </small>
        ) : null}
      </div>
      <div className="video-shell">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              className="video-node"
              src={videoUrl}
              preload="auto"
              playsInline
              {...handlers}
            />
            <canvas ref={canvasRef} className="overlay-canvas" />
          </>
        ) : (
          <div className="empty-state">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
}
