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
  searchQuery: string;
  searchResults: any[];
  searching: boolean;
  selectedLearner: any;
  linkClassName: string;
  linkStudentCode: string;
  linkSuccessMsg: string;
  linkErrorMsg: string;
  parentDashData: any;
  schoolDashData: any;
  onOpenAuth: () => void;
  onUpdateProfile: (e: React.FormEvent) => void;
  onSearchLearnerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectLearner: (learner: any) => void;
  onSendLinkRequest: (e: React.FormEvent) => void;
  onSetDisplayNameInput: (value: string) => void;
  onSetDobInput: (value: string) => void;
  onSetPhoneInput: (value: string) => void;
  onSetSchoolNameInput: (value: string) => void;
  onSetContactNameInput: (value: string) => void;
  onSetContactPhoneInput: (value: string) => void;
  onSetSelectedLearner: (learner: any) => void;
  onSetLinkClassName: (value: string) => void;
  onSetLinkStudentCode: (value: string) => void;
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
  searchQuery,
  searchResults,
  searching,
  selectedLearner,
  linkClassName,
  linkStudentCode,
  linkSuccessMsg,
  linkErrorMsg,
  parentDashData,
  schoolDashData,
  onOpenAuth,
  onUpdateProfile,
  onSearchLearnerChange,
  onSelectLearner,
  onSendLinkRequest,
  onSetDisplayNameInput,
  onSetDobInput,
  onSetPhoneInput,
  onSetSchoolNameInput,
  onSetContactNameInput,
  onSetContactPhoneInput,
  onSetSelectedLearner,
  onSetLinkClassName,
  onSetLinkStudentCode,
}: AccountTabProps) {
  if (!currentUser) {
    return (
      <section className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7 text-center py-12">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">🔑 Yêu cầu đăng nhập</p>
        <h2>Hãy đăng nhập để xem thông tin tài khoản</h2>
        <button onClick={onOpenAuth} type="button" className="border-0 rounded-full min-h-[48px] px-5 transition-all font-extrabold bg-gradient-to-br from-[#536ef9] to-[#68c6ff] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px cursor-pointer mt-4">
          Đăng nhập / Đăng ký
        </button>
      </section>
    );
  }

  const role = currentUser.role;

  return (
    <section className="space-y-6">
      <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-7">
        <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-indigo-600 font-bold">Cài đặt tài khoản</p>
        <h2>Thiết lập thông tin cá nhân và kết nối</h2>
        <p className="text-[var(--ink-soft)] leading-[1.62]">Quản lý hồ sơ cá nhân và kết nối giữa phụ huynh - con, nhà trường - học sinh.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Form */}
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            👤 Thông tin hồ sơ
          </h3>

          <form onSubmit={onUpdateProfile} className="space-y-4">
            {role === "learner" && (
              <>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Tên hiển thị</span>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => onSetDisplayNameInput(e.target.value)}
                    placeholder="Nhập tên hiển thị"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Ngày sinh</span>
                  <input
                    type="date"
                    value={dobInput}
                    onChange={(e) => onSetDobInput(e.target.value)}
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
              </>
            )}

            {role === "parent" && (
              <>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Họ tên phụ huynh</span>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => onSetDisplayNameInput(e.target.value)}
                    placeholder="Nhập họ tên phụ huynh"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Số điện thoại</span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => onSetPhoneInput(e.target.value)}
                    placeholder="Nhập số điện thoại liên hệ"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
              </>
            )}

            {role === "school" && (
              <>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Tên trường học</span>
                  <input
                    type="text"
                    required
                    value={schoolNameInput}
                    onChange={(e) => onSetSchoolNameInput(e.target.value)}
                    placeholder="Nhập tên trường học"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Người đại diện liên hệ</span>
                  <input
                    type="text"
                    value={contactNameInput}
                    onChange={(e) => onSetContactNameInput(e.target.value)}
                    placeholder="Họ tên người liên hệ"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
                <label className="grid gap-2 my-[18px]">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Số điện thoại liên hệ</span>
                  <input
                    type="tel"
                    value={contactPhoneInput}
                    onChange={(e) => onSetContactPhoneInput(e.target.value)}
                    placeholder="Số điện thoại liên hệ"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                  />
                </label>
              </>
            )}

            {profileSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold">
                {profileSuccessMsg}
              </div>
            )}
            {profileErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
                {profileErrorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl border-0 cursor-pointer transition-colors text-xs shadow-md"
            >
              {profileLoading ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
            </button>
          </form>
        </div>

        {/* Connections Section */}
        <div className="bg-[var(--surface)] border border-white/[0.82] rounded-[32px] shadow-[0_12px_34px_rgba(83,110,249,0.1)] backdrop-blur-[12px] p-6 space-y-4">
          {role === "learner" ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                🔗 Kết nối gia đình & trường học
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Để liên kết tài khoản của bạn với phụ huynh hoặc trường học, vui lòng gửi tên tài khoản{" "}
                <strong>@{currentUser.username}</strong> của bạn cho họ.
                Yêu cầu liên kết từ họ sẽ hiển thị trong tab <strong>Tiến độ</strong> để bạn xác nhận hoặc từ chối.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1.5 border border-slate-100">
                <div className="text-[10px] uppercase font-bold text-slate-400">Tên tài khoản của bạn</div>
                <div className="text-xl font-bold text-indigo-600 font-mono">@{currentUser.username}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>➕ Thêm {role === "parent" ? "thành viên" : "học sinh"}</span>
              </h3>

              <form onSubmit={onSendLinkRequest} className="space-y-3">
                <label className="grid gap-2 my-[18px] relative">
                  <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Tìm kiếm tài khoản</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={onSearchLearnerChange}
                    placeholder="Nhập tên tài khoản"
                    className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base pr-10"
                  />
                  {searching && (
                    <span className="absolute right-3 top-9 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  )}

                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {searchResults.map((learner) => (
                        <div
                          key={learner.id}
                          onClick={() => onSelectLearner(learner)}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-xs">
                            {learner.username[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-slate-800 text-xs">{learner.display_name}</div>
                            <div className="text-[10px] text-slate-400">@{learner.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </label>

                {selectedLearner && (
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-150 flex items-center justify-between text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-indigo-400">Đã chọn học sinh</span>
                      <strong>{selectedLearner.display_name}</strong>{" "}
                      <span className="text-slate-500">(@{selectedLearner.username})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSetSelectedLearner(null)}
                      className="py-1 px-2.5 bg-rose-50 text-rose-600 border-0 rounded-lg hover:bg-rose-100 cursor-pointer font-bold transition-all text-[10px]"
                    >
                      Hủy chọn
                    </button>
                  </div>
                )}

                {role === "school" && selectedLearner && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-2 my-[18px]">
                      <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Lớp học</span>
                      <input
                        type="text"
                        required
                        value={linkClassName}
                        onChange={(e) => onSetLinkClassName(e.target.value)}
                        placeholder="Ví dụ: 3A"
                        className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                      />
                    </label>
                    <label className="grid gap-2 my-[18px]">
                      <span className="text-[0.84rem] uppercase tracking-[0.12em] text-[#7c88a1]">Mã học sinh (Student Code)</span>
                      <input
                        type="text"
                        required
                        value={linkStudentCode}
                        onChange={(e) => onSetLinkStudentCode(e.target.value)}
                        placeholder="Ví dụ: HS001"
                        className="w-full border border-[rgba(47,71,112,0.12)] rounded-[16px] px-4 py-[14px] bg-white/[0.82] text-[var(--ink)] text-base"
                      />
                    </label>
                  </div>
                )}

                {linkSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs font-semibold">
                    {linkSuccessMsg}
                  </div>
                )}
                {linkErrorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold">
                    {linkErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedLearner}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-xl border-0 cursor-pointer transition-all text-xs shadow-md shadow-indigo-100"
                >
                  🚀 Gửi yêu cầu kết nối
                </button>
              </form>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Danh sách đã kết nối ({role === "parent"
                    ? parentDashData?.linked_learners?.length || 0
                    : schoolDashData?.linked_learners?.length || 0})
                </h4>

                <div className="space-y-2">
                  {role === "parent" ? (
                    parentDashData?.linked_learners && parentDashData.linked_learners.length > 0 ? (
                      parentDashData.linked_learners.map((learner: any) => (
                        <div key={learner.learner_id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono">
                              {learner.username[0].toUpperCase()}
                            </div>
                            <div>
                              <strong className="font-bold text-slate-700">{learner.display_name || learner.username}</strong>
                              <span className="block text-[10px] text-slate-400">@{learner.username}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block font-semibold text-slate-600">🔥 {learner.learning_streak} ngày</span>
                            <span className="block text-[10px] text-indigo-600 font-bold">{learner.xp} XP</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-4">Chưa liên kết với tài khoản con nào.</div>
                    )
                  ) : (
                    schoolDashData?.linked_learners && schoolDashData.linked_learners.length > 0 ? (
                      schoolDashData.linked_learners.map((student: any) => (
                        <div key={student.learner_id} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono">
                              {student.username[0].toUpperCase()}
                            </div>
                            <div>
                              <strong className="font-bold text-slate-700">{student.display_name || student.username}</strong>
                              <span className="block text-[10px] text-slate-400">@{student.username} • Lớp {student.class_name || "--"}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block font-semibold text-slate-600">Mã: {student.student_code}</span>
                            <span className="block text-[10px] text-indigo-600 font-bold">{student.xp} XP</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-4">Chưa liên kết với học sinh nào.</div>
                    )
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
