import { useState, useEffect, useLayoutEffect, useRef, forwardRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useMotionTemplate, useSpring, type MotionValue } from "motion/react";
const PaperFly = lazy(() => import("./PaperFly"));

import imgHero from "../../images/Hero.webp";
import imgRinesk from "../../images/Rinesk_min.webp";
import imgFincube from "../../images/Fincube_min.webp";
import imgBrush from "../../images/Brushbuddy_var_min.webp";
import imgJukra from "../../images/Jukrassic Pork_min.webp";
import imgSel1 from "../../images/1_openmind.webp";
import imgSel2 from "../../images/2_1000+1song.webp";
import imgSel3 from "../../images/3_svitlytsia.webp";
import imgSel4 from "../../images/4_Pixel.webp";
import imgSel5 from "../../images/5_Swamispath.webp";
import avatarBorys from "../../images/Avatar Borys Romanenko.webp";
import avatarAnastasiia from "../../images/Avatar Anastasiia Symantieva.webp";
import avatarOleksii from "../../images/Avatar Oleksii Vynnyk.webp";
import quotesIcon from "../../Isons_svg/quotes.svg";

import linkedinSvg from "@/imports/Socials/linkedin.svg?raw";
import dribbbleSvg from "@/imports/Socials/dribbble.svg?raw";
import behanceSvg from "@/imports/Socials/behance.svg?raw";
import telegramSvg from "@/imports/Socials/telegram.svg?raw";

export const gallery = { fontFamily: "'Gallery Modern', 'Italiana', serif" };
export const manrope = { fontFamily: "'Manrope', sans-serif" };

type Project = { title: string; year: string; tags: string[]; image: string; alt: string; to?: string };
const projects: Project[] = [
  { title: "Rinesk", year: "2025", tags: ["Dashboard", "Call centre", "UI/UX Design"], image: imgRinesk, to: "/work/rinesk", alt: "Rinesk - Telecom Dashboard for Call Centre | Branding and UX & UI Design" },
  { title: "Fincube", year: "2024", tags: ["Mobile app", "Finance", "UI/UX Design"], image: imgFincube, to: "/work/fincube", alt: "Fincube - Personal Finance Monitoring Mobile app | UX & UI Design" },
  { title: "BrushBuddy", year: "2024", tags: ["Website", "E-commerce", "UI/UX Design"], image: imgBrush, to: "/work/brushbuddy", alt: "BrushBuddy - Healthcare Ecommerce Website with Oral Care Products | UX & UI Design" },
  { title: "Jukrassic Pork", year: "2023", tags: ["Redesign", "Media", "UI/UX Design"], image: imgJukra, to: "/work/jukrassic", alt: "Jukrassic Pork - Media Website Redesign for Music Band | UX & UI Design" },
];

// Selected-work showcase images, ordered by the filename numbering in /images
const selectedWork = [
  { src: imgSel1, label: "OpenMind", alt: "Openmind - Travel Web platform for Couchsurfers | UX & UI Design" },
  { src: imgSel2, label: "1000+1 Song", alt: "1000+1song - Media Website with Ethnocultural Sings | UX & UI Design" },
  { src: imgSel3, label: "Svitlytsia", alt: "Svitlytsia - Public services One page Website for Management Company | UX & UI Design" },
  { src: imgSel4, label: "Pixel", alt: "Pixel - Real Estate Landing page | UX & UI Design" },
  { src: imgSel5, label: "Swamispath", alt: "Swamispath - Wellness Mobile app for Coach Community | UX & UI Design" },
];

// Testimonials. Ordered left→right as shown in the design; Anastasiia (index 1) is active by default.
const recommendations = [
  {
    name: "Borys Romanenko",
    role: "Head of Growth",
    avatar: avatarBorys,
    quote: "She was also one of the most proactive people on the team when it came to bringing AI into her design process, which in the current environment is not a nice-to-have anymore.",
  },
  {
    name: "Anastasiia Symantieva",
    role: "Senior UI/UX Designer",
    avatar: avatarAnastasiia,
    quote: "Anastasiia owns UI/UX end-to-end. What stands out is how naturally she blends careful, research-backed design with an AI-augmented workflow.",
  },
  {
    name: "Oleksii Vynnyk",
    role: "Full Stack Developer",
    avatar: avatarOleksii,
    quote: "She's easy to talk to, open to feedback, and never missed a deadline. We got along so well that she was the first person I reached out to for design on my own projects later.",
  },
];

function SocialIcon({ svg, size = 24 }: { svg: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/stasiiacher", svg: linkedinSvg },
  { label: "Dribbble", href: "https://dribbble.com/angeljazva", svg: dribbbleSvg },
  { label: "Behance", href: "https://www.behance.net/cherniak", svg: behanceSvg },
];

// Contact section uses Telegram in place of Dribbble.
const contactSocials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/stasiiacher", svg: linkedinSvg },
  { label: "Telegram", href: "https://t.me/anastasia_s_ch", svg: telegramSvg },
  { label: "Behance", href: "https://www.behance.net/cherniak", svg: behanceSvg },
];

function IconBtn({ children, href = "#", label }: { children: React.ReactNode; href?: string; label?: string }) {
  return (
    <motion.a
      href={href}
      data-cursor="expand"
      target={href === "#" ? undefined : "_blank"}
      rel={href === "#" ? undefined : "noreferrer"}
      aria-label={label}
      whileHover={{ backgroundColor: "#c39e7b", color: "#33323b", scale: 1.05 }}
      transition={{ duration: 0.25 }}
      className="size-[72px] rounded-full border border-[#c39e7b] text-[#c39e7b] flex items-center justify-center"
    >
      {children}
    </motion.a>
  );
}

export function useMediaQuery(query: string) {
  // Lazy-init from the actual match so the first render is correct (avoids a one-frame flash, e.g. a
  // desktop video briefly autoplaying before the effect runs).
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function Nav({ textColor }: { textColor: MotionValue<string> }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Scroll-spy: mark the nav link whose section sits under the line just below the nav.
  useEffect(() => {
    const ids = ["about", "work", "recommendation", "contact"];
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current = "";
      for (const id of ["intro", ...ids]) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { current = id; break; }
      }
      setActive(ids.includes(current) ? current : "");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Lock background scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Progressive blur: stacked backdrop-blur layers whose masks fade out downward,
          so the blur is strongest at the very top and dissolves below the bar. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[180%]">
        <div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_90%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_55%,transparent_90%)]" />
        <div className="absolute inset-0 backdrop-blur-[5px] [mask-image:linear-gradient(to_bottom,#000_0%,#000_30%,transparent_65%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_30%,transparent_65%)]" />
        <div className="absolute inset-0 backdrop-blur-[10px] [mask-image:linear-gradient(to_bottom,#000_0%,transparent_40%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,transparent_40%)]" />
      </div>
      <motion.div className="relative z-50 max-w-[1440px] mx-auto flex items-center justify-between px-4 md:px-[40px] lg:px-[84px] py-3 md:py-[24px] uppercase text-[14px] md:text-[16px]" style={{ ...manrope, color: textColor }}>
        <span className={`transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}>UI/UX & AI-Augmented Design</span>
        <div className="hidden md:flex gap-[24px]">
          {["about", "work", "recommendation", "contact"].map(id => (
            <button
              key={id}
              data-cursor="expand"
              onClick={() => go(id)}
              className={`relative font-normal uppercase transition-colors duration-300 hover:text-[#c39e7b] after:absolute after:left-0 after:-bottom-[4px] after:h-[2px] after:bg-current after:transition-[width] after:duration-300 after:content-[''] ${active === id ? "after:w-full" : "after:w-0"}`}
            >
              {id}
            </button>
          ))}
        </div>
        <button
          className={`md:hidden relative p-2 ${open ? "text-[#fefefe]" : ""}`}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <div className={`menu ${open ? "js-toggled" : ""}`}>
            <div className="menu-middle" />
          </div>
        </button>
      </motion.div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-40 bg-[#33323b] flex flex-col items-center pt-[140px] pb-[48px] uppercase"
            style={manrope}
          >
            <div className="flex flex-col items-center gap-[28px]">
              {["about", "work", "recommendation", "contact"].map(id => (
                <button key={id} onClick={() => go(id)} className="font-normal capitalize text-[#fefefe] text-[28px] leading-none">{id}</button>
              ))}
            </div>
            <a
              href="https://linktr.ee/stasiacher"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-auto size-[140px] rounded-full bg-[#c39e7b] text-[#33323b] text-[16px] leading-tight font-medium normal-case flex items-center justify-center text-center"
            >
              Send<br />message
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Intro() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 840], [0, 120]);
  const opacity = useTransform(scrollY, [0, 700], [1, 0]);

  return (
    <section id="intro" style={{ position: "relative" }} className="w-full overflow-hidden">
      {/* Mobile layout */}
      <div className="md:hidden relative pt-[64px] pb-[24px] px-4 min-h-[100svh] flex flex-col">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-[240px] h-[316px] bg-[#262d33] overflow-hidden"
        >
          <img src={imgHero} alt="" fetchpriority="high" decoding="async" className="w-full h-full object-cover" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-[#c39e7b] text-[40px] leading-none mt-6"
          style={gallery}
        >
          Anastasiia Cherniak
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-[#bcbcbc] text-[16px] leading-[24px] mt-4"
          style={manrope}
        >
          Based in Ukraine, available worldwide
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-[#bcbcbc] text-[16px] leading-[24px] mt-4"
          style={manrope}
        >
          Harnessing AI tools to design engaging UI/UX solutions that elevate web and mobile SaaS products, with 3 years of industry experience.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="flex gap-[8px] mt-auto pt-10 justify-start"
        >
          {socials.map((s) => (
            <IconBtn key={s.label} href={s.href} label={s.label}><SocialIcon svg={s.svg} size={24} /></IconBtn>
          ))}
        </motion.div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block relative h-[840px] max-w-[1440px] mx-auto">
        <motion.img
          src={imgHero}
          alt=""
          fetchpriority="high"
          decoding="async"
          style={{ y }}
          className="absolute left-1/2 -translate-x-1/2 top-[152px] w-[408px] h-[536px] object-cover"
        />
        <motion.div style={{ opacity }} className="absolute inset-0">
          <div className="absolute left-1/2 top-[120px] -translate-x-1/2 whitespace-nowrap">
            <RevealTitle
              text="Anastasiia Cherniak"
              className="text-[#c39e7b] text-[clamp(48px,11vw,132px)] leading-none whitespace-nowrap"
              style={gallery}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute right-[40px] lg:right-auto lg:left-[calc(50%_+_228px)] top-[224px] text-[#bcbcbc] text-[16px] leading-[24px] whitespace-nowrap"
            style={manrope}
          >
            Based in Ukraine, available worldwide
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// Entrance animation for the large Gallery Modern titles (88px / 132px). Each glyph swings up
// from below with a small rotation and a slant (pivoting from its bottom-left corner), staggered
// from the first character to the last — so the title resolves from its beginning to its end.
const titleStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
// Reduced rotation + slant; the glyph starts fully below its mask and slides up, so at the start
// of the animation only part of each letter is visible (the rest is clipped by the mask).
const titleCharVariant = {
  hidden: { y: "115%", rotate: 3, skewX: -4 },
  show: { y: "0%", rotate: 0, skewX: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export const RevealTitle = forwardRef<HTMLElement, {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "p" | "h1" | "h2" | "span";
  triggerOnView?: boolean;
}>(function RevealTitle({ text, className, style, as = "p", triggerOnView = false }, ref) {
  const MotionTag = (motion as any)[as];
  const trigger = triggerOnView
    ? { whileInView: "show", viewport: { once: true, amount: 0.5 } }
    : { animate: "show" };
  return (
    <MotionTag ref={ref} className={className} style={style} variants={titleStagger} initial="hidden" aria-label={text} {...trigger}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.2em", marginBottom: "-0.2em" }}
        >
          <motion.span className="inline-block" variants={titleCharVariant} style={{ transformOrigin: "0% 100%" }}>
          {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
});

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function About({ sectionRef, textColor }: { sectionRef: React.RefObject<HTMLElement>; textColor: MotionValue<string> }) {
  return (
    <motion.section ref={sectionRef} id="about" className="w-full" style={{ ...manrope, color: textColor }}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-[40px] lg:px-[84px] py-[80px] md:py-[24px]">
        <div className="flex flex-col items-end gap-[60px] md:gap-[120px] md:pt-[160px] md:pb-[100px]">
          <div className="flex flex-col md:flex-row gap-[40px] md:gap-[24px] items-start md:justify-end w-full">
            <Reveal className="w-full md:flex-1 lg:flex-none lg:w-[408px]">
              <div className="flex flex-col gap-[32px] w-full">
                <div className="flex flex-col gap-[16px] md:gap-[24px]">
                  <p className="text-[32px] md:text-[40px] leading-none" style={gallery}>soft skills</p>
                  <ul className="text-[16px] md:text-[20px] leading-[28px] md:leading-[32px]">
                    {["Time Management","Responsibility","Empathy","Perseverance","Attentiveness"].map(s => <li key={s}>•{s}</li>)}
                  </ul>
                </div>
                <div className="flex flex-col gap-[16px] md:gap-[24px]">
                  <p className="text-[32px] md:text-[40px] leading-none" style={gallery}>languages</p>
                  <ul className="text-[16px] md:text-[20px] leading-[28px] md:leading-[32px]">
                    <li>•English - Upper-Intermediate</li>
                    <li>•Ukrainian - Native</li>
                  </ul>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="w-full md:flex-1 lg:flex-none lg:w-[408px]">
              <div className="w-full flex flex-col gap-[16px] md:gap-[24px]">
                <p className="text-[32px] md:text-[40px] leading-none" style={gallery}>hard skills</p>
                <ul className="text-[16px] md:text-[20px] leading-[28px] md:leading-[32px]">
                  {["Research","Stakeholders interview","Competitors analysis","Qualitative / Quantitative user interviews","Mapping out User flow","Wireframing & Prototyping","AI-Assisted UI/UX Design (Claude, Gemini, Nano Banana, Midjourney)","Mobile UI patterns","Cross platform design","Animation of interface interaction"].map(s => <li key={s}>•{s}</li>)}
                </ul>
              </div>
            </Reveal>
          </div>
          <div className="flex flex-col gap-[40px] md:gap-[80px] md:items-end w-full">
            <ScrollRevealText
              className="text-[24px] md:text-[36px] lg:text-[44px] leading-[32px] md:leading-[46px] lg:leading-[56px] font-normal"
              text="Working on each project, I empathize and focused on users interests and needs while taking into account the business requirements, which helps me to define problems, ideate, prototype the end product with a neat delightful visual interface solution that will be profitable for the owner."
            />
            <div className="flex flex-col gap-[24px] md:gap-[40px] w-full md:w-[calc(50%_-_12px)] lg:w-[408px]">
              <p className="text-[16px] leading-[24px] w-full">If you are hiring and seeking for a creative team player to join your company, I would be glad to cooperate with you.</p>
              <div className="flex gap-[16px] md:gap-[24px]">
                {[
                  { label: "Read CV", href: "https://hello.cv/anastasiia-cherniak" },
                  { label: "Download resume", href: "https://drive.google.com/uc?export=download&id=1x-cL-a_HXyXI7H0HsgrL7hTFuhpU3LNA" },
                ].map(({ label, href }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ backgroundColor: "#33323b", color: "#c39e7b" }}
                    transition={{ duration: 0.3 }}
                    className="size-[96px] md:size-[120px] rounded-full border border-current text-[14px] md:text-[16px] font-semibold px-[12px] flex items-center justify-center text-center"
                  >
                    {label}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Works({ textColor }: { textColor: MotionValue<string> }) {
  const navigate = useNavigate();
  const [active, setActive] = useState<number | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Marquee panned by scroll: as the showcase passes through the viewport it travels
  // from the first image (x:0) to the last (x:-overflow), revealing every image.
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const marqueeX = useMotionValue(0);
  useEffect(() => {
    const update = () => {
      const wrap = marqueeRef.current;
      const track = trackRef.current;
      if (!wrap || !track) return;
      const overflow = Math.max(0, track.scrollWidth - track.clientWidth);
      const rect = wrap.getBoundingClientRect();
      const span = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span));
      marqueeX.set(-progress * overflow);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [marqueeX]);

  // Dynamic parallax for the hover stage image: a small, spring-smoothed offset that
  // tracks the cursor relative to the viewport center, giving a gentle "floaty" depth.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const stageX = useSpring(px, { stiffness: 90, damping: 18, mass: 0.6 });
  const stageY = useSpring(py, { stiffness: 90, damping: 18, mass: 0.6 });
  const PARALLAX = 0.14; // fraction of cursor-to-center distance; drives the drift amplitude
  const trackParallax = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    px.set((e.clientX - window.innerWidth / 2) * PARALLAX);
    py.set((e.clientY - window.innerHeight / 2) * PARALLAX);
  };
  const resetParallax = () => {
    // Snap the transform back to center instantly (before the fade-out), per spec.
    px.set(0); py.set(0);
    stageX.jump(0); stageY.jump(0);
  };

  // The hover image is anchored to the active project: its top lines up with that project's
  // title, while the box keeps its fixed 408×300 proportions.
  const STAGE_H = 300;
  const stageParentRef = useRef<HTMLDivElement>(null);
  const titleRefs = useRef<(HTMLElement | null)[]>([]);
  const [stageBox, setStageBox] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    if (active === null || !isDesktop) { setStageBox(null); return; }
    const parent = stageParentRef.current;
    const cur = titleRefs.current[active];
    if (!parent || !cur) return;
    const measure = () => {
      const parentTop = parent.getBoundingClientRect().top;
      const curTop = cur.getBoundingClientRect().top - parentTop;
      setStageBox({ top: curTop, height: STAGE_H });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, isDesktop]);

  return (
    <motion.section id="work" className="w-full" style={{ color: textColor }}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-[40px] lg:px-[84px] py-[60px] md:py-[24px]">
        <div ref={stageParentRef} className="relative flex flex-col md:pt-[60px] md:pb-[120px] gap-[40px]">
          {/* Desktop hover image stage — anchored to the active project, drifts with the cursor */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[408px] pointer-events-none">
            <AnimatePresence>
              {active !== null && stageBox && (
                <motion.div
                  key={`stage-${active}`}
                  className="absolute right-0 w-[408px]"
                  style={{ top: stageBox.top, height: stageBox.height, x: stageX, y: stageY }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <img
                    src={projects[active].image}
                    alt={projects[active].alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Project list — viewport-centered */}
          <div className="flex flex-col items-center md:gap-[80px] lg:gap-[120px] relative">
            {projects.map((p, i) => (
              <motion.a
                key={p.title}
                href={p.to ?? "#"}
                onClick={(e) => {
                  if (!p.to) return;
                  e.preventDefault();
                  // Remember where we are so returning from the case study restores this exact spot.
                  // We DON'T scroll the homepage here — the case study lands itself at the top on
                  // mount (useLayoutEffect, before paint), so there's no flash and no lost position.
                  sessionStorage.setItem("homeScroll", String(window.scrollY));
                  navigate(p.to);
                }}
                data-cursor="project"
                onMouseEnter={() => isDesktop && setActive(i)}
                onMouseMove={trackParallax}
                onMouseLeave={() => { if (!isDesktop) return; resetParallax(); setActive(null); }}
                className="w-full max-w-[408px] py-[32px] md:py-[60px] flex flex-col items-center gap-[16px] md:gap-[24px] cursor-pointer"
                animate={{ opacity: !isDesktop || active === null || active === i ? 1 : 0.35 }}
                transition={{ duration: 0.4 }}
              >
                {/* Mobile + tablet inline thumbnail (desktop uses the sticky hover stage).
                    Keep the 408×300 proportion at every size: fixed 408×300 from ~440px up
                    (capped by max-w-[408px]); below that it scales down with the side margins
                    while preserving the aspect ratio. */}
                <img src={p.image} alt={p.alt} loading="lazy" decoding="async" className="lg:hidden order-last w-full max-w-[408px] aspect-[408/300] object-cover" />
                <div className="flex items-end justify-center w-full gap-[12px] md:gap-[24px] lg:gap-[56px]">
                  <RevealTitle
                    ref={(el) => { titleRefs.current[i] = el; }}
                    text={p.title}
                    triggerOnView
                    className="text-[40px] md:text-[64px] lg:text-[88px] leading-none whitespace-nowrap"
                    style={gallery}
                  />
                  <p className="text-[14px] md:text-[16px] leading-[24px] shrink-0" style={manrope}>{p.year}</p>
                </div>
                <div className="flex justify-between w-full text-[12px] md:text-[16px] leading-[20px] md:leading-[24px] gap-2" style={manrope}>
                  {p.tags.map(t => <span key={t}>{t}</span>)}
                </div>
              </motion.a>
            ))}
          </div>

        </div>

        {/* Marquee */}
        <div ref={marqueeRef} className="py-[40px] md:py-[80px] overflow-hidden -mx-4 md:-mx-[40px] lg:-mx-[84px]">
          <motion.div
            ref={trackRef}
            className="flex gap-[16px] md:gap-[24px]"
            style={{ x: marqueeX }}
          >
            {selectedWork.map((w, i) => (
              <img key={i} src={w.src} alt={w.alt} loading="lazy" decoding="async" className="w-[240px] md:w-[408px] h-[180px] md:h-[300px] object-cover opacity-70 shrink-0 transition-opacity duration-300 hover:opacity-100" />
            ))}
          </motion.div>
        </div>

        <p className="md:hidden opacity-70 text-[14px] leading-[24px]" style={manrope}>
          Selected work 2023/26. Design solutions for commercial projects and educational cases.
        </p>
      </div>
    </motion.section>
  );
}

// Testimonials section. Hovering an avatar (desktop) or tapping one (mobile carousel) swaps the
// quote and highlights that person; inactive cards fade to 50% opacity, their avatars to a further
// 70% (so ~35% overall). Mobile shows a centred peek-carousel; desktop a static row + side label.
function Recommendation() {
  const [active, setActive] = useState(1); // the centre (2nd) person is picked by default, all viewports

  // Mobile peek-carousel scrolling: the middle card rests centred; tapping the first card scrolls it
  // flush to the left edge and the last card flush to the right edge — no inner padding either side.
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToCard = (i: number, smooth = true) => {
    const container = scrollRef.current;
    const card = container?.firstElementChild?.children[i] as HTMLElement | undefined;
    if (!container || !card || container.clientWidth === 0) return;
    const cardLeft = card.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
    let target: number;
    if (i === 0) target = cardLeft; // first card flush left
    else if (i === recommendations.length - 1) target = cardLeft + card.offsetWidth - container.clientWidth; // last flush right
    else target = cardLeft + card.offsetWidth / 2 - container.clientWidth / 2; // middle centred
    target = Math.max(0, Math.min(container.scrollWidth - container.clientWidth, target));
    container.scrollTo({ left: target, behavior: smooth ? "smooth" : "instant" });
  };
  // Centre the default card on mount (no animation), and keep the active card aligned across resizes.
  useLayoutEffect(() => { scrollToCard(active, false); }, []);
  useEffect(() => {
    const onResize = () => scrollToCard(active, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const Card = ({ i, w, h }: { i: number; w: number; h: number }) => {
    const r = recommendations[i];
    const isActive = i === active;
    return (
      // Inactive cards sit at 50% (avatar a further 70%); hovering the card (group) lifts both back
      // to full opacity as a preview — clicking is what actually activates it.
      <span className={`block shrink-0 text-left transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-50 group-hover:opacity-100"}`} style={{ width: w }}>
        <img
          src={r.avatar}
          alt={r.name}
          loading="lazy"
          decoding="async"
          style={{ width: w, height: h }}
          className={`object-cover transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
        />
        <span className="block text-[16px] leading-[24px] font-normal text-[#fefefe] mt-[16px]">{r.name}</span>
        <span className="block text-[16px] leading-[24px] font-normal text-[#9a99a0] mt-0">{r.role}</span>
      </span>
    );
  };

  const label = "What people say about our collaboration and teamwork with me on various projects.";

  return (
    <section id="recommendation" className="w-full" style={manrope}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-[40px] lg:px-[84px] py-[80px] md:py-[120px]">
        <div className="flex flex-col gap-[48px] md:gap-[100px]">

          {/* Quote — all three are stacked in one grid cell, so the box is always as tall as the
              longest quote (no reflow when switching at any viewport); only the active one shows. */}
          <div className="relative">
            <img src={quotesIcon} alt="" aria-hidden="true" className="block w-6 h-6 lg:absolute lg:left-0 lg:top-[6px]" />
            <div className="grid lg:max-w-[840px] lg:ml-auto mt-[16px] lg:mt-0">
              {recommendations.map((r, i) => (
                <motion.div
                  key={r.name}
                  aria-hidden={i !== active}
                  animate={{ opacity: i === active ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className={`col-start-1 row-start-1 ${i === active ? "" : "pointer-events-none"}`}
                >
                  <ScrollRevealText
                    text={r.quote}
                    offset={["start 0.9", "end 0.65"]}
                    className="text-[#fefefe] text-[24px] md:text-[36px] lg:text-[44px] leading-[32px] md:leading-[46px] lg:leading-[56px]"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop: avatar row (hover to switch). The caption is a sticky bottom bar (see App),
              fading in/out with the section just like the Works "Selected work" note. */}
          <div className="hidden lg:flex justify-end">
            <div className="flex gap-[24px]">
              {recommendations.map((r, i) => (
                <button key={r.name} type="button" data-cursor="expand" onClick={() => setActive(i)} className="group block">
                  <Card i={i} w={192} h={260} />
                </button>
              ))}
            </div>
          </div>

          {/* Phone + tablet: left-aligned, horizontally scrollable row; the centre (2nd) person is
              picked by default, tap to switch. The caption shows only on phone — tablet (md+) uses
              the sticky bottom bar, same as desktop, so the note appears exactly once. */}
          <div className="lg:hidden">
            <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-[16px]">
                {recommendations.map((r, i) => (
                  <button key={r.name} type="button" onClick={() => { setActive(i); scrollToCard(i); }} className="group block">
                    <Card i={i} w={168} h={227} />
                  </button>
                ))}
              </div>
            </div>
            <p className="md:hidden text-[#9a99a0] text-[14px] leading-[24px] mt-[40px]">{label}</p>
          </div>

        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="w-full" style={manrope}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-[40px] lg:px-[84px] pt-[80px] pb-[24px] md:py-[24px]">
        <div className="flex flex-col md:pt-[120px] pb-0 gap-[40px] md:gap-[80px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[40px]">
            <ScrollRevealText
              className="text-[#fefefe] text-[24px] md:text-[36px] lg:text-[44px] leading-[32px] md:leading-[46px] lg:leading-[56px] font-normal min-w-0 md:flex-1 lg:max-w-[840px]"
              text="If you liked this artwork, please contact me in any convenient way and we can discuss ideas for your project."
              offset={["start 0.9", "end 0.65"]}
            />
            <Reveal delay={0.1} className="shrink-0">
              {/* Keeps the source file's 1:1 (600×600) proportions */}
              <div className="w-[200px] md:w-[280px] lg:w-[360px] aspect-square shrink-0">
                <Suspense fallback={null}>
                  <PaperFly />
                </Suspense>
              </div>
            </Reveal>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between items-start gap-[32px]">
            <div className="flex flex-col gap-[12px] md:w-[408px]">
              <p className="text-[#bcbcbc] text-[16px] leading-[24px]">Let's do great things together!</p>
              <motion.a
                href="mailto:angeljazva@gmail.com"
                data-cursor="expand"
                whileHover={{ letterSpacing: "0.02em" }}
                transition={{ duration: 0.3 }}
                className="text-[#c39e7b] text-[20px] md:text-[28px] leading-[28px] font-medium inline-block break-all"
              >
                angeljazva@gmail.com
              </motion.a>
            </div>
            <div className="flex gap-[8px]">
              {contactSocials.map((s) => (
                <IconBtn key={s.label} href={s.href} label={s.label}><SocialIcon svg={s.svg} size={24} /></IconBtn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<"default" | "expand" | "project" | "play" | "pause" | "label">("default");
  const [label, setLabel] = useState("");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const size = useMotionValue(16);
  // Snappy spring so the dot trails the pointer with a subtle, premium lag.
  const sx = useSpring(x, { stiffness: 700, damping: 45, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 700, damping: 45, mass: 0.35 });
  const ssize = useSpring(size, { stiffness: 350, damping: 28, mass: 0.4 });
  // Position by top-left on a SINGLE element so the transform and mix-blend-mode live together.
  // (Nesting the blend inside a transformed wrapper isolates it and the inversion disappears.)
  const cx = useTransform<number, number>([sx, ssize], ([px, s]) => px - s / 2);
  const cy = useTransform<number, number>([sy, ssize], ([py, s]) => py - s / 2);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    // Resolve the cursor state from the element under the pointer. Run on every move (not just
    // mouseover) so a data-cursor that flips while hovering — e.g. play → pause on click — updates.
    // Projects/videos/labelled elements grow the cursor to 120px (arrow / play / pause icon / text);
    // links & social buttons grow it to 68px; everything else stays a dot. setState calls with an
    // unchanged value are no-ops in React, so running this each frame is cheap.
    const resolve = (el: HTMLElement | null) => {
      const labelEl = el?.closest("[data-cursor='label']");
      if (el?.closest("[data-cursor='project']")) { setVariant("project"); size.set(120); }
      else if (el?.closest("[data-cursor='play']")) { setVariant("play"); size.set(120); }
      else if (el?.closest("[data-cursor='pause']")) { setVariant("pause"); size.set(120); }
      else if (labelEl) { const l = labelEl.getAttribute("data-cursor-label") || ""; setVariant("label"); setLabel((prev) => (prev === l ? prev : l)); size.set(120); }
      else if (el?.closest("[data-cursor='expand']")) { setVariant("expand"); size.set(68); }
      else { setVariant("default"); size.set(16); }
    };
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); resolve(e.target as HTMLElement); };
    const over = (e: MouseEvent) => resolve(e.target as HTMLElement);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y, size]);

  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden
      style={{ x: cx, y: cy, width: ssize, height: ssize }}
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full bg-[#e8e4d8] mix-blend-difference"
    >
      <motion.svg
        viewBox="0 0 40 40"
        fill="none"
        className="w-[34px] h-[34px]"
        animate={{ opacity: variant === "project" ? 1 : 0, scale: variant === "project" ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        <path
          d="M16.4645 7.03649C17.3389 7.91094 19.5086 8.35289 21.4791 8.57445C24.0176 8.86436 26.595 8.75476 29.0769 8.15607C30.9378 7.70706 33.0155 6.98463 34.1422 5.85798M34.1422 5.85798C33.0155 6.98463 32.2919 9.06353 31.8441 10.9232C31.2466 13.4063 31.137 15.9837 31.4245 18.5199C31.6472 20.4916 32.0915 22.6635 32.9636 23.5356M34.1422 5.85798L5.85789 34.1422"
          stroke="#33323B"
          strokeWidth={2}
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 36 36"
        fill="none"
        className="absolute inset-0 m-auto w-[30px] h-[30px]"
        animate={{ opacity: variant === "play" ? 1 : 0, scale: variant === "play" ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        <path
          d="M9.33301 32L10.6663 32.6667C20.6663 26 27.333 22.3333 35.9997 19V17C27.333 13.6667 20.6663 9.99999 10.6663 3.33333L9.33301 3.99999C9.33301 3.99999 9.99967 12.2667 9.99967 18C9.99967 23.7333 9.33301 32 9.33301 32Z"
          fill="#33323B"
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 36 36"
        fill="none"
        className="absolute inset-0 m-auto w-[28px] h-[28px]"
        animate={{ opacity: variant === "pause" ? 1 : 0, scale: variant === "pause" ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        <path d="M16 32.5V3.5H15.75L15.48 3.554C14.1729 3.81531 12.8271 3.81531 11.52 3.554L11.25 3.5H11L11 32.5H11.25L11.52 32.446C12.8271 32.1847 14.1729 32.1847 15.48 32.446L15.75 32.5H16Z" fill="#33323B" />
        <path d="M25 32.5V3.5H24.75L24.48 3.554C23.1729 3.81531 21.8271 3.81531 20.52 3.554L20.25 3.5H20L20 32.5H20.25L20.52 32.446C21.8271 32.1847 23.1729 32.1847 24.48 32.446L24.75 32.5H25Z" fill="#33323B" />
      </motion.svg>
      <motion.span
        className="absolute inset-0 flex items-center justify-center text-center text-[#33323B] text-[16px] leading-[24px] font-semibold px-[14px]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
        animate={{ opacity: variant === "label" ? 1 : 0, scale: variant === "label" ? 1 : 0.5 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
}

function RevealWord({ progress, range, word }: { progress: MotionValue<number>; range: [number, number]; word: string }) {
  // Each word eases in from low-opacity + blurred to fully sharp as the scroll progress crosses its range.
  const opacity = useTransform(progress, range, [0.1, 1]);
  const blur = useTransform(progress, range, [6, 0]);
  const filter = useMotionTemplate`blur(${blur}px)`;
  return <motion.span style={{ opacity, filter }}>{word} </motion.span>;
}

// Read-along reveal: words sharpen from dim+blurred to full opacity as the paragraph scrolls through view.
export function ScrollRevealText({ text, className, style, offset = ["start 0.9", "end 0.45"] }: { text: string; className?: string; style?: React.CSSProperties; offset?: any }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <RevealWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} word={word} />
      ))}
    </p>
  );
}

export default function App() {
  const aboutRef = useRef<HTMLElement>(null);
  // Scroll-driven theme: t ramps 0 (dark) -> 1 (tan) as the About section passes through view.
  const t = useMotionValue(0);
  const bg = useTransform(t, [0, 1], ["#33323b", "#c39e7b"]);
  const fg = useTransform(t, [0, 1], ["#fefefe", "#33323b"]);
  // Sticky bottom bar visibility — full while its section fills the screen, faded otherwise.
  const heroBarOpacity = useMotionValue(1);
  const worksBarOpacity = useMotionValue(0);
  const recommendationBarOpacity = useMotionValue(0);
  const heroBarPE = useTransform(heroBarOpacity, (o) => (o > 0.05 ? "auto" : "none"));

  // Returning from a case study (Back link or browser back): restore the scroll position the visitor
  // had when they opened the project. Runs before paint so there's no jump. A fresh load of "/" has
  // nothing saved, so it stays at the top.
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem("homeScroll");
    if (saved === null) return;
    sessionStorage.removeItem("homeScroll");
    window.scrollTo({ top: parseInt(saved, 10) || 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    const smoothstep = (x: number) => x * x * (3 - 2 * x);
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const update = () => {
      const vh = window.innerHeight;
      const el = aboutRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        // Spread each transition across a full viewport of scrolling: ramp gray -> beige as the
        // About section enters, hold beige while it fills the screen, then ramp back to gray as it
        // leaves. smoothstep eases the ends so the gradient flows instead of snapping.
        const enter = (vh - rect.top) / vh;
        const exit = rect.bottom / vh;
        t.set(smoothstep(clamp01(Math.min(enter, exit))));
      }
      // Hero bar: full while the hero fills the viewport, fades out as it scrolls away.
      const intro = document.getElementById("intro");
      if (intro) {
        const r = intro.getBoundingClientRect();
        heroBarOpacity.set(smoothstep(clamp01(r.bottom / vh)));
      }
      // Works bar: fade in as Works enters, hold, fade out as it ends.
      const work = document.getElementById("work");
      if (work) {
        const r = work.getBoundingClientRect();
        const fadeIn = vh * 0.6;
        const fadeOut = vh * 0.4;
        // Fade in as Work enters; fade out as Work's bottom crosses up past the viewport bottom
        // (i.e. when the section ends and Contact starts taking over the lower viewport).
        const enter = (vh - r.top) / fadeIn;
        const exit = (r.bottom - (vh - fadeOut)) / fadeOut;
        worksBarOpacity.set(smoothstep(clamp01(Math.min(enter, exit))));
      }
      // Recommendation bar: same fade-in/out rules as the Works bar.
      const rec = document.getElementById("recommendation");
      if (rec) {
        const r = rec.getBoundingClientRect();
        const fadeIn = vh * 0.6;
        const fadeOut = vh * 0.4;
        const enter = (vh - r.top) / fadeIn;
        const exit = (r.bottom - (vh - fadeOut)) / fadeOut;
        recommendationBarOpacity.set(smoothstep(clamp01(Math.min(enter, exit))));
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [t, heroBarOpacity, worksBarOpacity, recommendationBarOpacity]);

  return (
    <motion.div style={{ backgroundColor: bg }} className="min-h-screen w-full relative">
      <CustomCursor />
      <Nav textColor={fg} />
      <Intro />
      <About sectionRef={aboutRef} textColor={fg} />
      <Works textColor={fg} />
      <Recommendation />
      <Contact />

      {/* Sticky bottom bar (desktop): hero shows bio + socials on one line; Works shows the caption only */}
      <motion.div style={{ opacity: heroBarOpacity }} className="hidden md:block fixed inset-x-0 bottom-[24px] z-40 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-[40px] lg:px-[84px] flex items-end justify-between gap-[24px]">
          <p className="w-[408px] text-[#bcbcbc] text-[16px] leading-[24px]" style={manrope}>
            Harnessing AI tools to design engaging UI/UX solutions that elevate web and mobile SaaS products, with 3 years of industry experience.
          </p>
          <motion.div className="flex gap-[8px]" style={{ pointerEvents: heroBarPE }}>
            {socials.map((s) => (
              <IconBtn key={s.label} href={s.href} label={s.label}><SocialIcon svg={s.svg} size={24} /></IconBtn>
            ))}
          </motion.div>
        </div>
      </motion.div>
      <motion.div style={{ opacity: worksBarOpacity }} className="hidden md:block fixed inset-x-0 bottom-[24px] z-40 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-[40px] lg:px-[84px]">
          <p className="w-[408px] text-[#bcbcbc] text-[16px] leading-[24px]" style={manrope}>
            Selected work 2023/26. Design solutions for commercial projects and educational cases.
          </p>
        </div>
      </motion.div>
      <motion.div style={{ opacity: recommendationBarOpacity }} className="hidden md:block fixed inset-x-0 bottom-[24px] z-40 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-[40px] lg:px-[84px]">
          <p className="w-[408px] text-[#bcbcbc] text-[16px] leading-[24px]" style={manrope}>
            What people say about our collaboration and teamwork with me on various projects.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
