import { useEffect, useRef, useState } from "react";
import Float from "./components/fancy/float";

/* Interactive "toolkit" keyboard for the Contact section: a small macro pad with my tools on its
 * keys and a wide Enter key.
 *
 * Inspired by Hairline's keyboard figure (hairline.lucasmarkes.com). The pad floats at an angle;
 * the key under the pointer sinks, a press pushes it all the way down, and Enter sends a typing
 * wave across the board. Each key is named for screen readers by its tool and role.
 * Keyboard: Tab into the pad, arrows to move, Enter/Space to press, 1–8 for the tools.
 *
 * Each key's depth runs on a small spring in one rAF loop that sleeps once everything settles.
 * Sizes are in container-query units, so the pad scales with its square stage.
 */

type Tool = { id: keyof typeof ICONS; name: string; role: string };

// Brand marks: Simple Icons (CC0), Iconify "logos" (CC0) and Fluent Emoji (MIT) for the banana.
const ICONS = {
  figma: { viewBox: "0 0 256 384", body: "<path fill=\"#0acf83\" d=\"M64 384c35.328 0 64-28.672 64-64v-64H64c-35.328 0-64 28.672-64 64s28.672 64 64 64\"/><path fill=\"#a259ff\" d=\"M0 192c0-35.328 28.672-64 64-64h64v128H64c-35.328 0-64-28.672-64-64\"/><path fill=\"#f24e1e\" d=\"M0 64C0 28.672 28.672 0 64 0h64v128H64C28.672 128 0 99.328 0 64\"/><path fill=\"#ff7262\" d=\"M128 0h64c35.328 0 64 28.672 64 64s-28.672 64-64 64h-64z\"/><path fill=\"#1abcfe\" d=\"M256 192c0 35.328-28.672 64-64 64s-64-28.672-64-64s28.672-64 64-64s64 28.672 64 64\"/>" },
  claude: { viewBox: "0 0 256 257", body: "<path fill=\"#d97757\" d=\"m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z\"/>" },
  chatgpt: { viewBox: "0 0 256 260", body: "<path fill=\"#1a1a1a\" d=\"M239.184 106.203a64.72 64.72 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.72 64.72 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.67 64.67 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.77 64.77 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483m-97.56 136.338a48.4 48.4 0 0 1-31.105-11.255l1.535-.87l51.67-29.825a8.6 8.6 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601M37.158 197.93a48.35 48.35 0 0 1-5.781-32.589l1.534.921l51.722 29.826a8.34 8.34 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803M23.549 85.38a48.5 48.5 0 0 1 25.58-21.333v61.39a8.29 8.29 0 0 0 4.195 7.316l62.874 36.272l-21.845 12.636a.82.82 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405zm179.466 41.695l-63.08-36.63L161.73 77.86a.82.82 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.54 8.54 0 0 0-4.4-7.213m21.742-32.69l-1.535-.922l-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.72.72 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391zM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87l-51.67 29.825a8.6 8.6 0 0 0-4.246 7.367zm11.868-25.58L128.067 97.3l28.188 16.218v32.434l-28.086 16.218l-28.188-16.218z\"/>" },
  gemini: { viewBox: "0 0 24 24", body: "<defs><linearGradient id=\"tk-gemini\" x1=\"0\" y1=\"24\" x2=\"24\" y2=\"0\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#1c7dff\"/><stop offset=\".52\" stop-color=\"#9168c0\"/><stop offset=\"1\" stop-color=\"#d96570\"/></linearGradient></defs><path fill=\"url(#tk-gemini)\" d=\"M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81\"/>" },
  nanobanana: { viewBox: "0 0 32 32", body: "<g fill=\"none\"><path fill=\"#f3ad61\" d=\"M2 26.431c0-.73.592-1.321 1.322-1.321h.99a1.322 1.322 0 0 1 0 2.643h-.99c-.73 0-1.322-.592-1.322-1.322\"/><path fill=\"#f9c23c\" d=\"M19.783 18h9.435c.695 0 1.045-.876.55-1.392l-2.178-2.272a4.244 4.244 0 0 0-6.181 0l-2.179 2.272c-.492.514-.142 1.392.553 1.392m-15 0h9.434c.695 0 1.045-.878.553-1.392l-2.18-2.272a4.243 4.243 0 0 0-6.182 0L4.23 16.608c-.492.514-.142 1.392.553 1.392\"/><path fill=\"#feefc2\" d=\"M16.7 2.029c4.92-.708 7.96 11.897 5.745 16.99c-2.215 5.094-6.997 6.21-12.07 8.204a4.7 4.7 0 0 1-1.705.325c-1.924 0-2.97 1.582-3.7-.375c-.942-2.535.293-5.376 2.76-6.344c2.684-1.053 4.111-3.077 5.185-5.818c1.096-2.795 1.17-3.941 1.166-6.988c-.005-2.437-.165-5.594 2.619-5.994\"/><path fill=\"#fcd53f\" d=\"m22.445 19.02l-9.46-4.344c-1.086 2.498-3.053 4.411-5.54 5.39c-2.881 1.132-4.807 4.23-3.23 7.386c3.151 6.304 18.23-.066 18.23-8.433\"/><path fill=\"#f9c23c\" fill-rule=\"evenodd\" d=\"M18.24 16.482a.75.75 0 0 1 .486.942c-1.98 6.201-7.756 9.065-12.918 9.33a.75.75 0 0 1-.077-1.498c4.738-.243 9.83-2.852 11.566-8.288a.75.75 0 0 1 .943-.486\" clip-rule=\"evenodd\"/><path fill=\"#fff478\" d=\"m23.24 26.467l-10.197-11.78h9.004c2.126.107 3.794 1.91 3.794 4.097v7.552c0 1.33-1.197 1.736-2.6.131\"/></g>" },
  adobecc: { viewBox: "0 0 24 24", body: "<path fill=\"#DA1F26\" d=\"M14.782 3.153c-.231.02-.472.04-.703.07a8.453 8.453 0 0 0-2.832.834 8.951 8.951 0 0 0-2.46 1.777c-.03.04-.09.06-.141.05a7.44 7.44 0 0 0-1.496-.07 7.424 7.424 0 0 0-2.932.763c-1.768.884-3.013 2.26-3.736 4.108a7.089 7.089 0 0 0-.462 2.139c0 .05-.01.09-.02.13v.773c.02.201.05.392.07.593.1.813.332 1.596.703 2.33.824 1.646 2.089 2.851 3.786 3.594a7.127 7.127 0 0 0 2.45.593c.032 0 .06.004.086.01h8.576c.183-.017.362-.035.547-.06a8.344 8.344 0 0 0 2.811-.834 8.836 8.836 0 0 0 3.646-3.304 8.187 8.187 0 0 0 1.184-3.093c.05-.34.08-.692.121-1.034 0-.05.01-.09.02-.13v-.794c-.02-.23-.05-.452-.05-.662a8.345 8.345 0 0 0-.834-2.812 8.952 8.952 0 0 0-3.324-3.645 8.245 8.245 0 0 0-3.072-1.175c-.362-.06-.713-.09-1.075-.13-.05 0-.09-.01-.14-.02zm.369 1.693c2.126.005 3.93.826 5.395 2.455a6.93 6.93 0 0 1 1.616 3.323c.15.764.181 1.547.07 2.32-.19 1.346-.702 2.55-1.576 3.605a7.082 7.082 0 0 1-3.997 2.45 7.297 7.297 0 0 1-2.56.1c-1.095-.14-2.099-.501-3.003-1.154a5.2 5.2 0 0 1-.672-.573c-1.226-1.205-2.44-2.42-3.666-3.625-.301-.3-.321-.632-.18-.934a.822.822 0 0 1 .863-.472c.21.02.372.141.522.292 1.105 1.114 2.2 2.209 3.304 3.324a5.263 5.263 0 0 0 3.093 1.536c1.948.261 3.605-.341 4.92-1.798.713-.793 1.145-1.747 1.326-2.811.26-1.587-.11-3.013-1.095-4.268-.873-1.115-2.018-1.808-3.404-2.059-1.416-.25-2.751.02-3.966.794-.03.02-.1.03-.131.01a9.04 9.04 0 0 0-1.406-.854s-.01-.01-.02-.03a6.603 6.603 0 0 1 1.255-.823 6.646 6.646 0 0 1 2.641-.784 8.45 8.45 0 0 1 .67-.024zM7.546 7.509c1.455-.024 2.791.525 3.982 1.63.854.802 1.637 1.636 2.46 2.47.231.23.281.522.171.833-.11.311-.362.462-.683.512a.722.722 0 0 1-.632-.23c-.784-.784-1.567-1.557-2.34-2.35-.633-.653-1.386-1.025-2.27-1.186-1.958-.351-3.936.784-4.639 2.641-.904 2.36.522 5.031 2.982 5.594.482.11.995.11 1.497.1.14-.01.22.04.32.13.483.473.995.945 1.497 1.416.03.03.07.06.1.09-.06 0-.1.01-.14.01h-2.3a5.833 5.833 0 0 1-5.693-4.568c-.653-2.942 1.034-5.925 3.926-6.798a6.33 6.33 0 0 1 1.762-.294Z\"/>" },
  maze: { viewBox: "0 0 24 24", body: "<path fill=\"#1a1a1a\" d=\"M1.126 16.547c-1.5013-1.4881-1.5013-3.9009 0-5.389l4.0778-4.042c1.2692-1.258 3.205-1.4525 4.6803-.5836.4564.2687.4524.8852.077 1.2573-.3753.372-.988.34-1.4975.1923-.6524-.1891-1.386-.0287-1.9006.4813l-4.0777 4.0419a1.8935 1.8935 0 0 0 0 2.6945c.7506.744 1.9678.744 2.7184 0l8.1555-8.0836c1.5014-1.4882 3.9355-1.4882 5.437 0l4.0778 4.0418c1.5013 1.4881 1.5013 3.901 0 5.389-1.5014 1.4882-3.9356 1.4882-5.437 0l-1.3593-1.3472-1.699 1.684c-1.2692 1.258-3.205 1.4526-4.6804.5837-.4563-.2687-.4523-.8852-.077-1.2573.3754-.372.988-.34 1.4975-.1923.6524.1892 1.386.0287 1.9006-.4813l1.7476-1.7322c.724-.7175 1.8975-.7175 2.6214 0l1.4078 1.3954c.7507.744 1.9678.744 2.7186 0a1.8936 1.8936 0 0 0 0-2.6945l-4.0779-4.0419c-.7507-.744-1.9678-.744-2.7185 0L6.563 16.5471c-1.5014 1.4882-3.9356 1.4881-5.437 0\"/>" },
  jira: { viewBox: "0 0 256 256", body: "<defs><linearGradient id=\"tk-jira-a\" x1=\"98.031%\" x2=\"58.888%\" y1=\".161%\" y2=\"40.766%\"><stop offset=\"18%\" stop-color=\"#0052cc\"/><stop offset=\"100%\" stop-color=\"#2684ff\"/></linearGradient><linearGradient id=\"tk-jira-b\" x1=\"100.665%\" x2=\"55.402%\" y1=\".455%\" y2=\"44.727%\"><stop offset=\"18%\" stop-color=\"#0052cc\"/><stop offset=\"100%\" stop-color=\"#2684ff\"/></linearGradient></defs><path fill=\"#2684ff\" d=\"M244.658 0H121.707a55.5 55.5 0 0 0 55.502 55.502h22.649V77.37c.02 30.625 24.841 55.447 55.466 55.467V10.666C255.324 4.777 250.55 0 244.658 0\"/><path fill=\"url(#tk-jira-a)\" d=\"M183.822 61.262H60.872c.019 30.625 24.84 55.447 55.466 55.467h22.649v21.938c.039 30.625 24.877 55.43 55.502 55.43V71.93c0-5.891-4.776-10.667-10.667-10.667\"/><path fill=\"url(#tk-jira-b)\" d=\"M122.951 122.489H0c0 30.653 24.85 55.502 55.502 55.502h22.72v21.867c.02 30.597 24.798 55.408 55.396 55.466V133.156c0-5.891-4.776-10.667-10.667-10.667\"/>" },
};

const TOOLS: Tool[] = [
  { id: "figma", name: "Figma", role: "Design & prototyping" },
  { id: "claude", name: "Claude", role: "AI assistant" },
  { id: "chatgpt", name: "ChatGPT", role: "AI assistant" },
  { id: "gemini", name: "Gemini", role: "AI assistant" },
  { id: "nanobanana", name: "Nano Banana", role: "AI image generation" },
  { id: "adobecc", name: "Adobe CC", role: "Visuals & motion" },
  { id: "maze", name: "Maze", role: "Usability testing" },
  { id: "jira", name: "Jira", role: "Sprints & handoff" },
];
const ENTER = TOOLS.length; // index of the Enter key
const COUNT = TOOLS.length + 1;

export default function ToolkitKeyboard({ manrope }: { manrope: React.CSSProperties }) {
  const keyRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const padRef = useRef<HTMLDivElement>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [still] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const st = useRef({
    d: new Float32Array(COUNT), // depth 0 (up) … 1 (bottomed out)
    v: new Float32Array(COUNT),
    held: -1, // key held by pointer / keyboard
    hover: -1,
    taps: new Float32Array(COUNT), // time until which a tapped key stays down
    raf: 0, last: 0, reduced: false,
    kick: () => {},
  });

  useEffect(() => {
    const s = st.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const target = (i: number, now: number) => {
      if (s.held === i || s.taps[i] > now) return 1;
      // Hover: only the key under the pointer sinks, part of the way.
      return s.hover === i ? 0.45 : 0;
    };

    const loop = (now: number) => {
      const dt = Math.min(2.5, (now - (s.last || now)) / 16.67 || 1);
      s.last = now;
      let moving = false;
      for (let i = 0; i < COUNT; i++) {
        const t = target(i, now);
        if (s.reduced) { s.d[i] = t; s.v[i] = 0; }
        else {
          // Stiff, slightly underdamped spring: keys snap down and bounce back up a touch.
          s.v[i] += ((t - s.d[i]) * 0.32 - s.v[i] * 0.42) * dt;
          s.d[i] += s.v[i] * dt;
        }
        if (Math.abs(t - s.d[i]) > 0.002 || Math.abs(s.v[i]) > 0.002 || s.taps[i] > now) moving = true;
        keyRefs.current[i]?.style.setProperty("--d", Math.max(-0.08, Math.min(1, s.d[i])).toFixed(3));
      }
      // The status light glows while a key is down.
      padRef.current?.style.setProperty("--glow", Math.max(0, Math.min(1, Math.max(...s.d) * 1.4)).toFixed(3));
      if (moving || s.hover >= 0 || s.held >= 0) s.raf = requestAnimationFrame(loop);
      else { s.raf = 0; s.last = 0; }
    };
    s.kick = () => { if (!s.raf) s.raf = requestAnimationFrame(loop); };

    // First time the pad is well in view, the keys type out a quick hello.
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || s.reduced) return;
      io.disconnect();
      // Same order as typing: along the top row, back along the bottom row, then Enter.
      [0, 1, 2, 3, 7, 6, 5, 4, ENTER].forEach((k, n) => {
        window.setTimeout(() => { s.taps[k] = performance.now() + 120; s.kick(); }, 200 + n * 70);
      });
    }, { threshold: 0.5 });
    if (padRef.current) io.observe(padRef.current);

    return () => { io.disconnect(); cancelAnimationFrame(s.raf); s.raf = 0; };
  }, []);

  const tap = (i: number) => {
    const s = st.current;
    s.taps[i] = performance.now() + 140;
    if (i === ENTER) {
      // Enter: a typing wave across the board.
      [0, 1, 2, 3, 7, 6, 5, 4].forEach((k, n) => {
        window.setTimeout(() => { s.taps[k] = performance.now() + 110; s.kick(); }, 90 + n * 60);
      });
    }
    s.kick();
  };

  const hover = (i: number) => {
    const s = st.current;
    if (s.hover === i) return;
    s.hover = i;
    s.kick();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const col = (i: number) => (i === ENTER ? 1 : i % 4);
    // The key the event came from (state can lag a focus change by a render).
    const cur = Math.max(0, keyRefs.current.indexOf(e.target as HTMLButtonElement));
    let next = -1;
    if (e.key === "ArrowRight") next = cur === ENTER ? ENTER : Math.min(cur + 1, cur < 4 ? 3 : 7);
    else if (e.key === "ArrowLeft") next = cur === ENTER ? ENTER : Math.max(cur - 1, cur < 4 ? 0 : 4);
    else if (e.key === "ArrowDown") next = cur < 4 ? cur + 4 : ENTER;
    else if (e.key === "ArrowUp") next = cur === ENTER ? 4 + col(cur) : cur >= 4 ? cur - 4 : cur;
    else if (/^[1-8]$/.test(e.key)) { const i = Number(e.key) - 1; e.preventDefault(); setFocusIdx(i); keyRefs.current[i]?.focus(); tap(i); return; }
    if (next >= 0) {
      e.preventDefault();
      setFocusIdx(next);
      keyRefs.current[next]?.focus();
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center [container-type:inline-size]" style={manrope}>
      {/* The pad floats at an angle, drifting like the hero photo. */}
      <div className="toolkit-stage relative w-full">
        <Drift still={still}>
        <div
          ref={padRef}
          role="group"
          aria-label="My design toolkit"
          onKeyDown={onKeyDown}
          onPointerOver={(e) => {
            const key = (e.target as HTMLElement).closest("button");
            hover(key ? keyRefs.current.indexOf(key as HTMLButtonElement) : -1);
          }}
          onPointerLeave={() => hover(-1)}
          className="toolkit-pad pointer-events-auto relative mx-auto w-[78cqw] rounded-[1.6cqw] px-[3cqw] pt-[3cqw] pb-[2.2cqw]"
        >
          {/* Case thickness: a stack of layers below the top face. */}
          {Array.from({ length: 16 }, (_, k) => (
            <span key={k} aria-hidden="true" className="toolkit-layer" style={{ "--z": k + 1 } as React.CSSProperties} />
          ))}
          <div className="toolkit-plate grid grid-cols-4 gap-[2cqw] p-[2cqw]">
            {TOOLS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => { keyRefs.current[i] = el; }}
                type="button"
                tabIndex={focusIdx === i ? 0 : -1}
                aria-label={`${t.name} — ${t.role}`}
                data-cursor="expand"
                onPointerDown={(e) => { if (e.pointerType !== "mouse") hover(-1); st.current.held = i; st.current.kick(); }}
                onPointerUp={() => { st.current.held = -1; tap(i); }}
                onPointerCancel={() => { st.current.held = -1; st.current.kick(); }}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tap(i); } }}
                onFocus={() => setFocusIdx(i)}
                className="toolkit-key aspect-square"
              >
                <span className="toolkit-cap">
                  <svg viewBox={ICONS[t.id].viewBox} className="w-[44%] h-[44%]" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[t.id].body }} />
                </span>
              </button>
            ))}
            <button
              ref={(el) => { keyRefs.current[ENTER] = el; }}
              type="button"
              tabIndex={focusIdx === ENTER ? 0 : -1}
              aria-label="Enter"
              data-cursor="expand"
              onPointerDown={(e) => { if (e.pointerType !== "mouse") hover(-1); st.current.held = ENTER; st.current.kick(); }}
              onPointerUp={() => { st.current.held = -1; tap(ENTER); }}
              onPointerCancel={() => { st.current.held = -1; st.current.kick(); }}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tap(ENTER); } }}
              onFocus={() => setFocusIdx(ENTER)}
              className="toolkit-key toolkit-key--enter col-span-4 h-[13cqw]"
            >
              <span className="toolkit-cap justify-center gap-[1.2cqw] text-[3cqw] tracking-[0.04em]">
                Enter
                {/* Drawn rather than typed: the ↵ glyph falls back to a thinner font and reads lighter. */}
                <svg viewBox="0 0 16 16" aria-hidden="true" className="w-[3cqw] h-[3cqw]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 3v5.5a2 2 0 0 1-2 2H3.5" />
                  <path d="M6.5 7.5 3.5 10.5l3 3" />
                </svg>
              </span>
            </button>
          </div>
          {/* Engraving and status light along the bottom edge of the base. */}
          <div aria-hidden="true" className="flex items-center justify-between px-[1.2cqw] pt-[1.8cqw] text-[2cqw] leading-none tracking-[0.28em] text-[#8e8d96]">
            <span>TOOLKIT '26</span>
            <span className="toolkit-led" />
          </div>
        </div>
        </Drift>
      </div>
    </div>
  );
}

// Drifts along the same slow 3D trajectory as the hero photo; holds still for reduced motion.
// The wrapper ignores the pointer: in 3D it sits in front of parts of the tilted pad and would
// otherwise swallow hovers meant for the keys (the pad turns pointer events back on).
function Drift({ still, children }: { still: boolean; children: React.ReactNode }) {
  if (still) return <>{children}</>;
  return (
    <Float speed={0.5} amplitude={[4, 10, 6]} rotationRange={[3, 4, 2]} className="pointer-events-none">
      {children}
    </Float>
  );
}
