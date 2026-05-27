import { useState, useEffect } from "react";
import type { Topic } from "../../types/learn";
import { useAuth } from "../../contexts/AuthContext";
import { mascots } from "../../utils/mascot";
import { getMascotShop, getMascotConfig } from "../../api";
import type { MascotItem, MascotConfig } from "../../api";
import { getMascotAssetUrl } from "../../utils/mascotAssets";
import { SpotlightTour } from "../../components/SpotlightTour";

const DEFAULT_BADGES = [
  { code: "first_attempt", name: "Khởi đầu mới", description: "Lượt luyện tập đầu tiên.", icon: "🚀" },
  { code: "first_correct_word", name: "Đúng chuẩn", description: "Đạt chuẩn một từ vựng.", icon: "✅" },
  { code: "five_words_done", name: "Chăm chỉ", description: "Đã học xong 5 từ vựng.", icon: "📚" },
  { code: "checkpoint_clear", name: "Vượt ải", description: "Vượt checkpoint 5 từ.", icon: "🏁" },
  { code: "topic_finisher", name: "Làm chủ", description: "Hoàn thành một chủ đề.", icon: "👑" },
  { code: "three_day_streak", name: "Kiên trì", description: "Học liên tục 3 ngày.", icon: "🔥" },
  { code: "practice_master_80", name: "Cao thủ 80+", description: "Đạt 80 điểm trở lên.", icon: "🎖️" },
  { code: "practice_master_90", name: "Đỉnh cao 90+", description: "Đạt 90 điểm trở lên.", icon: "🏆" },
];

interface ProgressTabProps {
  topics: Topic[];
  parentDashData: any;
  loadingProgress: boolean;
  progressError: string;
  learnerDashData: any;
  pendingLinks: any;
  selectedChildId: string;
  selectedChildProgress: any;
  loadingChildProgress: boolean;
  onOpenAuth: () => void;
  onSetSelectedChildId: (id: string) => void;
  onApproveLink: (type: "parent" | "school", id: string) => void;
  onRejectLink: (type: "parent" | "school", id: string) => void;
}

export function LearnerProgressDetails({ data, topics }: { data: any; topics: Topic[] }) {
  const activeStreak = data.learning_streak || 0;
  const currentXp = data.xp || 0;
  const progressList = data.topic_progress || [];
  const earnedBadges = data.badges || [];
  const recentAttempts = data.recent_attempts || [];

  const mergedProgress = topics.map((topic) => {
    const prog = progressList.find((tp: any) => tp.topic_id === topic.id);
    return {
      id: topic.id,
      title: topic.title,
      completedWords: prog ? prog.completed_words : 0,
      completed: prog ? prog.completed : false,
      checkpoint5_passed: prog ? prog.checkpoint5_passed : false,
      practice2_final_passed: prog ? prog.practice2_final_passed : false,
    };
  });

  const totalStudiedWords = progressList.reduce((acc: number, cur: any) => acc + (cur.completed_words || 0), 0);

  return (
    <div className="space-y-5">
      {/* Big stat cards */}
      <div data-tour="progress-stats" className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#fff8ee] border-2 border-b-4 border-[#ff9600]/40 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl select-none mb-1 sm:mb-2">🔥</div>
          <strong className="block text-3xl sm:text-5xl font-black text-[#ff9600] leading-none">{activeStreak}</strong>
          <span className="block text-[11px] sm:text-sm font-black text-[#cc7a00] mt-1">Ngày liên tục</span>
        </div>
        <div className="bg-[#f0f8ff] border-2 border-b-4 border-[#1cb0f6]/40 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl select-none mb-1 sm:mb-2">⭐</div>
          <strong className="block text-3xl sm:text-5xl font-black text-[#1cb0f6] leading-none">{currentXp}</strong>
          <span className="block text-[11px] sm:text-sm font-black text-[#1899d6] mt-1">Kiến thức XP</span>
        </div>
        <div className="bg-[#f0fff4] border-2 border-b-4 border-[#58cc02]/40 rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl select-none mb-1 sm:mb-2">📖</div>
          <strong className="block text-3xl sm:text-5xl font-black text-[#58cc02] leading-none">{totalStudiedWords}</strong>
          <span className="block text-[11px] sm:text-sm font-black text-[#46a302] mt-1">Từ đã học</span>
        </div>
      </div>

      {/* Badges */}
      <div data-tour="progress-badges" className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-5 space-y-4">
        <h3 className="text-xl font-black text-slate-800 border-b-2 border-slate-100 pb-3 flex items-center gap-2 m-0 select-none">
          🏅 Huy hiệu
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {DEFAULT_BADGES.map((badge) => {
            const isUnlocked = earnedBadges.some((eb: any) => eb.code === badge.code);
            return (
              <div
                key={badge.code}
                className={`p-3 sm:p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-1.5 sm:gap-2 ${
                  isUnlocked
                    ? "bg-white border-b-4 border-[#1cb0f6]/40 border-x-slate-200 border-t-slate-200"
                    : "bg-slate-50 border-slate-200 opacity-40 grayscale"
                }`}
              >
                <div className="text-2xl sm:text-3xl select-none">{badge.icon}</div>
                <div>
                  <h4 className="font-black text-slate-800 text-xs sm:text-sm leading-snug m-0">{badge.name}</h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 leading-tight m-0 hidden sm:block">{badge.description}</p>
                </div>
                <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-black rounded-full uppercase tracking-wider ${
                  isUnlocked ? "bg-[#1cb0f6] text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  {isUnlocked ? "✓ Đạt" : "Chưa"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic progress + History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-5 space-y-4">
          <h3 className="text-xl font-black text-slate-800 border-b-2 border-slate-100 pb-3 m-0 select-none">
            📚 Tiến trình Chủ đề
          </h3>
          <div className="space-y-5">
            {mergedProgress.map((tp) => {
              const percent = Math.round((tp.completedWords / 10) * 100);
              return (
                <div key={tp.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <strong className="font-black text-slate-800 text-base">{tp.title}</strong>
                    <span className="font-black text-[#1cb0f6] text-base">{tp.completedWords}/10</span>
                  </div>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-4 p-0.5">
                    <div
                      className="bg-[#1cb0f6] h-full rounded-full transition-all duration-500 relative"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border-2 ${tp.checkpoint5_passed ? "bg-[#1cb0f6] text-white border-[#1899d6]" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                      {tp.checkpoint5_passed ? "✓" : "○"} Điểm giữa
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border-2 ${tp.completed ? "bg-[#58cc02] text-white border-[#46a302]" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                      {tp.completed ? "✓" : "○"} Hoàn thành
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-5 space-y-4">
          <h3 className="text-xl font-black text-slate-800 border-b-2 border-slate-100 pb-3 m-0 select-none">
            ⚡ Lịch sử gần đây
          </h3>
          <div className="space-y-2">
            {recentAttempts.length > 0 ? (
              recentAttempts.map((att: any) => {
                const date = new Date(att.created_at).toLocaleDateString("vi-VN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={att.id} className="bg-slate-50 hover:bg-slate-100/80 px-4 py-3 rounded-2xl border-2 border-slate-100 flex items-center justify-between transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base font-black text-slate-800">{att.target_gloss}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide ${
                          att.practice_mode === "practice_i" ? "bg-sky-100 text-[#1cb0f6]" : "bg-indigo-100 text-indigo-600"
                        }`}>
                          {att.practice_mode === "practice_i" ? "Luyện từ" : "Kiểm tra"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold">{date}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-700">{Math.round(att.score)}đ</div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        att.accepted ? "bg-[#f0fff4] text-[#58cc02]" : "bg-[#fff8ee] text-[#ff9600]"
                      }`}>
                        {att.accepted ? "✓ Đạt" : "Cần ôn"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-400 font-black text-center py-8">Chưa có bài làm nào 😊</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgressTab({
  topics,
  parentDashData,
  loadingProgress,
  progressError,
  learnerDashData,
  pendingLinks,
  selectedChildId,
  selectedChildProgress,
  loadingChildProgress,
  onOpenAuth,
  onSetSelectedChildId,
  onApproveLink,
  onRejectLink,
}: ProgressTabProps) {
  const { currentUser } = useAuth();

  const [shopItems, setShopItems] = useState<MascotItem[]>([]);
  const [mascotConfig, setMascotConfig] = useState<MascotConfig | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("tour_progress_tab_v1")) setTourOpen(true);
  }, []);

  const handleCloseTour = () => {
    localStorage.setItem("tour_progress_tab_v1", "1");
    setTourOpen(false);
  };

  const PROGRESS_TOUR_STEPS = [
    {
      selector: '[data-tour="progress-stats"]',
      title: "Streak, XP và từ đã học",
      body: "Học mỗi ngày để duy trì streak và tích lũy XP sau mỗi lần luyện tập.",
      padding: 12,
    },
    {
      selector: '[data-tour="progress-badges"]',
      title: "Huy hiệu thành tích",
      body: "Hoàn thành các mục tiêu học tập để mở khóa huy hiệu. Huy hiệu mờ nghĩa là chưa đạt.",
      padding: 12,
    },
  ];

  useEffect(() => {
    if (currentUser?.role !== "learner") return;
    Promise.all([getMascotShop(), getMascotConfig()]).then(([shop, cfg]) => {
      setShopItems(shop.items);
      setMascotConfig(cfg);
    }).catch(() => {});
  }, [currentUser?.role]);

  if (!currentUser) {
    return (
      <section className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-8 text-center py-16">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="m-0 font-black text-slate-800 text-2xl">Đăng nhập để xem tiến độ</h2>
        <p className="text-slate-500 font-bold mt-2 max-w-xs mx-auto text-sm">Theo dõi hành trình học tập và các huy hiệu đạt được của bạn!</p>
        <button
          onClick={onOpenAuth}
          type="button"
          className="px-6 py-3 bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[3px] transition-all text-base mt-6"
        >
          Đăng nhập ngay 🚀
        </button>
      </section>
    );
  }

  const role = currentUser.role;

  if (role === "parent") {
    const kids = parentDashData?.linked_learners || [];
    return (
      <section className="space-y-6">
        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-6">
          <p className="m-0 text-sm uppercase tracking-[0.18em] text-[#1cb0f6] font-black">📈 Tiến độ của con</p>
          <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">Kết quả học tập của con</h2>
          <p className="text-slate-500 mt-1 font-bold text-sm">Xem chuỗi ngày học, huy hiệu và lịch sử làm bài của con.</p>
        </div>

        {kids.length === 0 ? (
          <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-8 text-center text-slate-400 font-bold">
            Chưa có tài khoản con nào được liên kết. Vui lòng vào tab <strong>Tài khoản</strong> để thêm con.
          </div>
        ) : (
          <div className="space-y-6">
            <label className="grid gap-1.5 max-w-xs">
              <span className="text-[0.76rem] uppercase tracking-wider text-slate-450 font-black">Chọn con xem tiến độ</span>
              <select
                value={selectedChildId}
                onChange={(e) => onSetSelectedChildId(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-[#1cb0f6] font-bold text-slate-700"
              >
                {kids.map((kid: any) => (
                  <option key={kid.learner_id} value={kid.learner_id}>
                    {kid.display_name || kid.username}
                  </option>
                ))}
              </select>
            </label>

            {loadingChildProgress ? (
              <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6 text-center text-slate-400 font-bold">Đang tải tiến độ...</div>
            ) : selectedChildProgress ? (
              <LearnerProgressDetails data={selectedChildProgress} topics={topics} />
            ) : (
              <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6 text-center text-slate-400 font-bold">Hãy chọn một người con.</div>
            )}
          </div>
        )}
      </section>
    );
  }

  if (role === "learner") {
    const activeItem = shopItems.find(i => i.item_key === mascotConfig?.active_item_key);
    const mascotImageUrl = activeItem ? getMascotAssetUrl(activeItem.mascot_filename) : undefined;

    return (
      <section className="space-y-6">
        <SpotlightTour steps={PROGRESS_TOUR_STEPS} isOpen={tourOpen} onClose={handleCloseTour} />
        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <p className="m-0 text-sm uppercase tracking-[0.18em] text-[#1cb0f6] font-black">⚡ Tiến độ của bạn</p>
              <button
                type="button"
                onClick={() => setTourOpen(true)}
                className="flex items-center gap-1 text-xs font-black text-slate-400 hover:text-[#1cb0f6] transition-colors cursor-pointer select-none group"
              >
                <span className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-[#1cb0f6] flex items-center justify-center text-[10px] font-black transition-colors">?</span>
                Hướng dẫn
              </button>
            </div>
            <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">Thành tích học tập 🏆</h2>
            <p className="text-slate-500 mt-1 font-bold text-sm">Học mỗi ngày để giữ chuỗi liên tục và mở khóa huy hiệu!</p>
          </div>
          <img
            src={mascotImageUrl ?? mascots[9]}
            alt="Progress Mascot"
            className="w-16 h-16 object-contain animate-bounce-subtle flex-shrink-0"
            style={{
              animationDuration: '5s',
            }}
          />
        </div>

        {loadingProgress ? (
          <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6 text-center text-slate-400 font-bold">Đang tải thành tích...</div>
        ) : progressError ? (
          <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6 text-center text-rose-600 font-bold">Lỗi: {progressError}</div>
        ) : learnerDashData ? (
          <LearnerProgressDetails data={learnerDashData} topics={topics} />
        ) : (
          <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6 text-center text-slate-400 font-bold">Không thể lấy dữ liệu tiến độ.</div>
        )}
      </section>
    );
  }

  return null;
}
