import { useState } from "react";
import { LearnerProgressDetails } from "./ProgressTab";
import type { Topic } from "../../types/learn";
import { AIRecommendationBox } from "../../components/AIRecommendationBox";
import { useAuth } from "../../contexts/AuthContext";

interface FamilyTabProps {
  loadingDash: boolean;
  parentDashData: any;
  topics: Topic[];
  loadingAI: boolean;
  onRefreshAI: () => Promise<void>;
}

export function FamilyTab({ loadingDash, parentDashData, topics, loadingAI, onRefreshAI }: FamilyTabProps) {
  const { currentUser } = useAuth();
  const [activeMemberId, setActiveMemberId] = useState<string>("parent");

  if (currentUser?.role !== "parent") {
    return (
      <section className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-6 text-center max-w-md mx-auto my-12">
        <div className="text-4xl mb-3">👨‍👩‍👧</div>
        <h2 className="text-xl font-black text-slate-800 m-0">Dashboard Gia đình</h2>
        <p className="text-slate-500 mt-2 font-bold text-xs">
          Phần dashboard dành riêng cho phụ huynh. Vui lòng đăng nhập bằng tài khoản Phụ huynh nhé!
        </p>
      </section>
    );
  }

  const selfProgress = parentDashData?.self_progress;
  const linkedLearners = parentDashData?.linked_learners || [];

  return (
    <section className="space-y-6">
      {/* Banner */}
      <div 
        className="text-white p-6 relative overflow-hidden rounded-[28px]"
        style={{
          backgroundColor: "#1cb0f6",
          borderBottom: "2px solid #1899d6"
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[120px] pointer-events-none" />
        <p className="m-0 text-xs uppercase tracking-[0.2em] font-black text-sky-100">Gia đình cùng học 👨‍👩‍👧</p>
        <h2 className="text-2xl font-black m-0 mt-1">Cổng kết nối Signova Family Hub</h2>
        <p className="text-sky-50 font-bold m-0 mt-1.5 leading-relaxed max-w-xl text-xs">
          Đồng hành cùng con trên con đường học ngôn ngữ ký hiệu. Ba mẹ có thể tự học và theo dõi sát sao từng bước tiến bộ của con!
        </p>
      </div>

      {/* AI Mascot Recommendations */}
      {!loadingDash && parentDashData?.ai_recommendation && (
        <AIRecommendationBox
          aiRecommendation={parentDashData.ai_recommendation}
          onRefresh={onRefreshAI}
          loading={loadingAI}
          role="parent"
        />
      )}

      {loadingDash ? (
        <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-10 text-center text-slate-400 font-bold">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto mb-3" />
          Đang tải dữ liệu học tập của gia đình...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Member Pills */}
          <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-5">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-1 select-none">
              👥 Thành viên gia đình
            </h4>
            <div className="flex flex-wrap gap-3">
              {/* Parent Option */}
              {selfProgress && (
                <button
                  type="button"
                  onClick={() => setActiveMemberId("parent")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm transition-all border-2 cursor-pointer ${
                    activeMemberId === "parent"
                      ? "bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white active:border-b-0 active:translate-y-[2px]"
                      : "bg-white border-2 border-b-2 border-slate-200 text-slate-700 hover:bg-slate-50 active:border-b-0 active:translate-y-[1px]"
                  }`}
                >
                  <span className="text-lg">🧑‍🏫</span>
                  <span>Ba/Mẹ (Bạn)</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    activeMemberId === "parent" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    🔥 {selfProgress.learning_streak || 0}
                  </span>
                </button>
              )}

              {/* Kids Options */}
              {linkedLearners.map((learner: any) => (
                <button
                  key={learner.learner_id}
                  type="button"
                  onClick={() => setActiveMemberId(learner.learner_id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm transition-all border-2 cursor-pointer ${
                    activeMemberId === learner.learner_id
                      ? "bg-[#58cc02] border-b-2 border-[#58a700] text-white active:border-b-0 active:translate-y-[2px]"
                      : "bg-white border-2 border-b-2 border-slate-200 text-slate-700 hover:bg-slate-50 active:border-b-0 active:translate-y-[1px]"
                  }`}
                >
                  <span className="text-lg">👶</span>
                  <span>{learner.display_name || learner.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                    activeMemberId === learner.learner_id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    🔥 {learner.learning_streak || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Profile Progress Details */}
          {activeMemberId === "parent" && selfProgress ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 px-2">
                <span className="text-2xl">🧑‍🏫</span>
                <div>
                  <h3 className="font-black text-lg text-slate-800 m-0">Tiến độ học tập của Ba/Mẹ</h3>
                  <p className="text-slate-500 text-[10px] font-bold m-0 mt-0.5">Dữ liệu tự học và luyện tập của chính bạn</p>
                </div>
              </div>
              <LearnerProgressDetails data={selfProgress} topics={topics} />
            </div>
          ) : (
            (() => {
              const selectedKid = linkedLearners.find((l: any) => l.learner_id === activeMemberId);
              if (selectedKid) {
                return (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2.5 px-2">
                      <span className="text-2xl">👶</span>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 m-0">Tiến độ của bé {selectedKid.display_name || selectedKid.username}</h3>
                        <p className="text-slate-500 text-[10px] font-bold m-0 mt-0.5">Kết quả học tập đồng bộ trực tiếp từ bé</p>
                      </div>
                    </div>
                    <LearnerProgressDetails data={selectedKid} topics={topics} />
                  </div>
                );
              }
              return (
                <div className="bg-white border-2 border-b-2 border-slate-200 rounded-[28px] p-8 text-center text-slate-400 font-bold">
                  Chưa chọn thành viên nào để xem chi tiết.
                </div>
              );
            })()
          )}

          {/* Link Kids Notice if no kids are linked */}
          {linkedLearners.length === 0 && (
            <div className="bg-[#fffbeb] border border-amber-250 rounded-[24px] p-5 text-center text-amber-800 font-bold text-xs">
              <p className="m-0 leading-relaxed">
                💡 Ba mẹ chưa liên kết với tài khoản của bé nào. Hãy vào mục <strong>Tài khoản</strong> để gửi yêu cầu kết nối với bé nhé!
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
