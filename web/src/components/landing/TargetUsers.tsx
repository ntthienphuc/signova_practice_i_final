import type { TargetUsersData } from "../../types/landing";

interface TargetUsersProps {
  data: TargetUsersData;
}

export function TargetUsers({ data }: TargetUsersProps) {
  return (
    <section className="bg-white py-20 lg:py-28" id="users">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-[0.2em]">
              Đối Tượng
            </span>
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight leading-tight">
            {data.heading}
          </h2>
          
          <p className="text-base sm:text-lg text-slate-500 font-bold max-w-2xl mx-auto">
            {data.subheading}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {data.items.map((item, index) => {
            const bgGradients = [
              "from-sky-50 to-sky-100/50 text-sky-600 border-sky-200",
              "from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-200",
              "from-indigo-50 to-indigo-100/50 text-indigo-600 border-indigo-200",
            ];
            const activeBg = bgGradients[index % bgGradients.length];

            return (
              <div 
                key={item.title} 
                className="group bg-white border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] rounded-[28px] p-8 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-50/50"
              >
                <div className={`w-20 h-20 rounded-[24px] bg-gradient-to-br border-2 flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-105 transition-transform ${activeBg}`}>
                  {item.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2.5 group-hover:text-[#1cb0f6] transition-colors">{item.title}</h3>
                <p className="text-slate-500 font-bold text-xs leading-relaxed max-w-xs mx-auto m-0">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
