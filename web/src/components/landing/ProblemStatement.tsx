import type { ProblemData } from "../../types/landing";

interface ProblemStatementProps {
  data: ProblemData;
}

export function ProblemStatement({ data }: ProblemStatementProps) {
  return (
    <section className="bg-white py-20 lg:py-28" id="problem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black uppercase tracking-wider shadow-sm">
            <span>⚠️ Thách thức</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-7xl font-black text-slate-800 tracking-tight leading-tight">
            {data.heading}
          </h2>
          
          <p className="text-base sm:text-lg text-slate-500 font-bold leading-relaxed">
            {data.body}
          </p>
        </div>

        {/* Before vs After Comparative Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Traditional Card */}
          <div className="bg-slate-50 border-2 border-b-4 border-slate-200 rounded-[28px] p-6 sm:p-8 space-y-5">
            <h3 className="text-lg font-black text-slate-500 flex items-center gap-2 select-none uppercase tracking-wider m-0">
              ❌ Lối học truyền thống
            </h3>
            
            <ul className="space-y-3.5 pl-0 text-slate-500 font-bold text-sm leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-rose-500 text-base">⚠️</span>
                <span>Chỉ xem video mẫu một chiều, học sinh tự tập đoán mò.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-500 text-base">⚠️</span>
                <span>Không phát hiện được tư thế tay, vị trí bị lệch góc.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-500 text-base">⚠️</span>
                <span>Học lâu dần bị sai thói quen ký hiệu khó sửa lại.</span>
              </li>
            </ul>
          </div>

          {/* Signova Card */}
          <div className="bg-gradient-to-b from-sky-50 to-white border-2 border-b-4 border-[#1cb0f6] rounded-[28px] p-6 sm:p-8 space-y-5 shadow-lg shadow-sky-100/50">
            <h3 className="text-lg font-black text-[#1cb0f6] flex items-center gap-2 select-none uppercase tracking-wider m-0">
              ✨ Đồng hành cùng Signova
            </h3>
            
            <ul className="space-y-3.5 pl-0 text-slate-600 font-bold text-sm leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-[#58cc02] text-base">✅</span>
                <span>Camera AI thông minh phản hồi xanh/đỏ chính xác tức thì.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#58cc02] text-base">✅</span>
                <span>Biết rõ góc gập khuỷu tay, hướng ngón tay sai ở đâu để sửa.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#58cc02] text-base">✅</span>
                <span>Học từ vựng trực quan sinh động, hào hứng như chơi game.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
