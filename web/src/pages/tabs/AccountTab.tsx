import { useState, useEffect } from "react";
import { createChild, createStudent, updateProfile } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { mascots } from "../../utils/mascot";

interface AccountTabProps {
  parentDashData: any;
  schoolDashData: any;
  onOpenAuth: () => void;
  onReloadDashboard: () => void;
}

export function AccountTab({
  parentDashData,
  schoolDashData,
  onOpenAuth,
  onReloadDashboard,
}: AccountTabProps) {
  const { currentUser, refreshUser } = useAuth();

  const [displayNameInput, setDisplayNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactPhoneInput, setContactPhoneInput] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "learner" && currentUser.learner_profile) {
      setDisplayNameInput(currentUser.learner_profile.display_name || "");
      setDobInput(currentUser.learner_profile.dob || "");
    } else if (currentUser.role === "parent" && currentUser.parent_profile) {
      setDisplayNameInput(currentUser.parent_profile.display_name || "");
      setPhoneInput(currentUser.parent_profile.phone || "");
    } else if (currentUser.role === "school" && currentUser.school_profile) {
      setSchoolNameInput(currentUser.school_profile.school_name || "");
      setContactNameInput(currentUser.school_profile.contact_name || "");
      setContactPhoneInput(currentUser.school_profile.contact_phone || "");
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileSuccessMsg("");
    setProfileErrorMsg("");
    setProfileLoading(true);
    try {
      const payload: any = {};
      if (currentUser.role === "learner") {
        payload.display_name = displayNameInput;
        payload.dob = dobInput || null;
      } else if (currentUser.role === "parent") {
        payload.display_name = displayNameInput;
        payload.phone = phoneInput || null;
      } else if (currentUser.role === "school") {
        payload.school_name = schoolNameInput;
        payload.contact_name = contactNameInput || null;
        payload.contact_phone = contactPhoneInput || null;
      }
      await updateProfile(payload);
      setProfileSuccessMsg("Cập nhật thông tin tài khoản thành công!");
      await refreshUser();
    } catch (err: any) {
      setProfileErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setProfileLoading(false);
    }
  };

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
    <section className="space-y-5 sm:space-y-6 max-w-full overflow-hidden">
      <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="space-y-1 text-center sm:text-left min-w-0">
          <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#1cb0f6] font-black">Cài đặt tài khoản ⚙️</p>
          <h2 className="m-0 mt-1 font-black text-slate-800 text-lg sm:text-xl leading-tight">Thông tin cá nhân & Quản lý</h2>
          <p className="text-slate-500 font-bold text-xs sm:text-sm m-0 leading-relaxed">Quản lý hồ sơ và tự tạo, liên kết tài khoản cho con hoặc học sinh của bạn.</p>
        </div>
        <img 
          src={mascots[1]} 
          alt="Settings Mascot" 
          className="w-16 h-16 object-contain animate-bounce-subtle flex-shrink-0" 
          style={{ 
            animationDuration: '5s',
            filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08))"
          }} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Form */}
        <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-4 min-w-0">
          <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-2.5 flex items-center gap-2 m-0 select-none">
            👤 Thông tin hồ sơ
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            {role === "learner" && (
              <>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Tên hiển thị</span>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Nhập tên hiển thị"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Ngày sinh</span>
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
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
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Nhập họ tên phụ huynh"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Số điện thoại</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
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
                    onChange={(e) => setSchoolNameInput(e.target.value)}
                    placeholder="Nhập tên trường học"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Người đại diện liên hệ</span>
                  <input
                    type="text"
                    value={contactNameInput}
                    onChange={(e) => setContactNameInput(e.target.value)}
                    placeholder="Họ tên người liên hệ"
                    className="w-full border-2 border-slate-200 focus:border-[#1cb0f6] focus:outline-none rounded-xl px-4 py-2.5 bg-white text-[var(--ink)] text-sm font-bold transition-all"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase font-black text-slate-450 tracking-wider">Số điện thoại liên hệ</span>
                  <input
                    type="tel"
                    value={contactPhoneInput}
                    onChange={(e) => setContactPhoneInput(e.target.value)}
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
        <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-4 min-w-0">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <div key={student.learner_id} className="bg-slate-50 p-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-2 border-slate-200 text-xs min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-sky-50 border border-[#1cb0f6] text-[#1cb0f6] flex items-center justify-center font-black font-mono">
                            {student.username[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <strong className="font-black text-slate-700 block truncate">{student.display_name || student.username}</strong>
                            <span className="block text-[10px] text-slate-400 font-bold truncate">@{student.username} • Lớp {student.class_name || "--"}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pl-10 sm:pl-0">
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
