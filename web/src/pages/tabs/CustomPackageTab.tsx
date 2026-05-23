export function CustomPackageTab() {
  return (
    <section className="custom-package-tab space-y-6">
      <div className="hero-panel card-surface">
        <p className="eyebrow text-indigo-600 font-bold">Gói học tùy chỉnh</p>
        <h2>Chương trình đào tạo riêng biệt cho trường của bạn</h2>
        <p className="muted">Tự thiết lập kho từ vựng, lộ trình bài giảng và giao bài tập theo lớp.</p>
      </div>

      <div className="card-surface p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mx-auto text-3xl">
          🏫
        </div>
        <h3 className="text-lg font-bold text-slate-800">Tính năng đang được phát triển</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Hệ thống đang tích hợp cổng thiết kế giáo án tùy chỉnh cho các đối tác trường học.
          Để đăng ký khóa học, phân bổ giáo viên, hoặc tạo giáo trình riêng cho trường của bạn,
          vui lòng liên hệ với ban quản trị viên.
        </p>
        <div className="bg-indigo-50/50 p-4 rounded-xl text-left text-xs text-slate-600 space-y-2 inline-block w-full border border-indigo-100/50">
          <div>📞 <strong>Hotline hỗ trợ trường học:</strong> 1900 8198 (Nhánh số 3)</div>
          <div>✉️ <strong>Email hỗ trợ:</strong> partner@signova.edu.vn</div>
          <div>🏢 <strong>Địa chỉ làm việc:</strong> Tòa nhà văn phòng Signova, Hà Nội / TP. HCM</div>
        </div>
      </div>
    </section>
  );
}
