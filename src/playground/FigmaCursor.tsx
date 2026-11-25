import { useEffect, useRef, useState } from "react";

/* Figma-style multiplayer cursor, used only on the Playground page (the rest of the site keeps its
 * own cursor). A rounded arrow follows the pointer with a little lag; a name tag in the same colour
 * appears only while hovering something that names itself with `data-cursor-label` (the Snap button,
 * the camera model, the colour swatches, the photos...), showing that name. Only shown on devices
 * with a precise pointer (mouse, trackpad, pen). */

export const CURSOR_DEFAULTS = {
  Colours: { Fill: "#ffffff", Gradient: false },
  Name: "you",
  "Arrow size (px)": 22,
  "Corner radius": 1.75,
  Follow: 0.34,
  "Show name tag": true,
};
export type CursorValues = typeof CURSOR_DEFAULTS;

// Arrow in a 24-unit box, tip at (4, 4): left edge, notch, right wing.
const ARROW = "M4 4 L4 18.6 L8.3 14.4 L14.6 14.4 Z";
const TIP = 4;
const DEFAULT_GRADIENT: [string, string] = ["#a259ff", "#1abcfe"];

// Relative luminance of a hex colour (0 = black, 1 = white); used to pick readable text and outline.
function luminance(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const s = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function FigmaCursor({ values: v = CURSOR_DEFAULTS, gradient = DEFAULT_GRADIENT }: { values?: CursorValues; gradient?: [string, string] }) {
  const [enabled] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches);

  const rootRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(v.Follow);
  followRef.current = v.Follow;
  const [label, setLabel] = useState<string | null>(null);
  const [side, setSide] = useState<"left" | "right">("right");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const shownLabel = useRef("");

  useEffect(() => {
    if (!enabled) return;
    const el = rootRef.current!;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, last = 0, placed = false;
    const place = () => { el.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const f = followRef.current;
      const k = f >= 0.999 ? 1 : 1 - Math.pow(1 - f, dt * 60); // same feel at any frame rate
      x += (tx - x) * k; y += (ty - y) * k;
      if (Math.abs(tx - x) + Math.abs(ty - y) < 0.1) { x = tx; y = ty; raf = 0; } else raf = requestAnimationFrame(loop);
      place();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") { setVisible(false); return; }
      tx = e.clientX; ty = e.clientY;
      if (!placed) { x = tx; y = ty; placed = true; place(); }
      setVisible(true);
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      const target = (e.target as Element | null)?.closest?.("[data-cursor-label]");
      const next = target?.getAttribute("data-cursor-label") || null;
      const explicitSide = target?.getAttribute("data-cursor-side");
      const nextSide: "left" | "right" =
        explicitSide === "left" || (!explicitSide && e.clientX > window.innerWidth - 150) ? "left" : "right";
      setLabel((prev) => (prev === next ? prev : next));
      setSide((prev) => (prev === nextSide ? prev : nextSide));
    };
    const onDown = (e: PointerEvent) => { if (e.pointerType !== "touch") setPressed(true); };
    const onUp = () => setPressed(false);
    const onLeave = () => setVisible(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = v["Arrow size (px)"];
  const s = size / 24; // px per arrow unit
  const radius = Math.max(0, v["Corner radius"]);
  const fill = v.Colours.Fill;
  const useGradient = v.Colours.Gradient;
  const light = !useGradient && luminance(fill) > 0.55;
  const outline = light ? "#1f2a17" : "#ffffff";
  const paint = useGradient ? "url(#figma-cursor-gradient)" : fill;
  const tagBg = useGradient ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` : fill;
  const showTag = v["Show name tag"] && !!label;
  if (label) shownLabel.current = label; // keep the text while the tag fades out

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[2147483647] will-change-transform"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.15s" }}
    >
      <div style={{ transform: `scale(${pressed ? 0.88 : 1})`, transformOrigin: "0 0", transition: "transform 0.12s ease-out" }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ display: "block", overflow: "visible", marginLeft: -TIP * s, marginTop: -TIP * s, filter: "drop-shadow(0 1px 2px rgba(20,30,15,0.28))" }}
        >
          <defs>
            <linearGradient id="figma-cursor-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          {/* outline, then the fill; round joins of the given radius soften the corners */}
          <path d={ARROW} fill={outline} stroke={outline} strokeWidth={(radius * 2 + 3) / s} strokeLinejoin="round" />
          <path d={ARROW} fill={paint} stroke={paint} strokeWidth={(radius * 2) / s} strokeLinejoin="round" />
        </svg>
        <div className="pointer-events-none relative h-0 w-0">
          <span
            className={`absolute whitespace-nowrap rounded-[4px] px-[8px] py-[3px] text-[12px] font-semibold leading-[18px] transition-[opacity,transform] duration-150 ${side === "left" ? "rounded-tr-[1px]" : "rounded-tl-[1px]"}`}
            style={{
              ...(side === "left"
                ? { right: TIP * s + 6, top: size * 0.52, transformOrigin: "100% 0" }
                : { left: size * 0.5, top: size * 0.62, transformOrigin: "0 0" }),
              background: tagBg,
              color: light ? "#1f2a17" : "#ffffff",
              boxShadow: light ? "0 0 0 1px rgba(31,42,23,0.14), 0 2px 6px rgba(20,30,15,0.18)" : "0 2px 6px rgba(20,30,15,0.22)",
              opacity: showTag ? 1 : 0,
              transform: showTag ? "translateY(0) scale(1)" : "translateY(-2px) scale(0.96)",
            }}
          >
            {shownLabel.current}
          </span>
        </div>
      </div>
    </div>
  );
}
