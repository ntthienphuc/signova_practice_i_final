import { Link } from "react-router-dom";
import type { ProductsData } from "../../types/landing";

interface ProductsProps {
  data: ProductsData;
}

export function Products({ data }: ProductsProps) {
  return (
    <section className="bg-gray-50 py-20 lg:py-28" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-sky-600" />
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">
              Products
            </span>
            <div className="w-10 h-1 rounded-full bg-sky-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:shadow-sky-100/60 hover:border-sky-200 transition-all duration-300 flex flex-col"
            >
              {/* Tag */}
              <span className="inline-block self-start px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-50 rounded-full mb-5">
                {item.tag}
              </span>

              {/* Icon */}
              <div className="text-4xl mb-4">{item.icon}</div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">{item.description}</p>

              {/* Link */}
              <div className="mt-6">
                {item.path ? (
                  <Link
                    to={item.path}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-500 transition-colors"
                  >
                    Open app
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                ) : (
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Contact us
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
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
