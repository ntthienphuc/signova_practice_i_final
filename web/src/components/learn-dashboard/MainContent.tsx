import { useState } from "react";
import { BookOpen } from "lucide-react";
import UnitAccordion from "./UnitAccordion";
import { MOCK_DASHBOARD } from "../../data/learnDashboardData";

export default function MainContent() {
  const topics = MOCK_DASHBOARD.topics;
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(topics[0]?.id ?? null);

  function toggleTopic(id: string) {
    setExpandedTopicId((prev) => (prev === id ? null : id));
  }

  const activeTopic = topics.find((t) => t.id === expandedTopicId) ?? topics[0];

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8 min-w-0">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="m-0 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {activeTopic
              ? `${activeTopic.title} • 0/${activeTopic.word_count} TỪ • ĐANG HỌC`
              : "CHỌN CHỦ ĐỀ ĐỂ BẮT ĐẦU"}
          </p>
          <h1 className="m-0 text-3xl font-bold text-gray-900">
            {activeTopic?.subtitle ?? "Chọn chủ đề"}
          </h1>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 text-[13px] font-semibold tracking-wide cursor-pointer transition-colors flex-shrink-0 shadow-sm">
          <BookOpen size={15} />
          HƯỚNG DẪN
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {topics.map((topic) => (
          <UnitAccordion
            key={topic.id}
            topic={topic}
            isExpanded={expandedTopicId === topic.id}
            onToggle={() => toggleTopic(topic.id)}
          />
        ))}
      </div>
    </main>
  );
}
