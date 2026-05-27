import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export interface TourStep {
  selector: string;
  title: string;
  body?: string;
  padding?: number;
}

interface Props {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

const TOOLTIP_W = 300;
const TOOLTIP_GAP = 14;

export function SpotlightTour({ steps, isOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [spotRect, setSpotRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const current = steps[step];

  const measure = useCallback(() => {
    if (!isOpen || !current) return;
    const el = document.querySelector(current.selector) as HTMLElement | null;
    if (!el || (el as HTMLElement).offsetParent === null) {
      setSpotRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = current.padding ?? 12;
    setSpotRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isOpen, current]);

  useEffect(() => {
    if (!isOpen) { setStep(0); return; }
    const t = setTimeout(measure, 80);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [isOpen, measure]);

  const next = () => (step < steps.length - 1 ? setStep((s) => s + 1) : onClose());
  const prev = () => step > 0 && setStep((s) => s - 1);

  if (!isOpen || !current) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let ttTop: number, ttBottom: number | undefined, above = false;
  let ttLeft: number;

  if (spotRect) {
    above = spotRect.top + spotRect.height > vh * 0.58;
    if (above) {
      ttBottom = vh - spotRect.top + TOOLTIP_GAP;
      ttTop = 0;
    } else {
      ttTop = spotRect.top + spotRect.height + TOOLTIP_GAP;
      ttBottom = undefined;
    }
    ttLeft = Math.max(16, Math.min(spotRect.left, vw - TOOLTIP_W - 16));
  } else {
    ttTop = vh / 2 - 90;
    ttBottom = undefined;
    ttLeft = vw / 2 - TOOLTIP_W / 2;
    above = false;
  }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
      {/* Backdrop — click to dismiss */}
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />

      {/* Spotlight ring with box-shadow backdrop */}
      {spotRect ? (
        <div
          style={{
            position: "absolute",
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.width,
            height: spotRect.height,
            borderRadius: 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.68)",
            pointerEvents: "none",
            border: "2px solid rgba(255,255,255,0.22)",
            transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.68)", pointerEvents: "none" }} />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: "absolute",
          top: above ? undefined : ttTop,
          bottom: above ? ttBottom : undefined,
          left: ttLeft,
          width: TOOLTIP_W,
          zIndex: 1,
          transition: "top 0.25s ease, left 0.25s ease, bottom 0.25s ease",
        }}
        className="bg-white rounded-[20px] shadow-2xl border-2 border-b-4 border-slate-200 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 20 : 8, backgroundColor: i === step ? "#1cb0f6" : "#e2e8f0" }}
            />
          ))}
        </div>

        <p className="m-0 text-[0.68rem] uppercase tracking-[0.18em] text-[#1cb0f6] font-extrabold mb-1">
          Bước {step + 1}/{steps.length}
        </p>
        <h4 className={`m-0 font-black text-slate-800 text-base ${current.body ? "mb-2" : ""}`}>{current.title}</h4>
        {current.body && <p className="m-0 text-sm font-bold text-slate-500 leading-relaxed">{current.body}</p>}

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-black text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            Bỏ qua
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="px-3 py-2 text-xs font-black text-slate-600 border-2 border-b-4 border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all active:border-b-2 active:translate-y-px"
              >
                ← Trước
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="px-4 py-2 text-xs font-black text-white rounded-xl cursor-pointer transition-all active:border-b-0 active:translate-y-[3px]"
              style={{ backgroundColor: "#1cb0f6", borderBottom: "4px solid #1899d6" }}
            >
              {step === steps.length - 1 ? "Hiểu rồi! ✓" : "Tiếp theo →"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
