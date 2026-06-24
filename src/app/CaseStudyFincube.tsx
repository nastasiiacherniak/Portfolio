import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { gallery, manrope, Reveal, RevealTitle, Contact, CustomCursor, useMediaQuery } from "./App";

import imgHero from "@/imports/fincube/hero.webp";
import imgHeroGray from "@/imports/fincube/hero-grayscale.webp";
import imgProject1 from "@/imports/fincube/project-1.webp";
import imgProject2 from "@/imports/fincube/project-2.webp";
import imgApproach2 from "@/imports/fincube/approach-2.webp";
import imgApproach3 from "@/imports/fincube/approach-3.webp";
import imgOutcomes1 from "@/imports/fincube/outcomes-1.webp";
import imgOutcomes2 from "@/imports/fincube/outcomes-2.webp";
import imgOutcomes3 from "@/imports/fincube/outcomes-3.webp";
import imgOutcomes4 from "@/imports/fincube/outcomes-4.webp";
import vidApproach from "@/imports/fincube/approach.mp4";
import imgBrushBuddy from "@/imports/fincube/brushbuddy.webp";

const CREAM = "#fefefe";

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[14px] md:text-[16px] text-[#9a99a0]">{label}</p>
      <p className="text-[16px] md:text-[18px] text-[#fefefe] mt-[6px] whitespace-nowrap">{value}</p>
    </div>
  );
}

// Section header: number in the left gutter; the title + label/paragraph column is 840px
// wide, right-aligned to the content edge, with an 84px inner right margin (→ 756px of content).
function SectionHead({ num, title, label, children }: { num: string; title: string; label: string; children: React.ReactNode }) {
  return (
    <div className="relative pt-[40px] lg:pt-0">
      <span className="absolute left-0 top-0 text-[16px] md:text-[20px] text-[#fefefe]" style={manrope}>{num}</span>
      <Reveal className="w-full lg:w-[840px] lg:ml-auto lg:pr-[84px]">
        <h2 className="text-[clamp(30px,4.4vw,56px)] leading-[1.08]" style={{ ...gallery, color: CREAM }}>{title}</h2>
        <div className="flex flex-col md:flex-row gap-[16px] md:gap-[24px] mt-[32px] md:mt-[56px]">
          <span className="w-full md:w-[120px] lg:w-[187px] shrink-0 text-[14px] md:text-[16px] text-[#fefefe]">{label}</span>
          <div className="flex-1 text-[14px] md:text-[16px] leading-[24px] text-[#9a99a0] space-y-[16px]">{children}</div>
        </div>
      </Reveal>
    </div>
  );
}

// Caption block: 408px wide with an 84px inner right margin (→ 324px of content). Left-aligned
// by default; right-aligned (to its column's right edge) when align="right".
function Caption({ title, children, align = "left" }: { title: string; children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <div className={`w-full lg:w-[408px] lg:pr-[84px] ${align === "right" ? "lg:ml-auto" : ""}`}>
      <p className="text-[16px] md:text-[18px] text-[#fefefe] font-medium">{title}</p>
      <p className="text-[14px] md:text-[16px] leading-[24px] text-[#9a99a0] mt-[12px]">{children}</p>
    </div>
  );
}

const SHELL = "max-w-[1440px] mx-auto px-4 md:px-[40px] lg:px-[84px]";

// Scroll-triggered reveal (desktop): an overflow-hidden window grows from 456×162 to 840×300 as it
// scrolls into view, while the image stays fixed at 840×300 — so it starts as the centre crop and
// expands to reveal the full frame using a single image.
function BrushBuddyReveal({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const w = useTransform(scrollYProgress, [0, 1], [456, 840]);
  const h = useTransform(scrollYProgress, [0, 1], [162, 300]);
  return (
    <div ref={ref} className="mt-[40px] md:mt-[60px] h-[300px] flex items-center justify-center">
      <motion.div style={{ width: w, height: h }} className="overflow-hidden flex items-center justify-center">
        <img
          src={src}
          alt="Dental Care Ecommerce Website Preview"
          className="w-[840px] h-[300px] max-w-none object-cover shrink-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </motion.div>
    </div>
  );
}

// Same approach as the homepage nav: progressive blur backdrop + scroll-spy active underline,
// links in regular weight. Text stays light on the dark case-study background.
function CaseNav() {
  const [active, setActive] = useState("");
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  useEffect(() => {
    const ids = ["project-info", "approach", "outcomes"];
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Progressive blur: stacked backdrop-blur layers fading out downward (same as homepage). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[180%]">
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_90%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_90%)]" />
        <div className="absolute inset-0 backdrop-blur-[5px] [mask-image:linear-gradient(to_bottom,#000_0%,#000_30%,transparent_65%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_30%,transparent_65%)]" />
        <div className="absolute inset-0 backdrop-blur-[10px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_40%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,transparent_40%)]" />
      </div>
      <div className={`relative z-50 ${SHELL} flex items-center justify-between py-3 md:py-[24px] uppercase text-[14px] md:text-[16px] text-[#fefefe]`} style={manrope}>
        <Link to="/" data-cursor="expand" className="font-normal transition-colors duration-300 hover:text-[#c39e7b]">
          ← BACK
        </Link>
        <div className="hidden md:flex gap-[24px]">
          {[["Project info", "project-info"], ["Approach", "approach"], ["Outcomes", "outcomes"]].map(([t, id]) => (
            <button
              key={id}
              data-cursor="expand"
              onClick={() => go(id)}
              className={`relative font-normal uppercase transition-colors duration-300 hover:text-[#c39e7b] after:absolute after:left-0 after:-bottom-[4px] after:h-[2px] after:bg-current after:transition-[width] after:duration-300 after:content-[''] ${active === id ? "after:w-full" : "after:w-0"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// Hero color ⇄ grayscale toggle. The affordance is the custom cursor (it shows "Show grayscale" /
// "Show color" on hover). Clicking reveals the incoming image with a circular clip that expands
// from the exact click point — so the new image grows out of the cursor.
function HeroShowcase({ color, grayscale }: { color: string; grayscale: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState(color);
  const [reveal, setReveal] = useState<{ src: string; x: number; y: number; r: number } | null>(null);
  const showingGray = (reveal ? reveal.src : base) === grayscale;

  const onClick = (e: React.MouseEvent) => {
    if (reveal || !ref.current) return; // ignore clicks mid-transition
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // radius that reaches the farthest corner from the click point
    const r = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    setReveal({ src: base === color ? grayscale : color, x, y, r });
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      data-cursor="label"
      data-cursor-label={showingGray ? "Show mockup" : "Show wireframe"}
      className="relative w-full mt-[40px] md:mt-[60px] overflow-hidden"
    >
      <img src={base} alt="Personal Finance Mobile App UI" className="w-full block" />
      {reveal && (
        <motion.img
          src={reveal.src}
          alt=""
          aria-hidden
          initial={{ clipPath: `circle(0px at ${reveal.x}px ${reveal.y}px)` }}
          animate={{ clipPath: `circle(${reveal.r}px at ${reveal.x}px ${reveal.y}px)` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => { setBase(reveal.src); setReveal(null); }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}
    </div>
  );
}

export default function CaseStudyFincube() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Land on the case study at the very top, instantly (the homepage leaves scroll-behavior:smooth
  // on <html>, which would otherwise animate the jump from the homepage's scroll position).
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#33323b] text-[#fefefe] overflow-x-hidden" style={manrope}>
      <CustomCursor />
      <CaseNav />

      {/* Gentle fade-in for a smoother page load (nav/cursor stay outside so the fixed nav keeps
          its viewport positioning). */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

      {/* 1 — INTRO */}
      <section className={`${SHELL} pt-[100px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <RevealTitle
          as="h1"
          text="Fincube"
          className="text-center text-[#c39e7b] text-[clamp(56px,9vw,132px)] leading-none"
          style={gallery}
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[24px] md:gap-[40px] mt-[48px] md:mt-[80px]">
          <Meta label="Services" value="UI/UX design" />
          <div className="flex gap-[60px] md:gap-[120px]">
            <Meta label="Type" value="Finance, Mobile App" />
            <Meta label="Release" value="October 2025" />
          </div>
        </div>

        <Reveal>
          <HeroShowcase color={imgHero} grayscale={imgHeroGray} />
        </Reveal>
      </section>

      {/* 2 — PROJECT INFO */}
      <section id="project-info" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="1." title="Transforming complex finance into structured clarity" label="Project info">
          <p>Fincube is a sleek personal finance app designed to help users efficiently manage their income and expenses while maintaining the highest level of privacy. Designed over a 2-month timeline across 50+ screens, the project covers four distinct development stages.</p>
          <p>The app's primary goal is to let users track financial activities securely, set clear savings goals, and gain instant insights into their spending patterns through a streamlined, user-friendly interface.</p>
        </SectionHead>

        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[60px] md:mt-[100px]">
          <Reveal><img src={imgProject1} alt="Monthly Expense Tracking App Screen" className="w-full" /></Reveal>
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal delay={0.1}><img src={imgProject2} alt="Finance App Home Screen Setup" className="w-full" /></Reveal>
            <Reveal delay={0.15}>
              <Caption title="Solution" align="right">
                To address common user pain points, I built an intuitive, rapid flow for core functions: allowing users to sync multiple bank accounts, automatically synchronize transactions, and manually map out savings goals with minimal friction.
              </Caption>
            </Reveal>
          </div>
        </div>
        {/* No autoplay video in this section. */}
      </section>

      {/* 3 — APPROACH */}
      <section id="approach" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="2." title="Sleek dark-mode aesthetics meeting daily utility" label="Approach">
          <p>For Fincube, I developed a premium, dark-mode-first visual identity that blends data-dense screens with clean typography and vibrant gradient accents. To ensure a cohesive experience across the entire user journey, this visual structure was extended into several key areas, such as intuitive onboarding and home screen widgets.</p>
        </SectionHead>

        {/* Video autoplays (muted, looped) in this section. */}
        <Reveal>
          <video src={vidApproach} autoPlay muted loop playsInline className="w-full mt-[60px] md:mt-[100px] block" />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <Reveal><img src={imgApproach2} alt="Savings Goal Tracking Feature UI" className="w-full" /></Reveal>
          <Reveal delay={0.1}><img src={imgApproach3} alt="Personal Savings Goals Mobile Screen" className="w-full" /></Reveal>
        </div>
      </section>

      {/* 4 — OUTCOMES */}
      <section id="outcomes" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="3." title="Validated design impact and high-performance results" label="Outcomes">
          <p>The final architecture for Fincube effectively eliminated the clutter typical of traditional banking software, shifting the focus onto scannable metrics and graphs. Comprehensive feature benchmarking against 7 industry competitors ensured that Fincube delivered a superior feature-to-interface balance.</p>
        </SectionHead>

        {/* Row 1 — IMG_1 expenses screen with caption (left) + IMG_2 widgets card (right, 624×600) */}
        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[60px] md:mt-[100px]">
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal><img src={imgOutcomes1} alt="Monthly Expenses Overview Mobile Design" className="w-full" /></Reveal>
            <Reveal delay={0.05}>
              <Caption title="100% Direct Success Rate" align="left">
                Unmoderated testing with 12 respondents yielded a 100% direct success rate, validating that the core navigation and fast-transaction flows are highly intuitive.
              </Caption>
            </Reveal>
          </div>
          <Reveal delay={0.1}><img src={imgOutcomes2} alt="Finance Home Screen Widgets Design" className="w-full" /></Reveal>
        </div>

        {/* Row 2 — IMG_3 testing card (left, 624×600) + IMG_4 wallet screen with caption (right) */}
        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <Reveal><img src={imgOutcomes3} alt="Finance App Usability Testing Results" className="w-full" /></Reveal>
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal delay={0.1}><img src={imgOutcomes4} alt="Digital Wallet Mobile App Screen" className="w-full lg:w-[408px] lg:ml-auto" /></Reveal>
            <Reveal delay={0.15}>
              <Caption title="Instant Financial Overview" align="right">
                By centralizing automated bank syncs, custom category tracking, and multi-currency support into a single dashboard, the interface successfully minimizes cognitive load and cuts daily expense-logging time down to seconds.
              </Caption>
            </Reveal>
          </div>
        </div>

        <div className="flex flex-col items-center text-center mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <a
            href="https://www.behance.net/gallery/210709987/Fincube-App-for-tracking-finances-Case-study"
            target="_blank"
            rel="noreferrer"
            data-cursor="project"
            className="text-[14px] md:text-[16px] leading-[24px] text-[#9a99a0] transition-colors duration-300 hover:text-[#fefefe]"
          >
            Want to discover more?<br />View the full case study on <span className="underline text-[#fefefe]">Behance</span>.
          </a>
        </div>
      </section>

      {/* 5 — NEXT PROJECT */}
      <section className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px]`}>
        <p className="text-center text-[16px] text-[#fefefe]">Next project</p>
        <Link to="/work/brushbuddy" data-cursor="project" className="group block mt-[40px] md:mt-[60px]">
          <RevealTitle
            as="span"
            text="BrushBuddy"
            triggerOnView
            className="block text-center text-[clamp(48px,8vw,96px)] leading-none"
            style={{ ...gallery, color: "#fefefe" }}
          />
          {isDesktop ? (
            <BrushBuddyReveal src={imgBrushBuddy} />
          ) : (
            <Reveal>
              <div className="overflow-hidden mt-[40px] md:mt-[60px]">
                <img src={imgBrushBuddy} alt="Dental Care Ecommerce Website Preview" className="w-full h-[300px] object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
              </div>
            </Reveal>
          )}
        </Link>
      </section>

      {/* 6 — CONTACT (same as homepage) */}
      <Contact />
      </motion.div>
    </div>
  );
}
