export function CustomPackageTab() {
  return (
    <section className="space-y-6">
      <div className="bg-white border-2 border-b-5 border-slate-200 rounded-[32px] p-7">
        <p className="m-0 text-xs uppercase tracking-[0.18em] text-[#1cb0f6] font-black">Gói học tùy chỉnh 📦</p>
        <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">Chương trình đào tạo riêng biệt cho trường của bạn</h2>
        <p className="text-slate-500 mt-2 font-bold text-sm">Tự thiết lập kho từ vựng, lộ trình bài giảng và giao bài tập theo lớp.</p>
      </div>

      <div className="bg-white border-2 border-b-5 border-slate-200 rounded-[32px] p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-24 h-24 flex items-center justify-center mx-auto select-none">
          <img 
            src="/mascot/8.png" 
            alt="Custom Package Mascot" 
            className="w-full h-full object-contain animate-bounce-subtle" 
            style={{ 
              animationDuration: '4s',
              filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08))"
            }} 
          />
        </div>
        <h3 className="text-xl font-black text-slate-800 m-0">Tính năng đang được thiết lập</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-bold">
          Hệ thống đang tích hợp cổng thiết kế giáo án tùy chỉnh cho các đối tác trường học.
          Để đăng ký khóa học, phân bổ giáo viên, hoặc tạo giáo trình riêng cho trường của bạn,
          vui lòng liên hệ với ban quản trị viên.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs font-bold text-slate-600 space-y-2.5 inline-block w-full border-2 border-slate-200">
          <div>📞 <strong>Hotline hỗ trợ trường học:</strong> 1900 8198 (Nhánh số 3)</div>
          <div>✉️ <strong>Email hỗ trợ:</strong> partner@signova.edu.vn</div>
          <div>🏢 <strong>Địa chỉ làm việc:</strong> Tòa nhà văn phòng Signova, Hà Nội / TP. HCM</div>
        </div>
      </div>
    </section>
  );
}
