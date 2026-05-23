const landingData = {
  vi: {
    nav: {
      links: [
        { label: 'Tính năng', href: '#features' },
        { label: 'Sản phẩm', href: '#products' },
        { label: 'Bảng giá', href: '#pricing' },
        { label: 'Đối tượng', href: '#users' },
      ],
      cta: 'Dùng thử miễn phí',
    },

    hero: {
      headline: 'Học Ngôn ngữ Ký hiệu Việt Nam cùng AI',
      subheadline:
        'Gia sư AI phản hồi trực quan, giúp người học biết chính xác mình sai ở đâu và cần sửa gì',
      ctaPrimary: 'Dùng thử miễn phí',
      ctaSecondary: 'Xem tính năng',
      badge: 'AI-powered · NNKH Việt Nam',
    },

    problem: {
      heading: 'Học ký hiệu không có phản hồi — học xong vẫn không biết mình đúng hay sai',
      body: 'Hầu hết nền tảng học ngôn ngữ ký hiệu chỉ cung cấp video mẫu hoặc từ điển. Người học vẫn phải tự đoán xem mình làm đúng không. Signova giải quyết khoảng trống này với phản hồi AI nhanh.',
    },

    products: {
      heading: 'Hệ sinh thái sản phẩm Signova',
      subheading: 'Giải pháp toàn diện cho người học, gia đình và nhà trường',
      items: [
        {
          icon: '📱',
          title: 'Signova Learner App',
          description:
            'Ứng dụng học NNKH tích hợp AI cho người khiếm thính, phụ huynh và học sinh. Học từng từ, luyện tập trước camera, nhận phản hồi màu đỏ/xanh chính xác từng lỗi sai.',
          tag: 'Người học',
          path: '/learn-dashboard',
        },
        {
          icon: '👨‍👩‍👧',
          title: 'Family Learning Dashboard',
          description:
            'Phụ huynh theo dõi các từ con đã học, những từ hay sai và học cùng con để tạo giao tiếp tại nhà.',
          tag: 'Gia đình',
          path: '/dashboard/family',
        },
        {
          icon: '🏫',
          title: 'School Dashboard',
          description:
            'Giáo viên tạo lớp, giao bài, theo dõi kết quả và xác định lỗi phổ biến trong lớp. Giảm tải công việc chỉnh sửa thủ công.',
          tag: 'Trường học',
          path: '/dashboard/school',
        },
        {
          icon: '🤖',
          title: 'Custom Learning Content & AI Model',
          description:
            'Trường học và trung tâm có thể yêu cầu bộ từ vựng tùy chỉnh, video mẫu và mô hình AI luyện tập theo phương ngữ địa phương hoặc chương trình riêng.',
          tag: 'Tùy chỉnh',
        },
      ],
    },

    features: {
      heading: 'Tính năng nổi bật',
      subheading: 'Công nghệ AI đặt đúng chỗ — phản hồi chính xác, học nhanh hơn',
      items: [
        {
          icon: '🎯',
          title: 'Phản hồi AI trực quan',
          description:
            'Overlay màu đỏ/xanh lá trên video người học so với video mẫu. Hiển thị chính xác vị trí tay, hướng chuyển động hoặc tốc độ sai.',
        },
        {
          icon: '🔤',
          title: 'Luyện tập theo từng từ',
          description:
            'Tập trung vào một từ tại một thời điểm — phản hồi chính xác hơn, dễ kiểm tra hơn, thực tế hơn cho lớp học và gia đình.',
        },
        {
          icon: '👨‍👩‍👧‍👦',
          title: 'Chế độ học gia đình',
          description:
            'Phụ huynh học cùng từ với con và theo dõi tiến bộ. Biến ứng dụng thành công cụ giao tiếp gia đình.',
        },
        {
          icon: '📊',
          title: 'Phân tích lớp học',
          description:
            'Giáo viên xem mẫu lỗi của từng học sinh và toàn lớp. Lập kế hoạch bài học dựa trên dữ liệu mà không cần quan sát thủ công.',
        },
      ],
    },

    targetUsers: {
      heading: 'Dành cho ai?',
      subheading: 'Signova phục vụ toàn bộ hệ sinh thái giáo dục hòa nhập',
      items: [
        {
          icon: '🏠',
          title: 'Gia đình',
          description:
            'Phụ huynh có con khiếm thính muốn học và theo dõi tiến bộ của con',
        },
        {
          icon: '🏫',
          title: 'Trường học & Trung tâm',
          description:
            'Giáo dục đặc biệt, giáo dục hòa nhập, cần quản lý lớp và báo cáo',
        },
        {
          icon: '🌐',
          title: 'NGO & CSR',
          description:
            'Tổ chức tài trợ giáo dục hòa nhập, cần dữ liệu tác động đo lường được',
        },
      ],
    },

    pricing: {
      heading: 'Bảng giá',
      subheading: 'Bắt đầu miễn phí, nâng cấp khi sẵn sàng',
      items: [
        {
          name: 'Free Starter',
          target: 'Phụ huynh / người học',
          price: 'Miễn phí',
          period: '',
          highlight: false,
          features: [
            'Học thử từ cơ bản',
            'Video mẫu tham khảo',
            'Luyện tập giới hạn với AI',
          ],
          cta: 'Bắt đầu miễn phí',
        },
        {
          name: 'Family Companion',
          target: 'Phụ huynh',
          price: '79.000 – 129.000 VND',
          period: '/tháng',
          highlight: true,
          features: [
            'Tài khoản cho con + phụ huynh',
            'Family Learning Dashboard',
            'AI luyện tập mở rộng',
            'Theo dõi tiến bộ chi tiết',
          ],
          cta: 'Chọn gói này',
        },
        {
          name: 'School Dashboard',
          target: 'Trường / trung tâm',
          price: '24 – 36 triệu VND',
          period: '/năm',
          highlight: false,
          features: [
            'Quản lý lớp học',
            'Giao bài tập cho học sinh',
            'Theo dõi tiến độ toàn lớp',
            'Báo cáo lỗi theo từng học sinh',
          ],
          cta: 'Liên hệ tư vấn',
        },
        {
          name: 'Custom Package',
          target: 'Trường / NGO',
          price: '30 – 100 triệu VND',
          period: '/dự án',
          highlight: false,
          features: [
            'Tùy chỉnh học liệu & từ vựng',
            'Video mẫu theo phương ngữ',
            'Mô hình AI riêng cho tổ chức',
            'Hỗ trợ triển khai & đào tạo',
          ],
          cta: 'Liên hệ tư vấn',
        },
      ],
    },

    valueProps: {
      heading: 'Giá trị cho từng đối tượng',
      subheading: 'Mỗi người dùng đều nhận được đúng điều họ cần',
      items: [
        {
          role: 'Người học khiếm thính',
          icon: '👋',
          props: [
            'Luyện chủ động trước camera',
            'Nhận phản hồi màu sắc tức thì',
            'Biết sai ở đâu và sửa từng bước',
          ],
        },
        {
          role: 'Phụ huynh',
          icon: '❤️',
          props: [
            'Theo dõi tiến bộ của con',
            'Học cùng con',
            'Xây dựng giao tiếp tại nhà',
          ],
        },
        {
          role: 'Giáo viên',
          icon: '📋',
          props: [
            'Dashboard giao bài tiện lợi',
            'Xem lỗi phổ biến toàn lớp',
            'Hỗ trợ cá nhân hóa không cần quan sát thủ công',
          ],
        },
        {
          role: 'Trường học',
          icon: '🏛️',
          props: [
            'Chuẩn hóa bài tập ký hiệu',
            'Báo cáo tiến độ tự động',
            'Tùy chỉnh học liệu theo chương trình riêng',
          ],
        },
        {
          role: 'NGO / CSR',
          icon: '📈',
          props: [
            'Dữ liệu tác động đo lường được',
            'Số học sinh & bài hoàn thành',
            'Báo cáo nhóm từ cải thiện',
          ],
        },
      ],
    },

    ctaFooter: {
      heading: 'Bắt đầu hành trình học ký hiệu cùng Signova',
      sub: 'Miễn phí hoàn toàn để thử. Không cần thẻ tín dụng.',
      cta: 'Dùng thử ngay',
    },

    footer: {
      tagline: 'Học Ngôn ngữ Ký hiệu Việt Nam cùng AI',
      copy: '© 2025 Signova. All rights reserved.',
    },
  },

  en: {
    nav: {
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Products', href: '#products' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Users', href: '#users' },
      ],
      cta: 'Try for free',
    },

    hero: {
      headline: 'Learn Vietnamese Sign Language with AI',
      subheadline:
        "An AI tutor with visual feedback — so learners know exactly what they're doing wrong and how to fix it",
      ctaPrimary: 'Try for free',
      ctaSecondary: 'See features',
      badge: 'AI-powered · Vietnamese Sign Language',
    },

    problem: {
      heading: "Learning sign language without feedback — you finish a lesson and still don't know if you did it right",
      body: "Most sign language learning platforms only provide sample videos or dictionaries. Learners still have to guess if they're doing it right. Signova solves this gap with real-time AI feedback.",
    },

    products: {
      heading: 'The Signova Product Ecosystem',
      subheading: 'End-to-end solutions for learners, families, and schools',
      items: [
        {
          icon: '📱',
          title: 'Signova Learner App',
          description:
            'AI-powered sign language learning app for deaf learners, parents, and students. Learn word-by-word, practice in front of camera, get red/green color-coded feedback on exactly what\'s wrong.',
          tag: 'Learner',
          path: '/learn-dashboard',
        },
        {
          icon: '👨‍👩‍👧',
          title: 'Family Learning Dashboard',
          description:
            'Parents track which words their child has learned, which ones are frequently wrong, and learn the same words alongside their child to enable home communication.',
          tag: 'Family',
          path: '/dashboard/family',
        },
        {
          icon: '🏫',
          title: 'School Dashboard',
          description:
            'Teachers create classes, assign lessons, track practice results, and identify common errors across students. Reduces manual correction workload.',
          tag: 'School',
          path: '/dashboard/school',
        },
        {
          icon: '🤖',
          title: 'Custom Learning Content & AI Model',
          description:
            'Schools and centers can request customized vocabulary sets, sample videos, and AI practice models tailored to regional sign variants or specific curricula.',
          tag: 'Custom',
        },
      ],
    },

    features: {
      heading: 'Key Features',
      subheading: 'AI technology placed exactly right — precise feedback, faster learning',
      items: [
        {
          icon: '🎯',
          title: 'AI Visual Feedback',
          description:
            'Red/green color-coded overlay on learner\'s video vs. sample video. Shows exactly which hand position, direction, or speed is wrong.',
        },
        {
          icon: '🔤',
          title: 'Word-level Practice',
          description:
            'Focuses on one word at a time — more precise feedback, easier to test, more practical for classroom and home.',
        },
        {
          icon: '👨‍👩‍👧‍👦',
          title: 'Family Learning Mode',
          description:
            'Parents learn the same words as their child and monitor progress. Turns the app into a family communication tool.',
        },
        {
          icon: '📊',
          title: 'Classroom Analytics',
          description:
            'Teachers see per-student and class-wide error patterns. Data-driven lesson planning without manual observation.',
        },
      ],
    },

    targetUsers: {
      heading: 'Who is it for?',
      subheading: 'Signova serves the entire inclusive education ecosystem',
      items: [
        {
          icon: '🏠',
          title: 'Families',
          description:
            'Parents of deaf children who want to learn alongside and track their child\'s progress',
        },
        {
          icon: '🏫',
          title: 'Schools & Centers',
          description:
            'Special education and inclusive schools needing class management and progress reporting',
        },
        {
          icon: '🌐',
          title: 'NGO & CSR',
          description:
            'Organizations funding inclusive education that need measurable impact data',
        },
      ],
    },

    pricing: {
      heading: 'Pricing',
      subheading: "Start for free, upgrade when you're ready",
      items: [
        {
          name: 'Free Starter',
          target: 'Parents / Learners',
          price: 'Free',
          period: '',
          highlight: false,
          features: [
            'Basic vocabulary trial',
            'Sample reference videos',
            'Limited AI practice sessions',
          ],
          cta: 'Get started free',
        },
        {
          name: 'Family Companion',
          target: 'Parents',
          price: '79,000 – 129,000 VND',
          period: '/month',
          highlight: true,
          features: [
            'Child + parent accounts',
            'Family Learning Dashboard',
            'Extended AI practice',
            'Detailed progress tracking',
          ],
          cta: 'Choose this plan',
        },
        {
          name: 'School Dashboard',
          target: 'Schools / Centers',
          price: '24M – 36M VND',
          period: '/year',
          highlight: false,
          features: [
            'Class management',
            'Assignment tools',
            'Full-class progress tracking',
            'Per-student error reports',
          ],
          cta: 'Contact us',
        },
        {
          name: 'Custom Package',
          target: 'Schools / NGOs',
          price: '30M – 100M VND',
          period: '/project',
          highlight: false,
          features: [
            'Custom vocabulary & content',
            'Regional sign variant videos',
            'Dedicated AI model',
            'Implementation support & training',
          ],
          cta: 'Contact us',
        },
      ],
    },

    valueProps: {
      heading: 'Value for every user',
      subheading: 'Each type of user gets exactly what they need',
      items: [
        {
          role: 'Deaf Learners',
          icon: '👋',
          props: [
            'Active practice in front of camera',
            'Instant color-coded feedback',
            'Know exactly what\'s wrong and fix it step by step',
          ],
        },
        {
          role: 'Parents',
          icon: '❤️',
          props: [
            'Track child\'s progress',
            'Learn alongside their child',
            'Build communication at home',
          ],
        },
        {
          role: 'Teachers',
          icon: '📋',
          props: [
            'Convenient assignment dashboard',
            'View class-wide common errors',
            'Personalized support without manual observation',
          ],
        },
        {
          role: 'Schools',
          icon: '🏛️',
          props: [
            'Standardized sign practice',
            'Automated progress reports',
            'Custom content for their curriculum',
          ],
        },
        {
          role: 'NGO / CSR',
          icon: '📈',
          props: [
            'Measurable impact data',
            'Student count & completed lessons',
            'Vocabulary improvement reports',
          ],
        },
      ],
    },

    ctaFooter: {
      heading: 'Start your sign language journey with Signova',
      sub: 'Completely free to try. No credit card required.',
      cta: 'Try it now',
    },

    footer: {
      tagline: 'Learn Vietnamese Sign Language with AI',
      copy: '© 2025 Signova. All rights reserved.',
    },
  },
}

export default landingData
