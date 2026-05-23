import { Play } from "lucide-react";

interface VideoCardProps {
  wordVi: string;
  wordEn: string;
}

export default function VideoCard({ wordVi, wordEn }: VideoCardProps) {
  return (
    <div
      className="w-80 h-80 rounded-2xl overflow-hidden border border-white/10 relative bg-black flex-shrink-0"
      style={{ minWidth: 400 }}
    >
      {/* Gradient background mimicking a dark video frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
      <div className="absolute inset-0 bg-dot-grid opacity-40" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <button className="bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-5 transition-all cursor-pointer border-0 scale-110">
          <Play size={28} fill="white" />
        </button>
      </div>

      {/* Bottom label overlay */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent text-center">
        <p className="m-0 text-xs text-text-hint">Video mẫu</p>
        <p className="m-0 mt-0.5 text-sm font-semibold text-text-main">
          {wordVi} — {wordEn}
        </p>
      </div>
    </div>
  );
}
