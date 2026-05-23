import type { AppConfig, PracticeMode, RandomTask } from "../api/index";
import type { NormalizedAnalysis } from "../overlay";
import { ResultStrip } from "./ResultStrip";
import { TaskCard } from "./TaskCard";
import { UploadCard } from "./UploadCard";

interface ControlPanelProps {
  config: AppConfig | null;
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  lessonSize: number;
  onLessonSizeChange: (size: number) => void;
  task: RandomTask | null;
  onRandom: () => void;
  file: File | null;
  loading: boolean;
  error: string;
  analysis: NormalizedAnalysis | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
}

export function ControlPanel({
  config,
  mode,
  onModeChange,
  lessonSize,
  onLessonSizeChange,
  task,
  onRandom,
  file,
  loading,
  error,
  analysis,
  onFileChange,
  onAnalyze
}: ControlPanelProps) {
  return (
    <aside className="control-panel">
      <div className="hero-block">
        <p className="eyebrow">SIGNOVA Demo</p>
        <h1>Practice web bám hoàn toàn vào API backend.</h1>
        <p className="hero-copy">
          FE chỉ upload video, nhận target, khoảng cắt, reference clip và overlay timeline từ
          server.
        </p>
      </div>

      <div className="mode-row">
        <button
          className={mode === "practice_i" ? "pill active" : "pill"}
          onClick={() => onModeChange("practice_i")}
          type="button"
        >
          Practice I
        </button>
        <button
          className={mode === "practice_ii" ? "pill active" : "pill"}
          onClick={() => onModeChange("practice_ii")}
          type="button"
        >
          Practice II
        </button>
      </div>

      {mode === "practice_ii" ? (
        <label className="field">
          <span>Lesson Size</span>
          <select
            value={lessonSize}
            onChange={(event) => onLessonSizeChange(Number(event.target.value))}
          >
            {(config?.random_practice_ii_sizes ?? [5, 10]).map((size) => (
              <option key={size} value={size}>
                {size} từ
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <TaskCard task={task} onRandom={onRandom} />
      <UploadCard
        task={task}
        file={file}
        loading={loading}
        error={error}
        onFileChange={onFileChange}
        onAnalyze={onAnalyze}
      />
      {analysis ? <ResultStrip analysis={analysis} /> : null}
    </aside>
  );
}
