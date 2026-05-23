import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PracticePage from "./PracticePage";

const LANDING_DATA = {
  vi: {
    nav: {
      links: [
        { label: "Tính năng", href: "#features" },
        { label: "Sản phẩm", href: "#products" },
        { label: "Bảng giá", href: "#pricing" },
        { label: "Đối tượng", href: "#users" },
      ],
      cta: "Vào lớp học",
    },
    hero: {
      badge: "AI-powered · NNKH Việt Nam",
      headline: "Cùng Signova học ký hiệu thật vui mỗi ngày",
      subheadline:
        "Xem video mẫu, tập theo bằng tay của mình, rồi nhận phản hồi màu sắc dễ hiểu như một người bạn nhỏ hướng dẫn.",
      ctaPrimary: "Vào lớp học thử",
      ctaSecondary: "Xem thêm",
    },
    problem: {
      heading: "Chỉ xem video mẫu thôi thì vẫn khó biết mình làm đã đúng chưa",
      body: "Signova giúp người học nhìn thấy ngay phần nào đang làm giống mẫu, phần nào cần sửa thêm, để việc học ký hiệu bớt căng thẳng và vui hơn như đang chơi một bài học nhỏ.",
    },
    features: [
      {
        icon: "🪄",
        title: "Phản hồi bằng màu sắc",
        description: "Đỏ là chỗ cần sửa thêm, xanh là chỗ đang bám tốt theo mẫu.",
      },
      {
        icon: "🧩",
        title: "Học từng từ nhỏ",
        description: "Mỗi lần chỉ tập trung vào một từ để dễ nhớ và dễ luyện hơn.",
      },
      {
        icon: "🎥",
        title: "Học xong là luyện ngay",
        description: "Vừa xem xong một từ là có thể quay video và thử làm ngay lập tức.",
      },
      {
        icon: "🌱",
        title: "Lớn dần theo từng topic",
        description: "Học 5 từ đầu rồi kiểm tra nhỏ, sau đó hoàn thành cả topic 10 từ.",
      },
    ],
    products: [
      {
        icon: "📱",
        title: "App học cho người học",
        description: "Xem minh họa, xem video mẫu, rồi quay video và luyện với AI như một trò chơi học tập.",
        tag: "Người học",
      },
      {
        icon: "🧡",
        title: "Family Dashboard",
        description: "Theo dõi tiến độ, từ hay sai, và cùng trẻ luyện tập tại nhà.",
        tag: "Gia đình",
      },
      {
        icon: "🏫",
        title: "School Dashboard",
        description: "Quản lý lớp, giao bài, và xem lỗi phổ biến của học sinh.",
        tag: "Trường học",
      },
      {
        icon: "🎨",
        title: "Custom Content & Model",
        description: "Có thể mở rộng thêm bộ từ, hình mẫu và model theo nhu cầu riêng.",
        tag: "Tùy chỉnh",
      },
    ],
    users: [
      { icon: "👨‍👩‍👧", title: "Gia đình", description: "Phụ huynh muốn học cùng và theo dõi tiến độ của trẻ." },
      { icon: "🧑‍🏫", title: "Trường học", description: "Lớp học, trung tâm, giáo dục đặc biệt và hòa nhập." },
      { icon: "🌍", title: "NGO / CSR", description: "Các đơn vị cần dữ liệu tác động và khả năng triển khai rộng." },
    ],
    pricing: [
      { name: "Free Starter", price: "Miễn phí", desc: "Thử học những từ đầu tiên và làm quen với cách app phản hồi." },
      { name: "Family Companion", price: "79k - 129k / tháng", desc: "Phụ huynh và trẻ học cùng nhau, theo dõi tiến độ dễ dàng." },
      { name: "School Dashboard", price: "24M - 36M / năm", desc: "Dành cho lớp học và trung tâm cần quản lý bài luyện tập." },
    ],
    valueProps: [
      { role: "Người học", points: ["Biết ngay chỗ nào cần sửa", "Tập lại từng bước nhỏ", "Nhìn rõ mình và video mẫu"] },
      { role: "Phụ huynh", points: ["Theo dõi con học", "Học cùng con", "Tạo thêm thời gian giao tiếp tại nhà"] },
      { role: "Giáo viên", points: ["Xem lỗi phổ biến", "Giảm sửa tay thủ công", "Có luồng học và luyện rõ ràng"] },
    ],
    cta: {
      heading: "Sẵn sàng vào lớp học ký hiệu chưa?",
      sub: "Mở app, chọn topic, xem mascot hướng dẫn và tập ngay trên video của mình.",
      button: "Bắt đầu học ngay",
    },
  },
  en: {
    nav: {
      links: [
        { label: "Features", href: "#features" },
        { label: "Products", href: "#products" },
        { label: "Pricing", href: "#pricing" },
        { label: "Users", href: "#users" },
      ],
      cta: "Try for free",
    },
    hero: {
      badge: "AI-powered · Vietnamese Sign Language",
      headline: "Learn Vietnamese Sign Language with AI",
      subheadline:
        "An AI tutor with visual feedback, so learners know exactly what they did wrong and how to fix it.",
      ctaPrimary: "Try for free",
      ctaSecondary: "See features",
    },
    problem: {
      heading: "Learning sign language without feedback means you still do not know if you are right or wrong",
      body: "Most sign language products stop at sample videos or dictionaries. Signova adds AI feedback so learners can compare themselves against a reference and correct mistakes immediately.",
    },
    features: [
      { icon: "🎯", title: "Visual AI feedback", description: "Red and green overlays directly on learner and reference videos." },
      { icon: "🔤", title: "Word-by-word learning", description: "Practice one word at a time, then checkpoint by lesson set." },
      { icon: "📱", title: "Practice I and II", description: "Study first, practice immediately, then take a grouped review." },
      { icon: "📊", title: "Dashboard-ready", description: "Family and school dashboards are already scaffolded for later." },
    ],
    products: [
      { icon: "📱", title: "Learner App", description: "Study a word, view illustration and sample video, then practice with AI.", tag: "Learner" },
      { icon: "👨‍👩‍👧", title: "Family Dashboard", description: "Track progress, frequent mistakes, and learn together at home.", tag: "Family" },
      { icon: "🏫", title: "School Dashboard", description: "Manage classes, assignments, and common classroom mistakes.", tag: "School" },
      { icon: "🤖", title: "Custom Content & Model", description: "Extend the system with custom vocabulary, data, and models.", tag: "Custom" },
    ],
    users: [
      { icon: "🏠", title: "Families", description: "Parents who want to learn and track their child's progress." },
      { icon: "🏫", title: "Schools", description: "Schools, centers, and inclusive education programs." },
      { icon: "🌐", title: "NGO / CSR", description: "Organizations that need measurable education impact." },
    ],
    pricing: [
      { name: "Free Starter", price: "Free", desc: "Try basic vocabulary and limited practice." },
      { name: "Family Companion", price: "79k - 129k / month", desc: "Parent and child accounts with detailed tracking." },
      { name: "School Dashboard", price: "24M - 36M / year", desc: "Classroom management and sign practice reporting." },
    ],
    valueProps: [
      { role: "Learners", points: ["See what is wrong", "Retry immediately", "Compare user and reference clearly"] },
      { role: "Parents", points: ["Track progress", "Learn together", "Build communication at home"] },
      { role: "Teachers", points: ["See class-wide mistakes", "Reduce manual correction", "Use a clear learning flow"] },
    ],
    cta: {
      heading: "Start your sign learning journey with Signova",
      sub: "Free to try. No credit card required.",
      button: "Open practice app",
    },
  },
};

function scrollToSection(href) {
  const id = href.replace(/^#/, "");
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function LandingPage() {
  const [locale, setLocale] = useState("vi");
  const [scrolled, setScrolled] = useState(false);
  const data = useMemo(() => LANDING_DATA[locale], [locale]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-shell">
      <nav className={scrolled ? "landing-nav scrolled" : "landing-nav"}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <span className="landing-logo-mark">
              <img src="/signova-mascot.png" alt="Signova mascot" className="landing-logo-image" />
            </span>
            <span className="landing-logo-word">Signova</span>
          </Link>
          <div className="landing-links">
            {data.nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(link.href);
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="landing-actions">
            <button
              type="button"
              className="landing-locale"
              onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            >
              <span className={locale === "vi" ? "active" : ""}>VI</span>
              <span>/</span>
              <span className={locale === "en" ? "active" : ""}>EN</span>
            </button>
            <Link to="/practice" className="landing-cta-nav">
              {data.nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="landing-hero" id="hero">
          <div className="landing-hero-glow landing-hero-glow-left" />
          <div className="landing-hero-glow landing-hero-glow-right" />
          <div className="landing-hero-grid" />
          <div className="landing-hero-content landing-hero-split">
            <div className="landing-hero-copy">
              <div className="landing-badge">{data.hero.badge}</div>
              <h1>{data.hero.headline}</h1>
              <p>{data.hero.subheadline}</p>
              <div className="landing-hero-actions">
                <Link to="/practice" className="landing-button-primary">
                  {data.hero.ctaPrimary}
                </Link>
                <a
                  href="#features"
                  className="landing-button-secondary"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("#features");
                  }}
                >
                  {data.hero.ctaSecondary}
                </a>
              </div>
              <div className="landing-mini-facts">
                <span>🎒 2 topic</span>
                <span>🧠 Practice I & II</span>
                <span>🌈 Phản hồi màu sắc</span>
              </div>
            </div>
            <div className="landing-mascot-card">
              <img src="/signova-mascot.png" alt="Signova mascot" className="landing-mascot-image" />
              <div className="landing-mascot-bubble">Xin chào, mình sẽ học cùng bạn!</div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-problem">
          <div className="landing-section-inner single">
            <p className="landing-section-kicker">Problem</p>
            <h2>{data.problem.heading}</h2>
            <p>{data.problem.body}</p>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <p className="landing-section-kicker">Features</p>
              <h2>{locale === "vi" ? "Tính năng nổi bật" : "Key features"}</h2>
            </div>
            <div className="landing-card-grid four">
              {data.features.map((item) => (
                <article key={item.title} className="landing-card dark">
                  <div className="landing-card-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="products">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <p className="landing-section-kicker">Products</p>
              <h2>{locale === "vi" ? "Hệ sinh thái sản phẩm Signova" : "The Signova product ecosystem"}</h2>
            </div>
            <div className="landing-card-grid two">
              {data.products.map((item) => (
                <article key={item.title} className="landing-card muted">
                  <div className="landing-card-meta">
                    <span className="landing-card-icon">{item.icon}</span>
                    <span className="landing-tag">{item.tag}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="users">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <p className="landing-section-kicker">Users</p>
              <h2>{locale === "vi" ? "Dành cho ai?" : "Who is it for?"}</h2>
            </div>
            <div className="landing-card-grid three">
              {data.users.map((item) => (
                <article key={item.title} className="landing-card light">
                  <div className="landing-card-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="pricing">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <p className="landing-section-kicker">Pricing</p>
              <h2>{locale === "vi" ? "Bảng giá" : "Pricing"}</h2>
            </div>
            <div className="landing-card-grid three">
              {data.pricing.map((item) => (
                <article key={item.name} className="landing-price-card">
                  <p className="landing-price-name">{item.name}</p>
                  <h3>{item.price}</h3>
                  <p>{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <p className="landing-section-kicker">Value</p>
              <h2>{locale === "vi" ? "Giá trị cho từng nhóm người dùng" : "Value for each user group"}</h2>
            </div>
            <div className="landing-card-grid three">
              {data.valueProps.map((item) => (
                <article key={item.role} className="landing-card muted">
                  <h3>{item.role}</h3>
                  <ul className="landing-list">
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta-footer">
          <div className="landing-section-inner single">
            <h2>{data.cta.heading}</h2>
            <p>{data.cta.sub}</p>
            <Link to="/practice" className="landing-button-primary">
              {data.cta.button}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/practice" element={<PracticePage />} />
      </Routes>
    </BrowserRouter>
  );
}
