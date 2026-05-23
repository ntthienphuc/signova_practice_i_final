import type { Topic } from "../../types/learn";

const DEFAULT_BADGES = [
  { code: "first_attempt", name: "Khởi đầu mới", description: "Thực hiện lượt luyện tập đầu tiên.", icon: "🚀" },
  { code: "first_correct_word", name: "Đúng chuẩn", description: "Đạt trạng thái Đạt (Accepted) cho một từ.", icon: "✅" },
  { code: "five_words_done", name: "Chăm chỉ", description: "Học xong 5 từ vựng.", icon: "📚" },
  { code: "checkpoint_clear", name: "Vượt ải", description: "Vượt qua bài checkpoint kiểm tra 5 từ.", icon: "🏁" },
  { code: "topic_finisher", name: "Làm chủ chủ đề", description: "Hoàn thành tất cả các từ trong chủ đề.", icon: "👑" },
  { code: "three_day_streak", name: "Kiên trì", description: "Duy trì chuỗi học tập 3 ngày liên tục.", icon: "🔥" },
  { code: "practice_master_80", name: "Cao thủ 80+", description: "Đạt điểm số 80 trở lên trong một lần tập.", icon: "🎖️" },
  { code: "practice_master_90", name: "Đỉnh cao 90+", description: "Đạt điểm số 90 trở lên trong một lần tập.", icon: "🏆" },
];

interface ProgressTabProps {
  currentUser: any;
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

function LearnerProgressDetails({ data, topics }: { data: any; topics: Topic[] }) {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Chuỗi liên tục</span>
            <strong className="block text-3xl font-black text-amber-700 mt-1">{activeStreak} ngày</strong>
          </div>
          <div className="text-4xl">🔥</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-100 rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tổng điểm kinh nghiệm</span>
            <strong className="block text-3xl font-black text-indigo-700 mt-1">{currentXp} XP</strong>
          </div>
          <div className="text-4xl">⭐</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Từ vựng đã học</span>
            <strong className="block text-3xl font-black text-emerald-700 mt-1">{totalStudiedWords} từ</strong>
          </div>
          <div className="text-4xl">📖</div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          🏅 Bộ sưu tập Huy hiệu
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {DEFAULT_BADGES.map((badge) => {
            const isUnlocked = earnedBadges.some((eb: any) => eb.code === badge.code);
            return (
              <div
                key={badge.code}
                className={`p-4 rounded-2xl border text-center flex flex-col justify-between items-center transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-amber-50/60 to-orange-50/30 border-amber-200 shadow-md shadow-amber-50/30 scale-100"
                    : "bg-slate-50/50 border-slate-100 opacity-60 filter grayscale"
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner mb-3 ${
                  isUnlocked ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                }`}>
                  {badge.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs leading-snug">{badge.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">{badge.description}</p>
                </div>
                <span className={`mt-3 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                  isUnlocked ? "bg-amber-100 text-amber-800" : "bg-slate-150 text-slate-500"
                }`}>
                  {isUnlocked ? "Đã Đạt" : "Chưa Đạt"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            📚 Tiến trình các Chủ đề
          </h3>
          <div className="space-y-4">
            {mergedProgress.map((tp) => {
              const percent = Math.round((tp.completedWords / 10) * 100);
              return (
                <div key={tp.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="font-semibold text-slate-800">{tp.title}</strong>
                    <span className="font-semibold text-indigo-700">{tp.completedWords}/10 từ ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-sky-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-2.5 mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    <span className={`flex items-center gap-1 ${tp.checkpoint5_passed ? "text-emerald-600" : "text-slate-350"}`}>
                      {tp.checkpoint5_passed ? "✅ Checkpoint 5" : "⚪ Checkpoint 5"}
                    </span>
                    <span className={`flex items-center gap-1 ${tp.practice2_final_passed ? "text-emerald-600" : "text-slate-350"}`}>
                      {tp.practice2_final_passed ? "✅ Practice II" : "⚪ Practice II"}
                    </span>
                    <span className={`flex items-center gap-1 ${tp.completed ? "text-emerald-600" : "text-slate-350"}`}>
                      {tp.completed ? "✅ Đã xong" : "⚪ Đang học"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
            ⚡ Lịch sử luyện tập gần đây
          </h3>
          <div className="space-y-3">
            {recentAttempts.length > 0 ? (
              recentAttempts.map((att: any) => {
                const date = new Date(att.created_at).toLocaleDateString("vi-VN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div key={att.id} className="bg-slate-50/60 hover:bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                          att.practice_mode === "practice_i"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-sky-100 text-sky-850"
                        }`}>
                          {att.practice_mode === "practice_i" ? "Luyện từ" : "Kiểm tra"}
                        </span>
                        <strong className="text-slate-800 font-semibold">{att.target_gloss}</strong>
                      </div>
                      <span className="block text-[10px] text-slate-400">{date}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-slate-700">{Math.round(att.score)} điểm</div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        att.accepted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-850"
                      }`}>
                        {att.accepted ? "Đạt" : "Cần ôn tập"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">Chưa có bài làm nào gần đây. Hãy bắt đầu luyện tập!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProgressTab({
  currentUser,
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
  if (!currentUser) {
    return (
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7 text-center py-12">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">🔑 Yêu cầu đăng nhập</p>
        <h2>Hãy đăng nhập để theo dõi tiến độ</h2>
        <button onClick={onOpenAuth} type="button" className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer mt-4">
          Đăng nhập / Đăng ký
        </button>
      </section>
    );
  }

  const role = currentUser.role;

  if (role === "parent") {
    const kids = parentDashData?.linked_learners || [];
    return (
      <section className="space-y-6">
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-indigo-600 font-bold">Tiến độ của con</p>
          <h2>Theo dõi chi tiết kết quả học tập của các con</h2>
          <p className="text-[var(--ink-soft)] leading-[1.62]">Xem chuỗi ngày học, huy hiệu đạt được và lịch sử làm bài chi tiết.</p>
        </div>

        {kids.length === 0 ? (
          <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-8 text-center text-slate-500 font-medium">
            Chưa có tài khoản con nào được liên kết. Vui lòng vào tab <strong>Tài khoản</strong> để thêm con.
          </div>
        ) : (
          <div className="space-y-6">
            <label className="grid gap-2 my-[18px] max-w-xs">
              <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Chọn con để xem tiến độ</span>
              <select
                value={selectedChildId}
                onChange={(e) => onSetSelectedChildId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
              >
                {kids.map((kid: any) => (
                  <option key={kid.learner_id} value={kid.learner_id}>
                    {kid.display_name || kid.username} ({kid.username})
                  </option>
                ))}
              </select>
            </label>

            {loadingChildProgress ? (
              <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 text-center text-slate-500">Đang tải dữ liệu tiến độ của con...</div>
            ) : selectedChildProgress ? (
              <LearnerProgressDetails data={selectedChildProgress} topics={topics} />
            ) : (
              <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 text-center text-slate-500">Vui lòng chọn một người con.</div>
            )}
          </div>
        )}
      </section>
    );
  }

  if (role === "learner") {
    return (
      <section className="space-y-6">
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-indigo-600 font-bold">Tiến độ cá nhân</p>
          <h2>Thành tích học tập của bạn</h2>
          <p className="text-[var(--ink-soft)] leading-[1.62]">Duy trì ngọn lửa học tập hàng ngày để tích lũy XP và mở khóa huy hiệu quý giá.</p>
        </div>

        {loadingProgress ? (
          <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 text-center text-slate-500 font-medium">Đang tải dữ liệu thành tích...</div>
        ) : progressError ? (
          <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 text-center text-rose-600 font-medium">Lỗi: {progressError}</div>
        ) : learnerDashData ? (
          <>
            {((pendingLinks.parent_links && pendingLinks.parent_links.length > 0) ||
              (pendingLinks.school_links && pendingLinks.school_links.length > 0)) && (
              <div className="bg-amber-50/40 border border-amber-200 rounded-2xl shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-5 space-y-3">
                <h4 className="text-amber-800 font-bold text-sm flex items-center gap-1.5">
                  ⚠️ Có yêu cầu kết nối tài khoản mới!
                </h4>
                <div className="divide-y divide-amber-100">
                  {pendingLinks.parent_links.map((pl: any) => (
                    <div key={pl.id} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-700">
                        Phụ huynh <strong>{pl.parent_display_name}</strong> muốn liên kết để theo dõi tiến trình của bạn.
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveLink("parent", pl.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                        >
                          Đồng ý
                        </button>
                        <button
                          onClick={() => onRejectLink("parent", pl.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingLinks.school_links.map((sl: any) => (
                    <div key={sl.id} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-700">
                        Trường học <strong>{sl.school_name}</strong> muốn liên kết (Lớp: <strong>{sl.class_name}</strong>, MSSV: <strong>{sl.student_code}</strong>).
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onApproveLink("school", sl.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                        >
                          Đồng ý
                        </button>
                        <button
                          onClick={() => onRejectLink("school", sl.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 border-0 rounded-lg cursor-pointer text-[10px]"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <LearnerProgressDetails data={learnerDashData} topics={topics} />
          </>
        ) : (
          <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 text-center text-slate-500 font-medium">Không thể lấy dữ liệu tiến độ.</div>
        )}
      </section>
    );
  }

  return null;
}
