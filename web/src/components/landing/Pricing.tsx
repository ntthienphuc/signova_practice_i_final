import type { PricingData } from "../../types/landing";

interface PricingProps {
  data: PricingData;
}

export function Pricing({ data }: PricingProps) {
  return (
    <section className="bg-gray-50 py-20 lg:py-28" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-sky-600" />
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-widest">
              Pricing
            </span>
            <div className="w-10 h-1 rounded-full bg-sky-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* Cards — equal height, Popular badge floats above highlighted card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {data.items.map((item) => (
            <div key={item.name} className="relative flex flex-col">
              {/* Popular badge — floats above the card */}
              {item.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-teal-500 text-white text-xs font-bold rounded-full shadow-md shadow-teal-500/30 whitespace-nowrap">
                    Popular
                  </span>
                </div>
              )}

              <div
                className={`flex-1 rounded-2xl flex flex-col transition-all duration-300 ${
                  item.highlight
                    ? "bg-gradient-to-b from-sky-500 to-teal-600 border-2 border-sky-400 p-8 pt-10 shadow-2xl shadow-sky-500/25"
                    : "bg-white border border-gray-200 p-7 shadow-sm hover:shadow-md hover:border-sky-200"
                }`}
              >
                {/* Target audience pill */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      item.highlight
                        ? "bg-white/20 text-white"
                        : "bg-sky-50 text-sky-600"
                    }`}
                  >
                    {item.target}
                  </span>
                </div>

                {/* Plan name */}
                <h3
                  className={`text-xl font-bold mb-4 ${
                    item.highlight ? "text-white" : "text-gray-900"
                  }`}
                >
                  {item.name}
                </h3>

                {/* Price */}
                <div className="mb-6 flex flex-col">
                  <span
                    className={`text-3xl w-full font-extrabold leading-tight ${
                      item.highlight ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.price}
                  </span>
                  {item.period && (
                    <span
                      className={`ml-1 border-2 text-sm font-normal ${
                        item.highlight ? "text-sky-100" : "text-gray-500"
                      }`}
                    >
                      {item.period}
                    </span>
                  )}
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-1 pl-0">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          item.highlight ? "text-green-300" : "text-sky-500"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span
                        className={`text-sm leading-snug ${
                          item.highlight ? "text-sky-50" : "text-gray-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#"
                  className={`block text-center py-3 px-5 rounded-full font-semibold text-sm transition-colors ${
                    item.highlight
                      ? "bg-white text-sky-600 hover:bg-sky-50"
                      : "bg-sky-600 text-white hover:bg-sky-500"
                  }`}
                >
                  {item.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
