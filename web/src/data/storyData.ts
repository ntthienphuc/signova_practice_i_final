import type { Story } from "../types/story";

export const STORIES: Story[] = [
  {
    id: "tho-va-gau-ket-ban",
    title: "Thỏ và Gấu kết bạn",
    description: "Thỏ học cách quan tâm, biết dừng lại khi bạn không thoải mái và nhờ giúp đỡ đúng lúc.",
    emoji: "🐰",
    category: "emotions",
    difficulty: "easy",
    scenes: [
      {
        id: "tho-nho-giup-do",
        sceneNumber: 1,
        contextTitle: "Nếu là Gấu, bạn sẽ làm gì?",
        contextDescription:
          "Bạn Thỏ làm rơi hết màu rồi. Con sẽ làm gì để giúp bạn?",
        characterEmoji: "🐰",
        sceneEmoji: "🌳",
        targetGloss: "Giúp đỡ",
        lessonGlosses: ["Giúp đỡ", "Làm bài tập", "Dụng cụ học tập"],
        successMessage: "Thỏ đã biết nhờ giúp đỡ một cách rõ ràng. Gấu vui vẻ cùng dọn dẹp!",
        failMessage: "Thỏ vẫn chưa nói đúng điều mình cần. Mình thử lại chậm hơn nhé.",
        wrongWordMessage: "Ký hiệu vừa rồi đang giống từ khác hơn. Con hãy chọn lại điều Thỏ cần nói với Gấu.",
      },
      {
        id: "gau-khong-muon-choi-nguy-hiem",
        sceneNumber: 2,
        contextTitle: "Gấu nhắc Thỏ dừng lại",
        contextDescription:
          "Thỏ muốn chạy qua bãi đá trơn để lấy trái bóng. Gấu thấy việc đó có thể làm Thỏ ngã nên cần một ký hiệu để nhắc bạn dừng lại.",
        characterEmoji: "🐻",
        sceneEmoji: "🪨",
        targetGloss: "Không nên",
        lessonGlosses: ["Không nên", "Giúp đỡ", "Làm bài tập"],
        successMessage: "Gấu đã nhắc bạn đúng cách. Thỏ dừng lại và chọn lối đi an toàn hơn!",
        failMessage: "Lời nhắc của Gấu chưa rõ lắm. Con thử lại với động tác chắc chắn hơn nhé.",
        wrongWordMessage: "Mascot thấy ký hiệu này giống một từ khác. Hãy giúp Gấu nói đúng ý cần nói.",
      },
      {
        id: "hai-ban-thay-cun-lac",
        sceneNumber: 3,
        contextTitle: "Hai bạn thấy một chú cún",
        contextDescription:
          "Trên đường về nhà, Thỏ và Gấu thấy một bạn nhỏ bốn chân đi lạc. Hai bạn cần gọi đúng tên để nhờ người lớn giúp.",
        characterEmoji: "🐻",
        sceneEmoji: "🏡",
        targetGloss: "Con chó",
        lessonGlosses: ["Con chó", "Cầu lông", "Nhảy dây"],
        successMessage: "Đúng rồi, hai bạn đã nhận ra chú cún và nhờ người lớn hỗ trợ!",
        failMessage: "Mình cần nói rõ hơn để mọi người biết hai bạn đang thấy gì.",
        wrongWordMessage: "Ký hiệu vừa rồi đang nghiêng sang một từ khác. Con thử lại từ đúng với tình huống nhé.",
      },
    ],
  },
  {
    id: "be-di-hoc",
    title: "Bé đi học",
    description: "Một buổi đến lớp nhẹ nhàng: chuẩn bị đồ dùng, làm bài và biết nhờ bạn hỗ trợ.",
    emoji: "🎒",
    category: "daily_life",
    difficulty: "easy",
    scenes: [
      {
        id: "be-chuan-bi-do-dung",
        sceneNumber: 1,
        contextTitle: "Bé sắp xếp cặp sách",
        contextDescription:
          "Trước khi vào lớp, bé cần lấy đúng món đồ trong cặp để sẵn sàng cho tiết học vẽ. Bạn bên cạnh cần hiểu bé đang tìm gì.",
        characterEmoji: "🧒",
        sceneEmoji: "📚",
        targetGloss: "Dụng cụ học tập",
        lessonGlosses: ["Dụng cụ học tập", "Làm bài tập", "Trường Cao đẳng"],
        successMessage: "Bé đã chuẩn bị đúng đồ dùng học tập và sẵn sàng vào bài!",
        failMessage: "Bạn bè chưa hiểu bé đang tìm gì. Mình thử lại rõ hơn nhé.",
        wrongWordMessage: "Ký hiệu này đang giống một lựa chọn khác. Con hãy giúp bé nói đúng món cần dùng.",
      },
      {
        id: "be-lam-bai-cung-ban",
        sceneNumber: 2,
        contextTitle: "Bé bắt đầu nhiệm vụ trên lớp",
        contextDescription:
          "Cô giáo đưa bài tập nhỏ cho cả lớp. Bé muốn nói với bạn rằng mình đang tập trung hoàn thành nhiệm vụ.",
        characterEmoji: "🧒",
        sceneEmoji: "✏️",
        targetGloss: "Làm bài tập",
        lessonGlosses: ["Làm bài tập", "Dụng cụ học tập", "Trường Cao đẳng"],
        successMessage: "Bé đã nói đúng việc mình đang làm. Bạn bên cạnh cũng tập trung học!",
        failMessage: "Thông điệp của bé chưa rõ. Mình làm lại chậm và gọn hơn nhé.",
        wrongWordMessage: "Mascot nhận ra một từ khác. Con thử lại ký hiệu phù hợp với giờ học nhé.",
      },
      {
        id: "be-can-ban-ho-tro",
        sceneNumber: 3,
        contextTitle: "Bé gặp câu khó",
        contextDescription:
          "Đến câu cuối, bé bị lúng túng và muốn nhờ bạn ngồi cạnh chỉ lại cách làm. Bé cần một ký hiệu lịch sự để mở lời.",
        characterEmoji: "🧒",
        sceneEmoji: "🤝",
        targetGloss: "Giúp đỡ",
        lessonGlosses: ["Giúp đỡ", "Làm bài tập", "Dụng cụ học tập"],
        successMessage: "Bé đã biết nhờ giúp đỡ. Bạn cùng giải thích và hai bạn cùng tiến bộ!",
        failMessage: "Lời nhờ của bé chưa đủ rõ. Mình thử lại với động tác chậm hơn nhé.",
        wrongWordMessage: "Ký hiệu vừa rồi đang giống từ khác. Hãy giúp bé nói đúng lời nhờ hỗ trợ.",
      },
    ],
  },
];

export function getStoryById(storyId: string | undefined): Story | undefined {
  return STORIES.find((story) => story.id === storyId);
}
