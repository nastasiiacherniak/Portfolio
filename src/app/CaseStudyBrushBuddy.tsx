import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { gallery, manrope, Reveal, RevealTitle, Contact, CustomCursor, useMediaQuery } from "./App";

import imgHero from "@/imports/brushbuddy/hero.webp";
import imgHeroWire from "@/imports/brushbuddy/hero-wireframe.webp";
import imgWow from "@/imports/brushbuddy/wow.webp";
import imgTablet from "@/imports/brushbuddy/tablet.webp";
import imgTabletFront from "@/imports/brushbuddy/tablet-front.webp";
import imgTabletDesk from "@/imports/brushbuddy/tablet-desk.webp";
import imgProposition from "@/imports/brushbuddy/proposition.webp";
import imgProduct from "@/imports/brushbuddy/product.webp";
import imgCatalog from "@/imports/brushbuddy/catalog.webp";
import imgReviews from "@/imports/brushbuddy/reviews.webp";
import vidBrush from "@/imports/brushbuddy/brushbuddy.mp4";
import imgApproachPoster from "@/imports/brushbuddy/approach-poster.webp";
import vidDialog from "@/imports/brushbuddy/dialog.mp4";
import imgNext from "@/imports/brushbuddy/jukrassic.webp";

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
function NextReveal({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const w = useTransform(scrollYProgress, [0, 1], [456, 840]);
  const h = useTransform(scrollYProgress, [0, 1], [162, 300]);
  return (
    <div ref={ref} className="mt-[40px] md:mt-[60px] h-[300px] flex items-center justify-center">
      <motion.div style={{ width: w, height: h }} className="overflow-hidden flex items-center justify-center">
        <img
          src={src}
          alt="Music Band Website Redesign Preview"
          className="w-[840px] h-[300px] max-w-none object-cover shrink-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </motion.div>
    </div>
  );
}

// Desktop (real pointer, no touch): click-to-play with the custom cursor showing play/pause. Touch
// devices (phones AND tablets, including iPad even in desktop mode where media queries lie) autoplay
// muted/looped — detected via navigator.maxTouchPoints. Optional poster previews the video unplayed.
function HoverVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isTouch] = useState(() => typeof navigator !== "undefined" && (navigator.maxTouchPoints > 0 || "ontouchstart" in window));
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      autoPlay={isTouch}
      data-cursor={isTouch ? undefined : (playing ? "pause" : "play")}
      onClick={toggle}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      className={className}
    />
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

// Hero mockup ⇄ wireframe toggle. The affordance is the custom cursor (it shows "Show wireframe" /
// "Show mockup" on hover). Clicking reveals the incoming image with a circular clip that expands
// from the exact click point — so the new image grows out of the cursor.
function HeroShowcase({ mockup, wireframe }: { mockup: string; wireframe: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [base, setBase] = useState(mockup);
  const [reveal, setReveal] = useState<{ src: string; x: number; y: number; r: number } | null>(null);
  const showingWire = (reveal ? reveal.src : base) === wireframe;

  const onClick = (e: React.MouseEvent) => {
    if (reveal || !ref.current) return; // ignore clicks mid-transition
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // radius that reaches the farthest corner from the click point
    const r = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    setReveal({ src: base === mockup ? wireframe : mockup, x, y, r });
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      data-cursor="label"
      data-cursor-label={showingWire ? "Show mockup" : "Show wireframe"}
      className="relative w-full mt-[40px] md:mt-[60px] overflow-hidden"
    >
      <img src={base} alt="Dental Care Ecommerce Website Design" className="w-full block" />
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

export default function CaseStudyBrushBuddy() {
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
          text="BrushBuddy"
          className="text-center text-[#c39e7b] text-[clamp(56px,9vw,132px)] leading-none"
          style={gallery}
        />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[24px] md:gap-[40px] mt-[48px] md:mt-[80px]">
          <Meta label="Services" value="UI/UX design website" />
          <div className="flex gap-[60px] md:gap-[120px]">
            <Meta label="Type" value="E-commerce" />
            <Meta label="Release" value="February 2024" />
          </div>
        </div>

        <Reveal>
          <HeroShowcase mockup={imgHero} wireframe={imgHeroWire} />
        </Reveal>
      </section>

      {/* 2 — PROJECT INFO */}
      <section id="project-info" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="1." title="Little bit of humor and lightness never hurts." label="Project info">
          <p>BrushBuddy is a hub of oral and dental care products for adults, children and pets.</p>
          <p>The main task of the website was to create an atmosphere of healthy and clean teeth. Led by the main supporter of healthy teeth Polina, company collected the best dental accessories on one site.</p>
        </SectionHead>

        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[60px] md:mt-[100px]">
          <Reveal><img src={imgProposition} alt="Oral Care Online Store Homepage" className="w-full" /></Reveal>
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal delay={0.1}><img src={imgTabletDesk} alt="Dental Care Brand Tablet View" className="w-full" /></Reveal>
            <Reveal delay={0.15}>
              <Caption title="Solution" align="right">
                Promotions and novelties occupy the most important section, highlighted with a white background. According to surveys, a blog also adds informativeness and credibility to the site for users.
              </Caption>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1}><video src={vidDialog} autoPlay muted loop playsInline className="w-full mt-[40px] md:mt-[80px] lg:mt-[120px]" /></Reveal>
      </section>

      {/* 3 — APPROACH */}
      <section id="approach" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="2." title="Minimalist interface using the Bento style" label="Approach">
          <p>Many design variants were offered. This design concept is a minimalist interface with a pleasant color palette with a light touch of humor. Using the Bento style helps to structure the content into blocks and is easier for the user to read.</p>
        </SectionHead>

        <Reveal>
          <HoverVideo src={vidBrush} poster={imgApproachPoster} className="w-full mt-[60px] md:mt-[100px] block cursor-pointer" />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <Reveal><img src={imgProduct} alt="Oral Care Product Page Design" className="w-full" /></Reveal>
          <Reveal delay={0.1}><img src={imgCatalog} alt="Dental Products Catalog Page UI" className="w-full" /></Reveal>
        </div>
      </section>

      {/* 4 — OUTCOMES */}
      <section id="outcomes" className={`${SHELL} pt-[60px] md:pt-[80px] lg:pt-[120px] pb-[60px] md:pb-[80px] lg:pb-[120px]`}>
        <SectionHead num="3." title="Trust-infused engagement results" label="Outcomes">
          <p>The final BrushBuddy design brilliantly balances a professional medical backbone with a warm, family-friendly aesthetic. By weaving the founder's clinical expertise directly into the product discovery loop, the UX achieved stellar qualitative outcomes.</p>
        </SectionHead>

        {/* Row 1 — tablet (left) + reviews (right) aligned at the top; Boosted caption under the tablet */}
        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[60px] md:mt-[100px]">
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal><img src={imgTabletFront} alt="Oral Care Shop Mobile UI" className="w-full" /></Reveal>
            <Reveal delay={0.05}>
              <Caption title="Boosted Credibility" align="left">
                Positioning "profi" dentist recommendations and real customer reviews prominently on product pages effectively mitigated buyer hesitation and validated product quality.
              </Caption>
            </Reveal>
          </div>
          <Reveal delay={0.1}><img src={imgReviews} alt="Customer Reviews Ecommerce UX Design" className="w-full" /></Reveal>
        </div>

        {/* Row 2 — wow (left) + tablet (right) aligned at the top; Reduced caption under the right tablet */}
        <div className="grid md:grid-cols-2 gap-[24px] items-start mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <Reveal><img src={imgWow} alt="Dental Care Promo Offers Section" className="w-full" /></Reveal>
          <div className="flex flex-col gap-[40px] md:gap-[64px]">
            <Reveal delay={0.1}><img src={imgTablet} alt="Oral Care About Section Tablet" className="w-full lg:w-[408px] lg:ml-auto" /></Reveal>
            <Reveal delay={0.15}>
              <Caption title="Reduced Cognitive Load" align="right">
                The minimalist pastel color palette combined with lighthearted, micro-copy humor created an inviting atmosphere that replaced the clinical anxiety usually associated with dental care.
              </Caption>
            </Reveal>
          </div>
        </div>

        <div className="flex flex-col items-center text-center mt-[40px] md:mt-[80px] lg:mt-[120px]">
          <a
            href="https://www.behance.net/gallery/192198473/BrushBuddy-E-commerce-Website-design"
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
        <Link to="/work/jukrassic" data-cursor="project" className="group block mt-[40px] md:mt-[60px]">
          <RevealTitle
            as="span"
            text="Jukrassic Pork"
            triggerOnView
            className="block text-center text-[clamp(48px,8vw,96px)] leading-none"
            style={{ ...gallery, color: "#fefefe" }}
          />
          {isDesktop ? (
            <NextReveal src={imgNext} />
          ) : (
            <Reveal>
              <div className="overflow-hidden mt-[40px] md:mt-[60px]">
                <img src={imgNext} alt="Music Band Website Redesign Preview" className="w-full h-[300px] object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
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
