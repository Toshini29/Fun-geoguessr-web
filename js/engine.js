/* Luthen's Coordinates: rendering engine.
   Everything is drawn in code on <canvas>. No images, no movie assets. */
(function () {
  'use strict';
  const LC = (window.LC = window.LC || {});
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  LC.util = { TAU, DEG, clamp, lerp, smooth, wrap180, reduceMotion };

  // ---------------------------------------------------------------- random + noise
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // 1D value noise that wraps around a full circle (u in [0,1))
  function pnoise(seed, cells) {
    const r = rng(seed), v = new Float32Array(cells);
    for (let i = 0; i < cells; i++) v[i] = r();
    return function (u) {
      u -= Math.floor(u);
      const x = u * cells, i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
      return v[i % cells] * (1 - s) + v[(i + 1) % cells] * s;
    };
  }
  function pfbm(seed, cells, oct, gain, ridged) {
    oct = oct || 4; gain = gain || 0.5;
    const fs = []; let norm = 0, a = 1;
    for (let o = 0; o < oct; o++) { fs.push(pnoise(seed * 7919 + o * 104729, cells << o)); norm += a; a *= gain; }
    return function (u) {
      let s = 0, amp = 1;
      for (let o = 0; o < oct; o++) { let n = fs[o](u); if (ridged) n = 1 - Math.abs(2 * n - 1); s += n * amp; amp *= gain; }
      return s / norm;
    };
  }
  function noise3(seed) {
    const r = rng(seed), p = new Uint8Array(512), val = new Float32Array(256), perm = [];
    for (let i = 0; i < 256; i++) perm.push(i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    for (let i = 0; i < 256; i++) val[i] = r();
    return function (x, y, z) {
      const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
      const fx = x - X, fy = y - Y, fz = z - Z;
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
      const xi = X & 255, yi = Y & 255, zi = Z & 255, xj = (xi + 1) & 255, yj = (yi + 1) & 255, zj = (zi + 1) & 255;
      const a = p[xi], b = p[xj];
      const aa = p[a + yi], ab = p[a + yj], ba = p[b + yi], bb = p[b + yj];
      const c000 = val[p[aa + zi]], c001 = val[p[aa + zj]], c010 = val[p[ab + zi]], c011 = val[p[ab + zj]];
      const c100 = val[p[ba + zi]], c101 = val[p[ba + zj]], c110 = val[p[bb + zi]], c111 = val[p[bb + zj]];
      const x00 = c000 + (c100 - c000) * u, x01 = c001 + (c101 - c001) * u, x10 = c010 + (c110 - c010) * u, x11 = c011 + (c111 - c011) * u;
      const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
      return y0 + (y1 - y0) * w;
    };
  }
  function fbm3(n, x, y, z, oct) {
    let s = 0, a = 1, norm = 0;
    for (let o = 0; o < oct; o++) { s += n(x, y, z) * a; norm += a; a *= 0.5; x *= 2.03; y *= 2.03; z *= 2.03; }
    return s / norm;
  }

  // ---------------------------------------------------------------- colour
  const cache = {};
  function hex(h) {
    if (Array.isArray(h)) return h;
    if (cache[h]) return cache[h];
    const c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    cache[h] = c; return c;
  }
  function mix(a, b, t) { a = hex(a); b = hex(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { c = hex(c); return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function ramp(stops, t) {
    if (t <= stops[0][0]) return hex(stops[0][1]);
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
    }
    return hex(stops[stops.length - 1][1]);
  }
  Object.assign(LC, { rng, pnoise, pfbm, noise3, fbm3, hex, mix, rgba, ramp });

  // ---------------------------------------------------------------- gestures (drag, pinch, wheel, tap)
  function gestures(el, h) {
    const pts = new Map(); let down = null, lastPinch = 0;
    el.addEventListener('pointerdown', (e) => {
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }; h.start && h.start(); }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); if (down) down.moved = true; }
    });
    el.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 1) {
        if (down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;
        if (down && down.moved) h.drag && h.drag(dx, dy);
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastPinch > 0 && h.zoom) h.zoom(d / lastPinch);
        lastPinch = d;
      }
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size === 0) {
        if (down && !down.moved && performance.now() - down.t < 450 && h.tap) { const r = el.getBoundingClientRect(); h.tap(e.clientX - r.left, e.clientY - r.top); }
        down = null; h.end && h.end();
      } else lastPinch = 0;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
    el.addEventListener('wheel', (e) => { e.preventDefault(); h.zoom && h.zoom(Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  }
  LC.gestures = gestures;

  // ---------------------------------------------------------------- stage (the full-screen canvas + loop)
  class Stage {
    constructor(canvas) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.view = null; this.paused = false; this.ov = null; this.time = 0;
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize); this.resize();
      const call = (name, ...a) => this.view && this.view[name] && this.view[name](...a);
      gestures(canvas, {
        start: () => call('onStart'), drag: (dx, dy) => call('onDrag', dx, dy),
        zoom: (f) => call('onZoom', f), end: () => call('onEnd'), tap: (x, y) => call('onTap', x, y),
      });
      this.last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000)); this.last = now;
        if (!this.paused && this.view && !document.hidden) {
          this.time += dt;
          const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
          this.view.frame(ctx, dt, this.time, this.W, this.H);
          this.drawOverlay(ctx, dt);
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = window.innerWidth; this.H = window.innerHeight;
      this.c.width = Math.round(this.W * this.dpr); this.c.height = Math.round(this.H * this.dpr);
      if (this.view && this.view.resize) this.view.resize(this.W, this.H, this.dpr);
    }
    show(view) {
      if (this.view && this.view.exit) this.view.exit();
      this.view = view;
      if (view && view.resize) view.resize(this.W, this.H, this.dpr);
    }
    // full-screen colour fade drawn over whatever view is showing
    fade(color, from, to, dur, cb) { this.ov = { color, from, to, t: 0, dur: Math.max(0.01, dur), cb }; }
    drawOverlay(ctx, dt) {
      const ov = this.ov; if (!ov) return;
      ov.t += dt; const k = clamp(ov.t / ov.dur, 0, 1), a = lerp(ov.from, ov.to, k);
      if (a > 0.003) { ctx.fillStyle = rgba(ov.color, a); ctx.fillRect(0, 0, this.W, this.H); }
      if (k >= 1) {
        const cb = ov.cb;
        this.ov = ov.to > 0.003 ? { color: ov.color, from: ov.to, to: ov.to, t: 0, dur: 1e9 } : null;
        if (cb) cb();
      }
    }
  }
  LC.Stage = Stage;

  // ---------------------------------------------------------------- disks (suns, moons, gas giants)
  function drawRing(ctx, X, Y, R, ring, back) {
    ctx.save(); ctx.translate(X, Y); ctx.rotate((ring.tilt || 0) * DEG);
    ctx.beginPath(); ctx.ellipse(0, 0, R * (ring.rx || 2), R * (ring.ry || 0.4), 0, back ? Math.PI : 0, back ? TAU : Math.PI);
    ctx.strokeStyle = ring.color || 'rgba(230,210,180,.55)'; ctx.lineWidth = R * (ring.width || 0.16); ctx.stroke();
    ctx.restore();
  }
  function drawDisk(ctx, X, Y, R, o) {
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.glow) {
      const c = hex(o.glow.color), GR = o.glow.r;
      const g = ctx.createRadialGradient(X, Y, R * 0.4, X, Y, GR);
      g.addColorStop(0, rgba(c, o.glow.alpha == null ? 0.6 : o.glow.alpha)); g.addColorStop(1, rgba(c, 0));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(X - GR, Y - GR, GR * 2, GR * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (o.ring) drawRing(ctx, X, Y, R, o.ring, true);
    ctx.save(); ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.clip();
    if (o.bands) {
      const a = (o.tilt || 0) * DEG, dx = Math.sin(a) * R, dy = Math.cos(a) * R;
      const g = ctx.createLinearGradient(X - dx, Y - dy, X + dx, Y + dy);
      o.bands.forEach((c, i) => g.addColorStop(i / (o.bands.length - 1), c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = o.color || '#ffffff';
    ctx.fillRect(X - R, Y - R, 2 * R, 2 * R);
    if (o.shade) {
      const a = o.shade.angle * DEG, dx = Math.cos(a) * R, dy = -Math.sin(a) * R, at = o.shade.at == null ? 0.42 : o.shade.at;
      const sc = o.shade.color || '#000000', am = o.shade.amount == null ? 0.88 : o.shade.amount;
      const g = ctx.createLinearGradient(X - dx, Y - dy, X + dx, Y + dy);
      g.addColorStop(0, rgba(sc, 0)); g.addColorStop(at, rgba(sc, 0)); g.addColorStop(Math.min(1, at + 0.28), rgba(sc, am)); g.addColorStop(1, rgba(sc, am));
      ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, 2 * R, 2 * R);
    }
    const lg = ctx.createRadialGradient(X, Y, R * 0.55, X, Y, R);
    lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,' + (o.limb == null ? 0.22 : o.limb) + ')');
    ctx.fillStyle = lg; ctx.fillRect(X - R, Y - R, 2 * R, 2 * R);
    ctx.restore();
    if (o.ring) drawRing(ctx, X, Y, R, o.ring, false);
    ctx.restore();
  }
  LC.drawDisk = drawDisk;

  // ---------------------------------------------------------------- panorama layers
  // A scene is a list of layers drawn in order. Positions are in degrees:
  // yaw = compass direction (0..360), pitch = up/down (-90..90).
  const L = {};
  L.sky = function (stops) {
    const s = stops.slice().sort((a, b) => b[0] - a[0]);
    return { draw(ctx, v) {
      const g = ctx.createLinearGradient(0, v.y(90), 0, v.y(-90));
      for (const st of s) g.addColorStop(clamp((90 - st[0]) / 180, 0, 1), st[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, v.W, v.H);
    } };
  };
  L.plane = function (top, stops) {
    const s = stops.slice().sort((a, b) => b[0] - a[0]), span = s[0][0] - s[s.length - 1][0] || 1;
    return { draw(ctx, v) {
      const yt = v.y(top); if (yt > v.H) return;
      const g = ctx.createLinearGradient(0, v.y(s[0][0]), 0, v.y(s[s.length - 1][0]));
      for (const st of s) g.addColorStop(clamp((s[0][0] - st[0]) / span, 0, 1), st[1]);
      ctx.fillStyle = g; const y0 = Math.max(0, yt); ctx.fillRect(0, y0, v.W, v.H - y0);
    } };
  };
  L.ridge = function (o) {
    let f = o.fn;
    if (!f) {
      const n = pfbm(o.seed || 1, o.cells || 8, o.oct || 4, o.gain || 0.5, o.ridged);
      const bump = o.puffy ? pnoise((o.seed || 1) + 99, o.puffy) : null;
      f = (yaw) => {
        let h = n(yaw / 360);
        if (o.mesa) h = smooth(o.mesa[0], o.mesa[1], h);
        if (o.pow) h = Math.pow(h, o.pow);
        if (bump) { const u = (yaw / 360) * o.puffy, fr = u - Math.floor(u); h = h * 0.5 + 0.5 * Math.sqrt(Math.sin(fr * Math.PI)) * (0.55 + 0.45 * bump(yaw / 360)); }
        return o.base + o.amp * h;
      };
    }
    const top = o.base + (o.amp || 0);
    return { fn: f, draw(ctx, v) {
      const step = (o.step || 3) / v.k, a = v.yaw - v.hfov / 2 - step * 2, b = v.yaw + v.hfov / 2 + step * 2, pts = [];
      for (let yw = a; yw <= b; yw += step) pts.push(v.W / 2 + (yw - v.yaw) * v.k, v.y(f(yw)));
      const edge = o.up ? Math.max(-4, v.y(90)) : Math.min(v.H + 4, v.y(o.to == null ? -90 : o.to));
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.lineTo(pts[pts.length - 2], edge); ctx.lineTo(pts[0], edge); ctx.closePath();
      if (Array.isArray(o.fill)) {
        const gt = o.gradTop == null ? top : o.gradTop, gb = o.gradBottom == null ? (o.up ? 90 : o.base) : o.gradBottom;
        const g = ctx.createLinearGradient(0, v.y(gt), 0, v.y(gb));
        o.fill.forEach((c, i) => g.addColorStop(i / (o.fill.length - 1), c));
        ctx.fillStyle = g;
      } else ctx.fillStyle = o.fill;
      ctx.fill();
      if (o.rim) {
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.strokeStyle = o.rim; ctx.lineWidth = o.rimWidth || 1.2; ctx.stroke();
      }
    } };
  };
  L.glow = function (o) {
    return { draw(ctx, v) {
      if (!v.vis(o.yaw, o.r)) return;
      const X = v.x(o.yaw), Y = v.y(o.pitch), R = o.r * v.k, a = (o.alpha == null ? 0.5 : o.alpha) * (1 + (o.pulse || 0) * Math.sin(v.t * 1.3));
      const g = ctx.createRadialGradient(X, Y, 0, X, Y, R);
      g.addColorStop(0, rgba(o.color, a)); g.addColorStop(0.4, rgba(o.color, a * 0.35)); g.addColorStop(1, rgba(o.color, 0));
      if (o.add !== false) ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, 2 * R, 2 * R);
      ctx.globalCompositeOperation = 'source-over';
    } };
  };
  L.body = function (o) {
    const half = Math.max(o.r * 2.5, o.glow ? o.glow.r : 0, o.ring ? o.r * (o.ring.rx || 2) : 0);
    return { draw(ctx, v) {
      if (!v.vis(o.yaw, half)) return;
      const R = o.r * v.k;
      drawDisk(ctx, v.x(o.yaw), v.y(o.pitch), R, Object.assign({}, o, { glow: o.glow ? Object.assign({}, o.glow, { r: o.glow.r * v.k }) : null }));
    } };
  };
  L.stars = function (o) {
    const r = rng(o.seed || 7), list = [], minP = o.minPitch == null ? 0 : o.minPitch, s0 = Math.sin(minP * DEG);
    for (let i = 0; i < o.count; i++) list.push(r() * 360, Math.asin(lerp(s0, 1, r())) / DEG, Math.pow(r(), 2.5), r() * TAU);
    return { draw(ctx, v) {
      ctx.fillStyle = o.color || '#ffffff';
      const base = o.alpha == null ? 1 : o.alpha, sz = o.size || 1.3;
      for (let i = 0; i < list.length; i += 4) {
        const yw = list[i]; if (!v.vis(yw, 1)) continue;
        const p = list[i + 1], Y = v.y(p); if (Y < -2 || Y > v.H + 2) continue;
        const m = list[i + 2], tw = o.twinkle ? 0.6 + 0.4 * Math.sin(v.t * 2.3 + list[i + 3]) : 1;
        ctx.globalAlpha = base * (0.2 + 0.8 * m) * tw * smooth(minP, minP + 8, p);
        const s = sz * (0.6 + 1.7 * m); ctx.fillRect(v.x(yw) - s / 2, Y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    } };
  };
  L.sprites = function (items) {
    return { draw(ctx, v) {
      for (const it of items) { if (!v.vis(it.yaw, it.w || 12)) continue; it.draw(ctx, v.x(it.yaw), v.y(it.pitch), v.k, v.t, v); }
    } };
  };
  L.custom = function (draw) { return { draw }; };
  L.fog = function (o) {
    return { draw(ctx, v) {
      const yc = v.y(o.pitch), hh = o.h * v.k; if (yc + hh < 0 || (yc - hh > v.H)) return;
      const a = o.alpha == null ? 0.5 : o.alpha, g = ctx.createLinearGradient(0, yc - hh, 0, yc + hh);
      g.addColorStop(0, rgba(o.color, 0)); g.addColorStop(0.5, rgba(o.color, a)); g.addColorStop(1, rgba(o.color, o.below ? a : 0));
      ctx.fillStyle = g; ctx.fillRect(0, yc - hh, v.W, o.below ? v.H - (yc - hh) : 2 * hh);
    } };
  };
  L.veil = function (o) {
    return { draw(ctx, v) {
      ctx.fillStyle = rgba(o.color, (o.alpha || 0.1) * (1 + (o.pulse || 0) * Math.sin(v.t * (o.speed || 0.7))));
      ctx.fillRect(0, 0, v.W, v.H);
    } };
  };
  L.shimmer = function (o) {
    const r = rng(o.seed || 5), list = [];
    for (let i = 0; i < o.count; i++) list.push(o.yaw ? lerp(o.yaw[0], o.yaw[1], r()) : r() * 360, lerp(o.top, o.bottom, Math.pow(r(), 0.6)), r() * TAU, 0.5 + r());
    return { draw(ctx, v) {
      ctx.strokeStyle = o.color; ctx.lineWidth = o.width || 1; ctx.beginPath();
      for (let i = 0; i < list.length; i += 4) {
        const yw = list[i], p = list[i + 1]; if (!v.vis(yw, 3)) continue;
        const Y = v.y(p); if (Y < 0 || Y > v.H) continue;
        if (Math.sin(v.t * 1.6 + list[i + 2]) < 0.15) continue;
        const len = (0.35 + Math.abs(p - o.top) * 0.1) * v.k * list[i + 3], X = v.x(yw);
        ctx.moveTo(X - len / 2, Y); ctx.lineTo(X + len / 2, Y);
      }
      ctx.stroke();
    } };
  };
  L.beams = function (o) {
    return { draw(ctx, v) {
      ctx.globalCompositeOperation = 'lighter';
      for (const [yaw, w, lean] of o.list) {
        if (!v.vis(yaw, w + Math.abs(lean) + 10)) continue;
        const X = v.x(yaw), yT = v.y(o.top), yB = v.y(o.bottom), W2 = (w * v.k) / 2, L2 = lean * v.k;
        const a = (o.alpha || 0.12) * (0.7 + 0.3 * Math.sin(v.t * 0.5 + yaw));
        const g = ctx.createLinearGradient(0, yT, 0, yB); g.addColorStop(0, rgba(o.color, a)); g.addColorStop(1, rgba(o.color, 0));
        ctx.fillStyle = g; ctx.beginPath();
        ctx.moveTo(X - W2 * 0.6, yT); ctx.lineTo(X + W2 * 0.6, yT); ctx.lineTo(X + L2 + W2 * 1.4, yB); ctx.lineTo(X + L2 - W2 * 1.4, yB);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    } };
  };
  L.meteors = function (o) {
    const r = rng(o.seed || 3), list = []; let acc = 0;
    return { draw(ctx, v) {
      acc += (o.rate || 5) * v.dt * (reduceMotion ? 0.3 : 1);
      while (acc >= 1) {
        acc -= 1;
        const dir = ((o.dir == null ? 210 : o.dir) + (r() - 0.5) * (o.jitter || 30)) * DEG;
        list.push({ yaw: v.yaw + (r() - 0.5) * v.hfov * 1.3, p: lerp(o.pMin || 20, o.pMax || 80, r()), dx: Math.cos(dir), dy: Math.sin(dir),
          sp: lerp(o.speed ? o.speed[0] : 30, o.speed ? o.speed[1] : 70, r()), len: lerp(o.len ? o.len[0] : 6, o.len ? o.len[1] : 16, r()),
          life: lerp(0.6, 1.5, r()), age: 0, c: hex(o.colors[Math.floor(r() * o.colors.length)]), w: lerp(0.8, 2.4, r()) });
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i]; m.age += v.dt;
        if (m.age > m.life) { list.splice(i, 1); continue; }
        const d = m.sp * m.age, hy = m.yaw + m.dx * d, hp = m.p + m.dy * d, L2 = m.len * Math.min(1, m.age * 4);
        const hx = v.W / 2 + wrap180(hy - v.yaw) * v.k, hY = v.y(hp), tx = hx - m.dx * L2 * v.k, tY = hY + m.dy * L2 * v.k;
        if ((hx < -50 && tx < -50) || (hx > v.W + 50 && tx > v.W + 50)) continue;
        const a = Math.sin((Math.PI * m.age) / m.life), g = ctx.createLinearGradient(tx, tY, hx, hY);
        g.addColorStop(0, rgba(m.c, 0)); g.addColorStop(1, rgba(m.c, a));
        ctx.strokeStyle = g; ctx.lineWidth = m.w; ctx.beginPath(); ctx.moveTo(tx, tY); ctx.lineTo(hx, hY); ctx.stroke();
        ctx.fillStyle = rgba(m.c, a * 0.9); ctx.beginPath(); ctx.arc(hx, hY, m.w * 1.1, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    } };
  };
  L.traffic = function (lanes) {
    const r = rng(77), cars = [];
    lanes.forEach((ln, li) => { for (let i = 0; i < ln.count; i++) cars.push({ li, yaw: r() * 360, ph: r() * TAU }); });
    return { draw(ctx, v) {
      ctx.globalCompositeOperation = 'lighter';
      for (const c of cars) {
        const ln = lanes[c.li]; c.yaw += ln.speed * v.dt;
        if (!v.vis(c.yaw, 4)) continue;
        const p = ln.pitch + ln.amp * Math.sin(c.yaw * DEG * (ln.freq || 2) + c.ph), X = v.x(c.yaw), Y = v.y(p);
        if (Y < -4 || Y > v.H + 4) continue;
        const s = (ln.size || 1.5) * Math.max(1, v.k / 10), tr = -Math.sign(ln.speed) * (ln.trail || 2.5) * v.k;
        const g = ctx.createLinearGradient(X + tr, Y, X, Y); g.addColorStop(0, rgba(ln.color, 0)); g.addColorStop(1, rgba(ln.color, 0.75));
        ctx.strokeStyle = g; ctx.lineWidth = s; ctx.beginPath(); ctx.moveTo(X + tr, Y); ctx.lineTo(X, Y); ctx.stroke();
        ctx.fillStyle = ln.color; ctx.fillRect(X - s, Y - s / 2, s * 2, s);
      }
      ctx.globalCompositeOperation = 'source-over';
    } };
  };
  // Screen-space particles that stay locked to the world when you turn your head.
  L.particles = function (o) {
    let ps = null, W = 0, H = 0, lastYaw = null, lastPitch = null;
    const r = rng(o.seed || 11), n = Math.round((o.count || 80) * (reduceMotion ? 0.35 : 1));
    return { draw(ctx, v) {
      if (!ps || W !== v.W || H !== v.H) {
        W = v.W; H = v.H; ps = [];
        for (let i = 0; i < n; i++) ps.push({ x: r() * W, y: r() * H, z: lerp(0.35, 1, r()), ph: r() * TAU, f: lerp(0.5, 1.5, r()) });
      }
      if (lastYaw !== null) {
        const dx = -wrap180(v.yaw - lastYaw) * v.k, dy = (v.pitch - lastPitch) * v.k;
        if (dx || dy) for (const p of ps) { p.x += dx; p.y += dy; }
      }
      lastYaw = v.yaw; lastPitch = v.pitch;
      const dt = v.dt, t = v.t, col = o.color || '#ffffff', size = o.size || 2, fall = o.fall == null ? 60 : o.fall, wind = o.wind || 0, sway = o.sway == null ? 15 : o.sway;
      if (o.add) ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = col;
      for (const p of ps) {
        const sw = Math.sin(t * p.f + p.ph);
        if (o.type === 'ember') { p.y -= fall * p.z * dt; p.x += (wind + sw * 12) * dt; }
        else if (o.type === 'mote' || o.type === 'firefly') { p.y += Math.sin(t * 0.4 * p.f + p.ph) * 7 * dt; p.x += (wind + Math.cos(t * 0.3 * p.f + p.ph) * 9) * dt; }
        else { p.y += fall * p.z * dt; p.x += (wind * p.z + sw * sway) * dt; }
        if (p.x < -10) p.x += W + 20; else if (p.x > W + 10) p.x -= W + 20;
        if (p.y > H + 10) p.y -= H + 20; else if (p.y < -10) p.y += H + 20;
        let a = (o.alpha == null ? 0.8 : o.alpha) * (0.35 + 0.65 * p.z);
        if (o.type === 'ember' || o.type === 'firefly') a *= 0.5 + 0.5 * Math.sin(t * 3 * p.f + p.ph);
        if (a <= 0.01) continue;
        const s = size * p.z; ctx.globalAlpha = a;
        if (o.type === 'firefly') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 4); g.addColorStop(0, rgba(col, 1)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.fillRect(p.x - s * 4, p.y - s * 4, s * 8, s * 8);
        } else if (o.type === 'dust') ctx.fillRect(p.x, p.y, s * 2.6, s * 0.6);
        else ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    } };
  };
  LC.L = L;

  // ---------------------------------------------------------------- 360° surface view
  class Pano {
    constructor(scene) {
      this.scene = scene; const s = scene.start || {};
      this.yaw = s.yaw || 0; this.pitch = s.pitch == null ? 3 : s.pitch; this.zoom = 1;
      this.vYaw = 0; this.vPitch = 0; this.dragging = false; this.lastMove = 0; this.moved = false;
      const self = this;
      this.v = {
        W: 0, H: 0, k: 1, yaw: 0, pitch: 0, t: 0, dt: 0, hfov: 90, vfov: 60,
        x(y) { return self.v.W / 2 + wrap180(y - self.v.yaw) * self.v.k; },
        y(p) { return self.v.H / 2 - (p - self.v.pitch) * self.v.k; },
        vis(y, half) { return Math.abs(wrap180(y - self.v.yaw)) <= self.v.hfov / 2 + half; },
      };
    }
    resize(W, H) { this.W = W; this.H = H; this.k0 = Math.min(W, H) / 58; this.clamp(); }
    get k() { return this.k0 * this.zoom; }
    clamp() { const half = this.H / (2 * this.k), lim = Math.max(0, 88 - half); this.pitch = clamp(this.pitch, -lim, Math.min(lim, 70)); }
    onStart() { this.dragging = true; this.vYaw = this.vPitch = 0; }
    onDrag(dx, dy) {
      const k = this.k, now = performance.now(), dt = Math.max(8, now - this.lastMove) / 1000; this.lastMove = now;
      this.yaw -= dx / k; this.pitch += dy / k; this.clamp();
      this.vYaw = lerp(this.vYaw, -dx / k / dt, 0.4); this.vPitch = lerp(this.vPitch, dy / k / dt, 0.4);
      if (!this.moved) { this.moved = true; this.onFirstMove && this.onFirstMove(); }
    }
    onEnd() { this.dragging = false; if (performance.now() - this.lastMove > 90) this.vYaw = this.vPitch = 0; }
    onZoom(f) { this.zoom = clamp(this.zoom * f, 1, 4); this.clamp(); }
    nudge(dYaw) { this.vYaw += dYaw; }
    frame(ctx, dt, t, W, H) {
      if (!this.dragging) {
        this.yaw += this.vYaw * dt; this.pitch += this.vPitch * dt;
        const d = Math.exp(-4.5 * dt); this.vYaw *= d; this.vPitch *= d; this.clamp();
      }
      this.yaw = ((this.yaw % 360) + 360) % 360;
      const v = this.v; v.W = W; v.H = H; v.k = this.k; v.yaw = this.yaw; v.pitch = this.pitch; v.t = t; v.dt = dt; v.hfov = W / v.k; v.vfov = H / v.k;
      for (const layer of this.scene.layers) layer.draw(ctx, v);
      if (this.onFrame) this.onFrame(this.yaw);
    }
  }
  LC.Pano = Pano;

  // ---------------------------------------------------------------- hyperspace jump
  class Hyper {
    constructor(opts) {
      this.o = opts || {}; this.t = 0; this.dur = this.o.dur || 2.2; this.done = false;
      this.s = []; for (let i = 0; i < 420; i++) this.s.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), pz: 1 });
    }
    frame(ctx, dt, t, W, H) {
      this.t += dt; const p = this.t / this.dur; if (this.o.tick) this.o.tick(p);
      const speed = reduceMotion ? 0.15 : lerp(0.05, 2.7, smooth(0.04, 0.55, p)) * (p > 0.9 ? 1.6 : 1);
      ctx.fillStyle = 'rgba(2,4,10,0.5)'; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, F = Math.max(W, H) * 0.6;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, F);
      g.addColorStop(0, 'rgba(110,160,255,' + (0.22 * smooth(0.15, 0.7, p)) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (const s of this.s) {
        s.pz = s.z; s.z -= speed * dt;
        if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; s.pz = 1; continue; }
        const x1 = cx + (s.x / s.z) * F * 0.5, y1 = cy + (s.y / s.z) * F * 0.5;
        if (x1 < -60 || x1 > W + 60 || y1 < -60 || y1 > H + 60) continue;
        const x0 = cx + (s.x / s.pz) * F * 0.5, y0 = cy + (s.y / s.pz) * F * 0.5, b = clamp(1.15 - s.z, 0, 1);
        ctx.strokeStyle = 'rgba(' + ((200 + 55 * b) | 0) + ',' + ((222 + 33 * b) | 0) + ',255,' + b + ')';
        ctx.lineWidth = 0.6 + 1.7 * b; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + 0.01, y1); ctx.stroke();
      }
      if (p >= 1 && !this.done) { this.done = true; if (this.o.done) this.o.done(); }
    }
  }
  LC.Hyper = Hyper;

  // ---------------------------------------------------------------- planet seen from orbit
  class Orbit {
    constructor(spec) {
      this.spec = spec; this.TW = 384; this.TH = 192; this.row = 0; this.ready = false;
      this.rgb = new Uint8ClampedArray(this.TW * this.TH * 3); this.eg = new Uint8ClampedArray(this.TW * this.TH * 2);
      this.noise = noise3(spec.seed || 1); this.rot = 0.25; this.scale = 0.6; this.desc = null;
      const r = rng((spec.seed || 1) + 5); this.bg = []; for (let i = 0; i < 320; i++) this.bg.push(r(), r(), Math.pow(r(), 3), r() * TAU);
      this.off = document.createElement('canvas'); this.octx = this.off.getContext('2d');
      const l = spec.light || [-0.68, -0.38, 0.62], ln = Math.hypot(l[0], l[1], l[2]); this.light = [l[0] / ln, l[1] / ln, l[2] / ln];
      this.R = 0;
    }
    gen(rows) {
      if (this.ready) return;
      const { TW, TH, rgb, eg, spec, noise } = this, out = [0, 0, 0, 0, 0], end = Math.min(TH, this.row + rows);
      for (let j = this.row; j < end; j++) {
        const lat = (0.5 - (j + 0.5) / TH) * Math.PI, cl = Math.cos(lat), sl = Math.sin(lat);
        for (let i = 0; i < TW; i++) {
          const lon = ((i + 0.5) / TW) * TAU, x = cl * Math.cos(lon), z = cl * Math.sin(lon);
          out[3] = 0; out[4] = 0; spec.tex(out, x, sl, z, lat, noise);
          const k = j * TW + i; rgb[k * 3] = out[0]; rgb[k * 3 + 1] = out[1]; rgb[k * 3 + 2] = out[2]; eg[k * 2] = out[3] * 255; eg[k * 2 + 1] = out[4] * 255;
        }
      }
      this.row = end; if (end >= TH) this.ready = true;
    }
    finish() { while (!this.ready) this.gen(48); }
    resize(W, H, dpr) {
      this.W = W; this.H = H;
      this.D = Math.round(Math.min(W * 0.8, H * 0.46, 540));
      const R = Math.min(300, Math.round(this.D * Math.min(dpr || 1, 1.4)));
      if (R === this.R) return;
      this.R = R; this.off.width = this.off.height = R; this.img = this.octx.createImageData(R, R);
      const n = R * R; this.pu = new Float32Array(n); this.pv = new Uint16Array(n); this.pl = new Float32Array(n); this.ps = new Float32Array(n); this.pr = new Float32Array(n); this.pm = new Uint8Array(n);
      const tilt = (this.spec.tilt == null ? 16 : this.spec.tilt) * DEG, ct = Math.cos(tilt), st = Math.sin(tilt), [Lx, Ly, Lz] = this.light;
      for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
        const idx = j * R + i, nx = ((i + 0.5) / R) * 2 - 1, ny = ((j + 0.5) / R) * 2 - 1, r2 = nx * nx + ny * ny;
        if (r2 > 1) continue;
        this.pm[idx] = r2 > 0.982 ? 2 : 1;
        const nz = Math.sqrt(1 - r2), tx = nx * ct - ny * st, ty = nx * st + ny * ct;
        const lat = Math.asin(clamp(-ty, -1, 1)), lon = Math.atan2(tx, nz);
        this.pu[idx] = (((lon / TAU) % 1) + 1) % 1 * this.TW;
        this.pv[idx] = Math.min(this.TH - 1, Math.floor((0.5 - lat / Math.PI) * this.TH));
        const d = nx * Lx + ny * Ly + nz * Lz;
        this.pl[idx] = smooth(-0.2, 0.6, d);
        const rz = 2 * d * nz - Lz; this.ps[idx] = d > 0 ? Math.pow(Math.max(0, rz), 26) : 0;
        this.pr[idx] = Math.pow(1 - nz, 2.4);
      }
    }
    renderSphere() {
      const { R, TW, rgb, eg, pu, pv, pl, ps, pr, pm, img } = this, data = img.data, off = (((this.rot % 1) + 1) % 1) * TW;
      const ec = hex(this.spec.emissive || '#ff7a2a'), ac = hex(this.spec.atmo || '#88aaff'), night = this.spec.night == null ? 0.035 : this.spec.night;
      for (let idx = 0, n = R * R; idx < n; idx++) {
        const m = pm[idx], o = idx * 4;
        if (!m) { data[o + 3] = 0; continue; }
        let u = pu[idx] + off; if (u >= TW) u -= TW;
        const ti = pv[idx] * TW + (u | 0), lit = pl[idx], l = lit * (1 - night) + night;
        const en = (eg[ti * 2] / 255) * (0.3 + 0.7 * (1 - lit)), sp = ps[idx] * (eg[ti * 2 + 1] / 255) * 230, rim = pr[idx] * lit * 0.95;
        data[o] = rgb[ti * 3] * l + ec[0] * en + sp + ac[0] * rim;
        data[o + 1] = rgb[ti * 3 + 1] * l + ec[1] * en + sp + ac[1] * rim;
        data[o + 2] = rgb[ti * 3 + 2] * l + ec[2] * en + sp + ac[2] * rim;
        data[o + 3] = m === 2 ? 170 : 255;
      }
      this.octx.putImageData(img, 0, 0);
    }
    onDrag(dx) { this.rot -= dx / (this.D * 3); }
    descend() { this.desc = { t: 0 }; }
    frame(ctx, dt, t, W, H) {
      const sp = this.spec; if (!this.ready) this.gen(24);
      ctx.fillStyle = sp.space || '#03050a'; ctx.fillRect(0, 0, W, H);
      if (sp.nebula) { const g = ctx.createRadialGradient(W * 0.25, H * 0.2, 0, W * 0.25, H * 0.2, Math.max(W, H) * 0.7); g.addColorStop(0, rgba(sp.nebula, 0.35)); g.addColorStop(1, rgba(sp.nebula, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < this.bg.length; i += 4) { ctx.globalAlpha = (0.25 + 0.75 * this.bg[i + 2]) * (0.7 + 0.3 * Math.sin(t * 1.5 + this.bg[i + 3])); const s = 0.6 + this.bg[i + 2] * 1.8; ctx.fillRect(this.bg[i] * W, this.bg[i + 1] * H, s, s); }
      ctx.globalAlpha = 1;
      this.scale = lerp(this.scale, 1, 1 - Math.exp(-2 * dt));
      let s = this.scale;
      if (this.desc) { this.desc.t += dt; s *= 1 + Math.pow(Math.min(1, this.desc.t / 1.1), 2.3) * 6; }
      this.rot += dt * (sp.spin == null ? 0.012 : sp.spin);
      const cx = W / 2, cy = H * 0.47, D = this.D * s, Rr = D / 2;
      for (const sun of sp.suns || []) drawDisk(ctx, W * sun.x, H * sun.y, sun.r * this.D, { color: sun.color, glow: { r: sun.r * this.D * 9, color: sun.glow, alpha: 0.9 }, limb: 0 });
      if (sp.companion) { const c = sp.companion; drawDisk(ctx, cx + c.x * this.D, cy + c.y * this.D, c.r * this.D, c); }
      const moons = sp.moons || [];
      const moonPos = (m) => { const a = (m.a + t * (m.speed || 2)) * DEG; return [cx + Math.cos(a) * m.d * D, cy - Math.sin(a) * m.d * D * (m.flat || 0.35)]; };
      for (const m of moons) { const a = ((m.a + t * (m.speed || 2)) % 360 + 360) % 360; if (a < 180) { const [x, y] = moonPos(m); drawDisk(ctx, x, y, m.r * D, { color: m.color, shade: { angle: -150, amount: 0.8 } }); } }
      if (sp.stream) this.drawStream(ctx, cx, cy, Rr, t, true);
      // atmosphere halo
      const ac = hex(sp.atmo || '#88aaff'), hg = ctx.createRadialGradient(cx, cy, Rr * 0.92, cx, cy, Rr * 1.22);
      hg.addColorStop(0, rgba(ac, 0.5)); hg.addColorStop(0.35, rgba(ac, 0.16)); hg.addColorStop(1, rgba(ac, 0));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hg; ctx.fillRect(cx - Rr * 1.3, cy - Rr * 1.3, Rr * 2.6, Rr * 2.6); ctx.globalCompositeOperation = 'source-over';
      if (this.ready) { this.renderSphere(); ctx.imageSmoothingEnabled = true; ctx.drawImage(this.off, cx - Rr, cy - Rr, D, D); }
      for (const m of moons) { const a = ((m.a + t * (m.speed || 2)) % 360 + 360) % 360; if (a >= 180) { const [x, y] = moonPos(m); drawDisk(ctx, x, y, m.r * D, { color: m.color, shade: { angle: -150, amount: 0.8 } }); } }
      if (sp.stream) this.drawStream(ctx, cx, cy, Rr, t, false);
      if (sp.shield) this.drawShield(ctx, cx, cy, Rr * 1.07, t, sp.shield);
    }
    drawStream(ctx, cx, cy, R, t, back) {
      const st = this.spec.stream, r = rng(99), tilt = (st.tilt || -16) * DEG;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < (st.count || 240); i++) {
        const a = r() * TAU + t * 0.05 * (0.5 + r()), sinA = Math.sin(a);
        const isBack = sinA < 0; if (isBack !== back) { r(); r(); continue; }
        const rx = R * (st.rx || 1.7) * (0.9 + r() * 0.25), ry = R * (st.ry || 0.32);
        const x = Math.cos(a) * rx, y = sinA * ry, tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.fillStyle = rgba(st.colors[i % st.colors.length], 0.25 + 0.6 * tw * r());
        const s = 0.8 + 1.4 * tw; ctx.fillRect(x, y, s, s);
      }
      ctx.restore();
    }
    drawShield(ctx, cx, cy, R, t, color) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      ctx.strokeStyle = rgba(color, 0.12 + 0.05 * Math.sin(t * 2)); ctx.lineWidth = 1;
      const a = R / 8, h = a * Math.sqrt(3); ctx.beginPath();
      for (let col = -7; col <= 7; col++) for (let row = -6; row <= 6; row++) {
        const x = cx + col * a * 1.5, y = cy + row * h + (col & 1 ? h / 2 : 0);
        for (let k = 0; k < 6; k++) { const ang = (k / 6) * TAU, px = x + Math.cos(ang) * a * 0.96, py = y + Math.sin(ang) * a * 0.96; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath();
      }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = rgba(color, 0.45); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    }
  }
  LC.Orbit = Orbit;

  // ---------------------------------------------------------------- galaxy
  function renderGalaxy(size, seed) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'), R = size / 2, r = rng(seed || 42), arms = 4, wind = 4.4, px = size / 1024;
    g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(R, R, 0, R, R, R);
    gr.addColorStop(0, 'rgba(90,110,180,0.28)'); gr.addColorStop(0.55, 'rgba(40,50,110,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 1000; i++) {
      const arm = i % arms, t = Math.pow(r(), 0.8), sp = (r() + r() - 1) * 0.3 * (1.1 - t);
      const ang = (arm / arms) * TAU + t * wind + sp, rr = (0.07 + t * 0.9) * R;
      const x = R + Math.cos(ang) * rr, y = R + Math.sin(ang) * rr, s = (0.02 + r() * 0.05) * size * (1.1 - t * 0.6);
      const col = r() < 0.12 ? '255,110,170' : r() < 0.5 ? '110,140,255' : '170,195,255';
      const gg = g.createRadialGradient(x, y, 0, x, y, s);
      gg.addColorStop(0, 'rgba(' + col + ',' + (0.05 + 0.05 * (1 - t)) + ')'); gg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gg; g.fillRect(x - s, y - s, 2 * s, 2 * s);
    }
    const N = Math.round((size * size) / 85);
    for (let i = 0; i < N; i++) {
      let x, y;
      if (r() < 0.18) { const a = r() * TAU, rr = Math.pow(r(), 2) * 0.24 * R; x = R + Math.cos(a) * rr; y = R + Math.sin(a) * rr; }
      else {
        const arm = i % arms, t = Math.pow(r(), 0.65), sp = (r() + r() + r() - 1.5) * 0.32 * (1.15 - t);
        const ang = (arm / arms) * TAU + t * wind + sp, rr = (0.06 + t * 0.94) * R + (r() - 0.5) * 0.03 * R;
        x = R + Math.cos(ang) * rr; y = R + Math.sin(ang) * rr;
      }
      const d = Math.hypot(x - R, y - R) / R, warm = d < 0.26 ? 1 - d / 0.26 : 0, b = (0.25 + 0.75 * r()) * (1 - d * 0.5);
      const sz = (r() < 0.015 ? 2.2 : 0.7 + r() * 0.9) * px;
      g.fillStyle = 'rgba(' + ((200 + 55 * warm) | 0) + ',' + ((205 + 25 * warm) | 0) + ',' + ((255 - 75 * warm) | 0) + ',' + b + ')';
      g.fillRect(x, y, sz, sz);
    }
    gr = g.createRadialGradient(R, R, 0, R, R, R * 0.32);
    gr.addColorStop(0, 'rgba(255,246,225,0.95)'); gr.addColorStop(0.12, 'rgba(255,214,160,0.6)'); gr.addColorStop(0.45, 'rgba(220,150,100,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 520; i++) {
      const arm = i % arms, t = 0.1 + r() * 0.72, ang = (arm / arms) * TAU + t * wind + 0.13, rr = (0.06 + t * 0.94) * R;
      g.fillStyle = 'rgba(3,4,10,0.10)'; g.beginPath(); g.arc(R + Math.cos(ang) * rr, R + Math.sin(ang) * rr, size * (0.008 + r() * 0.016), 0, TAU); g.fill();
    }
    return c;
  }
  LC.renderGalaxy = renderGalaxy;

  class GalaxyView {
    constructor(img) { this.img = img; this.rot = 0; const r = rng(9); this.st = []; for (let i = 0; i < 320; i++) this.st.push(r(), r(), Math.pow(r(), 3), r() * TAU); }
    frame(ctx, dt, t, W, H) {
      ctx.fillStyle = '#03050a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < this.st.length; i += 4) { ctx.globalAlpha = (0.2 + 0.8 * this.st[i + 2]) * (0.6 + 0.4 * Math.sin(t * 1.2 + this.st[i + 3])); const s = 0.6 + 1.6 * this.st[i + 2]; ctx.fillRect(this.st[i] * W, this.st[i + 1] * H, s, s); }
      ctx.globalAlpha = 1;
      if (!reduceMotion) this.rot += dt * 0.025;
      const S = Math.max(W, H) * 1.05;
      ctx.save(); ctx.translate(W / 2, H * 0.44); ctx.scale(1, 0.46); ctx.rotate(this.rot); ctx.drawImage(this.img, -S / 2, -S / 2, S, S); ctx.restore();
      const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
  }
  LC.GalaxyView = GalaxyView;

  // ---------------------------------------------------------------- navicomputer (the guess map)
  class NavMap {
    constructor(canvas, worlds, img, onSelect) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.worlds = worlds; this.img = img; this.onSelect = onSelect;
      this.cx = 0; this.cy = 0.05; this.z = 1; this.sel = null; this.result = null; this.final = null; this.anim = null; this.running = false; this.locked = false;
      this.byId = {}; worlds.forEach((w) => (this.byId[w.id] = w));
      gestures(canvas, {
        drag: (dx, dy) => { const s = this.s(); this.cx -= dx / s; this.cy -= dy / s; this.clampView(); this.anim = null; },
        zoom: (f) => { this.z = clamp(this.z * f, 1, 6); this.clampView(); this.anim = null; },
        tap: (x, y) => this.tap(x, y),
      });
      window.addEventListener('resize', () => this.running && this.resize());
    }
    s() { return this.base * this.z; }
    resize() {
      const r = this.c.getBoundingClientRect(); this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = r.width; this.H = r.height; this.c.width = Math.round(this.W * this.dpr); this.c.height = Math.round(this.H * this.dpr);
      this.base = Math.min(this.W - 24, this.H - 210) * 0.45;
    }
    clampView() { this.cx = clamp(this.cx, -1.05, 1.05); this.cy = clamp(this.cy, -1.05, 1.05); }
    toScreen(x, y) { const s = this.s(); return [this.W / 2 + (x - this.cx) * s, this.H / 2 + (y - this.cy) * s]; }
    tap(x, y) {
      if (this.locked) return;
      let best = null, bd = 34;
      for (const w of this.worlds) { const [X, Y] = this.toScreen(w.x, w.y), d = Math.hypot(X - x, Y - y); if (d < bd) { bd = d; best = w; } }
      if (best) { this.sel = best.id; this.onSelect && this.onSelect(best); }
    }
    focus(x, y, z, dur) { this.anim = { fx: this.cx, fy: this.cy, fz: this.z, tx: x, ty: y, tz: z, t: 0, dur: dur || 0.8 }; }
    start() {
      if (this.running) return; this.running = true; this.resize(); this.last = performance.now();
      const loop = (now) => { if (!this.running) return; const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.draw(now / 1000, dt); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    stop() { this.running = false; }
    label(ctx, w, X, Y, r, col, bold) {
      ctx.font = (bold ? '600 ' : '500 ') + (this.z > 2.2 ? 12 : 10.5) + 'px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = col; ctx.textBaseline = 'middle';
      const lp = w.label || 'r', off = r + 6, txt = w.name.toUpperCase();
      if (lp === 'r') { ctx.textAlign = 'left'; ctx.fillText(txt, X + off, Y); }
      else if (lp === 'l') { ctx.textAlign = 'right'; ctx.fillText(txt, X - off, Y); }
      else if (lp === 't') { ctx.textAlign = 'center'; ctx.fillText(txt, X, Y - off - 2); }
      else { ctx.textAlign = 'center'; ctx.fillText(txt, X, Y + off + 3); }
    }
    draw(t, dt) {
      const ctx = this.ctx, W = this.W, H = this.H; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.anim) { const a = this.anim; a.t += dt; const k = smooth(0, 1, a.t / a.dur); this.cx = lerp(a.fx, a.tx, k); this.cy = lerp(a.fy, a.ty, k); this.z = lerp(a.fz, a.tz, k); if (a.t >= a.dur) this.anim = null; }
      ctx.fillStyle = '#03050a'; ctx.fillRect(0, 0, W, H);
      const s = this.s(), [ox, oy] = this.toScreen(0, 0);
      ctx.globalAlpha = 0.85; ctx.drawImage(this.img, ox - 1.12 * s, oy - 1.12 * s, 2.24 * s, 2.24 * s); ctx.globalAlpha = 1;
      // grid
      ctx.strokeStyle = 'rgba(130,170,210,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let gv = -1; gv <= 1.001; gv += 0.25) { const X = ox + gv * s, Y = oy + gv * s; ctx.moveTo(X, oy - 1.1 * s); ctx.lineTo(X, oy + 1.1 * s); ctx.moveTo(ox - 1.1 * s, Y); ctx.lineTo(ox + 1.1 * s, Y); }
      ctx.stroke();
      // unknown regions
      ctx.beginPath(); ctx.arc(ox, oy, 1.1 * s, Math.PI * 0.8, Math.PI * 1.2); ctx.arc(ox, oy, 0.62 * s, Math.PI * 1.2, Math.PI * 0.8, true); ctx.closePath();
      ctx.fillStyle = 'rgba(3,5,10,0.5)'; ctx.fill(); ctx.strokeStyle = 'rgba(217,67,46,0.35)'; ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(ox - 1.04 * s, oy); ctx.rotate(-Math.PI / 2); ctx.font = '500 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(217,67,46,0.7)'; ctx.fillText('UNKNOWN REGIONS', 0, 0); ctx.restore();
      // region rings
      ctx.setLineDash([3, 6]); ctx.strokeStyle = 'rgba(240,169,58,0.2)'; ctx.font = '500 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = 'rgba(240,169,58,0.5)';
      for (const [rr, name] of [[0.22, 'CORE'], [0.4, 'INNER RIM'], [0.62, 'MID RIM'], [1.0, 'OUTER RIM']]) { ctx.beginPath(); ctx.arc(ox, oy, rr * s, 0, TAU); ctx.stroke(); ctx.fillText(name, ox, oy - rr * s - 4); }
      ctx.setLineDash([]);
      // result / final lines
      const lines = [];
      if (this.result && this.result.guess !== this.result.answer) lines.push([this.result.guess, this.result.answer, this.result]);
      if (this.final) for (const f of this.final) if (f.guess !== f.answer) lines.push([f.guess, f.answer, null]);
      for (const [gid, aid, res] of lines) {
        const g = this.byId[gid], a = this.byId[aid]; if (!g || !a) continue;
        const [x0, y0] = this.toScreen(g.x, g.y), [x1, y1] = this.toScreen(a.x, a.y);
        let k = 1; if (res) { res.t = Math.min(1, (res.t || 0) + dt * 1.2); k = smooth(0, 1, res.t); }
        ctx.setLineDash([6, 5]); ctx.strokeStyle = res ? '#f0a93a' : 'rgba(240,169,58,0.55)'; ctx.lineWidth = res ? 2 : 1.3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); ctx.stroke(); ctx.setLineDash([]);
      }
      // worlds
      const pulse = 0.5 + 0.5 * Math.sin(t * 4), answers = this.final ? new Set(this.final.map((f) => f.answer)) : null;
      for (const w of this.worlds) {
        const [X, Y] = this.toScreen(w.x, w.y); if (X < -90 || X > W + 90 || Y < -30 || Y > H + 30) continue;
        const res = this.result, isAns = (res && w.id === res.answer) || (answers && answers.has(w.id)), isSel = !res && !answers && w.id === this.sel, isGuess = res && w.id === res.guess && !isAns;
        let col = '#a9bccf', r = 3.6, lc = 'rgba(220,228,236,0.82)', bold = false;
        if (isSel || isGuess) { col = '#f0a93a'; r = 5; lc = col; bold = true; }
        if (isAns) { col = '#7fc28a'; r = 5.2; lc = col; bold = true; }
        if ((isSel || (res && w.id === res.answer)) && !this.final) { ctx.strokeStyle = rgba(col, 0.15 + 0.55 * (1 - pulse)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, r + 4 + pulse * 7, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill();
        this.label(ctx, w, X, Y, r, lc, bold);
      }
    }
  }
  LC.NavMap = NavMap;
})();
