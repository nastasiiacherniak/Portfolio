// Playground sound effects, synthesised with the Web Audio API (no audio files):
//   shutter()  – the release: a sharp mechanical click with a low body thump
//   eject()    – the print motor pushing the photo out: a short, softly wobbling buzz
//   develop()  – the photo coming to life: two soft bell tones
// Sounds start only from a user action (browsers require a gesture) and can be muted; the choice is
// remembered in this browser.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

const MUTE_KEY = "playground-sound-muted";
let muted = (() => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; } })();

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch { /* storage blocked */ }
}

function audio() {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.4), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBurst(at: number, { freq, q = 1, level, attack = 0.001, decay }: { freq: number; q?: number; level: number; attack?: number; decay: number }) {
  if (!ctx || !master || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  src.connect(f).connect(g).connect(master);
  src.start(at);
  src.stop(at + attack + decay + 0.02);
}

function tone(at: number, { type = "sine", freq, to, level, attack = 0.005, decay }: { type?: OscillatorType; freq: number; to?: number; level: number; attack?: number; decay: number }) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + attack + decay);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + attack + decay + 0.02);
}

/** Shutter release: press click, blade snap and a soft body thump. */
export function shutter() {
  const c = audio(); if (!c) return;
  const t = c.currentTime + 0.01;
  noiseBurst(t, { freq: 3200, q: 1.4, level: 0.6, decay: 0.03 });
  noiseBurst(t + 0.045, { freq: 5200, q: 2, level: 0.45, decay: 0.025 });
  tone(t, { freq: 160, to: 70, level: 0.45, decay: 0.09 });
}

/** Print motor: a ~1s buzz that wobbles a little as the photo slides out. */
export function eject(durationMs = 1000) {
  const c = audio(); if (!c || !master) return;
  const t = c.currentTime + 0.02, dur = durationMs / 1000;
  const o = c.createOscillator();
  o.type = "sawtooth"; o.frequency.value = 110;
  const lfo = c.createOscillator(); lfo.frequency.value = 9;
  const lfoGain = c.createGain(); lfoGain.gain.value = 6;
  lfo.connect(lfoGain).connect(o.frequency);
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.09, t + 0.06);
  g.gain.setValueAtTime(0.09, t + dur - 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g).connect(master);
  o.start(t); lfo.start(t);
  o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
  noiseBurst(t + dur - 0.05, { freq: 2400, level: 0.25, decay: 0.04 }); // the photo dropping free
}

/** Developed: two soft bell tones. */
export function develop() {
  const c = audio(); if (!c) return;
  const t = c.currentTime + 0.01;
  tone(t, { freq: 880, level: 0.12, attack: 0.01, decay: 1.2 });
  tone(t + 0.12, { freq: 1318.5, level: 0.09, attack: 0.01, decay: 1.4 });
}
