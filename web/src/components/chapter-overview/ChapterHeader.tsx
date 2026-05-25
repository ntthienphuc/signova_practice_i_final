import { ArrowLeft } from "lucide-react";

interface ChapterHeaderProps {
  topicIndex: number;
  title: string;
  subtitle: string;
  accentColor: string;
  accentBg: string;
  onBack: () => void;
}

export function ChapterHeader({ topicIndex, title, subtitle, accentColor, accentBg, onBack }: ChapterHeaderProps) {
  return (
    <header
      className="w-full px-4 pt-5 pb-8 relative"
      style={{ backgroundColor: accentBg }}
    >
      <div className="max-w-2xl mx-auto relative">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 top-0 p-2 rounded-full transition-all hover:bg-black/5 active:scale-95 cursor-pointer"
          style={{ border: "none", background: "transparent" }}
          aria-label="Quay lại"
        >
          <ArrowLeft size={22} color="#374151" />
        </button>

        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <span
            className="text-[11px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full"
            style={{
              backgroundColor: "white",
              color: accentColor,
              border: `1.5px solid ${accentColor}`,
            }}
          >
            Chương {topicIndex}
          </span>

          <h1 className="m-0 text-2xl sm:text-3xl font-black text-slate-800 leading-tight mt-1">
            {title}
          </h1>
          <p className="m-0 text-slate-600 text-sm sm:text-base font-medium max-w-sm leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}
