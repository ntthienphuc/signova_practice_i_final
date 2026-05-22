import type { ProblemData } from "../../types/landing";

interface ProblemStatementProps {
  data: ProblemData;
}

export function ProblemStatement({ data }: ProblemStatementProps) {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Accent rule */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-1 rounded-full bg-indigo-600" />
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">
            The Problem
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-tight">
          {data.heading}
        </h2>

        <p className="text-lg sm:text-xl text-gray-500 leading-relaxed">{data.body}</p>
      </div>
    </section>
  );
}
