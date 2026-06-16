import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { gallery, manrope, Reveal, RevealTitle, Contact, CustomCursor, useMediaQuery } from "./App";

import imgHero from "@/imports/rinesk/hero.jpg";
import imgProject1 from "@/imports/rinesk/project-1.jpg";
import imgProject2 from "@/imports/rinesk/project-2.jpg";
import imgApproach2 from "@/imports/rinesk/approach-2.jpg";
import imgApproach3 from "@/imports/rinesk/approach-3.jpg";
import imgOutcomes1 from "@/imports/rinesk/outcomes-1.jpg";
import imgOutcomes2 from "@/imports/rinesk/outcomes-2.jpg";
import imgOutcomes3 from "@/imports/rinesk/outcomes-3.jpg";
import imgOutcomes4 from "@/imports/rinesk/outcomes-4.jpg";
import vidApproach from "@/imports/rinesk/approach.mp4";
import imgFincube from "@/imports/rinesk/fincube.jpg";

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
function FincubeReveal({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const w = useTransform(scrollYProgress, [0, 1], [456, 840]);
  const h = useTransform(scrollYProgress, [0, 1], [162, 300]);
  return (
    <div ref={ref} className="mt-[40px] md:mt-[60px] h-[300px] flex items-center justify-center">
      <motion.div style={{ width: w, height: h }} className="overflow-hidden flex items-center justify-center">
        <img
          src={src}
          alt="Personal Finance Mobile App Preview"
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

export default function CaseStudyRinesk() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Land on the case study at the very top, instantly (the homepage leaves scroll-behavior:smooth
  // on <html>, which would otherwise animate the jump from the homepage's scroll position).
  useLayoutEffect(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
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
          text="Rinesk"
          className="text-center text-[#c39e7b] text-[clamp(56px,9vw,132px)] leading-none"
          style={gallery}
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[24px] md:gap-[40px] mt-[48px] md:mt-[80px]">
          <Meta label="Services" value="UI/UX design, Branding" />
          <div className="flex gap-[60px] md:gap-[120px]">
            <Meta label="Type" value="Dashboard" />
            <Meta label="Release" value="November 2025" />
          </div>
        </div>

        {/* No grayscale/wireframe variant → plain hero image, no toggle. */}
        <Reveal>
          <img src={imgHero} alt="Call Centre Analytics Dashboard Design" className="w-full block mt-[40px] md:mt-[60px]" />
        </Reveal>
      </section>

      {/* 2 — PROJECT INFO */}
      <section id="project-info" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="1." title="Concept that improves efficiency & best experience" label="Project info">
          <p>Rinesk is a design concept for a web and mobile dashboard built for modern call centers. It helps teams track performance, analyze satisfaction, and improve daily workflow.</p>
          <p>The focus was to streamline operations and reduce cognitive load for faster, more confident decision-making.</p>
        </SectionHead>

        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[60px] md:mt-[100px]">
          <Reveal><img src={imgProject1} alt="Call Centre Statistics Dashboard UI" className="w-full" /></Reveal>
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal delay={0.1}><img src={imgProject2} alt="Telecom Brand Logo Grid Construction" className="w-full" /></Reveal>
            <Reveal delay={0.15}>
              <Caption title="Solution" align="right">
                The design aimed to centralize insights and create a simplified visual structure for agents. I focused on turning data into actionable metrics that help reduce time on routine tasks.
              </Caption>
            </Reveal>
          </div>
        </div>
        {/* No autoplay video in this section. */}
      </section>

      {/* 3 — APPROACH */}
      <section id="approach" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="2." title="Visual system across Social media" label="Approach">
          <p>For Rinesk, I designed a consistent visual identity optimized for digital platforms, focusing on Instagram as a key communication channel. The content layout emphasized clarity and color balance, reflecting the dashboard's calm and data-driven aesthetic.</p>
        </SectionHead>

        {/* Video autoplays (muted, looped) in this section. */}
        <Reveal>
          <video src={vidApproach} autoPlay muted loop playsInline className="w-full mt-[60px] md:mt-[100px] block" />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <Reveal><img src={imgApproach2} alt="Telecom Brand Instagram Story Design" className="w-full" /></Reveal>
          <Reveal delay={0.1}><img src={imgApproach3} alt="Customer Satisfaction Survey Mobile Screen" className="w-full" /></Reveal>
        </div>
      </section>

      {/* 4 — OUTCOMES */}
      <section id="outcomes" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="3." title="Performance-driven interface results" label="Outcomes">
          <p>The final Rinesk dashboard delivered a clear interface that improves workflow visibility. A/B testing showed higher task completion speed and reduced cognitive load. Usability sessions confirmed better navigation flow and increased satisfaction among test participants.</p>
        </SectionHead>

        {/* Row 1 — laptop (left) + visual-clarity statement (right) aligned at the top; caption under the laptop */}
        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[60px] md:mt-[100px]">
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal><img src={imgOutcomes1} alt="Call Centre Dashboard Laptop View" className="w-full" /></Reveal>
            <Reveal delay={0.05}>
              <Caption title="Streamlined Data Access" align="left">
                By eliminating the need to switch between multiple tabs, the centralized dashboard cut down average data retrieval times for supervisors by 35%.
              </Caption>
            </Reveal>
          </div>
          <Reveal delay={0.1}><img src={imgOutcomes2} alt="Dashboard Visual Clarity Comparison Design" className="w-full" /></Reveal>
        </div>

        {/* Row 2 — mobile screens (left) + business card (right) aligned at the top; caption under the card */}
        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <Reveal><img src={imgOutcomes3} alt="Call Centre Mobile App Screens" className="w-full" /></Reveal>
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal delay={0.1}><img src={imgOutcomes4} alt="Telecom Brand Business Card Design" className="w-full lg:w-[408px] lg:h-[300px] lg:object-cover lg:ml-auto" /></Reveal>
            <Reveal delay={0.15}>
              <Caption title="Reduced Operational Errors" align="right">
                The clean information architecture minimized visual clutter, resulting in a substantial reduction in agent handling mistakes during high-volume multitasking periods.
              </Caption>
            </Reveal>
          </div>
        </div>

        <div className="flex flex-col items-center text-center mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <a
            href="https://www.behance.net/gallery/237446763/Rinesk-Call-Centre-Dashboard-Case-study"
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
        <Link to="/work/fincube" data-cursor="project" className="group block mt-[40px] md:mt-[60px]">
          <RevealTitle
            as="span"
            text="Fincube"
            triggerOnView
            className="block text-center text-[clamp(48px,8vw,96px)] leading-none"
            style={{ ...gallery, color: "#fefefe" }}
          />
          {isDesktop ? (
            <FincubeReveal src={imgFincube} />
          ) : (
            <Reveal>
              <div className="overflow-hidden mt-[40px] md:mt-[60px]">
                <img src={imgFincube} alt="Personal Finance Mobile App Preview" className="w-full h-[300px] object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
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
