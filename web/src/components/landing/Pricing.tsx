import type { PricingData } from "../../types/landing";

interface PricingProps {
  data: PricingData;
}

export function Pricing({ data }: PricingProps) {
  return (
    <section className="bg-dark-bg py-20 lg:py-28" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-10 h-1 rounded-full bg-brand-primary" />
            <span className="text-sm font-semibold text-brand-primary uppercase tracking-widest">
              Pricing
            </span>
            <div className="w-10 h-1 rounded-full bg-brand-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-main mb-5">
            {data.heading}
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">{data.subheading}</p>
        </div>

        {/* Cards — equal height, Popular badge floats above highlighted card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {data.items.map((item) => (
            <div key={item.name} className="relative flex flex-col">
              {/* Popular badge — floats above the card */}
              {item.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1.5 bg-brand-teal text-text-main text-xs font-bold rounded-full shadow-md shadow-brand-teal/30 whitespace-nowrap">
                    Popular
                  </span>
                </div>
              )}

              <div
                className={`flex-1 rounded-2xl flex flex-col transition-all duration-300 ${
                  item.highlight
                    ? "bg-gradient-to-b from-brand-primaryHover to-brand-teal border-2 border-brand-primaryLight p-8 pt-10 shadow-2xl shadow-brand-primaryHover/25"
                    : "bg-dark-card border border-white/10 p-7 shadow-sm hover:shadow-md hover:border-brand-primaryLight/30"
                }`}
              >
                {/* Target audience pill */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      item.highlight
                        ? "bg-white/20 text-text-main"
                        : "bg-brand-primary/10 text-brand-primary"
                    }`}
                  >
                    {item.target}
                  </span>
                </div>

                {/* Plan name */}
                <h3
                  className={`text-xl font-bold mb-4 ${
                    item.highlight ? "text-text-main" : "text-text-main"
                  }`}
                >
                  {item.name}
                </h3>

                {/* Price */}
                <div className="mb-6 flex flex-col">
                  <span
                    className={`text-3xl w-full font-extrabold leading-tight ${
                      item.highlight ? "text-text-main" : "text-text-main"
                    }`}
                  >
                    {item.price}
                  </span>
                  {item.period && (
                    <span
                      className={`ml-1 border-2 text-sm font-normal ${
                        item.highlight ? "text-brand-primaryLight" : "text-text-muted"
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
                          item.highlight ? "text-green-300" : "text-brand-primaryHover"
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
                          item.highlight ? "text-text-main/90" : "text-text-muted"
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
                      ? "bg-dark-bg text-brand-primary hover:bg-dark-bg/80"
                      : "bg-brand-primary text-text-main hover:bg-brand-primaryHover"
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
