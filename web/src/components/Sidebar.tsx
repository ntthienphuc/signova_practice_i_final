import type { Topic } from "../types/learn";

const TABS = [
  { id: "learn", label: "Học" },
  { id: "practice", label: "Luyện Tập" },
] as const;

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  apiBase: string;
  onApiBaseChange: (value: string) => void;
  curriculumTopics: Topic[];
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="sticky top-0 h-screen overflow-auto px-6 py-8 border-r border-[rgba(53,84,128,0.08)] backdrop-blur-[14px] bg-[radial-gradient(circle_at_top_left,rgba(255,220,242,0.6),transparent_28%),linear-gradient(180deg,rgba(255,252,247,0.96),rgba(238,247,255,0.96))]">
      <div className="mb-[22px]">
        <div className="flex items-center gap-[10px] flex-wrap">
          <div className="w-[66px] h-[66px] rounded-[22px] grid place-items-center bg-white/90 shadow-[0_14px_28px_rgba(83,110,249,0.12)] overflow-hidden">
            <img src="/signova-mascot.png" alt="Signova mascot" className="w-full h-full object-cover" />
          </div>
          <span className="mt-[10px] bg-[#fff0c4] text-[#9a6213] inline-flex items-center rounded-full px-3 py-2 font-bold text-[0.92rem]">
            20 từ • 2 topic
          </span>
        </div>
        <p className="m-0 mt-4 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">SIGNOVA</p>
        <h1
          className="mt-[10px] mb-3 text-[clamp(2.15rem,3vw,3.15rem)] leading-[1.04] tracking-[-0.03em]"
          style={{ fontFamily: '"Baloo 2", Nunito, sans-serif' }}
        >
          Học ký hiệu cùng mascot Signova
        </h1>
        <p className="text-[#66758a] leading-[1.62]">
          Xem mẫu, học từng từ, quay video và nhận phản hồi màu sắc thật dễ hiểu.
        </p>
      </div>

      <div className="grid gap-[10px] mb-[18px]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "w-full border border-transparent py-4 px-[18px] rounded-full text-left transition-all duration-[160ms] font-bold text-[1.02rem] bg-[linear-gradient(135deg,#536ef9,#68c6ff)] text-white shadow-[0_12px_34px_rgba(83,110,249,0.1)]"
                : "w-full border border-transparent bg-white/[0.72] text-[#1e2742] py-4 px-[18px] rounded-full text-left transition-all duration-[160ms] font-bold text-[1.02rem] hover:-translate-y-px"
            }
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-[14px] p-[18px] bg-[rgba(255,252,248,0.92)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px]">
        <p className="m-0 mb-2 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Cách chơi</p>
        <ul className="grid gap-[10px] m-0 pl-[18px] list-disc">
          <li className="text-base leading-[1.65]">Xem hình và video mẫu trước.</li>
          <li className="text-base leading-[1.65]">Học xong một từ thì luyện ngay.</li>
          <li className="text-base leading-[1.65]">Mỗi 5 từ sẽ có một bài kiểm tra nhỏ.</li>
        </ul>
      </div>
    </aside>
  );
}
