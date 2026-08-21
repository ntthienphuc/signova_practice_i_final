import { ArrowRight, Camera, CircleCheckBig, PlayCircle } from "lucide-react";

interface LearningLoopProps {
  locale: "vi" | "en";
}

const content = {
  vi: {
    eyebrow: "Một vòng học thật sự hữu ích",
    heading: "Không chỉ xem. Bé được luyện, được thấy, rồi biết cách sửa.",
    body: "Signova đánh giá toàn bộ chuyển động của ký hiệu, thay vì chỉ chấm một khoảnh khắc. Mỗi lần luyện là một cơ hội để tiến gần hơn đến ký hiệu đúng.",
    steps: [
      { title: "Xem mẫu tin cậy", body: "Video VSL trực quan để bé quan sát hình tay, hướng và nhịp điệu.", icon: PlayCircle },
      { title: "Luyện trước camera", body: "Bé quay hoặc tải bài làm theo cách thoải mái nhất.", icon: Camera },
      { title: "Nhận gợi ý để sửa", body: "Màu xanh - đỏ giúp nhận ra phần đang tốt và điểm cần tập thêm.", icon: CircleCheckBig },
    ],
  },
  en: {
    eyebrow: "A learning loop that helps",
    heading: "More than watching. Practice, see, and know what to adjust.",
    body: "Signova evaluates a whole sign movement, not a single frozen moment. Every practice gives a learner a clearer next step.",
    steps: [
      { title: "Watch a trusted reference", body: "Clear VSL video helps learners observe handshape, direction, and timing.", icon: PlayCircle },
      { title: "Practice with a camera", body: "Record or upload a practice attempt in the way that feels comfortable.", icon: Camera },
      { title: "See how to improve", body: "Green and red guidance shows what is going well and what needs more practice.", icon: CircleCheckBig },
    ],
  },
};

export function LearningLoop({ locale }: LearningLoopProps) {
  const data = content[locale];
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-24" id="how-it-works">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(14,165,233,.28),transparent_28%),radial-gradient(circle_at_82%_65%,rgba(6,182,212,.18),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">{data.eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-4xl font-black leading-[1.05] tracking-[-.04em] text-white sm:text-5xl">{data.heading}</h2>
          <p className="mt-5 max-w-lg text-base font-bold leading-relaxed text-slate-300 sm:text-lg">{data.body}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-0">
          {data.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-[24px] border border-white/10 bg-white/[.07] p-5 backdrop-blur-sm sm:rounded-none sm:first:rounded-l-[24px] sm:last:rounded-r-[24px] sm:not(:last-child):border-r-0">
                <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><Icon size={22} strokeWidth={2.6} /></span>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-black leading-tight text-white">{step.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">{step.body}</p>
                {index < data.steps.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-cyan-300 p-1 text-slate-950 sm:block" size={28} />}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
