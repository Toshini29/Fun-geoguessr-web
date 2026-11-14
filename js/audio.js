/* Luthen's Coordinates: synthesized sound (no audio files). */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {}), KEY = 'lc-muted';
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (_) {}
  const A = { ctx: null, master: null, amb: null, noise: null };

  function init() {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.gain.value = muted ? 0 : 0.7; A.master.connect(A.ctx.destination);
    const len = A.ctx.sampleRate * 2, buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.noise = buf;
  }
  function tone(freq, dur, type, vol, when) {
    if (!A.ctx) return;
    const t0 = A.ctx.currentTime + (when || 0), o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.1, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const AMB = { blizzard: [1400, 0.22, 0.35], desert: [450, 0.08, 0.3], swamp: [260, 0.12, 0.3], lava: [140, 0.35, 0.2], sky: [600, 0.07, 0.4],
    forest: [900, 0.06, 0.3], town: [380, 0.08, 0.3], night: [500, 0.05, 0.3], eerie: [320, 0.1, 0.5], ocean: [800, 0.16, 0.6] };

  LC.Sfx = {
    init,
    get muted() { return muted; },
    setMuted(m) { muted = m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (_) {} if (A.master) A.master.gain.setTargetAtTime(m ? 0 : 0.7, A.ctx.currentTime, 0.05); },
    blip() { tone(1320, 0.06, 'square', 0.03); },
    select() { tone(660, 0.08, 'triangle', 0.07); tone(990, 0.1, 'triangle', 0.05, 0.06); },
    hit() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.4, 'triangle', 0.08, i * 0.08)); },
    miss() { tone(330, 0.25, 'triangle', 0.08); tone(247, 0.45, 'triangle', 0.08, 0.15); },
    bell() { [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(196 * m, 2.8 / (i + 1), 'sine', 0.14 / (i + 1))); },
    jump(dur) {
      if (!A.ctx) return;
      const t0 = A.ctx.currentTime, src = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
      src.buffer = A.noise; src.loop = true; f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(150, t0); f.frequency.exponentialRampToValueAtTime(2600, t0 + dur * 0.85);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.45, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
      src.connect(f); f.connect(g); g.connect(A.master); src.start(t0); src.stop(t0 + dur + 0.5);
      const o = A.ctx.createOscillator(), lp = A.ctx.createBiquadFilter(), og = A.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(55, t0); o.frequency.exponentialRampToValueAtTime(220, t0 + dur);
      lp.type = 'lowpass'; lp.frequency.value = 400;
      og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.12, t0 + dur * 0.6); og.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.2);
      o.connect(lp); lp.connect(og); og.connect(A.master); o.start(t0); o.stop(t0 + dur + 0.3);
    },
    ambient(type) {
      if (!A.ctx) return;
      const t0 = A.ctx.currentTime;
      if (A.amb) { const old = A.amb; old.g.gain.setTargetAtTime(0.0001, t0, 0.4); setTimeout(() => { try { old.src.stop(); old.lfo.stop(); } catch (_) {} }, 2000); A.amb = null; }
      const P = AMB[type]; if (!P) return;
      const src = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain(), lfo = A.ctx.createOscillator(), lg = A.ctx.createGain();
      src.buffer = A.noise; src.loop = true; f.type = 'lowpass'; f.frequency.value = P[0];
      g.gain.value = 0.0001; g.gain.setTargetAtTime(P[1], t0, 1.2);
      lfo.frequency.value = type === 'ocean' ? 0.12 : 0.07; lg.gain.value = P[1] * P[2];
      lfo.connect(lg); lg.connect(g.gain); src.connect(f); f.connect(g); g.connect(A.master); src.start(); lfo.start();
      A.amb = { src, g, lfo };
    },
  };
})();
