import { useState } from "react";
import { createChild, createStudent } from "../../api";

interface AccountTabProps {
  currentUser: any;
  displayNameInput: string;
  dobInput: string;
  phoneInput: string;
  schoolNameInput: string;
  contactNameInput: string;
  contactPhoneInput: string;
  profileSuccessMsg: string;
  profileErrorMsg: string;
  profileLoading: boolean;
  parentDashData: any;
  schoolDashData: any;
  onOpenAuth: () => void;
  onUpdateProfile: (e: React.FormEvent) => void;
  onSetDisplayNameInput: (value: string) => void;
  onSetDobInput: (value: string) => void;
  onSetPhoneInput: (value: string) => void;
  onSetSchoolNameInput: (value: string) => void;
  onSetContactNameInput: (value: string) => void;
  onSetContactPhoneInput: (value: string) => void;
  onReloadDashboard: () => void;
}

export function AccountTab({
  currentUser,
  displayNameInput,
  dobInput,
  phoneInput,
  schoolNameInput,
  contactNameInput,
  contactPhoneInput,
  profileSuccessMsg,
  profileErrorMsg,
  profileLoading,
  parentDashData,
  schoolDashData,
  onOpenAuth,
  onUpdateProfile,
  onSetDisplayNameInput,
  onSetDobInput,
  onSetPhoneInput,
  onSetSchoolNameInput,
  onSetContactNameInput,
  onSetContactPhoneInput,
  onReloadDashboard,
}: AccountTabProps) {
  // Local states for direct creation
  const [childUsername, setChildUsername] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [childDisplayName, setChildDisplayName] = useState("");
  const [childDob, setChildDob] = useState("");

  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentDisplayName, setStudentDisplayName] = useState("");
  const [studentClassName, setStudentClassName] = useState("");
  const [studentCode, setStudentCode] = useState("");

  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");
  const [createErrorMsg, setCreateErrorMsg] = useState("");

  if (!currentUser) {
    return (
      <section className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-7 text-center py-12">
        <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#ff9600] font-black">🔑 Yêu cầu đăng nhập</p>
        <h2 className="m-0 mt-1 font-black text-slate-800 text-xl">Đăng nhập để xem thông tin tài khoản</h2>
        <button
          onClick={onOpenAuth}
          type="button"
          className="px-5 py-2.5 bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px] transition-all text-sm mt-4"
        >
          Đăng nhập
        </button>
      </section>
    );
  }

  const role = currentUser.role;

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuccessMsg("");
    setCreateErrorMsg("");
    if (childUsername.length < 3) {
      setCreateErrorMsg("Tên đăng nhập phải từ 3 ký tự trở lên.");
      return;
    }
    if (childPassword.length < 6) {
      setCreateErrorMsg("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }
    setCreateLoading(true);
    try {
      await createChild({
        username: childUsername,
        password: childPassword,
        display_name: childDisplayName || undefined,
        dob: childDob || undefined
      });
      setCreateSuccessMsg(`Đã tạo tài khoản con "${childUsername}" và tự động kết nối thành công! 🎉`);
      setChildUsername("");
      setChildPassword("");
      setChildDisplayName("");
      setChildDob("");
      onReloadDashboard();
    } catch (err: any) {
      setCreateErrorMsg(err?.message || "Đã có lỗi xảy ra.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuccessMsg("");
    setCreateErrorMsg("");
    if (studentUsername.length < 3) {
      setCreateErrorMsg("Tên đăng nhập phải từ 3 ký tự trở lên.");
      return;
    }
    if (studentPassword.length < 6) {
      setCreateErrorMsg("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }
    setCreateLoading(true);
    try {
      await createStudent({
        username: studentUsername,
        password: studentPassword,
        display_name: studentDisplayName || undefined,
        class_name: studentClassName || undefined,
        student_code: studentCode || undefined
      });
      setCreateSuccessMsg(`Đã tạo tài khoản học sinh "${studentUsername}" và tự động kết nối thành công! 🎉`);
      setStudentUsername("");
      setStudentPassword("");
      setStudentDisplayName("");
      setStudentClassName("");
      setStudentCode("");
      onReloadDashboard();
    } catch (err: any) {
      setCreateErrorMsg(err?.message || "Đã có lỗi xảy ra.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6">
        <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#1cb0f6] font-black">Cài đặt tài khoản ⚙️</p>
        <h2 className="m-0 mt-1 font-black text-slate-800 text-xl">Thông tin cá nhân và quản lý tài khoản</h2>
        <p className="text-slate-500 mt-1 font-bold text-xs">Quản lý hồ sơ và tự tạo, quản lý tài khoản cho con/học sinh.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Form */}
        <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-5 space-y-4">
          <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2 m-0 select-none">
            👤 Thông tin hồ sơ
          </h3>

          <form onSubmit={onUpdateProfile} className="space-y-3">
            {role === "learner" && (
              <>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên hiển thị</span>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => onSetDisplayNameInput(e.target.value)}
                    placeholder="Nhập tên hiển thị"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Ngày sinh</span>
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => onSetDobInput(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
              </>
            )}

            {role === "parent" && (
              <>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Họ tên phụ huynh</span>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => onSetDisplayNameInput(e.target.value)}
                    placeholder="Nhập họ tên phụ huynh"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Số điện thoại</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => onSetPhoneInput(e.target.value)}
                    placeholder="Nhập số điện thoại liên hệ"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
              </>
            )}

            {role === "school" && (
              <>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên trường học</span>
                  <input
                    type="text"
                    required
                    value={schoolNameInput}
                    onChange={(e) => onSetSchoolNameInput(e.target.value)}
                    placeholder="Nhập tên trường học"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Người đại diện liên hệ</span>
                  <input
                    type="text"
                    value={contactNameInput}
                    onChange={(e) => onSetContactNameInput(e.target.value)}
                    placeholder="Họ tên người liên hệ"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Số điện thoại liên hệ</span>
                  <input
                    type="tel"
                    value={contactPhoneInput}
                    onChange={(e) => onSetContactPhoneInput(e.target.value)}
                    placeholder="Số điện thoại liên hệ"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
              </>
            )}

            {profileSuccessMsg && (
              <div className="bg-[#d7ffb8] border border-[#58cc02] text-[#58a700] px-3 py-2 rounded-xl text-xs font-black">
                {profileSuccessMsg}
              </div>
            )}
            {profileErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-black">
                {profileErrorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2.5 bg-[#1cb0f6] border-b-2 border-[#1899d6] hover:bg-[#24c4ff] disabled:bg-slate-100 text-white disabled:text-slate-400 font-black rounded-2xl cursor-pointer text-sm transition-all active:border-b-0 active:translate-y-[2px]"
            >
              {profileLoading ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
            </button>
          </form>
        </div>

        {/* Account Creation & Linking Section */}
        <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-5 space-y-4">
          {role === "learner" ? (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2.5 m-0 select-none">
                🔗 Tài khoản liên kết
              </h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                Tài khoản Cá nhân hoạt động độc lập và không cần liên kết với phụ huynh hay trường học.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-center space-y-1.5 border-2 border-slate-200">
                <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Tên tài khoản</div>
                <div className="text-lg font-black text-[#1cb0f6] font-mono">@{currentUser.username}</div>
              </div>
            </div>
          ) : role === "parent" ? (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2.5 flex items-center justify-between m-0 select-none">
                <span>👶 Tạo tài khoản cho con</span>
              </h3>

              <form onSubmit={handleCreateChild} className="space-y-3">
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên đăng nhập cho con *</span>
                  <input
                    type="text"
                    required
                    value={childUsername}
                    onChange={(e) => setChildUsername(e.target.value)}
                    placeholder="Ví dụ: conyeu123"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Mật khẩu cho con *</span>
                  <input
                    type="password"
                    required
                    value={childPassword}
                    onChange={(e) => setChildPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên hiển thị của con</span>
                  <input
                    type="text"
                    value={childDisplayName}
                    onChange={(e) => setChildDisplayName(e.target.value)}
                    placeholder="Ví dụ: Gia Bảo"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Ngày sinh của con</span>
                  <input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                {createSuccessMsg && (
                  <div className="bg-[#d7ffb8] border border-[#58cc02] text-[#58a700] px-3 py-2 rounded-xl text-xs font-black">
                    {createSuccessMsg}
                  </div>
                )}
                {createErrorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-black">
                    ⚠️ {createErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2.5 bg-[#58cc02] border-b-2 border-[#58a700] hover:bg-[#61e003] disabled:bg-slate-100 text-white disabled:text-slate-400 font-black rounded-2xl cursor-pointer text-sm transition-all active:border-b-0 active:translate-y-[2px]"
                >
                  {createLoading ? "Đang tạo tài khoản..." : "✨ Tạo tài khoản & Kết nối ngay"}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 px-1 select-none">
                  Đã kết nối ({parentDashData?.linked_learners?.length || 0})
                </h4>

                <div className="space-y-2">
                  {parentDashData?.linked_learners && parentDashData.linked_learners.length > 0 ? (
                    parentDashData.linked_learners.map((learner: any) => (
                      <div key={learner.learner_id} className="bg-slate-50 p-2.5 rounded-2xl flex items-center justify-between border-2 border-slate-200 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-50 border border-[#1cb0f6] text-[#1cb0f6] flex items-center justify-center font-black font-mono">
                            {learner.username[0].toUpperCase()}
                          </div>
                          <div>
                            <strong className="font-black text-slate-700">{learner.display_name || learner.username}</strong>
                            <span className="block text-[10px] text-slate-400 font-bold">@{learner.username}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-slate-700">🔥 {learner.learning_streak} ngày</span>
                          <span className="block text-[10px] text-[#1cb0f6] font-black">{learner.xp} XP</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-3 font-bold">Chưa tạo tài khoản con nào.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2.5 flex items-center justify-between m-0 select-none">
                <span>🏫 Tạo tài khoản học sinh</span>
              </h3>

              <form onSubmit={handleCreateStudent} className="space-y-3">
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên đăng nhập học sinh *</span>
                  <input
                    type="text"
                    required
                    value={studentUsername}
                    onChange={(e) => setStudentUsername(e.target.value)}
                    placeholder="Ví dụ: hs_nguyenvanA"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Mật khẩu học sinh *</span>
                  <input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên hiển thị học sinh</span>
                  <input
                    type="text"
                    value={studentDisplayName}
                    onChange={(e) => setStudentDisplayName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Lớp học</span>
                    <input
                      type="text"
                      value={studentClassName}
                      onChange={(e) => setStudentClassName(e.target.value)}
                      placeholder="Ví dụ: 3A"
                      className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Mã học sinh</span>
                    <input
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="Ví dụ: HS001"
                      className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                    />
                  </label>
                </div>

                {createSuccessMsg && (
                  <div className="bg-[#d7ffb8] border border-[#58cc02] text-[#58a700] px-3 py-2 rounded-xl text-xs font-black">
                    {createSuccessMsg}
                  </div>
                )}
                {createErrorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-black">
                    ⚠️ {createErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2.5 bg-[#58cc02] border-b-2 border-[#58a700] hover:bg-[#61e003] disabled:bg-slate-100 text-white disabled:text-slate-400 font-black rounded-2xl cursor-pointer text-sm transition-all active:border-b-0 active:translate-y-[2px]"
                >
                  {createLoading ? "Đang tạo tài khoản..." : "✨ Tạo tài khoản & Kết nối ngay"}
                </button>
              </form>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 px-1 select-none">
                  Đã kết nối ({schoolDashData?.linked_learners?.length || 0})
                </h4>

                <div className="space-y-2">
                  {schoolDashData?.linked_learners && schoolDashData.linked_learners.length > 0 ? (
                    schoolDashData.linked_learners.map((student: any) => (
                      <div key={student.learner_id} className="bg-slate-50 p-2.5 rounded-2xl flex items-center justify-between border-2 border-slate-200 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sky-50 border border-[#1cb0f6] text-[#1cb0f6] flex items-center justify-center font-black font-mono">
                            {student.username[0].toUpperCase()}
                          </div>
                          <div>
                            <strong className="font-black text-slate-700">{student.display_name || student.username}</strong>
                            <span className="block text-[10px] text-slate-400 font-bold">@{student.username} • Lớp {student.class_name || "--"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-slate-700">Mã: {student.student_code}</span>
                          <span className="block text-[10px] text-[#1cb0f6] font-black">{student.xp} XP</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-3 font-bold">Chưa tạo tài khoản học sinh nào.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
