import type { AppTab, PracticeSession, ProgressByTopic, Topic } from "../types/learn";

interface StatPanelProps {
  eyebrow: string;
  value: string;
  hint: string;
}

function StatPanel({ eyebrow, value, hint }: StatPanelProps) {
  return (
    <article className="rail-panel">
      <p className="rail-eyebrow">{eyebrow}</p>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}

interface ProgressRailProps {
  activeTab: AppTab;
  session: PracticeSession | null;
  progressByTopic: ProgressByTopic;
  topics: Topic[];
}

export function ProgressRail({ activeTab, session, progressByTopic, topics }: ProgressRailProps) {
  if (activeTab !== "learn") {
    return (
      <aside className="progress-rail">
        <StatPanel eyebrow="Progress" value="Soon" hint="Dashboard nâng cao sẽ được nối vào đây." />
        <StatPanel eyebrow="Notes" value="2" hint="Giữ chỗ cho widget gia đình và trường học." />
      </aside>
    );
  }

  const completedTopics = Object.values(progressByTopic).filter((item) => item?.completed).length;
  const totalWords = topics.reduce((sum, topic) => sum + (topic.word_count ?? 0), 0);
  const completedWords = Object.values(progressByTopic).reduce(
    (sum, item) => sum + Number(item?.completedWords ?? 0),
    0
  );

  const activeTopicProgress = session
    ? progressByTopic[session.topic.id] ?? { completedWords: 0, completed: false }
    : null;

  return (
    <aside className="progress-rail">
      <StatPanel
        eyebrow="Current Topic"
        value={session ? session.topic.title : "Chưa chọn"}
        hint={
          session
            ? `${activeTopicProgress?.completedWords ?? 0}/${session.topic.word_count} từ đã đi qua`
            : "Chọn một topic để bắt đầu học."
        }
      />
      <StatPanel
        eyebrow="Words"
        value={`${completedWords}/${totalWords || 20}`}
        hint="Tổng số từ bạn đã đi qua trong app hiện tại."
      />
      <StatPanel
        eyebrow="Topics"
        value={`${completedTopics}/${topics.length || 2}`}
        hint="Topic được tính hoàn thành khi xong cả Practice II cuối topic."
      />

      <section className="rail-panel rail-panel-list">
        <p className="rail-eyebrow">Journey</p>
        <ul>
          <li>Xem poster và video mẫu.</li>
          <li>Luyện ngay từng từ bằng Practice I.</li>
          <li>Làm checkpoint sau 5 từ đầu.</li>
          <li>Hoàn tất 10 từ rồi làm Practice II tổng kết.</li>
        </ul>
      </section>
    </aside>
  );
}
