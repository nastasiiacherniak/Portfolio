import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import Camera3D, { type CameraHandle } from "./Camera3D";
import FigmaCursor from "./FigmaCursor";
import { PROJECTS, CAMERA_COLORS, type CameraColorId, type PlaygroundProject } from "./projects";
import { shutter as shutterSound, eject as ejectSound, develop as developSound, isMuted, setMuted } from "./sound";
import backdrop from "../../Background/example.avif";
import "./playground.css";

/* Playground: a playful second portfolio. A 3D instant camera hangs in the air over a meadow; each Snap
 * (the button, or a click on the camera itself) prints the next project as an instant photo that slides
 * out of the camera, develops, and joins a fanned row in the bottom-left corner. Opening a photo zooms
 * it to the centre over a blurred scene, with the project image on the left and its story (Project
 * Info / Approach / Results) on the right. The page uses its own Figma-style cursor, which names the
 * control under the pointer. */

const TILTS = [-6, 4, -3, 5]; // each photo's resting angle in the row
const EJECT_MS = 1100;
const DEVELOP_MS = 3400;

// Photo size in the row (and while ejecting, so the hand-off is seamless), and how much they overlap.
const PHOTO_W = "w-[84px] md:w-[108px] lg:w-[96px] xl:w-[140px] hd:w-[170px] 2xl:w-[180px]";
const PHOTO_OVERLAP = "-ml-[12px] lg:-ml-[14px] xl:-ml-[40px] hd:-ml-[50px] 2xl:-ml-[54px]";

type Toast = { id: number; text: string } | null;

// ---------- an instant photo ----------
// `covered`: the next photo in the row overlaps this one, so the caption keeps clear of that edge.
function PhotoFace({ p, developing, compact, covered }: { p: PlaygroundProject; developing: boolean; compact?: boolean; covered?: boolean }) {
  return (
    <>
      <div className="aspect-square overflow-hidden rounded-[2px] bg-[#1c1f17]">
        <img src={p.photo} alt="" draggable={false} data-developing={developing} className="pg-photo-image w-full h-full object-cover" />
      </div>
      <div className={`${compact ? "pt-[6px] pb-[4px] hd:pt-[9px]" : "pt-[10px] pb-[6px]"} ${covered ? "pr-[8%] xl:pr-[31%]" : ""} text-left`}>
        <p className={`pg-hand leading-none text-[var(--pg-ink)] whitespace-nowrap overflow-hidden text-ellipsis ${compact ? "text-[14px] md:text-[17px] lg:text-[16px] xl:text-[20px] hd:text-[23px]" : "text-[22px]"}`}>{p.title}</p>
        <p className={`mt-[3px] uppercase tracking-[0.1em] leading-[1.25] text-[var(--pg-ink-soft)] ${compact ? "text-[8px] md:text-[9px] hd:text-[10px] min-h-[2.5em]" : "text-[10px]"}`}>{p.type.replace(/-/g, "‑") /* non-breaking hyphen: keeps "E-commerce" on one line */}</p>
      </div>
    </>
  );
}

// ---------- opened photo ----------
function PhotoDetail({ p, tilt, onClose }: { p: PlaygroundProject; tilt: number; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      // keep keyboard focus inside the dialog
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")].filter((el) => !el.hasAttribute("disabled"));
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onTabKey = (e: ReactKeyboardEvent) => {
    const n = p.sections.length;
    const next = e.key === "ArrowRight" ? (tab + 1) % n : e.key === "ArrowLeft" ? (tab - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8">
      <motion.button
        type="button"
        aria-label="Close project"
        tabIndex={-1}
        className="pg-backdrop absolute inset-0 cursor-default"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onClose}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`pg-title-${p.id}`}
        layoutId={`photo-${p.id}`}
        initial={{ rotate: tilt }}
        animate={{ rotate: 0 }}
        exit={{ rotate: tilt }}
        transition={{ type: "spring", stiffness: 210, damping: 28 }}
        className="pg-photo relative w-full max-w-[1000px] max-h-[92svh] flex flex-col overflow-hidden"
      >
        {/* Close stays pinned to the card's corner while the content scrolls (mobile). */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-cursor-label="Close"
          data-cursor-side="left"
          className="pg-btn-light absolute z-10 top-[18px] right-[18px] md:top-[26px] md:right-[26px] size-[44px] md:size-[40px] rounded-full flex items-center justify-center"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
        <div className="overflow-y-auto overscroll-contain p-[10px] md:p-[16px] flex flex-col md:grid md:grid-cols-[1.05fr_1fr] gap-[16px] md:gap-[28px]">
          <motion.div layout="position" className="shrink-0 overflow-hidden rounded-[3px] bg-[#1c1f17] aspect-[4/3] md:aspect-auto md:min-h-[460px]">
            <img src={p.hero} alt={p.alt} decoding="async" className="w-full h-full object-cover" />
          </motion.div>
          <motion.div
            className="flex flex-col px-[6px] pb-[8px] md:py-[12px] md:pr-[12px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.22, duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <p className="uppercase tracking-[0.14em] text-[11px] md:text-[12px] text-[var(--pg-ink-soft)] pt-[2px] md:pt-[16px] md:pr-[56px]">{p.type} · {p.year}</p>
            <h2 id={`pg-title-${p.id}`} className="pg-display text-[34px] md:text-[48px] leading-[1.02] font-[650] mt-[6px]">{p.title}</h2>

            <div role="tablist" aria-label={`${p.title} sections`} className="flex flex-wrap gap-[8px] mt-[18px] md:mt-[22px]" onKeyDown={onTabKey}>
              {p.sections.map((s, i) => (
                <button
                  key={s.id}
                  ref={(el) => { tabsRef.current[i] = el; }}
                  role="tab"
                  id={`pg-tab-${p.id}-${s.id}`}
                  aria-selected={tab === i}
                  aria-controls={`pg-panel-${p.id}-${s.id}`}
                  tabIndex={tab === i ? 0 : -1}
                  onClick={() => setTab(i)}
                  data-cursor-label="Click on me"
                  className={`h-[34px] px-[16px] rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.12em] font-medium pg-btn-light`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* All three sections share one grid cell, so the card keeps the height of the longest
                one and doesn't jump when switching tabs; only the selected one is visible. */}
            <div className="grid mt-[20px] md:mt-[24px]">
              {p.sections.map((s, i) => (
                <div
                  key={s.id}
                  id={`pg-panel-${p.id}-${s.id}`}
                  role="tabpanel"
                  aria-labelledby={`pg-tab-${p.id}-${s.id}`}
                  className={`col-start-1 row-start-1 transition-[opacity,transform,visibility] duration-200 ${tab === i ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-[4px] invisible"}`}
                >
                  <h3 className="pg-display text-[20px] md:text-[24px] leading-[1.2] font-[560]">{s.heading}</h3>
                  <div className="mt-[10px] space-y-[12px] text-[15px] md:text-[16px] leading-[1.6] text-[var(--pg-ink-soft)]">
                    {s.body.map((t, j) => <p key={j}>{t}</p>)}
                  </div>
                </div>
              ))}
            </div>

            <Link to={p.to} data-cursor-label="Click on me" className="mt-auto pt-[24px] self-start text-[14px] font-medium underline underline-offset-4 decoration-[var(--pg-ink)]/40 hover:decoration-[var(--pg-ink)]">
              Open the full case study →
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- page ----------
export default function Playground() {
  const reduce = useReducedMotion();
  const cameraRef = useRef<CameraHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [color, setColor] = useState<CameraColorId>("misty-white");
  const [printed, setPrinted] = useState<string[]>([]);
  const [ejecting, setEjecting] = useState<{ id: string; x: number; y: number } | null>(null);
  const [developing, setDeveloping] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [tipFor, setTipFor] = useState<string | null>(null); // swatch name shown briefly after a tap
  const timers = useRef<number[]>([]);
  const finish = CAMERA_COLORS.find((c) => c.id === color)!;

  useEffect(() => {
    const prev = document.title;
    document.title = "Playground - Anastasiia Cherniak";
    window.scrollTo(0, 0);
    // The site reserves a scrollbar gutter; this full-bleed scene paints edge to edge instead.
    const html = document.documentElement;
    const prevGutter = html.style.scrollbarGutter;
    html.style.scrollbarGutter = "auto";
    const t = window.setTimeout(() => say("Press Snap to print my projects"), 1650);
    return () => { document.title = prev; html.style.scrollbarGutter = prevGutter; window.clearTimeout(t); timers.current.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const toastSeq = useRef(0);
  const say = useCallback((text: string) => {
    const id = ++toastSeq.current;
    setToast({ id, text });
    window.setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 3600);
  }, []);

  // Latest state for the camera's click handler (registered once inside the 3D scene).
  const stateRef = useRef({ busy, printed, openId });
  stateRef.current = { busy, printed, openId };

  const snap = () => {
    const { busy, printed, openId } = stateRef.current;
    if (busy || openId) return;
    const next = PROJECTS.find((p) => !printed.includes(p.id));
    cameraRef.current?.shutter();
    shutterSound();
    if (!next) { say("All four are printed — tap a photo to open"); return; }
    setBusy(true);
    setPrintingId(next.id);
    say(`Printing “${next.title}”…`);
    const slot = cameraRef.current?.slotPoint();
    const stage = stageRef.current?.getBoundingClientRect();
    later(reduce ? 0 : 260, () => {
      ejectSound(EJECT_MS);
      setEjecting({ id: next.id, x: (stage?.left ?? 0) + (slot?.x ?? 0), y: (stage?.top ?? 0) + (slot?.y ?? 0) });
    });
    // the photo leaves the camera and flies to the row, still blank; then it develops
    later((reduce ? 0 : 260) + EJECT_MS + 250, () => {
      setDeveloping((d) => [...d, next.id]);
      setPrinted((p) => [...p, next.id]);
      setEjecting(null);
      setPrintingId(null);
      setBusy(false);
    });
    later((reduce ? 0 : 260) + EJECT_MS + 1100, () => setDeveloping((d) => d.filter((x) => x !== next.id)));
    later((reduce ? 0 : 260) + EJECT_MS + 1100 + (reduce ? 600 : DEVELOP_MS), () => {
      developSound();
      say(`“${next.title}” is ready — tap to open`);
    });
  };

  const close = useCallback(() => {
    const id = openId;
    setOpenId(null);
    if (id) window.setTimeout(() => cardRefs.current[id]?.focus({ preventScroll: true }), 50);
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [openId]);

  // Radio group keyboard pattern: arrows move the selection, only the checked swatch is tabbable.
  const swatchRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onSwatchKey = (e: ReactKeyboardEvent) => {
    const i = CAMERA_COLORS.findIndex((c) => c.id === color), n = CAMERA_COLORS.length;
    const next = ["ArrowRight", "ArrowDown"].includes(e.key) ? (i + 1) % n : ["ArrowLeft", "ArrowUp"].includes(e.key) ? (i - 1 + n) % n : -1;
    if (next < 0) return;
    e.preventDefault();
    const id = CAMERA_COLORS[next].id;
    setColor(id);
    swatchRefs.current[id]?.focus();
  };
  // On touch there's no hover, so a tapped swatch shows its name for a moment.
  const tipTimer = useRef(0);
  const lastPointer = useRef<string | undefined>(undefined);
  const pickColor = (id: CameraColorId, pointerType?: string) => {
    setColor(id);
    if (pointerType === "touch" || pointerType === "pen") {
      setTipFor(id);
      window.clearTimeout(tipTimer.current);
      tipTimer.current = window.setTimeout(() => setTipFor(null), 1400);
    }
  };

  const toggleMute = () => { const m = !muted; setMuted(m); setMutedState(m); };
  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (printed.length === 0 && !busy && !ejecting) {
      say("Press Snap to print my projects");
      return;
    }
    setPrinted([]);
    setEjecting(null);
    setDeveloping([]);
    setPrintingId(null);
    setOpenId(null);
    setBusy(false);
    say("Reset — press Snap to print again");
  };
  const open = PROJECTS.find((p) => p.id === openId);
  const ejectProject = PROJECTS.find((p) => p.id === ejecting?.id);
  const lensProject =
    (printingId ? PROJECTS.find((p) => p.id === printingId) : undefined) ??
    PROJECTS.find((p) => !printed.includes(p.id)) ??
    PROJECTS[PROJECTS.length - 1];

  const easeOut = [0.22, 1, 0.36, 1] as const;

  return (
    <MotionConfig reducedMotion="user">
    <main className="pg-root relative min-h-[100svh] overflow-hidden">
      {/* backdrop: starts blurred, transitions into a clear image; blurs again when a project is open */}
      <motion.div
        aria-hidden="true"
        className="pg-bg absolute inset-0"
        style={{ backgroundImage: `url(${backdrop})` }}
        initial={reduce ? false : { filter: "blur(24px)", scale: 1.06, opacity: 0.85 }}
        animate={openId ? { filter: "blur(10px)", scale: 1.03, opacity: 1 } : { filter: "blur(0px)", scale: 1, opacity: 1 }}
        transition={{ duration: openId ? 0.35 : 0.9, ease: easeOut }}
      />

      {/* top bar: navigation & sound button */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-[40px] pt-4 md:pt-[24px]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.98, duration: 0.5, ease: easeOut }}
        >
          <Link
            to="/"
            data-cursor-label="Click on me"
            className="pg-btn-light inline-flex items-center gap-[8px] h-[44px] px-[18px] rounded-full text-[11px] md:text-[12px] uppercase tracking-[0.12em] font-medium"
          >
            <span aria-hidden="true">←</span> Back Home
          </Link>
        </motion.div>
        <motion.button
          type="button"
          onClick={toggleMute}
          aria-pressed={!muted}
          aria-label="Sound"
          data-cursor-label={muted ? "Sound off" : "Sound on"}
          data-cursor-side="left"
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.08, duration: 0.5, ease: easeOut }}
          className="pg-btn-light size-[44px] rounded-full flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />}
          </svg>
        </motion.button>
      </header>

      {/* headline: text elements appear one by one */}
      <section className="relative z-10 text-center px-4 mt-[18px] md:mt-[8px]">
        <motion.span
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.65, duration: 0.45, ease: easeOut }}
          className="inline-block -rotate-3 bg-[var(--pg-lime)] px-[12px] py-[3px] rounded-[6px] text-[14px] md:text-[16px] font-semibold shadow-[0_4px_10px_rgba(20,40,10,0.15)]"
        >
          Playground
        </motion.span>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.76, duration: 0.5, ease: easeOut }}
          className="pg-display mt-[8px] text-[44px] md:text-[clamp(52px,8.4svh,76px)] leading-[1] font-[700] text-[var(--pg-ink)] [text-shadow:0_1px_24px_rgba(255,255,255,0.55)]"
        >
          Snap my work
        </motion.h1>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.87, duration: 0.5, ease: easeOut }}
          className="mt-[14px] md:mt-[18px] mx-auto max-w-[440px] text-[15px] md:text-[17px] leading-[1.45] font-medium text-[var(--pg-ink)] [text-shadow:0_0_14px_rgba(255,255,255,0.8)]"
        >
          Pick a camera colour, press Snap and collect my four projects as instant photos.
        </motion.p>
      </section>

      {/* the camera: moves down from above */}
      <motion.div
        ref={stageRef}
        initial={reduce ? false : { opacity: 0, y: -110 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.85, ease: easeOut }}
        className="pg-stage relative z-10 mx-auto aspect-[1.22/1]"
      >
        <Camera3D
          ref={cameraRef}
          body={finish.model}
          previewImage={lensProject?.photo}
          label={`Instant camera in ${finish.name}`}
          onActivate={snap}
          activateLabel="Snap"
          paused={!!openId}
          className="absolute inset-0"
        />
      </motion.div>

      {/* camera colours: compact swatches on a blurred semi-transparent gray panel, centered on the mute button's vertical axis */}
      <div className="absolute z-20 right-4 md:right-[40px] top-[40%] md:top-1/2 -translate-y-1/2 w-[48px] flex justify-center pointer-events-none">
        <motion.div
          role="radiogroup"
          aria-label="Camera colour"
          aria-orientation="vertical"
          onKeyDown={onSwatchKey}
          initial={reduce ? false : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.18, duration: 0.5, ease: easeOut }}
          className="pg-picker-panel pointer-events-auto flex flex-col items-center gap-[10px] rounded-full px-[8px] py-[10px]"
        >
          {CAMERA_COLORS.map((c, idx) => (
            <motion.div
              key={c.id}
              className="relative flex"
              initial={reduce ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.24 + idx * 0.06, duration: 0.35, ease: easeOut }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={color === c.id}
                aria-label={c.name}
                tabIndex={color === c.id ? 0 : -1}
                ref={(el) => { swatchRefs.current[c.id] = el; }}
                data-cursor-label={c.name}
                data-cursor-side="left"
                onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
                onClick={() => { pickColor(c.id, lastPointer.current); lastPointer.current = undefined; }}
                className={`pg-picker-swatch peer size-[26px] rounded-full transition-transform duration-200 ${color === c.id ? "is-active scale-110" : "hover:scale-110"}`}
                style={{ "--swatch-bg": c.body } as React.CSSProperties}
              />
              <span aria-hidden="true" className={`pg-tip ${tipFor === c.id ? "is-shown" : ""}`}>{c.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* controls: toast above the Snap button */}
      <div className="relative z-20 flex flex-col items-center gap-[12px] pb-[150px] md:pb-[176px] lg:pb-[28px]">
        <div className="relative h-[40px] w-full flex justify-center" aria-live="polite" aria-atomic="true">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className="absolute top-0 max-w-[90vw] rounded-full bg-[var(--pg-ink)] text-[var(--pg-paper)] text-[13px] md:text-[14px] px-[16px] py-[9px] shadow-[0_8px_20px_rgba(20,40,10,0.25)] whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {toast.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.38, duration: 0.5, ease: easeOut }}
          className="pg-snap-dock inline-flex items-center gap-[6px] rounded-full p-[5px]"
        >
          <button
            type="button"
            onClick={snap}
            disabled={busy}
            aria-label={printed.length < PROJECTS.length ? "Snap: print the next project" : "Snap"}
            data-cursor-label="Click on me"
            className="pg-btn-dark h-[48px] md:h-[52px] min-w-[156px] md:min-w-[172px] px-[32px] rounded-full text-[13px] md:text-[14px] uppercase tracking-[0.16em] font-medium"
          >
            Snap
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset printed projects"
            data-cursor-label="Reset"
            className="pg-btn-light size-[48px] md:size-[52px] rounded-full flex items-center justify-center shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </motion.div>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.48, duration: 0.45, ease: easeOut }}
          className="text-[12px] font-medium text-[var(--pg-ink)] [text-shadow:0_0_10px_rgba(255,255,255,0.8)]"
        >
          {printed.length} of {PROJECTS.length} printed
        </motion.p>
      </div>

      {/* the photo sliding out of the camera's film slot */}
      {ejectProject && ejecting && (
        <div className="fixed z-30 pointer-events-none" style={{ left: ejecting.x, top: ejecting.y, transform: "translate(-50%, -100%)" }}>
          <div className={`overflow-hidden ${PHOTO_W}`} style={{ paddingTop: 12 }}>
            <motion.div
              layoutId={`photo-${ejectProject.id}`}
              className="pg-photo p-[7%] pb-[4%]"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: reduce ? 0 : EJECT_MS / 1000, ease: [0.45, 0, 0.25, 1] }}
            >
              <PhotoFace p={ejectProject} developing compact />
            </motion.div>
          </div>
        </div>
      )}

      {/* printed photos: a fanned row in the bottom-left corner; the hovered one comes to the front */}
      <ol aria-label="Printed projects" className="absolute z-20 left-4 md:left-[24px] lg:left-[16px] xl:left-[32px] bottom-[16px] md:bottom-[28px] flex items-end">
        {printed.map((id, i) => {
          const p = PROJECTS.find((x) => x.id === id)!;
          const tilt = TILTS[i % TILTS.length];
          return (
            <li key={id} className={`relative ${PHOTO_W} ${PHOTO_OVERLAP} first:ml-0 z-[var(--z)] hover:z-30 focus-within:z-30`} style={{ ["--z" as string]: i + 1 }}>
              {openId === id ? (
                <div className="w-full aspect-[0.82]" />
              ) : (
                <motion.button
                  ref={(el) => { cardRefs.current[id] = el; }}
                  type="button"
                  layoutId={`photo-${id}`}
                  onClick={() => setOpenId(id)}
                  aria-label={`Open ${p.title}, ${p.type}`}
                  aria-haspopup="dialog"
                  data-cursor-label={`Open ${p.title}`}
                  initial={{ rotate: tilt }}
                  animate={{ rotate: tilt }}
                  whileHover={reduce ? undefined : { y: -12, rotate: tilt * 0.4, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 210, damping: 26 }}
                  className="pg-photo block w-full p-[7%] pb-[4%]"
                >
                  <PhotoFace p={p} developing={developing.includes(id)} compact covered={i < printed.length - 1} />
                </motion.button>
              )}
            </li>
          );
        })}
      </ol>

      <AnimatePresence>
        {open && <PhotoDetail key={open.id} p={open} tilt={TILTS[printed.indexOf(open.id) % TILTS.length] ?? 0} onClose={close} />}
      </AnimatePresence>

      <FigmaCursor />
    </main>
    </MotionConfig>
  );
}
