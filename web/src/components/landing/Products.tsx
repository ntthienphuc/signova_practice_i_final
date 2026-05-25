import { Link } from "react-router-dom";
import type { ProductsData } from "../../types/landing";

interface ProductsProps {
  data: ProductsData;
}

export function Products({ data }: ProductsProps) {
  return (
    <section className="bg-white py-20 lg:py-28" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
            <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-[0.2em]">
              Sản Phẩm
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="group bg-white rounded-[28px] border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] transition-all duration-150 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-50/50 flex flex-col p-6 justify-between"
            >
              <div>
                {/* Tag */}
                <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-100 rounded-full mb-5">
                  {item.tag}
                </span>

                {/* Icon */}
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform select-none">{item.icon}</div>

                {/* Content */}
                <h3 className="text-base sm:text-lg font-black text-slate-805 mb-2 group-hover:text-[#1cb0f6] transition-colors">{item.title}</h3>
                <p className="text-slate-500 font-bold text-xs leading-relaxed mb-6">{item.description}</p>
              </div>

              {/* Link */}
              <div className="mt-4">
                {item.path ? (
                  <Link
                    to={item.path}
                    className="inline-flex items-center justify-center w-full py-2.5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:border-b-0 active:translate-y-[2px]"
                  >
                    Mở Ứng Dụng 🚀
                  </Link>
                ) : (
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center w-full py-2.5 bg-slate-50 border-2 border-b-4 border-slate-200 hover:bg-slate-100 text-slate-550 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:border-b-0 active:translate-y-[2px]"
                  >
                    Liên Hệ Tư Vấn
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
