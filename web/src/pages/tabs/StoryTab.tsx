import { useNavigate } from "react-router-dom";
import { STORIES } from "../../data/storyData";
import { useAuth } from "../../contexts/AuthContext";
import rabbitBearImage from "../../assets/words/rabbit_bear.png";

const difficultyLabel = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
};

const categoryLabel = {
  emotions: "Cảm xúc",
  daily_life: "Hằng ngày",
  family: "Gia đình",
  school: "Trường lớp",
};

export default function StoryTab() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const openStory = (storyId: string, index: number) => {
    if (!currentUser && index > 0) {
      navigate("/learn-dashboard?require_login=true");
      return;
    }
    navigate(`/story/${storyId}`);
  };

  return (
    <section className="min-h-[calc(100vh-80px)] bg-[#f7fbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-[28px] border-2 border-sky-100 bg-white px-5 py-6 shadow-sm sm:px-7">
          <p className="m-0 text-xs font-black uppercase tracking-[0.18em] text-[#1cb0f6]">
            Khai vấn qua cốt truyện
          </p>
          <h1 className="m-0 mt-2 text-3xl font-black leading-tight text-slate-800 sm:text-4xl">
            Câu chuyện
          </h1>
          <p className="m-0 mt-3 max-w-2xl text-sm font-bold leading-relaxed text-slate-500">
            Bé giúp các nhân vật xử lý tình huống bằng ký hiệu VSL đúng trong ngữ cảnh.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {STORIES.map((story, index) => (
            <article
              key={story.id}
              className="flex min-h-[260px] flex-col rounded-[24px] border-2 border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md sm:p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                {story.id === "tho-va-gau-ket-ban" ? (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[20px] bg-sky-50 ring-2 ring-sky-100">
                    <img
                      src={rabbitBearImage}
                      alt="Thỏ và Gấu"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-sky-50 text-4xl ring-2 ring-sky-100">
                    {story.emoji}
                  </div>
                )}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                    {story.scenes.length} canh
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                    {difficultyLabel[story.difficulty]}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <p className="m-0 mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {categoryLabel[story.category]}
                </p>
                <h2 className="m-0 text-lg font-black leading-tight text-slate-800 sm:text-xl">
                  {story.title}
                </h2>
                <p className="m-0 mt-2 line-clamp-4 text-xs font-bold leading-relaxed text-slate-500 sm:text-sm">
                  {story.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openStory(story.id, index)}
                className="mt-5 min-h-[46px] rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-4 text-sm font-black text-white transition-all hover:bg-[#24c4ff] active:translate-y-1 active:border-b-0"
              >
                Bắt đầu
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
