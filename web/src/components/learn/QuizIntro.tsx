import type { Topic } from "../../types/learn";

interface QuizIntroProps {
  scope: number;
  topic: Topic;
  onStart: () => void;
  onBack: () => void;
}

export function QuizIntro({ scope, topic, onStart, onBack }: QuizIntroProps) {
  const lessonGlosses = topic.words.slice(0, scope).map((word) => word.gloss);
  return (
    <section className="grid place-items-center min-h-[calc(100vh-80px)]">
      <div className="max-w-[860px] w-full grid gap-[18px] p-[34px] rounded-[30px] shadow-[0_18px_42px_rgba(62,88,149,0.1)] bg-[radial-gradient(circle_at_top_right,rgba(116,186,255,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,255,0.96))]">
        <div className="grid gap-[10px]">
          <p className="m-0 text-[0.86rem] uppercase tracking-[0.18em] text-[#c07f42] font-extrabold">Practice II</p>
          <div className="inline-flex items-center rounded-full px-3 py-2 font-bold text-[0.92rem] bg-[#ffdff1] text-[#a8517e]">
            🏁 Bài kiểm tra nhỏ
          </div>
          <h2
            className="m-0 text-[clamp(2rem,4vw,3.2rem)] leading-[1.05]"
            style={{ fontFamily: '"Baloo 2", Nunito, sans-serif' }}
          >
            {scope === 5 ? "Checkpoint sau 5 từ đầu" : "Bài tổng kết 10 từ"}
          </h2>
          <p className="text-[#66758a] leading-[1.62]">
            {scope === 5
              ? "Bạn đã đi qua 5 từ đầu tiên rồi. Giờ mình làm một bài kiểm tra nhỏ để xem đã nhớ được bao nhiêu nhé."
              : "Bạn đã học xong toàn bộ 10 từ trong topic. Giờ là lúc làm bài tổng kết để xem mình đã sẵn sàng chưa."}
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          {lessonGlosses.map((gloss) => (
            <span
              key={gloss}
              className="inline-flex items-center px-[14px] py-[10px] rounded-full bg-[linear-gradient(135deg,#536ef9,#68c6ff)] text-white font-bold"
            >
              {gloss}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full min-h-[48px] px-5 font-extrabold transition-all duration-[160ms] bg-white/[0.84] border border-[rgba(53,84,128,0.08)] text-[#1e2742] hover:-translate-y-px"
            onClick={onBack}
          >
            Quay lại topic
          </button>
          <button
            type="button"
            className="border-0 rounded-full min-h-[48px] px-5 font-extrabold transition-all duration-[160ms] bg-[linear-gradient(135deg,#536ef9,#68c6ff)] text-white shadow-[0_16px_30px_rgba(83,110,249,0.22)] hover:-translate-y-px"
            onClick={onStart}
          >
            Bắt đầu Practice II
          </button>
        </div>
      </div>
    </section>
  );
}
