import { Link } from "react-router-dom";
import type { ProductsData } from "../../types/landing";

interface ProductsProps {
  data: ProductsData;
}

export function Products({ data }: ProductsProps) {
  return (
    <section className="bg-white py-20 lg:py-28" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: heading + subheading + CTA */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-[#1cb0f6]" />
              <span className="text-xs font-black text-[#1cb0f6] uppercase tracking-[0.2em]">
                Sản Phẩm
              </span>
            </div>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-800 tracking-tight leading-tight">
              {data.heading}
            </h2>

            <p className="text-xl sm:text-2xl text-slate-500 font-bold leading-relaxed">
              {data.subheading}
            </p>

            <Link
              to="/learn-dashboard"
              className="inline-block px-8 py-3.5 bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#24c4ff] text-white font-black uppercase tracking-wider rounded-2xl transition-all text-lg shadow-md active:border-b-0 active:translate-y-1"
            >
              Bắt đầu ngay 🚀
            </Link>
          </div>

          {/* Right: 2×2 product mini-cards */}
          <div className="grid grid-cols-2 gap-4">
            {data.items.map((item) => (
              <div
                key={item.title}
                className="group bg-white rounded-[24px] border-2 border-b-4 border-slate-200 hover:border-[#1cb0f6] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-50/50 flex flex-col p-5"
              >
                {/* Tag */}
                <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-100 rounded-full mb-3 self-start">
                  {item.tag}
                </span>

                {/* Icon */}
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform select-none">{item.icon}</div>

                {/* Title & description */}
                <h3 className="text-base font-black text-slate-800 mb-1 group-hover:text-[#1cb0f6] transition-colors leading-tight">{item.title}</h3>
                <p className="text-slate-400 font-bold text-sm leading-relaxed mb-4 flex-1">{item.description}</p>

                {/* Link */}
                {item.path ? (
                  <Link
                    to={item.path}
                    className="inline-flex items-center justify-center py-2 bg-[#1cb0f6] border-b-2 border-[#1899d6] hover:bg-[#24c4ff] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:border-b-0 active:translate-y-[1px]"
                  >
                    Mở App 🚀
                  </Link>
                ) : (
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Liên hệ
                  </a>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
