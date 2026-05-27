import type { AnalyzeResponse, FrameData, FramePoints, Point, SegmentTiming } from "./api/index";
import { apiClient } from "./api/client";

export interface Palette {
  baseEdge: string;
  baseJoint: string;
  focusEdge: string;
  focusJoint: string;
}

export interface NormalizedSegment {
  segment_start_ms: number;
  segment_end_ms: number;
  segment_duration_ms: number;
  [key: string]: unknown;
}

export interface NormalizedAnalysis {
  raw: AnalyzeResponse;
  jointNames: string[];
  connections: [number, number][];
  badByFrame: Set<number>[];
  userSegment: NormalizedSegment | null;
  referenceSegment: NormalizedSegment | null;
  userFrames: FrameData[];
  referenceFrames: FrameData[];
  userPlaybackUrl: string | null;
  referenceVideoUrl: string | null;
}

export interface DrawOverlayParams {
  canvas: HTMLCanvasElement | null;
  video: HTMLVideoElement | null;
  frames: FrameData[];
  segment: NormalizedSegment | null;
  connections: [number, number][];
  badByFrame: Set<number>[];
  palette: Palette;
}

interface ContentBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getVideoContentBox(video: HTMLVideoElement, canvas: HTMLCanvasElement): ContentBox {
  const canvasWidth = canvas.clientWidth || canvas.width || 640;
  const canvasHeight = canvas.clientHeight || canvas.height || 480;
  const videoWidth = video.videoWidth || canvasWidth;
  const videoHeight = video.videoHeight || canvasHeight;
  const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
  const drawWidth = videoWidth * scale;
  const drawHeight = videoHeight * scale;
  return {
    left: (canvasWidth - drawWidth) / 2,
    top: (canvasHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight
  };
}

function pickFrameIndex(
  segment: NormalizedSegment,
  frames: FrameData[],
  currentTimeSeconds: number
): number {
  if (!frames.length) {
    return 0;
  }
  const currentMs = currentTimeSeconds * 1000;
  const durationMs = Math.max(segment.segment_duration_ms, 1);
  const normalized = Math.min(
    1,
    Math.max(0, (currentMs - segment.segment_start_ms) / durationMs)
  );
  return Math.min(frames.length - 1, Math.max(0, Math.round(normalized * (frames.length - 1))));
}

function setCanvasSize(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
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
    segment_duration_ms: Math.max(1, Number(segment.segment_duration_ms ?? (endMs - startMs)))
  };
}

function smoothBadByFrame(frames: Set<number>[]): Set<number>[] {
  if (!frames.length) {
    return [];
  }

  const jointIds = new Set<number>();
  for (const frame of frames) {
    for (const jointId of frame) {
      jointIds.add(jointId);
    }
  }

  const smoothed = frames.map((frame) => new Set<number>(frame));

  for (const jointId of jointIds) {
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
      const prev = frameIndex > 0 && frames[frameIndex - 1].has(jointId);
      const curr = frames[frameIndex].has(jointId);
      const next = frameIndex < frames.length - 1 && frames[frameIndex + 1].has(jointId);

      // Bridge 1-frame gaps so red feedback does not blink when tracking drops briefly.
      if (!curr && prev && next) {
        smoothed[frameIndex].add(jointId);
      }

      // Keep a short tail if the joint is marked bad in two consecutive frames.
      if (
        curr &&
        next &&
        frameIndex < frames.length - 2 &&
        !frames[frameIndex + 2].has(jointId)
      ) {
        smoothed[frameIndex + 2].add(jointId);
      }
    }
  }

  return smoothed;
}

export function normalizeAnalysis(raw: AnalyzeResponse): NormalizedAnalysis {
  const apiBase = apiClient.defaults.baseURL ?? "";
  const overlay = raw.overlay ?? ({} as Partial<typeof raw.overlay>);
  const playback = raw.playback ?? ({} as Partial<typeof raw.playback>);
  const jointNames = overlay.joint_names ?? [];
  const connections = overlay.connections ?? [];
  const jointIndexByName = Object.fromEntries(jointNames.map((name, index) => [name, index]));
  const rawBadByFrame: Set<number>[] = Array.from(
    { length: overlay.frame_count ?? 0 },
    (_, frameIndex) => {
      const frameBad = overlay.bad_joint_indices?.[frameIndex] ?? [];
      return new Set<number>(frameBad);
    }
  );

  if (!overlay.bad_joint_indices?.length) {
    for (const item of raw.visualization?.joint_status ?? []) {
      if (item.status !== "bad") {
        continue;
      }
      const jointIndex = jointIndexByName[item.body_part];
      if (jointIndex === undefined || !rawBadByFrame[item.frame]) {
        continue;
      }
      rawBadByFrame[item.frame].add(jointIndex);
    }
  }
  const badByFrame = smoothBadByFrame(rawBadByFrame);

  const referenceVideoUrl = raw.reference?.display_video?.video_url
    ? new URL(raw.reference.display_video.video_url, apiBase).href
    : null;
  const referencePlaybackUrl = raw.reference?.display_video?.playback_url
    ? new URL(raw.reference.display_video.playback_url, apiBase).href
    : referenceVideoUrl;
  const userPlaybackUrl = raw.playback?.user_video_url
    ? new URL(raw.playback.user_video_url, apiBase).href
    : null;

  return {
    raw,
    jointNames,
    connections,
    badByFrame,
    userSegment: normalizeSegment(playback.user_segment),
    referenceSegment: normalizeSegment(playback.reference_segment),
    userFrames: overlay.user_frames ?? [],
    referenceFrames: overlay.reference_frames ?? [],
    userPlaybackUrl,
    referenceVideoUrl: referencePlaybackUrl
  };
}

export function drawOverlay({
  canvas,
  video,
  frames,
  segment,
  connections,
  badByFrame,
  palette
}: DrawOverlayParams): void {
  if (!canvas || !video || !frames.length || !segment) {
    return;
  }
  const ctx = setCanvasSize(canvas);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const frameIndex = pickFrameIndex(segment, frames, video.currentTime || 0);
  const frame = frames[frameIndex];
  const points: FramePoints = Array.isArray((frame as { points?: FramePoints }).points)
    ? (frame as { points: FramePoints }).points
    : (frame as FramePoints);
  const badSet = badByFrame[frameIndex] ?? new Set<number>();
  const box = getVideoContentBox(video, canvas);

  if (!Array.isArray(points)) {
    return;
  }

  function mapPoint(point: Point): [number, number] | null {
    if (!point) {
      return null;
    }
    return [box.left + point[0] * box.width, box.top + point[1] * box.height];
  }

  for (const [a, b] of connections) {
    const pa = mapPoint(points[a]);
    const pb = mapPoint(points[b]);
    if (!pa || !pb) {
      continue;
    }
    const highlight = badSet.has(a) || badSet.has(b);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = highlight ? palette.focusEdge : palette.baseEdge;
    ctx.lineWidth = highlight ? 5.5 : 3;
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.stroke();
  }

  for (let index = 0; index < points.length; index += 1) {
    const point = mapPoint(points[index]);
    if (!point) {
      continue;
    }
    const highlight = badSet.has(index);
    ctx.fillStyle = highlight ? palette.focusJoint : palette.baseJoint;
    ctx.beginPath();
    ctx.arc(point[0], point[1], highlight ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
