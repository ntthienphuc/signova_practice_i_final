import { Link } from "react-router-dom";
import { ArrowDownRight, Check, Sparkles } from "lucide-react";
import type { HeroData } from "../../types/landing";

interface HeroProps {
  data: HeroData;
  locale: "vi" | "en";
}

const labels = {
  vi: {
    rhythm: "Học theo nhịp của bé",
    feedback: "AI phản hồi trực quan",
    detected: "Nhận diện",
    onRhythm: "Đúng nhịp",
    goingWell: "Đang tốt",
    feedbackCopy: "Thấy điểm cần sửa, ngay trong lúc luyện tập.",
    signs: "Ký hiệu VSL",
    accuracy: "Độ chính xác*",
    support: "Góc nhìn hỗ trợ",
  },
  en: {
    rhythm: "Learn at your own pace",
    feedback: "Visual AI feedback",
    detected: "Detection",
    onRhythm: "On rhythm",
    goingWell: "Going well",
    feedbackCopy: "See what to adjust while practicing.",
    signs: "VSL signs",
    accuracy: "Accuracy*",
    support: "Ways we support",
  },
};

export function Hero({ data, locale }: HeroProps) {
  const copy = labels[locale];
  return (
    <section className="landing-hero relative isolate overflow-hidden pt-28 sm:pt-32" id="hero">
      <div className="landing-hero-grid absolute inset-0 -z-10 opacity-40" />
      <div className="landing-orb landing-orb-one absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl" />
      <div className="landing-orb landing-orb-two absolute right-0 top-0 -z-10 h-[30rem] w-[30rem] rounded-full bg-blue-700/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:gap-8 lg:px-8 lg:pb-24">
        <div className="landing-reveal flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-sky-700 shadow-[0_8px_30px_rgba(2,132,199,.10)] backdrop-blur">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-white"><Sparkles size={12} strokeWidth={3} /></span>
            {data.badge}
          </div>

          <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-sky-600">Sign better - Learn closer</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] text-slate-900 sm:text-6xl lg:text-7xl">
            {data.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-bold leading-relaxed text-slate-600 sm:text-xl">
            {data.subheadline}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/learn-dashboard"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl border-b-4 border-sky-700 bg-sky-500 px-7 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_24px_rgba(2,132,199,.22)] transition hover:-translate-y-0.5 hover:bg-sky-400 active:translate-y-1 active:border-b-0"
            >
              {data.ctaPrimary}
              <ArrowDownRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-sky-100 bg-white/75 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-sky-700 transition hover:border-sky-300 hover:bg-white"
            >
              {data.ctaSecondary}
            </a>
          </div>

          <div className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-500 lg:justify-start">
            <span className="inline-flex items-center gap-1.5"><Check size={16} className="text-emerald-500" strokeWidth={3} /> {copy.rhythm}</span>
            <span className="inline-flex items-center gap-1.5"><Check size={16} className="text-emerald-500" strokeWidth={3} /> {copy.feedback}</span>
          </div>
        </div>

        <div className="landing-reveal-delay relative mx-auto flex w-full max-w-[570px] items-center justify-center lg:justify-end">
          <div className="absolute left-[8%] top-[9%] h-20 w-20 rounded-full border border-white/80 bg-white/60 shadow-[0_12px_35px_rgba(2,132,199,.12)] backdrop-blur" />
          <div className="absolute bottom-[12%] left-[4%] hidden rounded-2xl border border-emerald-100 bg-white/90 px-3 py-2 shadow-[0_18px_35px_rgba(16,185,129,.16)] sm:block">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">{copy.detected}</p>
            <p className="text-lg font-black leading-none text-slate-800">{copy.onRhythm}</p>
          </div>

          <div className="relative aspect-square w-full max-w-[490px]">
            <div className="absolute inset-[7%] rounded-[34%] bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,.8)]" />
            <div className="absolute inset-[13%] rounded-[30%] border border-white/75" />
            <img
              src="/signova-mascot-cutout.png"
              alt="Mascot Signova đồng hành cùng người học"
              className="landing-mascot-float absolute inset-[2%] z-10 h-[96%] w-[96%] object-contain drop-shadow-[0_28px_24px_rgba(14,116,144,.24)]"
            />
            <div className="absolute bottom-[4%] right-[0%] z-20 w-[190px] rounded-[22px] border border-white/70 bg-white/92 p-3 shadow-[0_18px_45px_rgba(2,132,199,.20)] backdrop-blur sm:w-[215px] sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[.15em] text-slate-500">AI feedback</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">{copy.goingWell}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="h-2 flex-1 rounded-full bg-emerald-100"><span className="block h-full w-[83%] rounded-full bg-emerald-400" /></span></div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /><span className="h-2 flex-1 rounded-full bg-rose-100"><span className="block h-full w-[42%] rounded-full bg-rose-400" /></span></div>
              </div>
              <p className="mt-3 text-xs font-bold leading-snug text-slate-600">{copy.feedbackCopy}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-y border-sky-100/80 bg-white/75 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-sky-100 px-4 sm:px-6 lg:px-8">
          <div className="py-5 text-center sm:py-6"><strong className="block text-2xl font-black tracking-tight text-sky-600 sm:text-3xl">400+</strong><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500 sm:text-xs">{copy.signs}</span></div>
          <div className="py-5 text-center sm:py-6"><strong className="block text-2xl font-black tracking-tight text-sky-600 sm:text-3xl">&gt;96%</strong><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500 sm:text-xs">{copy.accuracy}</span></div>
          <div className="py-5 text-center sm:py-6"><strong className="block text-2xl font-black tracking-tight text-sky-600 sm:text-3xl">3</strong><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500 sm:text-xs">{copy.support}</span></div>
        </div>
      </div>
    </section>
  );
}
