import type { Topic } from "../types/learn";

interface TopicProgress {
  completedWords?: number;
  completed?: boolean;
}

interface Session {
  topic: Topic;
}

interface StatPanelProps {
  eyebrow: string;
  value: string;
  hint: string;
}

function StatPanel({ eyebrow, value, hint }: StatPanelProps) {
  return (
    <article className="grid gap-2 p-5 rounded-[22px] bg-[rgba(255,252,248,0.92)] border border-white/[0.82] shadow-[0_8px_20px_rgba(83,110,249,0.08)]">
      <p className="m-0 text-[0.75rem] uppercase tracking-[0.16em] text-[#c07f42] font-extrabold">{eyebrow}</p>
      <strong className="text-[1.4rem] text-[#1e2742]">{value}</strong>
      <p className="m-0 text-[#66758a] leading-[1.55] text-sm">{hint}</p>
    </article>
  );
}

interface ProgressRailProps {
  activeTab: string;
  session: Session | null;
  progressByTopic: Record<string, TopicProgress | undefined>;
  topics: Topic[];
}

export function ProgressRail({ activeTab, session, progressByTopic, topics }: ProgressRailProps) {
  if (activeTab !== "learn") {
    return (
      <aside className="sticky top-0 h-screen overflow-auto px-5 py-7 grid gap-4 content-start">
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
    <aside className="sticky top-0 h-screen overflow-auto px-5 py-7 grid gap-4 content-start">
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

      <section className="grid gap-3 p-5 rounded-[22px] bg-[rgba(255,252,248,0.92)] border border-white/[0.82] shadow-[0_8px_20px_rgba(83,110,249,0.08)]">
        <p className="m-0 text-[0.75rem] uppercase tracking-[0.16em] text-[#c07f42] font-extrabold">Journey</p>
        <ul className="m-0 pl-[18px] grid gap-2 list-disc">
          <li className="text-sm leading-[1.65] text-[#66758a]">Xem poster và video mẫu.</li>
          <li className="text-sm leading-[1.65] text-[#66758a]">Luyện ngay từng từ bằng Practice I.</li>
          <li className="text-sm leading-[1.65] text-[#66758a]">Làm checkpoint sau 5 từ đầu.</li>
          <li className="text-sm leading-[1.65] text-[#66758a]">Hoàn tất 10 từ rồi làm Practice II tổng kết.</li>
        </ul>
      </section>
    </aside>
  );
}
