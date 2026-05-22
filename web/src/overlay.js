function getVideoContentBox(video, canvas) {
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

function pickFrameIndex(segment, frames, currentTimeSeconds) {
  if (!segment || !frames?.length) {
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

function setCanvasSize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function normalizeAnalysis(raw, apiBase) {
  const overlay = raw.overlay ?? {};
  const playback = raw.playback ?? {};
  const jointNames = overlay.joint_names ?? [];
  const connections = overlay.connections ?? [];
  const jointIndexByName = Object.fromEntries(jointNames.map((name, index) => [name, index]));
  const badByFrame = Array.from({ length: overlay.frame_count ?? 0 }, (_, frameIndex) => {
    const frameBad = overlay.bad_joint_indices?.[frameIndex] ?? [];
    return new Set(frameBad);
  });
  if (!overlay.bad_joint_indices?.length) {
    for (const item of raw.visualization?.joint_status ?? []) {
      if (item.status !== "bad") {
        continue;
      }
      const jointIndex = jointIndexByName[item.body_part];
      if (jointIndex === undefined || !badByFrame[item.frame]) {
        continue;
      }
      badByFrame[item.frame].add(jointIndex);
    }
  }

  const referenceVideoUrl = raw.reference?.display_video?.video_url
    ? new URL(raw.reference.display_video.video_url, apiBase).href
    : null;
  const referencePlaybackUrl = raw.reference?.display_video?.playback_url
    ? new URL(raw.reference.display_video.playback_url, apiBase).href
    : referenceVideoUrl;
  const userPlaybackUrl = raw.playback?.user_video_url
    ? new URL(raw.playback.user_video_url, apiBase).href
    : null;

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
}) {
  if (!canvas || !video || !frames?.length || !segment) {
    return;
  }
  const ctx = setCanvasSize(canvas);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const frameIndex = pickFrameIndex(segment, frames, video.currentTime || 0);
  const frame = frames[frameIndex];
  const points = Array.isArray(frame?.points) ? frame.points : frame;
  const badSet = badByFrame?.[frameIndex] ?? new Set();
  const box = getVideoContentBox(video, canvas);

  if (!Array.isArray(points)) {
    return;
  }

  function mapPoint(point) {
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
    ctx.strokeStyle = highlight ? palette.focusEdge : palette.baseEdge;
    ctx.lineWidth = highlight ? 4 : 3;
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
