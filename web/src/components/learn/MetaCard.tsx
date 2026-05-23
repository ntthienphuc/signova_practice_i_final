interface MetaCardProps {
  vi: string;
  en?: string;
  category_vi?: string;
  difficulty?: string;
  description_vi?: string;
  score?: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export default function MetaCard({ vi, en, category_vi, difficulty, description_vi, score }: MetaCardProps) {
  return (
    <div className="w-56 sm:w-64 lg:w-80 aspect-square bg-dark-card border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col gap-3 sm:gap-4 text-left overflow-y-auto">
      {/* Vietnamese */}
      <div>
        <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-hint">
          TỪ TIẾNG VIỆT
        </p>
        <p className="m-0 text-xl font-bold text-text-main">{vi}</p>
      </div>

      {/* English — only if provided */}
      {en && (
        <div>
          <p className="m-0 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-hint">
            TIẾNG ANH
          </p>
          <p className="m-0 text-xl font-bold text-brand-primaryLight">{en}</p>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {category_vi && (
          <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryLight text-xs px-2.5 py-1 rounded-full">
            {category_vi}
          </span>
        )}
        {difficulty && (
          <span className="bg-brand-teal/10 border border-brand-teal/20 text-brand-tealLight text-xs px-2.5 py-1 rounded-full">
            {DIFFICULTY_LABEL[difficulty] ?? difficulty}
          </span>
        )}
        {score !== undefined && (
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-full">
            {score}%
          </span>
        )}
      </div>

      {/* Description — only if provided */}
      {description_vi && (
        <div>
          <p className="m-0 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-hint">
            MÔ TẢ
          </p>
          <p className="m-0 text-sm leading-relaxed text-text-muted">{description_vi}</p>
        </div>
      )}
    </div>
  );
}
