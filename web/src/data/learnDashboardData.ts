import type { DashboardPayload, Topic } from "../types/learn";

export type { Topic };

/** UI-only accent color per topic id — calibrated cleanly to the new backend ids. */
export const TOPIC_COLORS: Record<string, string> = {
  "topic_1": "#22C55E", // Bright Green
  "topic_2": "#0EA5E9", // Vibrant Blue/Cyan
  "topic_3": "#6366F1", // Indigo
};

/** Helper constructor matching the real backend signature schema exactly */
function createWord(
  order: number,
  gloss: string,
  checkpointGroup: number,
  videoId: string,
  score: number,
  encodedGloss: string,
  videoFilename: string
) {
  return {
    order,
    gloss,
    checkpoint_group: checkpointGroup,
    study: {
      gloss,
      video_id: videoId,
      score,
      poster_url: `/poster/reference/${encodedGloss}`,
      reference: {
        video_url: `/reference-video/${encodedGloss}`,
        playback_url: `/playback/reference/${encodedGloss}`,
        segment: null,
        video_filename: videoFilename,
      },
    },
  };
}

export const MOCK_DASHBOARD: DashboardPayload = {
  topics: [
    {
      id: "topic_1",
      title: "Chủ đề 1",
      subtitle: "10 từ đầu tiên",
      word_count: 10,
      checkpoint_sizes: [5, 10],
      glosses: [
        "Làm bài tập",
        "Không nên",
        "Tường",
        "Mới",
        "Cầu lông",
        "Thái Lan",
        "Trường Cao đẳng",
        "Con chó",
        "Quần đùi",
        "Nhân viên phục vụ"
      ],
      words: [
        createWord(1, "Làm bài tập", 1, "021028", 100.0, "L%C3%A0m%20b%C3%A0i%20t%E1%BA%ADp", "021028.mp4"),
        createWord(2, "Không nên", 1, "021267", 100.0, "Kh%C3%B4ng%20n%C3%AAn", "021267.mp4"),
        createWord(3, "Tường", 1, "020723", 100.0, "T%C6%B0%E1%BB%9Dng", "020723.mp4"),
        createWord(4, "Mới", 1, "021079", 100.0, "M%E1%BB%9Bi", "021079.mp4"),
        createWord(5, "Cầu lông", 1, "020800", 100.0, "C%E1%BA%A7u%20l%C3%B4ng", "020800.mp4"),
        createWord(6, "Thái Lan", 2, "021199", 95.0, "Th%C3%A1i%20Lan", "021199.mp4"),
        createWord(7, "Trường Cao đẳng", 2, "020634", 100.0, "Tr%C6%B0%E1%BB%9Dng%20Cao%20%C4%91%E1%BA%B3ng", "020634.mp4"),
        createWord(8, "Con chó", 2, "021301", 97.0, "Con%20ch%C3%B3", "021301.mp4"),
        createWord(9, "Quần đùi", 2, "021194", 99.0, "Qu%E1%BA%A7n%20%C4%91%C3%B9i", "021194.mp4"),
        createWord(10, "Nhân viên phục vụ", 2, "020968", 94.0, "Nh%C3%A2n%20vi%C3%AAn%20ph%E1%BB%A5c%20v%E1%BB%A5", "020968.mp4")
      ]
    },
    {
      id: "topic_2",
      title: "Chủ đề 2",
      subtitle: "10 từ tiếp theo",
      word_count: 10,
      checkpoint_sizes: [5, 10],
      glosses: [
        "Tháng mười",
        "Buổi tối",
        "Mũ",
        "Nhảy dây",
        "Bơi lội",
        "Ngày Quốc tế Lao động",
        "Hoàng hôn",
        "Dài",
        "Dụng cụ học tập",
        "Giúp đỡ"
      ],
      words: [
        createWord(1, "Tháng mười", 1, "020777", 95.0, "Th%C3%A1ng%20m%C6%B0%E1%BB%9Di", "020777.mp4"),
        createWord(2, "Buổi tối", 1, "020791", 98.0, "Bu%E1%BB%95i%20t%E1%BB%91i", "020791.mp4"),
        createWord(3, "Mũ", 1, "020860", 84.0, "M%C5%A9", "020860.mp4"),
        createWord(4, "Nhảy dây", 1, "020905", 85.0, "Nh%E1%BA%A3y%20d%C3%A2y", "020905.mp4"),
        createWord(5, "Bơi lội", 1, "020804", 86.0, "B%C6%A1i%20l%E1%BB%99i", "020804.mp4"),
        createWord(6, "Ngày Quốc tế Lao động", 2, "020667", 74.0, "Ng%C3%A0y%20Qu%E1%BB%91c%20t%E1%BA%BF%20Lao%20%C4%91%E1%BB%99ng", "020667.mp4"),
        createWord(7, "Hoàng hôn", 2, "020687", 70.0, "Ho%C3%A0ng%20h%C3%B4n", "020687.mp4"),
        createWord(8, "Dài", 2, "021383", 100.0, "D%C3%A0i", "021383.mp4"),
        createWord(9, "Dụng cụ học tập", 2, "020930", 100.0, "D%E1%BB%A5ng%20c%E1%BB%A5%20h%E1%BB%8Dc%20t%E1%BA%ADp", "020930.mp4"),
        createWord(10, "Giúp đỡ", 2, "021036", 100.0, "Gi%C3%BAp%20%C4%91%E1%BB%A1", "021036.mp4")
      ]
    }
  ]
};