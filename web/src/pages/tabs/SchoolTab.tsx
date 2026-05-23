import { DashboardPlaceholder } from "../../components/DashboardPlaceholder";

interface SchoolTabProps {
  currentUser: any;
  loadingDash: boolean;
  schoolDashData: any;
}

export function SchoolTab({ currentUser, loadingDash, schoolDashData }: SchoolTabProps) {
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
      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-indigo-600 font-bold">Dashboard Nhà Trường</p>
        <h2>Quản lý lớp học & học sinh</h2>
        <p className="text-[var(--ink-soft)] leading-[1.62]">Thống kê điểm số và quá trình hoàn thành bài học của toàn bộ học sinh được liên kết.</p>
      </div>

      {loadingDash ? (
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 text-center">Đang tải danh sách học sinh...</div>
      ) : !schoolDashData || !schoolDashData.linked_learners || schoolDashData.linked_learners.length === 0 ? (
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-8 text-center text-slate-500 font-medium">
          Chưa có học sinh nào được liên kết với trường học.
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] overflow-x-auto p-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3">Học sinh</th>
                <th className="p-3">Lớp</th>
                <th className="p-3">Mã số</th>
                <th className="p-3">Chuỗi học</th>
                <th className="p-3">Tổng XP</th>
                <th className="p-3">Độ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schoolDashData.linked_learners.map((student: any) => {
                const doneTopicsCount = student.topic_progress
                  ? student.topic_progress.filter((tp: any) => tp.completed).length
                  : 0;
                return (
                  <tr key={student.learner_id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-700">{student.username}</td>
                    <td className="p-3 text-slate-600">{student.class_name || "--"}</td>
                    <td className="p-3 text-slate-600 font-mono">{student.student_code || "--"}</td>
                    <td className="p-3 text-slate-700">🔥 {student.learning_streak} ngày</td>
                    <td className="p-3 text-indigo-600 font-bold">{student.xp} XP</td>
                    <td className="p-3">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                        Xong {doneTopicsCount}/2 Topic
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
