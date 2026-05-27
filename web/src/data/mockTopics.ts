import type { Topic } from "../types/learn";

export const MOCK_EXTRA_TOPICS: Topic[] = [
  {
    id: "mock-topic-3",
    title: "Gia đình & Người thân",
    subtitle: "Học từ vựng về các thành viên trong gia đình",
    word_count: 8,
    checkpoint_sizes: [5, 8],
    glosses: ["BỐ", "MẸ", "ANH", "CHỊ", "EM", "ÔNG", "BÀ", "CON"],
    words: Array.from({ length: 8 }, (_, i) => ({
      order: i,
      gloss: ["BỐ", "MẸ", "ANH", "CHỊ", "EM", "ÔNG", "BÀ", "CON"][i],
      checkpoint_group: i < 5 ? 1 : 2,
      study: { gloss: "", video_id: "", score: 0, poster_url: "", reference: { video_url: "", playback_url: "", segment: null, video_filename: "" } },
    })),
  },
  {
    id: "mock-topic-4",
    title: "Màu sắc & Hình dạng",
    subtitle: "Khám phá thế giới màu sắc và hình khối qua ngôn ngữ ký hiệu",
    word_count: 10,
    checkpoint_sizes: [5, 10],
    glosses: ["ĐỎ", "XANH", "VÀNG", "TRẮNG", "ĐEN", "CAM", "TÍM", "HỒNG", "TRÒN", "VUÔNG"],
    words: Array.from({ length: 10 }, (_, i) => ({
      order: i,
      gloss: ["ĐỎ", "XANH", "VÀNG", "TRẮNG", "ĐEN", "CAM", "TÍM", "HỒNG", "TRÒN", "VUÔNG"][i],
      checkpoint_group: i < 5 ? 1 : 2,
      study: { gloss: "", video_id: "", score: 0, poster_url: "", reference: { video_url: "", playback_url: "", segment: null, video_filename: "" } },
    })),
  },
];
