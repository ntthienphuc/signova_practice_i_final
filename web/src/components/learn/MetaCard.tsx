import { words } from "../../data/learnData";

type Word = (typeof words)[number];

interface MetaCardProps {
  word: Word;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export default function MetaCard({ word }: MetaCardProps) {
  return (
    <div className="w-80 h-80 bg-dark-card border border-white/10 rounded-2xl p-6 flex flex-col gap-4 text-left flex-shrink-0 overflow-y-auto">
      {/* Vietnamese */}
      <div>
        <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-hint">
          TỪ TIẾNG VIỆT
        </p>
        <p className="m-0 text-xl font-bold text-text-main">{word.vi}</p>
      </div>

      {/* English */}
      <div>
        <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-hint">
          TIẾNG ANH
        </p>
        <p className="m-0 text-xl font-bold text-brand-primaryLight">{word.en}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryLight text-xs px-2.5 py-1 rounded-full">
          {word.category_vi}
        </span>
        <span className="bg-brand-teal/10 border border-brand-teal/20 text-brand-tealLight text-xs px-2.5 py-1 rounded-full">
          {DIFFICULTY_LABEL[word.difficulty] ?? word.difficulty}
        </span>
      </div>

      {/* Description */}
      <div>
        <p className="m-0 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-hint">
          MÔ TẢ
        </p>
        <p className="m-0 text-sm leading-relaxed text-text-muted">{word.description_vi}</p>
      </div>
    </div>
  );
}
