import { DashboardPlaceholder } from "../../components/DashboardPlaceholder";

interface FamilyTabProps {
  currentUser: any;
  loadingDash: boolean;
  parentDashData: any;
}

export function FamilyTab({ currentUser, loadingDash, parentDashData }: FamilyTabProps) {
  if (currentUser?.role !== "parent") {
    return (
      <DashboardPlaceholder
        title="Dashboard Gia đình"
        description="Phần dashboard dành riêng cho phụ huynh. Vui lòng đăng nhập bằng tài khoản Phụ huynh."
      />
    );
  }

  return (
    <section className="family-dashboard space-y-6">
      <div className="hero-panel card-surface">
        <p className="eyebrow text-indigo-600 font-bold">Dashboard Phụ Huynh</p>
        <h2>Theo dõi tiến độ học của con</h2>
        <p className="muted">Dữ liệu được đồng bộ trực tiếp từ các buổi tập và bài kiểm tra của con.</p>
      </div>

      {loadingDash ? (
        <div className="card-surface p-6 text-center">Đang tải dữ liệu học tập...</div>
      ) : !parentDashData || !parentDashData.linked_learners || parentDashData.linked_learners.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-500 font-medium">
          Chưa có tài khoản học sinh nào được liên kết. Hãy vào trang liên kết trong tài khoản của con để kết nối.
        </div>
      ) : (
        <div className="space-y-6">
          {parentDashData.linked_learners.map((learner: any) => (
            <div key={learner.learner_id} className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {learner.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{learner.username}</h3>
                    <span className="text-xs text-slate-500">Học sinh</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div>🔥 Chuỗi học: <strong>{learner.learning_streak} ngày</strong></div>
                  <div className="mt-0.5">⭐ Tổng điểm XP: <strong>{learner.xp}</strong></div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Độ hoàn thành Topic</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {learner.topic_progress && learner.topic_progress.length > 0 ? (
                    learner.topic_progress.map((tp: any) => (
                      <div key={tp.topic_id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700">
                            {tp.topic_id === "topic_1" ? "Chủ đề 1" : "Chủ đề 2"}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">Đã học: {tp.completed_words}/10 từ</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tp.completed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {tp.completed ? "Hoàn thành" : "Đang học"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 col-span-2">Chưa bắt đầu học topic nào.</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hoạt động luyện tập gần đây</h4>
                <div className="space-y-2">
                  {learner.recent_attempts && learner.recent_attempts.length > 0 ? (
                    learner.recent_attempts.map((att: any) => (
                      <div key={att.id} className="bg-slate-50 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${att.practice_mode === "practice_i" ? "bg-indigo-100 text-indigo-800" : "bg-sky-100 text-sky-800"}`}>
                            {att.practice_mode === "practice_i" ? "Luyện từ" : "Kiểm tra"}
                          </span>
                          <span className="font-semibold text-slate-700">{att.target_gloss}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>Điểm số: <strong>{Math.round(att.score)}đ</strong></span>
                          <span className={att.accepted ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                            {att.accepted ? "Đạt" : "Cần tập lại"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">Chưa ghi nhận hoạt động luyện tập nào.</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
