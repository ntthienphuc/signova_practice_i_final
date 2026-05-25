import { DashboardPlaceholder } from "../../components/DashboardPlaceholder";
import { AIRecommendationBox } from "../../components/AIRecommendationBox";
import { useAuth } from "../../contexts/AuthContext";

interface SchoolTabProps {
  loadingDash: boolean;
  schoolDashData: any;
  loadingAI: boolean;
  onRefreshAI: () => Promise<void>;
}

export function SchoolTab({ loadingDash, schoolDashData, loadingAI, onRefreshAI }: SchoolTabProps) {
  const { currentUser } = useAuth();
  if (currentUser?.role !== "school") {
    return (
      <DashboardPlaceholder
        title="Dashboard Trường học"
        description="Phần dashboard dành riêng cho giáo viên/nhà trường. Vui lòng đăng nhập bằng tài khoản Trường học."
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="bg-white border-2 border-b-5 border-slate-200 rounded-[32px] p-7">
        <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#1cb0f6] font-black">Dashboard Nhà Trường 🏫</p>
        <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">Quản lý lớp học & học sinh</h2>
        <p className="text-slate-500 mt-2 font-bold text-sm">Thống kê điểm số và quá trình hoàn thành bài học của toàn bộ học sinh được liên kết.</p>
      </div>

      {/* AI Mascot Recommendations */}
      {!loadingDash && schoolDashData?.ai_recommendation && (
        <AIRecommendationBox
          aiRecommendation={schoolDashData.ai_recommendation}
          onRefresh={onRefreshAI}
          loading={loadingAI}
          role="school"
        />
      )}

      {loadingDash ? (
        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[32px] p-6 text-center text-slate-400 font-bold">Đang tải danh sách học sinh...</div>
      ) : !schoolDashData || !schoolDashData.linked_learners || schoolDashData.linked_learners.length === 0 ? (
        <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[32px] p-8 text-center text-slate-450 font-bold">
          Chưa có học sinh nào được liên kết với trường học.
        </div>
      ) : (
        <div className="bg-white border-2 border-b-5 border-slate-200 rounded-[32px] overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-bold text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-450 font-black text-[10px] uppercase tracking-wider">
                  <th className="p-4">Học sinh</th>
                  <th className="p-4">Lớp</th>
                  <th className="p-4">Mã số</th>
                  <th className="p-4">Chuỗi học</th>
                  <th className="p-4">Tổng XP</th>
                  <th className="p-4">Độ hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolDashData.linked_learners.map((student: any) => {
                  const doneTopicsCount = student.topic_progress
                    ? student.topic_progress.filter((tp: any) => tp.completed).length
                    : 0;
                  return (
                    <tr key={student.learner_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-black text-slate-800">@{student.username}</td>
                      <td className="p-4 text-slate-600">{student.class_name || "--"}</td>
                      <td className="p-4 text-slate-500 font-mono font-black">{student.student_code || "--"}</td>
                      <td className="p-4 text-slate-800">🔥 {student.learning_streak} ngày</td>
                      <td className="p-4 text-[#1cb0f6] font-black">{student.xp} XP</td>
                      <td className="p-4">
                        <span className="bg-[#dff3ff] border border-[#1cb0f6] text-[#1cb0f6] px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider animate-pulse-subtle">
                          Xong {doneTopicsCount}/2 Topic
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
