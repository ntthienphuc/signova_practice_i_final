import type { RandomTask } from "../api/index";

function buildLessonBadge(task: RandomTask): string[] {
  return task.lesson_glosses?.length ? task.lesson_glosses : [task.target_gloss];
}

interface TaskCardProps {
  task: RandomTask | null;
  onRandom: () => void;
}

export function TaskCard({ task, onRandom }: TaskCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <strong>Bài random</strong>
        <button className="ghost-button" onClick={onRandom} type="button">
          Random
        </button>
      </div>
      {task ? (
        <>
          <div className="target-chip">{task.target_gloss}</div>
          <div className="lesson-grid">
            {buildLessonBadge(task).map((item) => (
              <span
                key={item}
                className={item === task.target_gloss ? "lesson-pill target" : "lesson-pill"}
              >
                {item}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="muted">Chưa có task. Bấm random để lấy bài từ bank 20 gloss.</p>
      )}
    </div>
  );
}
