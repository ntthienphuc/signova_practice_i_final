import { ArrowLeft } from "lucide-react";
import { mascots } from "../../utils/mascot";

interface ChapterHeaderProps {
  topicIndex: number;
  title: string;
  subtitle: string;
  accentColor: string;
  accentBg: string;
  onBack: () => void;
}

export function ChapterHeader({ topicIndex, title, subtitle, accentColor, accentBg, onBack }: ChapterHeaderProps) {
  const mascotImg = mascots[6]; // Teacher Mascot is perfect for chapter curriculum overview
  
  return (
    <header
      className="w-full px-4 pt-6 pb-8 relative overflow-hidden"
      style={{ backgroundColor: accentBg }}
    >
      <div className="max-w-2xl mx-auto relative flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 top-0 p-2 rounded-full transition-all hover:bg-black/5 active:scale-95 cursor-pointer z-10"
          style={{ border: "none", background: "transparent" }}
          aria-label="Quay lại"
        >
          <ArrowLeft size={22} color="#374151" />
        </button>

        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 pt-1 flex-1 relative z-10 pl-10 sm:pl-12">
          <span
            className="text-[11px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full w-fit"
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
          <p className="m-0 text-slate-600 text-sm sm:text-base font-medium max-w-md leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Mascot Peeking out */}
        <div 
          className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 select-none animate-bounce-subtle pointer-events-none relative z-10 mt-2 sm:mt-0"
          style={{ 
            animationDuration: '6s',
            filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.08))"
          }}
        >
          <img 
            src={mascotImg} 
            alt="Chapter Mascot" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      {/* Decorative playful bubbles to blend into UI */}
      <div className="absolute top-2 right-[20%] w-3 h-3 rounded-full bg-white/40 animate-pulse pointer-events-none" style={{ animationDuration: '2s' }} />
      <div className="absolute bottom-2 left-[10%] w-4 h-4 rounded-full bg-white/30 animate-pulse pointer-events-none" style={{ animationDuration: '3.5s' }} />
      <div className="absolute top-[40%] left-[5%] w-2 h-2 rounded-full bg-white/55 pointer-events-none" />
    </header>
  );
}
