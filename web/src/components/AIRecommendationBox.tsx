import { useState, useEffect } from "react";
import logo from '../assets/image/logo.jpeg'
interface AIRecommendationBoxProps {
  aiRecommendation: {
    recommendation: string;
    action_items: string[];
    updated_at: string;
  } | null;
  onRefresh: () => Promise<void>;
  loading: boolean;
  role: "parent" | "school";
}

export function AIRecommendationBox({
  aiRecommendation,
  onRefresh,
  loading,
  role,
}: AIRecommendationBoxProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [refreshError, setRefreshError] = useState("");

  // Reset checked items when new recommendation is loaded
  useEffect(() => {
    setCheckedItems({});
    setRefreshError("");
  }, [aiRecommendation]);

  const handleToggle = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleRefreshClick = async () => {
    if (loading) return;
    setRefreshError("");
    try {
      await onRefresh();
    } catch (err: any) {
      setRefreshError(err.message || "Không thể làm mới gợi ý.");
    }
  };

  if (!aiRecommendation) return null;

  // Simple Markdown-like bold parser (**text**)
  const renderRecommendationText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return (
      <p className="text-slate-600 font-bold text-sm leading-relaxed m-0 mt-1">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <strong key={index} className="font-black text-slate-800">
                {part}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  };

  // Format updated_at timestamp to friendly Vietnamese string
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "";
      const pad = (num: number) => String(num).padStart(2, "0");
      return `lúc ${pad(date.getHours())}:${pad(date.getMinutes())} ngày ${pad(
        date.getDate()
      )}/${pad(date.getMonth() + 1)}`;
    } catch {
      return "";
    }
  };

  const formattedTime = formatTime(aiRecommendation.updated_at);

  return (
    <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-5 shadow-sm transition-all hover:border-sky-300">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Mascot section */}
        <div className="flex md:flex-col items-center gap-3 shrink-0 mx-auto md:mx-0 select-none">
          <div className="relative">
            <img
              src="/mascot/10.png"
              alt="Signova Mascot"
              className="w-16 h-16 object-contain animate-bounce-subtle"
              style={{
                filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))",
                animationDuration: "3s",
              }}
            />
            {/* Thinking / sparkles decoration */}
            <span className="absolute -top-1 -right-1 text-lg">💡</span>
          </div>
          <div className="text-center md:text-center text-left">
            <span className="bg-[#e0f2fe] border border-sky-300 text-sky-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full block">
              Mascot Signova
            </span>
          </div>
        </div>

        {/* Speech Bubble / Content Section */}
        <div className="flex-1 w-full space-y-4">
          <div className="relative bg-slate-50 border-2 border-slate-100 rounded-[24px] p-4">
            {/* Little triangle arrow pointing to mascot (only on md sizes, left side) */}
            <div className="hidden md:block absolute top-6 -left-2.5 w-4 h-4 bg-slate-50 border-l-2 border-b-2 border-slate-100 rotate-45" />

            <div className="flex justify-between items-center select-none">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-black">
                🦉 Lời khuyên & Gợi ý AI
              </span>
              <button
                type="button"
                onClick={handleRefreshClick}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-[11px] transition-all border-2 cursor-pointer select-none ${
                  loading
                    ? "bg-slate-100 border-slate-200 text-slate-400"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 active:translate-y-[1px]"
                }`}
              >
                <span className={`inline-block ${loading ? "animate-spin" : ""}`}>
                  🔄
                </span>
                <span>{loading ? "Đang phân tích..." : "Làm mới"}</span>
              </button>
            </div>

            {renderRecommendationText(aiRecommendation.recommendation)}

            {refreshError && (
              <p className="text-rose-500 font-bold text-xs m-0 mt-2">
                ⚠️ {refreshError}
              </p>
            )}
          </div>

          {/* Action checklist */}
          {aiRecommendation.action_items && aiRecommendation.action_items.length > 0 && (
            <div className="space-y-2 px-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider m-0 mb-1 select-none">
                📋 Việc cần làm gợi ý
              </h4>
              <div className="grid gap-2">
                {aiRecommendation.action_items.map((item, index) => {
                  const isChecked = !!checkedItems[index];
                  return (
                    <div
                      key={index}
                      onClick={() => handleToggle(index)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                        isChecked
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                          : "bg-white border-slate-100 text-slate-700 hover:border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className="w-3.5 h-3.5 stroke-[3] stroke-current fill-none"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold transition-all ${
                          isChecked ? "line-through opacity-60 font-semibold" : ""
                        }`}
                      >
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer timestamp */}
          {formattedTime && (
            <div className="text-[10px] font-bold text-slate-400 text-right px-1 select-none">
              Gợi ý được tạo {formattedTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
