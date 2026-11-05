// Mechanical key-click sounds for the toolkit keyboard, synthesised with the Web Audio API (no audio
// files). A press is a crisp switch "tick" (a short burst of band-passed noise) over a soft low
// "thock" (a quickly falling sine); a release is a lighter, higher tick. Each key gets its own
// slight pitch, plus a touch of randomness, so repeats don't sound mechanical-in-the-bad-way.
//
// Sounds only ever start from a direct user action: browsers only allow audio after a gesture, and
// the context is created (or resumed) on the first press.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

const VOLUME = 0.35;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
    // 60ms of white noise, reused for every tick
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.06), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tick(at: number, freq: number, level: number, length: number) {
  if (!ctx || !master || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(band).connect(g).connect(master);
  src.start(at);
  src.stop(at + length + 0.01);
}

function thock(at: number, freq: number, level: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, at + 0.05);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(level, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
  osc.connect(g).connect(master);
  osc.start(at);
  osc.stop(at + 0.08);
}

// A key's voice: keys sit a little apart in pitch; `wide` keys (Enter) are deeper.
const voice = (key: number, wide: boolean) => {
  const jitter = 1 + (Math.random() - 0.5) * 0.06;
  return { tick: (2600 + (key % 4) * 180 - (wide ? 700 : 0)) * jitter, thock: (wide ? 95 : 130 + (key % 4) * 6) * jitter };
};

/** Key goes down. `delayMs` schedules it ahead (used for the Enter wave). */
export function keyDown(key: number, wide = false, delayMs = 0) {
  const c = audio();
  if (!c) return;
  const at = c.currentTime + delayMs / 1000 + 0.005;
  const v = voice(key, wide);
  tick(at, v.tick, 0.5, 0.035);
  thock(at, v.thock, wide ? 0.4 : 0.3);
}

/** Key comes back up: a lighter, higher tick. */
export function keyUp(key: number, wide = false, delayMs = 0) {
  const c = audio();
  if (!c) return;
  const at = c.currentTime + delayMs / 1000 + 0.005;
  tick(at, voice(key, wide).tick * 1.35, 0.18, 0.02);
}
