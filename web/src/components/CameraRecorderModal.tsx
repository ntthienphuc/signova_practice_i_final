import { useEffect, useRef, useState } from "react";
import { Camera, Square, RotateCcw, Check, X } from "lucide-react";

interface CameraRecorderModalProps {
  onSave: (file: File) => void;
  onClose: () => void;
}

type RecordState = "idle" | "countdown" | "recording" | "review";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CameraRecorderModal({ onSave, onClose }: CameraRecorderModalProps) {
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [cameraError, setCameraError] = useState("");

  const previewRef = useRef<HTMLVideoElement | null>(null);
  const playbackRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const playbackUrlRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Không thể truy cập camera. Hãy cấp quyền camera cho trình duyệt.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
    };
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      recordedBlobRef.current = blob;
      if (playbackUrlRef.current) URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = URL.createObjectURL(blob);
      setState("review");
    };
    recorder.start(100);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    setState("recording");
  };

  const handleRecord = () => {
    if (!streamRef.current) return;
    setCountdown(5);
    setState("countdown");
  };

  const handleStop = () => {
    recorderRef.current?.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleReRecord = () => {
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = "";
    }
    recordedBlobRef.current = null;
    chunksRef.current = [];
    setElapsed(0);
    setState("idle");
    startCamera();
  };

  const handleSave = () => {
    if (!recordedBlobRef.current) return;
    const ext = recordedBlobRef.current.type.includes("webm") ? "webm" : "mp4";
    const file = new File([recordedBlobRef.current], `recording.${ext}`, {
      type: recordedBlobRef.current.type,
    });
    onSave(file);
    onClose();
  };

  // Wire playback src when entering review state
  useEffect(() => {
    if (state === "review" && playbackRef.current && playbackUrlRef.current) {
      playbackRef.current.src = playbackUrlRef.current;
    }
  }, [state]);

  // Countdown tick — decrements each second, fires recording at 0
  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      startRecording();
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [state, countdown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[28px] shadow-2xl border-2 border-slate-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 m-0">
            <Camera size={20} className="text-[#1cb0f6]" />
            {state === "review" ? "Xem lại video" : "Quay video"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video area */}
        <div className="px-5 flex justify-center">
          <div className="relative rounded-[20px] overflow-hidden bg-slate-900 w-full" style={{ aspectRatio: "9/16", maxHeight: "60vh" }}>
            {/* Live preview */}
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover ${state === "review" ? "hidden" : "block"}`}
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Recorded playback */}
            <video
              ref={playbackRef}
              autoPlay
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover ${state === "review" ? "block" : "hidden"}`}
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Countdown overlay */}
            {state === "countdown" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span
                  key={countdown}
                  className="text-white font-black leading-none select-none"
                  style={{ fontSize: "7rem", textShadow: "0 4px 24px rgba(0,0,0,0.6)", animation: "countdown-pop 1s ease-out" }}
                >
                  {countdown}
                </span>
              </div>
            )}
            {/* Recording indicator */}
            {state === "recording" && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs font-black px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {formatElapsed(elapsed)}
              </div>
            )}
            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-rose-400 text-sm font-bold text-center">{cameraError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Hint */}
        {state !== "review" && state !== "countdown" && (
          <div className="mx-5 mt-3 flex items-center gap-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3">
            <span className="text-2xl shrink-0">📸</span>
            <p className="text-amber-800 text-xs font-black leading-snug">
              Lùi người ra xa một chút để camera thấy rõ cả hai tay bạn nhé!
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="px-5 py-5 flex gap-3 justify-center">
          {(state === "idle" || state === "countdown") && (
            <button
              type="button"
              onClick={handleRecord}
              disabled={!!cameraError || state === "countdown"}
              className="flex items-center gap-2 py-3 px-6 bg-rose-500 border-b-2 border-rose-700 hover:bg-rose-600 text-white font-black rounded-2xl text-sm cursor-pointer transition-all active:border-b-0 active:translate-y-[2px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="w-3 h-3 rounded-full bg-white" />
              {state === "countdown" ? `Bắt đầu sau ${countdown}s...` : "Bắt đầu quay"}
            </button>
          )}

          {state === "recording" && (
            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-2 py-3 px-6 bg-slate-700 border-b-2 border-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-sm cursor-pointer transition-all active:border-b-0 active:translate-y-[2px]"
            >
              <Square size={14} fill="white" />
              Dừng quay
            </button>
          )}

          {state === "review" && (
            <>
              <button
                type="button"
                onClick={handleReRecord}
                className="flex items-center gap-2 py-3 px-5 bg-white border-2 border-b-2 border-slate-200 text-slate-700 font-black rounded-2xl text-sm cursor-pointer transition-all active:border-b-0 active:translate-y-[2px] hover:bg-slate-50"
              >
                <RotateCcw size={15} />
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-[#1cb0f6] border-b-2 border-[#1899d6] hover:bg-[#24c4ff] text-white font-black rounded-2xl text-sm cursor-pointer transition-all active:border-b-0 active:translate-y-[2px]"
              >
                <Check size={16} />
                Dùng video này
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
