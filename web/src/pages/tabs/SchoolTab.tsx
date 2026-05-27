import { useEffect, useMemo, useState } from "react";
import { DashboardPlaceholder } from "../../components/DashboardPlaceholder";
import { AIRecommendationBox } from "../../components/AIRecommendationBox";
import { useAuth } from "../../contexts/AuthContext";
import type { Topic } from "../../types/learn";
import { LearnerProgressDetails } from "./ProgressTab";

type SchoolView = "overview" | "students";

interface SchoolTabProps {
  topics: Topic[];
  loadingDash: boolean;
  schoolDashData: any;
  loadingAI: boolean;
  onRefreshAI: () => Promise<void>;
  selectedStudentId: string;
  selectedStudentProgress: any;
  loadingStudentProgress: boolean;
  onSelectStudent: (id: string) => void;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDateLabel(value?: string | null): string {
  if (!value) return "Chưa học";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa học";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isWithinDays(value: string | undefined, days: number): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

function getCompletedTopics(student: any): number {
  return (student.topic_progress || []).filter((topic: any) => topic.completed).length;
}

function getStudiedWords(student: any): number {
  return (student.topic_progress || []).reduce(
    (sum: number, topic: any) => sum + (topic.completed_words || 0),
    0
  );
}

function getAttemptStats(student: any) {
  const attempts = student.recent_attempts || [];
  const scores = attempts.map((attempt: any) => Number(attempt.score || 0));
  const acceptedAttempts = attempts.filter((attempt: any) => attempt.accepted);
  const lastAttempt = attempts[0];

  return {
    attempts,
    averageScore: attempts.length ? average(scores) : 0,
    acceptedRate: attempts.length ? (acceptedAttempts.length / attempts.length) * 100 : 0,
    lastAttemptAt: lastAttempt?.created_at ?? null,
  };
}

function getSupportWords(student: any): string[] {
  const attempts = student.recent_attempts || [];
  const counters = new Map<string, number>();

  attempts.forEach((attempt: any) => {
    const weakAttempt = !attempt.accepted || Number(attempt.score || 0) < 70;
    if (!weakAttempt || !attempt.target_gloss) return;
    counters.set(attempt.target_gloss, (counters.get(attempt.target_gloss) || 0) + 1);
  });

  return [...counters.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([gloss]) => gloss);
}

function getStudentStatus(student: any, totalTopicCount: number) {
  const { attempts, averageScore, lastAttemptAt } = getAttemptStats(student);
  const completedTopics = getCompletedTopics(student);

  if (!attempts.length || !isWithinDays(lastAttemptAt ?? undefined, 10)) {
    return {
      tone: "slate",
      label: "Cần theo dõi",
      reason: "Ít hoạt động",
    };
  }

  if (averageScore < 65 || completedTopics === 0) {
    return {
      tone: "amber",
      label: "Cần hỗ trợ",
      reason: "Điểm còn thấp",
    };
  }

  if (completedTopics >= Math.max(1, totalTopicCount) || averageScore >= 85) {
    return {
      tone: "emerald",
      label: "Tiến bộ nổi bật",
      reason: "Kết quả học tập tốt và ổn định",
    };
  }

  return {
    tone: "sky",
    label: "Đúng tiến độ",
    reason: "Đang theo kịp lộ trình học",
  };
}

function statusClasses(tone: string): string {
  switch (tone) {
    case "emerald":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "amber":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "sky":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function SchoolTab({
  topics,
  loadingDash,
  schoolDashData,
  loadingAI,
  onRefreshAI,
  selectedStudentId,
  selectedStudentProgress,
  loadingStudentProgress,
  onSelectStudent,
}: SchoolTabProps) {
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState<SchoolView>("overview");
  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const learners = schoolDashData?.linked_learners || [];
  const topicCount = Math.max(topics.length, 1);

  const classOptions = useMemo<string[]>(
    () => {
      const classNames = learners
        .map((student: any) => student.class_name as string | undefined)
        .filter((className: string | undefined): className is string => Boolean(className));
      return Array.from(new Set<string>(classNames)).sort((left, right) =>
        left.localeCompare(right)
      );
    },
    [learners]
  );

  const filteredLearners = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return learners.filter((student: any) => {
      const matchesClass = classFilter === "all" || student.class_name === classFilter;
      const haystack = [
        student.display_name,
        student.username,
        student.student_code,
        student.class_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesClass && matchesSearch;
    });
  }, [classFilter, learners, searchQuery]);

  useEffect(() => {
    if (!filteredLearners.length) return;
    const selectedExists = filteredLearners.some(
      (student: any) => student.learner_id === selectedStudentId
    );
    if (!selectedExists) {
      onSelectStudent(filteredLearners[0].learner_id);
    }
  }, [filteredLearners, onSelectStudent, selectedStudentId]);

  const classroomAttempts = useMemo<any[]>(
    () =>
      filteredLearners
        .flatMap((student: any) =>
          (student.recent_attempts || []).map((attempt: any) => ({
            ...attempt,
            student_name: student.display_name || student.username,
            learner_id: student.learner_id,
          }))
        )
        .sort(
          (left: any, right: any) =>
            new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        ),
    [filteredLearners]
  );

  const aggregateStats = useMemo(() => {
    const attemptScores = classroomAttempts.map((attempt: any) => Number(attempt.score || 0));
    const totalXp = filteredLearners.reduce(
      (sum: number, student: any) => sum + Number(student.xp || 0),
      0
    );
    const totalBadges = filteredLearners.reduce(
      (sum: number, student: any) => sum + (student.badges?.length || 0),
      0
    );
    const activeStudents = filteredLearners.filter((student: any) =>
      isWithinDays(getAttemptStats(student).lastAttemptAt ?? undefined, 7)
    ).length;
    const completedTopics = filteredLearners.reduce(
      (sum: number, student: any) => sum + getCompletedTopics(student),
      0
    );
    const supportStudents = filteredLearners.filter((student: any) => {
      const status = getStudentStatus(student, topicCount);
      return status.tone === "amber" || status.tone === "slate";
    }).length;

    return {
      totalStudents: filteredLearners.length,
      activeStudents,
      supportStudents,
      averageScore: attemptScores.length ? average(attemptScores) : 0,
      averageXp: filteredLearners.length ? totalXp / filteredLearners.length : 0,
      averageStreak: filteredLearners.length
        ? average(filteredLearners.map((student: any) => Number(student.learning_streak || 0)))
        : 0,
      totalBadges,
      topicCompletionRate:
        filteredLearners.length > 0
          ? (completedTopics / (filteredLearners.length * topicCount)) * 100
          : 0,
      totalAttempts: classroomAttempts.length,
    };
  }, [classroomAttempts, filteredLearners, topicCount]);

  const classBreakdown = useMemo<
    Array<{ className: string; count: number; averageXp: number; averageScore: number }>
  >(
    () =>
      classOptions.map((className) => {
        const members = learners.filter((student: any) => student.class_name === className);
        const xpValues = members.map((student: any) => Number(student.xp || 0));
        const avgScoreValues = members.flatMap((student: any) =>
          (student.recent_attempts || []).map((attempt: any) => Number(attempt.score || 0))
        );
        return {
          className,
          count: members.length,
          averageXp: xpValues.length ? average(xpValues) : 0,
          averageScore: avgScoreValues.length ? average(avgScoreValues) : 0,
        };
      }),
    [classOptions, learners]
  );

  const topPerformers = useMemo(
    () =>
      [...filteredLearners]
        .sort((left: any, right: any) => {
          const xpGap = Number(right.xp || 0) - Number(left.xp || 0);
          if (xpGap !== 0) return xpGap;
          return getAttemptStats(right).averageScore - getAttemptStats(left).averageScore;
        })
        .slice(0, 5),
    [filteredLearners]
  );

  const supportList = useMemo(
    () =>
      [...filteredLearners]
        .filter((student: any) => {
          const status = getStudentStatus(student, topicCount);
          return status.tone === "amber" || status.tone === "slate";
        })
        .sort(
          (left: any, right: any) =>
            getAttemptStats(left).averageScore - getAttemptStats(right).averageScore
        )
        .slice(0, 6),
    [filteredLearners, topicCount]
  );

  const hotspotWords = useMemo<Array<[string, number]>>(() => {
    const counters = new Map<string, number>();
    filteredLearners.forEach((student: any) => {
      getSupportWords(student).forEach((gloss) => {
        counters.set(gloss, (counters.get(gloss) || 0) + 1);
      });
    });
    return [...counters.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6);
  }, [filteredLearners]);

  const selectedStudentSummary =
    filteredLearners.find((student: any) => student.learner_id === selectedStudentId) ||
    learners.find((student: any) => student.learner_id === selectedStudentId) ||
    null;
  const selectedStudentData = selectedStudentProgress || selectedStudentSummary;
  const selectedAttemptStats = selectedStudentData ? getAttemptStats(selectedStudentData) : null;
  const selectedSupportWords = selectedStudentData ? getSupportWords(selectedStudentData) : [];
  const selectedStatus = selectedStudentData
    ? getStudentStatus(selectedStudentData, topicCount)
    : null;

  if (currentUser?.role !== "school") {
    return (
      <DashboardPlaceholder
        title="Dashboard giáo viên"
        description="Đăng nhập bằng tài khoản giáo viên để xem lớp học."
      />
    );
  }

  const statCards = [
    {
      label: "Học sinh",
      value: aggregateStats.totalStudents,
      hint: `${aggregateStats.activeStudents} hoạt động gần đây`,
      accent: "from-sky-500 to-cyan-400",
      soft: "bg-sky-50 text-sky-700",
      icon: "👩‍🎓",
    },
    {
      label: "Điểm TB",
      value: `${Math.round(aggregateStats.averageScore)}đ`,
      hint: `${aggregateStats.totalAttempts} lượt gần nhất`,
      accent: "from-emerald-500 to-lime-400",
      soft: "bg-emerald-50 text-emerald-700",
      icon: "📈",
    },
    {
      label: "Hoàn thành",
      value: `${Math.round(aggregateStats.topicCompletionRate)}%`,
      hint: `${aggregateStats.supportStudents} cần hỗ trợ`,
      accent: "from-violet-500 to-indigo-400",
      soft: "bg-violet-50 text-violet-700",
      icon: "🧭",
    },
    {
      label: "XP trung bình",
      value: `${Math.round(aggregateStats.averageXp)}`,
      hint: `${aggregateStats.totalBadges} huy hiệu`,
      accent: "from-amber-400 to-orange-400",
      soft: "bg-amber-50 text-amber-700",
      icon: "⭐",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#0ea5e9_0%,#1d4ed8_55%,#312e81_100%)] px-6 py-7 text-white shadow-[0_22px_50px_rgba(29,78,216,0.24)]">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="absolute right-20 top-16 h-20 w-20 rounded-full bg-cyan-300/15" />
        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="m-0 text-xs uppercase tracking-[0.22em] text-sky-100 font-black">
              Lớp học
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <h2 className="m-0 text-3xl font-black leading-tight">
                  Dashboard giáo viên
                </h2>
                <p className="m-0 max-w-3xl text-sm font-bold leading-relaxed text-sky-50/95">
                  Xem tình hình lớp, điểm số và tiến độ của từng học sinh.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur"
                  >
                    <div className="text-2xl">{card.icon}</div>
                    <div className="mt-3 text-2xl font-black leading-none">{card.value}</div>
                    <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-sky-100/90">
                      {card.label}
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-sky-50/80">{card.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] bg-white/10 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveView("overview")}
                className={`rounded-full px-4 py-2 text-sm font-black transition-all ${
                  activeView === "overview"
                    ? "bg-white text-sky-700"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Tổng quan
              </button>
              <button
                type="button"
                onClick={() => setActiveView("students")}
                className={`rounded-full px-4 py-2 text-sm font-black transition-all ${
                  activeView === "students"
                    ? "bg-white text-sky-700"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Học sinh
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[180px_minmax(220px,1fr)]">
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="rounded-2xl border border-white/15 bg-white/95 px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả lớp</option>
                {classOptions.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm học sinh..."
                className="rounded-2xl border border-white/15 bg-white/95 px-4 py-2 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {!loadingDash && schoolDashData?.ai_recommendation && (
        <AIRecommendationBox
          aiRecommendation={schoolDashData.ai_recommendation}
          onRefresh={onRefreshAI}
          loading={loadingAI}
          role="school"
        />
      )}

      {loadingDash ? (
        <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-8 text-center font-bold text-slate-400">
          Đang tải dữ liệu lớp học...
        </div>
      ) : !learners.length ? (
        <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-8 text-center font-bold text-slate-500">
          Chưa có học sinh được liên kết.
        </div>
      ) : activeView === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                    Nổi bật
                  </p>
                  <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                    Học sinh có kết quả tốt
                  </h3>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                  {filteredLearners.length} bạn
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {topPerformers.map((student: any, index: number) => {
                  const stats = getAttemptStats(student);
                  const status = getStudentStatus(student, topicCount);
                  return (
                    <button
                      key={student.learner_id}
                      type="button"
                      onClick={() => {
                        onSelectStudent(student.learner_id);
                        setActiveView("students");
                      }}
                      className="grid gap-3 rounded-[24px] border-2 border-slate-100 bg-slate-50 p-4 text-left transition-all hover:-translate-y-[1px] hover:border-sky-200 hover:bg-sky-50/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-lg font-black text-white">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="text-base font-black text-slate-800">
                              {student.display_name || student.username}
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              @{student.username} • {student.class_name || "Chưa có lớp"}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusClasses(status.tone)}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            XP
                          </div>
                          <div className="mt-1 text-lg font-black text-slate-800">
                              {student.xp || 0}
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Điểm TB
                          </div>
                          <div className="mt-1 text-lg font-black text-slate-800">
                            {Math.round(stats.averageScore)}đ
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Chủ đề
                          </div>
                          <div className="mt-1 text-lg font-black text-slate-800">
                            {getCompletedTopics(student)}/{topicCount}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Lần cuối
                          </div>
                          <div className="mt-1 text-sm font-black text-slate-700">
                            {formatDateLabel(stats.lastAttemptAt)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                    Cần lưu ý
                  </p>
                  <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                    Học sinh cần hỗ trợ thêm
                  </h3>
                </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    {supportList.length} bạn
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {supportList.length ? (
                    supportList.map((student: any) => {
                      const stats = getAttemptStats(student);
                      const status = getStudentStatus(student, topicCount);
                      const supportWords = getSupportWords(student);
                      return (
                        <button
                          key={student.learner_id}
                          type="button"
                          onClick={() => {
                            onSelectStudent(student.learner_id);
                            setActiveView("students");
                          }}
                          className="rounded-[24px] border-2 border-amber-100 bg-amber-50/70 p-4 text-left transition-all hover:-translate-y-[1px] hover:border-amber-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-black text-slate-800">
                                {student.display_name || student.username}
                              </div>
                              <div className="text-xs font-bold text-slate-500">
                                {student.class_name || "Chưa có lớp"} • {status.reason}
                              </div>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusClasses(status.tone)}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Điểm TB
                              </div>
                              <div className="mt-1 text-lg font-black text-slate-800">
                                {Math.round(stats.averageScore)}đ
                              </div>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Chuỗi học
                              </div>
                              <div className="mt-1 text-lg font-black text-slate-800">
                                {student.learning_streak || 0} ngày
                              </div>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Cần ôn
                          </div>
                          <div className="mt-1 text-sm font-black text-slate-700">
                                {supportWords.length ? supportWords.join(", ") : "Chưa đủ dữ liệu"}
                          </div>
                        </div>
                      </div>
                        </button>
                      );
                    })
                  ) : (
                  <div className="rounded-[24px] border-2 border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                      Không có học sinh cần lưu ý theo bộ lọc này.
                  </div>
                )}
              </div>
              </div>

              <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
              <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                  Cần ôn chung
              </p>
              <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                  Từ nhiều học sinh còn khó
              </h3>
                <div className="mt-5 flex flex-wrap gap-2">
                  {hotspotWords.length ? (
                    hotspotWords.map(([gloss, count]) => (
                      <span
                        key={gloss}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"
                      >
                        {gloss}
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-rose-600">
                          {count} bạn
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-bold text-slate-500">
                      Chưa đủ dữ liệu.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                    Học sinh
                  </p>
                  <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                    Theo dõi nhanh
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {filteredLearners.length} hồ sơ
                </span>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      <th className="px-3 py-3 font-black">Học sinh</th>
                      <th className="px-3 py-3 font-black">Lớp / mã học sinh</th>
                      <th className="px-3 py-3 font-black">Điểm TB</th>
                      <th className="px-3 py-3 font-black">XP</th>
                      <th className="px-3 py-3 font-black">Chủ đề</th>
                      <th className="px-3 py-3 font-black">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLearners.map((student: any) => {
                      const stats = getAttemptStats(student);
                      const status = getStudentStatus(student, topicCount);
                      return (
                        <tr
                          key={student.learner_id}
                          className="cursor-pointer transition-colors hover:bg-sky-50/60"
                          onClick={() => {
                            onSelectStudent(student.learner_id);
                            setActiveView("students");
                          }}
                        >
                          <td className="px-3 py-4">
                            <div className="font-black text-slate-800">
                              {student.display_name || student.username}
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                              @{student.username}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm font-bold text-slate-600">
                            <div>{student.class_name || "Chưa có lớp"}</div>
                            <div className="font-mono text-xs text-slate-500">
                              {student.student_code || "--"}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm font-black text-slate-800">
                            {Math.round(stats.averageScore)}đ
                          </td>
                          <td className="px-3 py-4 text-sm font-black text-sky-700">
                            {student.xp || 0}
                          </td>
                          <td className="px-3 py-4 text-sm font-black text-slate-800">
                            {getCompletedTopics(student)}/{topicCount}
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusClasses(status.tone)}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                    Phân bố theo lớp
                  </p>
                  <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                    Theo từng lớp
                  </h3>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                  {classBreakdown.length} lớp
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {classBreakdown.length ? (
                  classBreakdown.map((item) => (
                    <div
                      key={item.className}
                      className="rounded-[24px] border-2 border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-base font-black text-slate-800">{item.className}</div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                          {item.count} bạn
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Điểm TB
                          </div>
                          <div className="mt-1 text-lg font-black text-slate-800">
                            {Math.round(item.averageScore)}đ
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            XP trung bình
                          </div>
                          <div className="mt-1 text-lg font-black text-slate-800">
                            {Math.round(item.averageXp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border-2 border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                    Chưa có dữ liệu theo lớp.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                  Gần đây
                </p>
                <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                  Lượt luyện tập mới nhất
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {classroomAttempts.length} lượt
              </span>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {classroomAttempts.slice(0, 8).map((attempt: any) => (
                <button
                  key={attempt.id}
                  type="button"
                  onClick={() => {
                    onSelectStudent(attempt.learner_id);
                    setActiveView("students");
                  }}
                  className="flex items-center justify-between gap-4 rounded-[24px] border-2 border-slate-100 bg-slate-50 p-4 text-left transition-all hover:-translate-y-[1px] hover:border-sky-200 hover:bg-sky-50/50"
                >
                  <div>
                    <div className="text-base font-black text-slate-800">
                      {attempt.student_name}
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                      {attempt.target_gloss} •{" "}
                      {attempt.practice_mode === "practice_i" ? "Luyện tập" : "Bài kiểm tra"} •{" "}
                      {formatDateLabel(attempt.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-800">
                      {Math.round(Number(attempt.score || 0))}đ
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-black ${
                        attempt.accepted
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {attempt.accepted ? "Đạt" : "Cần ôn"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-5">
            <div className="border-b border-slate-100 pb-4">
              <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                Danh sách học sinh
              </p>
              <h3 className="m-0 mt-1 text-2xl font-black text-slate-800">
                Chọn học sinh
              </h3>
            </div>
            <div className="mt-4 grid gap-3">
              {filteredLearners.length ? (
                filteredLearners.map((student: any) => {
                  const stats = getAttemptStats(student);
                  const status = getStudentStatus(student, topicCount);
                  const isActive = student.learner_id === selectedStudentId;
                  return (
                    <button
                      key={student.learner_id}
                      type="button"
                      onClick={() => onSelectStudent(student.learner_id)}
                      className={`rounded-[24px] border-2 p-4 text-left transition-all ${
                        isActive
                          ? "border-sky-300 bg-sky-50 shadow-[0_12px_24px_rgba(14,165,233,0.12)]"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-black text-slate-800">
                            {student.display_name || student.username}
                          </div>
                          <div className="text-xs font-bold text-slate-500">
                            @{student.username}
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusClasses(status.tone)}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Lớp
                          </div>
                          <div className="mt-1 text-sm font-black text-slate-800">
                            {student.class_name || "Chưa có lớp"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Điểm TB
                          </div>
                          <div className="mt-1 text-sm font-black text-slate-800">
                            {Math.round(stats.averageScore)}đ
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            XP
                          </div>
                          <div className="mt-1 text-sm font-black text-sky-700">
                            {student.xp || 0}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Chủ đề
                          </div>
                          <div className="mt-1 text-sm font-black text-slate-800">
                            {getCompletedTopics(student)}/{topicCount}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border-2 border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Không tìm thấy học sinh phù hợp.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {loadingStudentProgress ? (
              <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-8 text-center font-bold text-slate-400">
                Đang tải tiến độ...
              </div>
            ) : selectedStudentData ? (
              <>
                <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                        Học sinh
                      </p>
                      <h3 className="m-0 text-3xl font-black text-slate-800">
                        {selectedStudentData.display_name || selectedStudentData.username}
                      </h3>
                      <p className="m-0 text-sm font-bold text-slate-500">
                        @{selectedStudentData.username} • {selectedStudentSummary?.class_name || "Chưa có lớp"} •{" "}
                        {selectedStudentSummary?.student_code || "Chưa có mã học sinh"}
                      </p>
                    </div>
                    {selectedStatus && (
                      <div
                        className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${statusClasses(selectedStatus.tone)}`}
                      >
                        {selectedStatus.label}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        XP tích lũy
                      </div>
                      <div className="mt-2 text-3xl font-black text-slate-800">
                        {selectedStudentData.xp || 0}
                      </div>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Chuỗi học
                      </div>
                      <div className="mt-2 text-3xl font-black text-slate-800">
                        {selectedStudentData.learning_streak || 0}
                      </div>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Điểm TB
                      </div>
                      <div className="mt-2 text-3xl font-black text-slate-800">
                        {Math.round(selectedAttemptStats?.averageScore || 0)}đ
                      </div>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Chủ đề đã xong
                      </div>
                      <div className="mt-2 text-3xl font-black text-slate-800">
                        {getCompletedTopics(selectedStudentData)}/{topicCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
                    <div className="border-b border-slate-100 pb-4">
                      <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                        Góc nhìn giáo viên
                      </p>
                      <h4 className="m-0 mt-1 text-2xl font-black text-slate-800">
                        Theo dõi nhanh
                      </h4>
                    </div>
                    <div className="mt-5 grid gap-4">
                      <div className="rounded-[24px] bg-slate-50 p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Lần học gần nhất
                        </div>
                        <div className="mt-2 text-base font-black text-slate-800">
                          {formatDateLabel(selectedAttemptStats?.lastAttemptAt ?? undefined)}
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-500">
                          Tỷ lệ đạt: {Math.round(selectedAttemptStats?.acceptedRate || 0)}%
                        </div>
                      </div>

                      <div className="rounded-[24px] bg-slate-50 p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Cần ôn
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedSupportWords.length ? (
                            selectedSupportWords.map((gloss) => (
                              <span
                                key={gloss}
                                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700"
                              >
                                {gloss}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm font-bold text-slate-500">
                              Chưa có từ nào cần chú ý.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[24px] bg-slate-50 p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Tiến độ từ vựng
                        </div>
                        <div className="mt-2 text-base font-black text-slate-800">
                          {getStudiedWords(selectedStudentData)} từ đã học
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-500">
                          {selectedStudentData.badges?.length || 0} huy hiệu
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-6">
                    <div className="border-b border-slate-100 pb-4">
                      <p className="m-0 text-xs uppercase tracking-[0.18em] text-slate-400 font-black">
                        Lịch sử gần đây
                      </p>
                      <h4 className="m-0 mt-1 text-2xl font-black text-slate-800">
                        Lượt luyện tập gần đây
                      </h4>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {(selectedStudentData.recent_attempts || []).length ? (
                        (selectedStudentData.recent_attempts || []).map((attempt: any) => (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between gap-4 rounded-[24px] border-2 border-slate-100 bg-slate-50 p-4"
                          >
                            <div>
                              <div className="text-base font-black text-slate-800">
                                {attempt.target_gloss}
                              </div>
                              <div className="mt-1 text-xs font-bold text-slate-500">
                                {attempt.practice_mode === "practice_i" ? "Luyện tập" : "Bài kiểm tra"} •{" "}
                                {formatDateLabel(attempt.created_at)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-black text-slate-800">
                                {Math.round(Number(attempt.score || 0))}đ
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-black ${
                                  attempt.accepted
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {attempt.accepted ? "Đạt" : "Cần ôn"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[24px] border-2 border-slate-100 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                          Chưa có lịch sử luyện tập.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <LearnerProgressDetails data={selectedStudentData} topics={topics} />
              </>
            ) : (
              <div className="rounded-[32px] border-2 border-b-4 border-slate-200 bg-white p-8 text-center font-bold text-slate-400">
                Chọn một học sinh để xem tiến độ.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
