/* Luthen's Coordinates: the ten surface scenes.
   Each scene is a 360° panorama built from layers (see engine.js).
   Clues are hidden around the viewer, so look everywhere. */
(function () {
  'use strict';
  const LC = window.LC, L = LC.L, U = LC.util, TAU = U.TAU;
  const { rng, rgba } = LC;
  const { lerp, wrap180 } = U;

  // ---------------------------------------------------------------- helpers
  function radial(ctx, x, y, r, c, a, add) {
    if (!(r > 0)) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
    if (add) ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.globalCompositeOperation = 'source-over';
  }
  function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
  function dome(ctx, x, y, rx, ry, light, dark) { ctx.fillStyle = lin(ctx, x - rx, 0, x + rx, 0, [dark, light, dark]); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); }
  function scatter(seed, n, fn) { const r = rng(seed), out = []; for (let i = 0; i < n; i++) out.push(fn(r, i)); return out; }
  function qpt(x0, y0, x1, y1, x2, y2, u) { const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; return [a * x0 + b * x1 + c * x2, a * y0 + b * y1 + c * y2]; }
  // a world-anchored polyline that never draws across the wrap seam
  function path(ctx, v, pts) {
    let started = false, px = 0;
    ctx.beginPath();
    for (const [yw, p] of pts) {
      const X = v.x(yw), Y = v.y(p);
      if (!started || Math.abs(X - px) > v.W) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      px = X;
    }
  }

  // ================================================================ TATOOINE
  function tatooine() {
    const items = [];
    items.push({ yaw: 6, pitch: -2.4, w: 10, draw(ctx, x, y, k) {
      ctx.fillStyle = '#6e4129'; ctx.beginPath(); ctx.ellipse(x + 2.6 * k, y + 0.45 * k, 5.6 * k, 0.85 * k, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3b2215'; ctx.beginPath(); ctx.ellipse(x + 2.6 * k, y + 0.5 * k, 4.4 * k, 0.5 * k, 0, 0, TAU); ctx.fill();
      dome(ctx, x, y, 2.5 * k, 2.1 * k, '#f2dcbb', '#b88a62');
      ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.ellipse(x + 0.3 * k, y, 0.65 * k, 1.05 * k, 0, Math.PI, TAU); ctx.fill();
      dome(ctx, x + 4.6 * k, y + 0.35 * k, 0.95 * k, 0.8 * k, '#ead0aa', '#b08660');
      dome(ctx, x - 3.3 * k, y + 0.2 * k, 0.7 * k, 0.6 * k, '#ead0aa', '#b08660');
    } });
    const vap = (yaw, pitch, h) => ({ yaw, pitch, w: 4, draw(ctx, x, y, k, t) {
      const w = 0.16 * h * k;
      ctx.fillStyle = 'rgba(70,35,18,0.28)'; ctx.beginPath(); ctx.ellipse(x - w * 4, y, w * 4.5, w * 0.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = lin(ctx, x - w, 0, x + w, 0, ['#8d735c', '#d7c1a4', '#6f5848']); ctx.fillRect(x - w / 2, y - h * k, w, h * k);
      ctx.fillStyle = '#9c8268'; for (let i = 0; i < 3; i++) ctx.fillRect(x - w * 1.7, y - h * k * (0.38 + i * 0.17), w * 3.4, w * 0.5);
      ctx.fillStyle = '#e2d2bb'; ctx.fillRect(x - w, y - h * k - w * 0.7, w * 2, w * 0.7);
      if (Math.sin(t * 2.2 + yaw) > 0.55) radial(ctx, x, y - h * k - w, w * 1.6, '#ff5a3a', 0.8, true);
    } });
    items.push(vap(-16, -2.2, 4.5), vap(-24, -2.0, 3.6), vap(28, -3.6, 6.5));
    // a giant skeleton half-buried in the sand
    items.push({ yaw: 112, pitch: -3.4, w: 16, draw(ctx, x, y, k) {
      ctx.strokeStyle = '#efe3c9'; ctx.lineCap = 'round';
      ctx.lineWidth = 0.35 * k; ctx.beginPath(); ctx.moveTo(x - 10 * k, y + 0.3 * k); ctx.quadraticCurveTo(x, y - 2.4 * k, x + 9.5 * k, y + 0.2 * k); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const u = i / 8, px = x - 8 * k + u * 16 * k, c = 1 - Math.abs(u - 0.45) * 1.6, top = y - (0.6 + 1.6 * c) * k, h = (1.6 + 3.2 * c) * k;
        ctx.lineWidth = (0.22 + 0.16 * c) * k;
        ctx.beginPath(); ctx.moveTo(px, top); ctx.quadraticCurveTo(px + 1.5 * k, top + h * 0.35, px + 0.9 * k, top + h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, top); ctx.quadraticCurveTo(px - 1.3 * k, top + h * 0.35, px - 0.7 * k, top + h * 0.92); ctx.stroke();
      }
      ctx.fillStyle = '#e8dbbe'; ctx.beginPath(); ctx.ellipse(x + 11.3 * k, y + 0.1 * k, 2.3 * k, 1.05 * k, -0.12, 0, TAU); ctx.fill();
      ctx.fillStyle = '#4f3322'; ctx.beginPath(); ctx.ellipse(x + 11.8 * k, y - 0.15 * k, 0.45 * k, 0.28 * k, 0, 0, TAU); ctx.fill();
    } });
    const rip = scatter(5, 70, (r) => [r() * 360, -12 - r() * 45, 2 + r() * 5]);
    return { start: { yaw: 2, pitch: 2 }, layers: [
      L.sky([[90, '#1c3462'], [50, '#34588c'], [22, '#7e92b3'], [9, '#dca577'], [3, '#f7c48a'], [-4, '#f0ad78']]),
      L.stars({ count: 70, minPitch: 38, alpha: 0.35, seed: 3 }),
      L.glow({ yaw: 186, pitch: 6, r: 70, color: '#ffb36b', alpha: 0.5 }),
      L.body({ yaw: 182, pitch: 7.2, r: 2.1, color: '#fff7df', glow: { r: 16, color: '#ffd28a', alpha: 0.85 }, limb: 0 }),
      L.body({ yaw: 189.5, pitch: 4.4, r: 1.55, color: '#ffdcaa', glow: { r: 11, color: '#ff9f5a', alpha: 0.75 }, limb: 0 }),
      L.body({ yaw: 318, pitch: 36, r: 1.3, color: '#ece5d6', alpha: 0.75, shade: { angle: 20, amount: 0.9 } }),
      L.ridge({ seed: 11, cells: 9, oct: 4, base: -0.5, amp: 7, mesa: [0.5, 0.6], fill: ['#9a7372', '#c3967b'], to: -12 }),
      L.plane(-1.0, [[-1.0, '#c88a58'], [-40, '#8a5232'], [-90, '#5a321d']]),
      L.ridge({ seed: 21, cells: 5, oct: 3, base: -1.8, amp: 3.4, fill: ['#e2a86f', '#b4744b'], rim: 'rgba(255,224,170,0.55)', to: -20 }),
      L.sprites(items),
      L.ridge({ seed: 31, cells: 4, oct: 3, base: -10, amp: 5.5, fill: ['#e7ac72', '#a8673e'], rim: 'rgba(255,226,176,0.6)' }),
      L.ridge({ seed: 41, cells: 3, oct: 3, base: -34, amp: 13, fill: ['#d99559', '#7a4528'], rim: 'rgba(255,220,170,0.5)' }),
      L.custom((ctx, v) => {
        ctx.strokeStyle = 'rgba(255,225,180,0.22)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (const [yw, p, len] of rip) { if (!v.vis(yw, len)) continue; const X = v.x(yw), Y = v.y(p), w = len * v.k; ctx.moveTo(X - w / 2, Y); ctx.quadraticCurveTo(X, Y - 0.4 * v.k, X + w / 2, Y); }
        ctx.stroke();
      }),
      L.particles({ type: 'dust', count: 45, color: '#f3cf9e', alpha: 0.35, wind: 40, fall: 4, sway: 3, size: 2 }),
    ] };
  }

  // ================================================================ HOTH
  function hoth() {
    const items = [];
    items.push({ yaw: 195, pitch: -4.5, w: 34, draw(ctx, x, y, k) {
      ctx.strokeStyle = '#5c6d80'; ctx.lineWidth = 0.35 * k; ctx.beginPath();
      for (let i = -30; i <= 30; i += 2) { const X = x + i * k, Y = y + Math.sin(i * 0.7) * 0.35 * k; if (i === -30) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
      ctx.stroke();
      ctx.fillStyle = '#e9eff6'; for (let i = -30; i <= 30; i += 1.6) { ctx.beginPath(); ctx.ellipse(x + i * k, y - 0.2 * k, 0.6 * k, 0.32 * k, 0, Math.PI, TAU); ctx.fill(); }
      const dx = x + 6 * k, dy = y - 0.6 * k;
      ctx.strokeStyle = '#4b5a6a'; ctx.lineWidth = 0.18 * k; ctx.beginPath(); ctx.moveTo(dx - 0.9 * k, dy); ctx.lineTo(dx, dy - 2.2 * k); ctx.lineTo(dx + 0.9 * k, dy); ctx.stroke();
      ctx.fillStyle = lin(ctx, dx - 2 * k, 0, dx + 2 * k, 0, ['#9aa9b8', '#e4ebf2', '#7e8d9c']); ctx.beginPath(); ctx.ellipse(dx, dy - 3 * k, 2.1 * k, 1.1 * k, -0.4, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(dx, dy - 3.05 * k, 2.1 * k, 0.35 * k, -0.4, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#3d4b5a'; ctx.fillRect(x - 12 * k, y - 1.6 * k, 2.6 * k, 1.4 * k); ctx.fillStyle = '#f4f8fc'; ctx.fillRect(x - 12.2 * k, y - 1.9 * k, 3 * k, 0.35 * k);
    } });
    items.push({ yaw: 302, pitch: -1.5, w: 16, draw(ctx, x, y, k) {
      ctx.fillStyle = lin(ctx, 0, y - 7.5 * k, 0, y, ['#f4f8fc', '#c9d7e5']);
      ctx.beginPath(); ctx.moveTo(x - 14 * k, y); ctx.lineTo(x - 11 * k, y - 6 * k); ctx.lineTo(x - 2 * k, y - 7.5 * k); ctx.lineTo(x + 9 * k, y - 6.4 * k); ctx.lineTo(x + 14 * k, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1f2b38'; ctx.beginPath(); ctx.moveTo(x - 4.2 * k, y); ctx.lineTo(x - 3.2 * k, y - 3.6 * k); ctx.lineTo(x + 3.2 * k, y - 3.6 * k); ctx.lineTo(x + 4.2 * k, y); ctx.closePath(); ctx.fill();
      radial(ctx, x, y - 1 * k, 4 * k, '#ffd9a0', 0.35, true);
      ctx.fillStyle = 'rgba(255,217,160,0.85)'; for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * 0.9 * k - 0.1 * k, y - 0.5 * k, 0.2 * k, 0.2 * k);
    } });
    return { start: { yaw: 322, pitch: 2 }, ambient: 'blizzard', layers: [
      L.sky([[90, '#58728f'], [45, '#88a0ba'], [15, '#b3c4d6'], [2, '#d3dfeb'], [-10, '#e3ebf3']]),
      L.glow({ yaw: 40, pitch: 20, r: 35, color: '#ffffff', alpha: 0.35 }),
      L.body({ yaw: 296, pitch: 30, r: 1.7, color: '#e3e9ef', alpha: 0.55, shade: { angle: 200, amount: 0.6 } }),
      L.body({ yaw: 309, pitch: 37, r: 1.0, color: '#d5dce4', alpha: 0.5, shade: { angle: 200, amount: 0.6 } }),
      L.body({ yaw: 288, pitch: 41, r: 0.7, color: '#cfd7e0', alpha: 0.45 }),
      L.ridge({ seed: 5, cells: 9, oct: 5, ridged: true, base: -0.5, amp: 14, fill: ['#ffffff', '#a9bccf', '#7891aa'] }),
      L.fog({ pitch: 1, h: 6, color: '#dfe8f1', alpha: 0.45 }),
      L.ridge({ seed: 15, cells: 6, oct: 4, ridged: true, base: -2.5, amp: 4.5, fill: ['#ffffff', '#d3dfeb'], rim: 'rgba(150,175,200,0.45)' }),
      L.plane(-2.5, [[-2.5, '#e5edf5'], [-30, '#f6f9fc'], [-90, '#dce6f0']]),
      L.sprites(items),
      L.custom((ctx, v) => {
        ctx.fillStyle = 'rgba(120,145,175,0.45)';
        for (let i = 0; i < 26; i++) {
          const u = i / 25, p = lerp(-40, -2.2, Math.pow(u, 0.5)), yw = 300 + (i % 2 ? 0.7 : -0.7) * (1 - u);
          if (!v.vis(yw, 2)) continue;
          const s = lerp(1.0, 0.12, u) * v.k; ctx.beginPath(); ctx.ellipse(v.x(yw), v.y(p), s * 0.6, s * 0.25, 0, 0, TAU); ctx.fill();
        }
      }),
      L.ridge({ seed: 25, cells: 3, oct: 3, base: -30, amp: 10, fill: ['#ffffff', '#dbe5ef'], rim: 'rgba(140,165,195,0.45)' }),
      L.particles({ type: 'snow', count: 260, color: '#ffffff', wind: 70, fall: 90, size: 3.2, alpha: 0.95, sway: 20 }),
      L.veil({ color: '#f2f6fa', alpha: 0.07, pulse: 0.6, speed: 0.5 }),
    ] };
  }

  // ================================================================ DAGOBAH
  function gnarled(ctx, x, y, k, s, col, t, seed) {
    const r = rng(seed), h = 18 * s * k, w = 1.6 * s * k, bend = (r() - 0.5) * 3 * s * k;
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const dir = i < 3 ? -1 : 1, spread = (1.5 + r() * 3.5) * s * k;
      ctx.lineWidth = w * (0.25 + r() * 0.2); ctx.beginPath(); ctx.moveTo(x + dir * w * 0.2, y - h * 0.18); ctx.quadraticCurveTo(x + dir * spread * 0.6, y - h * 0.12, x + dir * spread, y + 0.3 * s * k); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x - w * 0.6, y - h * 0.1); ctx.quadraticCurveTo(x - w * 0.4 + bend, y - h * 0.6, x - w * 0.2 + bend * 1.4, y - h);
    ctx.lineTo(x + w * 0.2 + bend * 1.4, y - h); ctx.quadraticCurveTo(x + w * 0.4 + bend, y - h * 0.6, x + w * 0.6, y - h * 0.1); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const by = y - h * (0.55 + r() * 0.4), dir = r() < 0.5 ? -1 : 1, len = (3 + r() * 5) * s * k;
      ctx.lineWidth = w * (0.12 + r() * 0.12); ctx.beginPath(); ctx.moveTo(x + bend * 1.2, by); ctx.quadraticCurveTo(x + bend + dir * len * 0.5, by - len * 0.5, x + bend + dir * len, by - len * 0.2 + r() * len * 0.3); ctx.stroke();
    }
    ctx.lineWidth = Math.max(1, 0.08 * s * k); ctx.strokeStyle = rgba(col, 0.75);
    for (let i = 0; i < 7; i++) {
      const mx = x + bend + (r() - 0.5) * 9 * s * k, my = y - h * (0.6 + r() * 0.35), ml = (1.5 + r() * 4) * s * k, sw = Math.sin(t * 0.8 + i) * 0.3 * s * k;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + sw, my + ml * 0.5, mx + sw * 1.5, my + ml); ctx.stroke();
    }
  }
  function dagobah() {
    const far = scatter(13, 24, (r) => ({ yaw: r() * 360, s: 0.35 + r() * 0.35, seed: Math.floor(r() * 1e6) }));
    const mid = [[40, 0.9], [95, 1.1], [150, 0.75], [215, 1.0], [262, 0.85], [328, 1.05]];
    const items = [];
    mid.forEach(([yaw, s], i) => items.push({ yaw, pitch: -0.8, w: 14, draw(ctx, x, y, k, t) { gnarled(ctx, x, y, k, s, '#33433a', t, 500 + i); } }));
    items.push({ yaw: 0, pitch: -1.2, w: 8, draw(ctx, x, y, k, t) {
      ctx.fillStyle = '#4a4031'; ctx.beginPath(); ctx.ellipse(x, y, 3.2 * k, 2.0 * k, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a3226'; ctx.beginPath(); ctx.ellipse(x + 2.4 * k, y, 1.4 * k, 1.1 * k, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      const fl = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
      radial(ctx, x - 0.6 * k, y - 1.0 * k, 3.5 * k, '#ffc66a', 0.45 * fl, true);
      ctx.fillStyle = rgba('#ffd27a', fl); ctx.beginPath(); ctx.ellipse(x - 0.6 * k, y - 1.0 * k, 0.45 * k, 0.4 * k, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1d1a14'; ctx.beginPath(); ctx.ellipse(x + 1.2 * k, y, 0.45 * k, 0.8 * k, 0, Math.PI, TAU); ctx.fill();
      for (let i = 0; i < 5; i++) { const ph = (t * 0.25 + i / 5) % 1; radial(ctx, x - 1.6 * k + Math.sin(ph * 6 + i) * 0.4 * k, y - (2.0 + ph * 5) * k, (0.4 + ph * 1.2) * k, '#9aa69c', 0.25 * (1 - ph)); }
      ctx.fillStyle = 'rgba(255,200,110,0.25)'; ctx.fillRect(x - 0.9 * k, y + 0.6 * k, 0.6 * k, 0.12 * k); ctx.fillRect(x - 0.8 * k, y + 1.0 * k, 0.4 * k, 0.1 * k);
    } });
    items.push({ yaw: 300, pitch: -1.6, w: 10, draw(ctx, x, y, k) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
      ctx.fillStyle = '#9a9f99'; ctx.fillRect(-0.5 * k, -5.5 * k, 1.3 * k, 6 * k);
      ctx.fillStyle = '#7f857f'; ctx.beginPath(); ctx.moveTo(0.8 * k, -4.6 * k); ctx.lineTo(5.2 * k, -6.4 * k); ctx.lineTo(5.4 * k, -5.6 * k); ctx.lineTo(0.8 * k, -3.6 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6f756f'; ctx.fillRect(4.2 * k, -6.9 * k, 1.8 * k, 0.6 * k);
      ctx.fillStyle = 'rgba(60,90,60,0.5)'; ctx.fillRect(-0.5 * k, -1.2 * k, 1.3 * k, 1.2 * k);
      ctx.restore();
      ctx.fillStyle = 'rgba(30,40,34,0.6)'; ctx.fillRect(x - 3 * k, y, 9 * k, 0.25 * k);
    } });
    items.push({ yaw: 178, pitch: -1.5, w: 22, draw(ctx, x, y, k, t) {
      ctx.fillStyle = '#1c2520';
      ctx.beginPath(); ctx.moveTo(x - 14 * k, y + 0.5 * k); ctx.quadraticCurveTo(x - 7 * k, y - 3 * k, x - 5 * k, y - 10 * k); ctx.lineTo(x - 3.5 * k, y - 34 * k);
      ctx.lineTo(x + 3.5 * k, y - 34 * k); ctx.lineTo(x + 5 * k, y - 10 * k); ctx.quadraticCurveTo(x + 7 * k, y - 3 * k, x + 14 * k, y + 0.5 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#050706'; ctx.beginPath(); ctx.ellipse(x, y - 0.2 * k, 3.4 * k, 3.2 * k, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      radial(ctx, x, y - 1.2 * k, 2.6 * k, '#2c4a5a', 0.25 + 0.1 * Math.sin(t * 0.7));
    } });
    const near = [[120, 3.0, 11], [236, 2.6, 12]];
    const vines = scatter(17, 40, (r) => [r() * 360, 6 + r() * 26, r() * TAU]);
    return { start: { yaw: 356, pitch: 3 }, layers: [
      L.sky([[90, '#16221d'], [40, '#2b3a33'], [10, '#4d6157'], [0, '#6b7f73']]),
      L.sprites(far.map((f) => ({ yaw: f.yaw, pitch: 0.6, w: 8, draw(ctx, x, y, k, t) { gnarled(ctx, x, y, k, f.s, '#5b6e63', t, f.seed); } }))),
      L.fog({ pitch: 2, h: 10, color: '#768b7f', alpha: 0.6 }),
      L.plane(0, [[0, '#5f7266'], [-12, '#34433b'], [-90, '#0e1411']]),
      L.shimmer({ top: -0.4, bottom: -40, count: 150, color: 'rgba(200,225,200,0.22)', seed: 9 }),
      L.sprites(items),
      L.fog({ pitch: -1, h: 3, color: '#8fa597', alpha: 0.35 }),
      L.ridge({ seed: 8, cells: 6, oct: 4, base: -44, amp: 15, fill: '#121915' }),
      L.sprites(near.map(([yaw, s, seed]) => ({ yaw, pitch: -12, w: 30, draw(ctx, x, y, k, t) { gnarled(ctx, x, y, k, s, '#121814', t, seed); } }))),
      L.custom((ctx, v) => {
        ctx.strokeStyle = 'rgba(24,36,28,0.85)'; ctx.lineCap = 'round';
        for (const [yw, len, ph] of vines) {
          if (!v.vis(yw, 3)) continue;
          const X = v.x(yw), sw = Math.sin(v.t * 0.6 + ph) * 0.5 * v.k, top = v.y(90), bot = v.y(80 - len);
          ctx.lineWidth = Math.max(1, 0.12 * v.k); ctx.beginPath(); ctx.moveTo(X, top); ctx.quadraticCurveTo(X + sw, (top + bot) / 2, X + sw * 2, bot); ctx.stroke();
        }
      }),
      L.particles({ type: 'firefly', count: 34, color: '#d8ff8a', size: 1.6, alpha: 0.9, add: true }),
    ] };
  }

  // ================================================================ BESPIN (Cloud City)
  function bespin() {
    const towers = scatter(31, 14, (r, i) => ({ yaw: (i < 7 ? 292 + i * 10 : 28 + (i - 7) * 10) + r() * 4, h: 8 + r() * 16, w: 1.2 + r() * 2.2, base: -11 - r() * 5, cap: r() < 0.5 }));
    const tower = (tw) => ({ yaw: tw.yaw, pitch: tw.base, w: 6, draw(ctx, x, y, k) {
      const w = tw.w * k, top = y - tw.h * k, sunRight = wrap180(10 - tw.yaw) > 0;
      ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, sunRight ? ['#2a1730', '#3d2240', '#e08a6a'] : ['#e08a6a', '#3d2240', '#2a1730']);
      ctx.fillRect(x - w / 2, top, w, tw.h * k);
      ctx.beginPath();
      if (tw.cap) ctx.ellipse(x, top, w / 2, w * 0.45, 0, Math.PI, TAU); else { ctx.moveTo(x - w / 2, top); ctx.lineTo(x, top - w * 1.2); ctx.lineTo(x + w / 2, top); }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,214,160,0.75)';
      for (let j = 1; j < tw.h * 1.2; j++) {
        if ((j * 7 + Math.round(tw.yaw)) % 3 === 0) continue;
        const ww = Math.max(1, w * 0.12), hh = Math.max(1, 0.18 * k);
        ctx.fillRect(x - w * 0.25, top + j * 0.8 * k, ww, hh); ctx.fillRect(x + w * 0.12, top + j * 0.8 * k + 0.3 * k, ww, hh);
      }
    } });
    return { start: { yaw: 4, pitch: 0 }, layers: [
      L.sky([[90, '#2b1d4a'], [50, '#5a3463'], [25, '#a8506a'], [10, '#ee8a62'], [2, '#ffc27e'], [-6, '#ffb07a'], [-25, '#c86a6a'], [-90, '#4a2546']]),
      L.stars({ count: 40, minPitch: 50, alpha: 0.4, seed: 8 }),
      L.glow({ yaw: 10, pitch: 3, r: 60, color: '#ff9a5a', alpha: 0.45 }),
      L.body({ yaw: 10, pitch: 3, r: 3.5, color: '#fff1c9', glow: { r: 30, color: '#ffb36a', alpha: 0.9 }, limb: 0 }),
      L.body({ yaw: 122, pitch: 30, r: 7, bands: ['#d9b38c', '#c98f6a', '#e8c9a0', '#b97b5c', '#e0bb93'], tilt: -12, shade: { angle: 200, amount: 0.75 }, ring: { tilt: -12, rx: 2.1, ry: 0.32, color: 'rgba(245,215,180,0.45)', width: 0.12 } }),
      L.ridge({ seed: 2, cells: 7, oct: 4, base: -4, amp: 5, puffy: 18, fill: ['#ffe0aa', '#e59a78', '#b9667a'], rim: 'rgba(255,240,200,0.6)' }),
      L.sprites([{ yaw: 200, pitch: 4, w: 14, draw(ctx, x, y, k, t) {
        const b = Math.sin(t * 0.4) * 0.15 * k;
        ctx.fillStyle = '#5b3456'; ctx.beginPath(); ctx.ellipse(x, y + b, 9 * k, 1.4 * k, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 1.2 * k, y + b); ctx.lineTo(x, y + 6 * k + b); ctx.lineTo(x + 1.2 * k, y + b); ctx.fill();
        ctx.fillStyle = '#6a3d60'; for (let i = -6; i <= 6; i += 1.5) { const hh = (3 - Math.abs(i) * 0.35) * k; ctx.fillRect(x + i * k - 0.4 * k, y - hh + b, 0.8 * k, hh); }
        ctx.fillStyle = 'rgba(255,220,170,0.7)'; for (let i = -7; i <= 7; i += 0.9) ctx.fillRect(x + i * k, y - 0.1 * k + b, Math.max(1, 0.15 * k), Math.max(1, 0.15 * k));
      } }]),
      L.sprites(towers.map(tower)),
      L.ridge({ seed: 12, cells: 6, oct: 4, base: -14, amp: 8, puffy: 14, fill: ['#f6b48a', '#c87a7c', '#7e4466'], rim: 'rgba(255,220,180,0.5)' }),
      L.traffic([{ pitch: 6, amp: 3, speed: 8, count: 9, color: '#ffe0b0', size: 1.6 }, { pitch: -3, amp: 2, speed: -12, count: 7, color: '#ffffff', size: 1.2 }]),
      L.custom((ctx, v) => {
        const yr = v.y(-15), yf = v.y(-21);
        if (yf < v.H) {
          ctx.fillStyle = lin(ctx, 0, yf, 0, v.y(-70), ['#4a2c48', '#24142a']); ctx.fillRect(0, yf, v.W, v.H - yf);
          ctx.fillStyle = 'rgba(255,170,120,0.18)'; ctx.fillRect(0, yf, v.W, Math.max(1, 0.4 * v.k));
        }
        ctx.fillStyle = '#2b1830';
        const s0 = Math.floor((v.yaw - v.hfov / 2) / 8) * 8;
        for (let a = s0; a <= v.yaw + v.hfov / 2 + 8; a += 8) { const X = v.W / 2 + (a - v.yaw) * v.k; ctx.fillRect(X - 0.25 * v.k, yr, 0.5 * v.k, yf - yr); }
        ctx.fillStyle = lin(ctx, 0, yr - 0.5 * v.k, 0, yr + 0.5 * v.k, ['#f2a37a', '#5a3050']); ctx.fillRect(0, yr - 0.4 * v.k, v.W, 0.8 * v.k);
        ctx.fillStyle = '#3a2040'; ctx.fillRect(0, v.y(-18), v.W, Math.max(1, 0.35 * v.k));
      }),
    ] };
  }

  // ================================================================ ENDOR
  function trunk(ctx, x, yb, yt, w, col, lit, k, seed) {
    ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [col, lit, col, '#1a100c']);
    ctx.beginPath(); ctx.moveTo(x - w / 2, yb); ctx.lineTo(x - w * 0.42, yt); ctx.lineTo(x + w * 0.42, yt); ctx.lineTo(x + w / 2, yb); ctx.closePath(); ctx.fill();
    const r = rng(seed); ctx.strokeStyle = 'rgba(20,10,6,0.35)'; ctx.lineWidth = Math.max(1, 0.06 * k); ctx.beginPath();
    for (let i = 0; i < 6; i++) { const u = r() - 0.5; ctx.moveTo(x + u * w * 0.8, yb); ctx.lineTo(x + u * w * 0.7, yt); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(70,110,50,0.35)'; for (let i = 0; i < 3; i++) { const py = lerp(yb, yt, r() * 0.6); ctx.fillRect(x - w / 2, py, w * (0.3 + r() * 0.3), (yt - yb) * -0.04); }
  }
  function endor() {
    const far = scatter(71, 80, (r) => [r() * 360, 0.8 + r() * 1.4]);
    const mid = scatter(72, 26, (r) => [r() * 360, 2 + r() * 2, Math.floor(r() * 1e6)]).filter((m) => Math.abs(wrap180(m[0])) > 18);
    mid.push([352, 3, 11], [10, 3.2, 12]);
    const nearT = [[330, 10, 21], [52, 8, 22], [118, 12, 23], [205, 9, 24], [262, 11, 25]];
    const canopy = LC.pfbm(7, 9, 4);
    const ferns = scatter(73, 40, (r) => [r() * 360, -16 - r() * 30, 1 + r() * 2, r() * TAU]);
    return { start: { yaw: 0, pitch: 12 }, layers: [
      L.sky([[90, '#a8d0e0'], [40, '#bcd8d2'], [10, '#9bb99b'], [0, '#8aa88c']]),
      L.body({ yaw: 28, pitch: 52, r: 11, bands: ['#c9d3e0', '#aab8cc', '#d8e0ea', '#9fb0c6', '#c4cfdc'], tilt: 15, shade: { angle: 200, amount: 0.6 }, alpha: 0.95 }),
      L.custom((ctx, v) => {
        ctx.fillStyle = 'rgba(122,154,138,0.6)';
        for (const [yw, w] of far) { if (!v.vis(yw, w)) continue; const X = v.x(yw); ctx.fillRect(X - (w * v.k) / 2, v.y(75), w * v.k, v.y(-2) - v.y(75)); }
      }),
      L.fog({ pitch: 4, h: 25, color: '#b5ccbf', alpha: 0.45 }),
      L.custom((ctx, v) => { for (const [yw, w, seed] of mid) { if (!v.vis(yw, w)) continue; trunk(ctx, v.x(yw), v.y(-6), v.y(85), w * v.k, '#5e4234', '#8a6450', v.k, seed); } }),
      L.sprites([{ yaw: 0, pitch: 18, w: 30, draw(ctx, x, y, k, t) {
        const plat = (dx, dy, rw) => {
          const px = x + dx * k, py = y + dy * k;
          ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.ellipse(px, py + 0.25 * k, rw * k, 0.7 * k, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = '#7a5636'; ctx.beginPath(); ctx.ellipse(px, py, rw * k, 0.6 * k, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#3a2416'; ctx.lineWidth = Math.max(1, 0.08 * k); ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(px + i * rw * 0.35 * k, py + 0.3 * k); ctx.lineTo(px + i * rw * 0.35 * k, py + 4 * k); } ctx.stroke();
          return [px, py];
        };
        const hut = (hx, hy, s) => {
          ctx.fillStyle = '#6e4e33'; ctx.fillRect(hx - 0.8 * s * k, hy - 1.1 * s * k, 1.6 * s * k, 1.1 * s * k);
          ctx.fillStyle = '#4e3522'; ctx.beginPath(); ctx.moveTo(hx - 1.1 * s * k, hy - 1.0 * s * k); ctx.lineTo(hx, hy - 2.6 * s * k); ctx.lineTo(hx + 1.1 * s * k, hy - 1.0 * s * k); ctx.closePath(); ctx.fill();
          const fl = 0.75 + 0.25 * Math.sin(t * 5 + hx);
          ctx.fillStyle = rgba('#ffc46a', fl); ctx.fillRect(hx - 0.25 * s * k, hy - 0.8 * s * k, 0.5 * s * k, 0.8 * s * k);
          radial(ctx, hx, hy - 0.5 * s * k, 1.6 * s * k, '#ffb050', 0.3 * fl, true);
        };
        const [ax, ay] = plat(-8, 0, 3.2), [bx, by] = plat(10, -3, 3.6);
        hut(ax - 1.4 * k, ay, 1); hut(ax + 1.3 * k, ay, 0.8); hut(bx - 1.2 * k, by, 1.1); hut(bx + 1.6 * k, by, 0.85);
        ctx.strokeStyle = '#5a3f2a'; ctx.lineWidth = Math.max(1, 0.12 * k);
        ctx.beginPath(); ctx.moveTo(ax + 3.2 * k, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 2.2 * k, bx - 3.6 * k, by); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax + 3.2 * k, ay - 0.9 * k); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 1.2 * k, bx - 3.6 * k, by - 0.9 * k); ctx.stroke();
        ctx.lineWidth = Math.max(1, 0.05 * k); ctx.beginPath();
        for (let i = 1; i < 10; i++) { const u = i / 10, p1 = qpt(ax + 3.2 * k, ay, (ax + bx) / 2, (ay + by) / 2 + 2.2 * k, bx - 3.6 * k, by, u), p2 = qpt(ax + 3.2 * k, ay - 0.9 * k, (ax + bx) / 2, (ay + by) / 2 + 1.2 * k, bx - 3.6 * k, by - 0.9 * k, u); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); }
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax - 2 * k, ay); ctx.lineTo(ax - 2.4 * k, ay + 16 * k); ctx.moveTo(ax - 1.4 * k, ay); ctx.lineTo(ax - 1.8 * k, ay + 16 * k); ctx.stroke();
      } }]),
      L.ridge({ up: true, fn: (yw) => 66 - 16 * canopy(yw / 360) + 22 * Math.exp(-Math.pow(wrap180(yw - 28) / 15, 2)), base: 50, amp: 20, fill: ['#0d1a10', '#244a2c'], gradTop: 90, gradBottom: 52, rim: 'rgba(160,210,140,0.35)' }),
      L.beams({ list: [[350, 5, 10], [18, 4, 14], [60, 6, 8], [130, 5, 12], [200, 4, 10], [282, 6, 14]], top: 62, bottom: -22, color: '#fff2c0', alpha: 0.14 }),
      L.plane(-3, [[-3, '#3c5a34'], [-30, '#22361d'], [-90, '#101a0c']]),
      L.ridge({ seed: 9, cells: 60, oct: 2, ridged: true, base: -14, amp: 7, fill: ['#5f8f4a', '#2c4a25'] }),
      L.custom((ctx, v) => {
        ctx.lineCap = 'round';
        for (const [yw, p, s, ph] of ferns) {
          if (!v.vis(yw, 8)) continue;
          const X = v.x(yw), Y = v.y(p), sw = Math.sin(v.t * 0.7 + ph) * 0.3;
          for (let i = 0; i < 7; i++) {
            const a = -Math.PI / 2 + (i - 3) * 0.32 + sw * 0.2, len = (3 + (3 - Math.abs(i - 3))) * s * v.k;
            const ex = X + Math.cos(a) * len, ey = Y + Math.sin(a) * len * 0.8;
            ctx.strokeStyle = i % 2 ? '#3d6b33' : '#4f8240'; ctx.lineWidth = Math.max(1, 0.2 * s * v.k);
            ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(X + Math.cos(a) * len * 0.6, Y + Math.sin(a) * len * 0.9, ex, ey + len * 0.25); ctx.stroke();
          }
        }
      }),
      L.custom((ctx, v) => { for (const [yw, w, seed] of nearT) { if (!v.vis(yw, w)) continue; trunk(ctx, v.x(yw), v.y(-90), v.y(90), w * v.k, '#3e271d', '#8a5a40', v.k, seed); } }),
      L.particles({ type: 'mote', count: 40, color: '#fff4c8', alpha: 0.6, size: 1.8, add: true }),
    ] };
  }

  // ================================================================ MUSTAFAR
  function lavaRiver(pts) {
    return L.custom((ctx, v) => {
      const sp = pts.map(([yw, p, w]) => [v.x(yw), v.y(p), w * v.k]);
      if (sp.every((s) => s[0] < -300) || sp.every((s) => s[0] > v.W + 300)) return;
      const stroke = (mul, color) => {
        ctx.strokeStyle = color;
        for (let i = 0; i < sp.length - 1; i++) {
          if (Math.abs(sp[i][0] - sp[i + 1][0]) > v.W) continue;
          ctx.lineWidth = ((sp[i][2] + sp[i + 1][2]) / 2) * mul; ctx.beginPath(); ctx.moveTo(sp[i][0], sp[i][1]); ctx.lineTo(sp[i + 1][0], sp[i + 1][1]); ctx.stroke();
        }
      };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter'; stroke(3.2, 'rgba(255,80,20,0.18)'); ctx.globalCompositeOperation = 'source-over';
      stroke(1, '#ff6a1f'); stroke(0.45, rgba('#ffd27a', 0.75 + 0.25 * Math.sin(v.t * 3)));
    });
  }
  function mustafar() {
    const cone = LC.pfbm(17, 12, 3);
    const items = [
      { yaw: 150, pitch: 0, w: 12, draw(ctx, x, y, k, t) {
        ctx.fillStyle = '#140807'; ctx.beginPath(); ctx.moveTo(x - 9 * k, y); ctx.lineTo(x - 7 * k, y - 8 * k); ctx.lineTo(x + 6 * k, y - 9 * k); ctx.lineTo(x + 9 * k, y); ctx.closePath(); ctx.fill();
        for (const [dx, w] of [[-3, 0.8], [0.5, 1.2], [3.5, 0.6]]) {
          const X = x + dx * k, top = y - 8.4 * k;
          ctx.fillStyle = lin(ctx, 0, top, 0, y, ['#ffd27a', '#ff7a2a', '#ff5a1f']); ctx.fillRect(X - (w * k) / 2, top, w * k, y - top);
          ctx.fillStyle = 'rgba(255,240,180,0.5)'; for (let i = 0; i < 6; i++) { const ph = (t * 0.6 + i / 6) % 1; ctx.fillRect(X - (w * k) / 4, top + ph * (y - top), (w * k) / 2, 0.5 * k); }
          radial(ctx, X, y, 3 * k, '#ff6a1f', 0.6, true);
        }
      } },
      { yaw: 318, pitch: -1, w: 18, draw(ctx, x, y, k, t) {
        ctx.strokeStyle = '#1a0d0c'; ctx.fillStyle = '#1a0d0c'; ctx.lineWidth = Math.max(1, 0.3 * k);
        ctx.fillRect(x - 1 * k, y - 10 * k, 2 * k, 10 * k);
        ctx.beginPath(); ctx.moveTo(x, y - 9 * k); ctx.lineTo(x + 14 * k, y - 6 * k); ctx.lineTo(x + 14 * k, y - 5.2 * k); ctx.lineTo(x, y - 8 * k); ctx.fill();
        for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2 * k, y - 8.5 * k + i * 0.43 * k); ctx.lineTo(x + (i + 1) * 2 * k, y - 6.8 * k + i * 0.43 * k); ctx.stroke(); }
        ctx.fillRect(x + 13 * k, y - 5.4 * k, 0.6 * k, 4.5 * k);
        if (Math.sin(t * 3) > 0) radial(ctx, x, y - 10.2 * k, 1 * k, '#ff3a2a', 0.9, true);
        radial(ctx, x + 13.3 * k, y - 0.8 * k, 3 * k, '#ff7a2a', 0.55, true);
      } },
    ];
    const drops = scatter(19, 26, (r) => [r() < 0.5 ? -1 : 1, 2 + r() * 5, 6 + r() * 7, r()]);
    return { start: { yaw: 358, pitch: 4 }, layers: [
      L.sky([[90, '#0b0406'], [45, '#1d0809'], [18, '#4a160f'], [5, '#a2361a'], [0, '#d8541f']]),
      L.glow({ yaw: 2, pitch: 8, r: 45, color: '#ff5a1f', alpha: 0.45, pulse: 0.15 }),
      L.glow({ yaw: 145, pitch: 5, r: 30, color: '#ff5a1f', alpha: 0.3 }),
      L.ridge({ seed: 13, cells: 8, oct: 4, ridged: true, base: 0, amp: 7, fill: '#170909', rim: 'rgba(255,110,50,0.5)' }),
      L.custom((ctx, v) => {
        if (!v.vis(2, 40)) return; const X = v.x(2);
        for (let i = 0; i < 14; i++) {
          const ph = (v.t * 0.05 + i / 14) % 1, p = 15.5 + ph * 40, sz = (2 + ph * 14) * v.k, dx = Math.sin(ph * 4 + i) * 3 * v.k + ph * 8 * v.k, Y = v.y(p);
          const g = ctx.createRadialGradient(X + dx, Y, 0, X + dx, Y, sz); g.addColorStop(0, rgba('#2a1512', 0.55 * (1 - ph))); g.addColorStop(1, rgba('#2a1512', 0));
          ctx.fillStyle = g; ctx.fillRect(X + dx - sz, Y - sz, 2 * sz, 2 * sz);
        }
      }),
      L.ridge({ fn: (yw) => { const d = Math.abs(wrap180(yw - 2)); return 0.5 + 15 * Math.pow(Math.max(0, 1 - d / 13), 1.35) + 1.2 * cone(yw / 360); }, base: 0, amp: 16, fill: ['#1a0a09', '#0f0606'], rim: 'rgba(255,120,60,0.6)', to: -6 }),
      L.glow({ yaw: 2, pitch: 15.5, r: 6, color: '#ffb050', alpha: 0.8, pulse: 0.3 }),
      L.custom((ctx, v) => {
        if (!v.vis(2, 12)) return; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffb050';
        for (const [dir, vx, vy, off] of drops) {
          const ph = (v.t * 0.7 + off) % 1, yw = 2 + dir * vx * ph, p = 15.5 + vy * ph - 14 * ph * ph;
          ctx.globalAlpha = 1 - ph; const s = Math.max(1.2, 0.25 * v.k); ctx.fillRect(v.x(yw) - s / 2, v.y(p) - s / 2, s, s);
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }),
      L.plane(0, [[0, '#2b120f'], [-20, '#170908'], [-90, '#070303']]),
      L.sprites(items),
      lavaRiver([[-3, -0.3, 0.25], [3, -1.2, 0.45], [-4, -3, 0.8], [5, -6.5, 1.4], [-6, -12, 2.4], [6, -22, 4], [-8, -38, 6.5], [2, -60, 9], [0, -89, 10]]),
      lavaRiver([[62, -0.5, 0.3], [70, -2, 0.6], [64, -5, 1.0], [78, -11, 1.8], [70, -20, 3], [88, -36, 5], [80, -60, 7]]),
      lavaRiver([[230, -0.4, 0.3], [222, -2.5, 0.7], [236, -7, 1.3], [225, -16, 2.6], [240, -32, 4.5]]),
      L.ridge({ seed: 21, cells: 5, oct: 4, base: -38, amp: 16, fill: ['#120706', '#050202'], rim: 'rgba(255,90,40,0.5)' }),
      L.particles({ type: 'ember', count: 100, color: '#ff8a3a', fall: 40, size: 2.2, add: true }),
      L.particles({ count: 70, color: '#6b5a55', fall: 18, wind: 10, size: 1.6, alpha: 0.5, seed: 4 }),
      L.veil({ color: '#ff5a1f', alpha: 0.05, pulse: 0.5, speed: 1.1 }),
    ] };
  }

  // ================================================================ FERRIX
  function ferrix() {
    const r = rng(404), pal = ['#8a5a43', '#9b6a4f', '#73503f', '#a07656', '#6a4a3c'];
    const blocks = [];
    const row = (from, to, base, hMin, hMax, scale) => {
      for (let yaw = from; yaw < to;) {
        const w = (3 + r() * 5) * scale;
        if (Math.abs(wrap180(yaw + w / 2)) > 5) blocks.push({ yaw: yaw + w / 2, w, base, h: hMin + r() * (hMax - hMin), col: pal[Math.floor(r() * pal.length)], roof: r(), chim: r() < 0.45, seed: Math.floor(r() * 1e6) });
        yaw += w + r() * 0.6;
      }
    };
    row(-80, 96, -3, 4, 13, 1); row(175, 262, -2, 3, 9, 0.8); row(266, 282, -2.5, 6, 11, 1);
    const building = (b) => ({ yaw: b.yaw, pitch: b.base, w: b.w, draw(ctx, x, y, k, t) {
      const w = b.w * k, h = b.h * k, top = y - h, rr = rng(b.seed);
      ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, [b.col, '#b98a6a', b.col]); ctx.fillRect(x - w / 2, top, w, h);
      if (b.roof < 0.4) { ctx.fillStyle = '#4a3328'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 0.2 * k, top); ctx.lineTo(x, top - w * 0.3); ctx.lineTo(x + w / 2 + 0.2 * k, top); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = '#5a3f32'; ctx.fillRect(x - w / 2 - 0.15 * k, top - 0.4 * k, w + 0.3 * k, 0.45 * k); }
      const cols = Math.max(1, Math.floor(b.w / 1.4)), rows = Math.max(1, Math.floor(b.h / 2.2));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows - 1; j++) {
        const lit = rr() < 0.18, wx = x - w / 2 + ((i + 0.5) / cols) * w, wy = top + (j + 0.6) * 2.2 * k;
        ctx.fillStyle = lit ? '#ffcf8a' : '#2a1d17'; ctx.fillRect(wx - 0.35 * k, wy, 0.7 * k, 1.0 * k);
      }
      ctx.fillStyle = '#24170f'; ctx.beginPath(); ctx.ellipse(x, y, 0.8 * k, 1.6 * k, 0, Math.PI, TAU); ctx.fill();
      if (b.chim) {
        const cx = x + w * 0.28; ctx.fillStyle = '#4a3328'; ctx.fillRect(cx - 0.3 * k, top - 2.2 * k, 0.6 * k, 2.2 * k);
        for (let i = 0; i < 4; i++) { const ph = (t * 0.18 + i / 4 + b.seed % 7) % 1; radial(ctx, cx + ph * 3 * k, top - (2.4 + ph * 6) * k, (0.5 + ph * 1.6) * k, '#7d7268', 0.35 * (1 - ph)); }
      }
    } });
    const crane = (yaw, h, jib, dir) => ({ yaw, pitch: -1.5, w: jib + 4, draw(ctx, x, y, k) {
      ctx.strokeStyle = '#3e322c'; ctx.lineWidth = Math.max(1, 0.16 * k); const top = y - h * k; ctx.beginPath();
      ctx.moveTo(x - 0.6 * k, y); ctx.lineTo(x - 0.6 * k, top); ctx.moveTo(x + 0.6 * k, y); ctx.lineTo(x + 0.6 * k, top);
      for (let yy = y; yy > top; yy -= 1.2 * k) { ctx.moveTo(x - 0.6 * k, yy); ctx.lineTo(x + 0.6 * k, yy - 1.2 * k); }
      ctx.moveTo(x - 2 * dir * k, top); ctx.lineTo(x + dir * jib * k, top); ctx.moveTo(x, top - 2 * k); ctx.lineTo(x + dir * jib * k, top); ctx.moveTo(x, top - 2 * k); ctx.lineTo(x - 2 * dir * k, top);
      ctx.moveTo(x + dir * jib * 0.8 * k, top); ctx.lineTo(x + dir * jib * 0.8 * k, top + h * 0.4 * k); ctx.stroke();
    } });
    const hulk = (yaw, s, col) => ({ yaw, pitch: -1, w: 14 * s, draw(ctx, x, y, k) {
      const w = 12 * s * k, h = 5 * s * k;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.45, y - h, x, y - h * 1.05); ctx.quadraticCurveTo(x + w * 0.4, y - h * 0.9, x + w / 2, y - h * 0.3); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(30,20,15,0.45)'; ctx.lineWidth = Math.max(1, 0.12 * k); ctx.beginPath();
      for (let i = -0.4; i <= 0.41; i += 0.1) { ctx.moveTo(x + i * w, y); ctx.lineTo(x + i * w * 0.9, y - h * (1 - Math.abs(i) * 1.2)); }
      ctx.stroke();
    } });
    const tower = { yaw: 0, pitch: -3, w: 6, draw(ctx, x, y, k, t) {
      const w = 4.2 * k, h = 24 * k, top = y - h;
      ctx.fillStyle = lin(ctx, x - w / 2, 0, x + w / 2, 0, ['#6a4334', '#a7735a', '#5a392c']); ctx.fillRect(x - w / 2, top, w, h);
      ctx.strokeStyle = 'rgba(40,25,18,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let yy = top + 0.8 * k; yy < y; yy += 0.8 * k) { ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); } ctx.stroke();
      const bt = top + 1.5 * k, bh = 6 * k;
      ctx.fillStyle = '#20150f'; ctx.beginPath(); ctx.moveTo(x - w * 0.36, bt + bh); ctx.lineTo(x - w * 0.36, bt + w * 0.36); ctx.arc(x, bt + w * 0.36, w * 0.36, Math.PI, TAU); ctx.lineTo(x + w * 0.36, bt + bh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = lin(ctx, x - w * 0.3, 0, x + w * 0.3, 0, ['#5a5550', '#c9c0b2', '#4a4540']);
      ctx.beginPath(); ctx.moveTo(x - w * 0.12, bt + 1.2 * k); ctx.lineTo(x + w * 0.12, bt + 1.2 * k); ctx.lineTo(x + w * 0.28, bt + 4.2 * k); ctx.lineTo(x - w * 0.28, bt + 4.2 * k); ctx.closePath(); ctx.fill();
      const since = t - (LC.bellAt == null ? -99 : LC.bellAt), swing = since >= 0 && since < 1.6 ? Math.sin(Math.min(1, since / 0.2) * Math.PI / 2) * Math.exp(-since * 2.2) : 0;
      ctx.save(); ctx.translate(x + w * 0.44, bt + 1.0 * k); ctx.rotate(-0.95 + swing * 0.95); ctx.fillStyle = '#2e2724'; ctx.fillRect(-0.15 * k, 0, 0.3 * k, 2.6 * k); ctx.fillRect(-0.6 * k, 2.4 * k, 1.2 * k, 0.7 * k); ctx.restore();
      if (since >= 0 && since < 0.8) radial(ctx, x, bt + 3 * k, 4 * k, '#ffe0a0', 0.35 * (1 - since / 0.8), true);
      ctx.fillStyle = '#4a3328'; ctx.beginPath(); ctx.moveTo(x - w * 0.62, top); ctx.lineTo(x, top - 2.5 * k); ctx.lineTo(x + w * 0.62, top); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d9b48a'; ctx.lineWidth = Math.max(1, 0.15 * k); ctx.beginPath(); ctx.arc(x, top + 10 * k, 1.1 * k, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#8a2c22'; ctx.fillRect(x - w * 0.5, top + 13 * k, w, 0.6 * k);
    } };
    const walkers = scatter(41, 9, (r) => ({ yaw: r() * 360, sp: (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.6), s: 0.8 + r() * 0.3, ph: r() * TAU }));
    return { start: { yaw: 0, pitch: 5 }, layers: [
      L.sky([[90, '#56636e'], [45, '#86888a'], [15, '#b4a48e'], [2, '#cbb59a']]),
      L.body({ yaw: 230, pitch: 24, r: 2.5, color: '#fff1d6', glow: { r: 22, color: '#f2d6a8', alpha: 0.45 }, limb: 0 }),
      L.ridge({ seed: 4, cells: 6, oct: 4, base: -0.5, amp: 4.5, fill: ['#8f7f70', '#a69684'], to: -6 }),
      L.fog({ pitch: 0.5, h: 5, color: '#c4b39b', alpha: 0.55 }),
      L.plane(-1.5, [[-1.5, '#7e6a5a'], [-25, '#5e4c40'], [-90, '#2c231d']]),
      L.sprites([crane(108, 16, 9, 1), crane(205, 19, 11, -1), crane(276, 14, 8, 1), hulk(125, 1.2, '#7d5a46'), hulk(158, 0.9, '#6a4c3c'), hulk(140, 0.7, '#8a6a52')]),
      L.custom((ctx, v) => { if (!v.vis(135, 40)) return; const y0 = v.y(-1.4), y1 = v.y(-3.4); ctx.fillStyle = '#6b5446'; for (let a = 100; a < 172; a += 0.5) { if (!v.vis(a, 1)) continue; ctx.fillRect(v.x(a), y0, 0.55 * v.k, y1 - y0); } }),
      L.sprites(blocks.map(building)),
      L.sprites([tower]),
      L.custom((ctx, v) => {
        ctx.strokeStyle = 'rgba(40,28,22,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let p = -4; p > -88; p -= Math.max(0.6, Math.abs(p) * 0.18)) { const Y = v.y(p); if (Y < 0 || Y > v.H) continue; ctx.moveTo(0, Y); ctx.lineTo(v.W, Y); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(30,20,15,0.5)'; ctx.lineWidth = 2;
        for (const c of [0, 180]) for (const s of [-1, 1]) { if (!v.vis(c, 45)) continue; path(ctx, v, [[c + s * 3, -3.2], [c + s * 40, -60]]); ctx.stroke(); }
      }),
      L.custom((ctx, v) => {
        ctx.fillStyle = '#2a1f19';
        for (const w of walkers) {
          const yaw = w.yaw + v.t * w.sp; if (!v.vis(yaw, 2)) continue;
          const X = v.x(yaw), Y = v.y(-3.6), s = w.s * v.k, bob = Math.abs(Math.sin(v.t * 4 + w.ph)) * 0.08 * s;
          ctx.beginPath(); ctx.arc(X, Y - 1.55 * s - bob, 0.22 * s, 0, TAU); ctx.fill();
          ctx.fillRect(X - 0.22 * s, Y - 1.35 * s - bob, 0.44 * s, 0.85 * s); ctx.fillRect(X - 0.18 * s, Y - 0.5 * s, 0.14 * s, 0.5 * s); ctx.fillRect(X + 0.04 * s, Y - 0.5 * s, 0.14 * s, 0.5 * s);
        }
      }),
      L.particles({ type: 'dust', count: 40, color: '#d8c2a0', alpha: 0.3, wind: 25, fall: 3, sway: 4, size: 2 }),
    ] };
  }

  // ================================================================ ALDHANI
  function aldhani() {
    const tufts = scatter(91, 70, (r) => [r() * 360, -18 - r() * 50, 0.6 + r() * 1.2]);
    return { start: { yaw: 8, pitch: 10 }, layers: [
      L.sky([[90, '#03050d'], [45, '#081127'], [15, '#132244'], [3, '#22345c'], [0, '#2c3f68']]),
      L.stars({ count: 520, minPitch: -1, twinkle: true, seed: 21, alpha: 0.9 }),
      L.glow({ yaw: 15, pitch: 45, r: 55, color: '#3f7cff', alpha: 0.16 }),
      L.glow({ yaw: 340, pitch: 60, r: 40, color: '#9b5cff', alpha: 0.12 }),
      L.glow({ yaw: 60, pitch: 30, r: 35, color: '#4fd0ff', alpha: 0.1 }),
      L.body({ yaw: 250, pitch: 28, r: 2.2, color: '#dfe6f2', shade: { angle: 160, amount: 0.9 }, glow: { r: 14, color: '#9fb8ff', alpha: 0.35 } }),
      L.meteors({ rate: 42, colors: ['#ffffff', '#bfe3ff', '#8fb8ff', '#ffd2f2', '#c6b3ff'], pMin: 6, pMax: 55, dir: 235, jitter: 18, speed: [35, 80], len: [12, 26] }),
      L.ridge({ seed: 6, cells: 7, oct: 5, ridged: true, base: -0.5, amp: 11, fill: ['#0d1830', '#0a1222'], rim: 'rgba(160,190,255,0.55)' }),
      L.ridge({ seed: 16, cells: 5, oct: 3, base: -2.5, amp: 6, fill: ['#101b2a', '#0b131e'], rim: 'rgba(120,150,220,0.25)' }),
      L.plane(-2.5, [[-2.5, '#0e1620'], [-40, '#090d12'], [-90, '#050709']]),
      L.custom((ctx, v) => {
        if (!v.vis(148, 35)) return;
        ctx.fillStyle = '#1a2a4a'; ctx.beginPath(); ctx.ellipse(v.x(148), v.y(-4.2), 26 * v.k, 1.6 * v.k, 0, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,190,255,0.25)';
        for (let i = 0; i < 30; i++) { const yw = 126 + i * 1.5, f = Math.sin(v.t * 2 + i); if (f < 0.3) continue; ctx.fillRect(v.x(yw), v.y(-4.2 + Math.sin(i * 7) * 0.9), 0.9 * v.k, 1); }
        ctx.globalCompositeOperation = 'source-over';
      }),
      L.sprites([
        { yaw: 200, pitch: -1.2, w: 16, draw(ctx, x, y, k) {
          const w = 12 * k, h = 4.5 * k;
          ctx.fillStyle = lin(ctx, 0, y - h, 0, y, ['#7c8698', '#4c5566']);
          ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.quadraticCurveTo(x, y - h - 0.9 * k, x + w / 2, y - h); ctx.lineTo(x + w * 0.42, y); ctx.lineTo(x - w * 0.42, y); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(30,36,48,0.6)'; ctx.lineWidth = 1; ctx.beginPath();
          for (let i = -5; i <= 5; i++) { ctx.moveTo(x + (i * w) / 12, y - h - 0.6 * k * (1 - Math.abs(i) / 6)); ctx.lineTo(x + (i * w) / 13, y); }
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,214,140,0.9)'; const d = Math.max(1, 0.15 * k);
          for (let i = -6; i <= 6; i++) ctx.fillRect(x + (i * w) / 13, y - h - 0.75 * k * (1 - (i / 6) * (i / 6)) - 0.1 * k, d, d);
          ctx.fillStyle = 'rgba(200,220,255,0.35)'; ctx.fillRect(x - 0.4 * k, y - h * 0.6, 0.8 * k, h * 0.6);
        } },
        { yaw: 30, pitch: -3.2, w: 12, draw(ctx, x, y, k, t) {
          ctx.fillStyle = '#1b2433';
          const bs = [[-6, 3, 1.6], [-2.5, 4, 2.2], [2, 3.5, 1.8], [6, 2.5, 1.4]];
          for (const [dx, w, h] of bs) {
            ctx.fillRect(x + dx * k - (w * k) / 2, y - h * k, w * k, h * k);
            ctx.fillStyle = '#ffd38a'; for (let i = 0; i < w * 1.5; i++) ctx.fillRect(x + dx * k - (w * k) / 2 + (i + 0.3) * 0.6 * k, y - h * k * 0.6, Math.max(1, 0.2 * k), Math.max(1, 0.2 * k));
            ctx.fillStyle = '#1b2433';
          }
          ctx.fillRect(x + 8.5 * k, y - 7 * k, 0.5 * k, 7 * k);
          if (Math.sin(t * 2.5) > 0.2) radial(ctx, x + 8.75 * k, y - 7.2 * k, 1.1 * k, '#ff3a3a', 0.9, true);
          ctx.fillStyle = '#2a3446'; ctx.beginPath(); ctx.ellipse(x - 12 * k, y, 3.5 * k, 0.5 * k, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(140,200,255,0.8)'; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.fillRect(x - 12 * k + Math.cos(a) * 3.2 * k, y + Math.sin(a) * 0.45 * k, Math.max(1, 0.15 * k), Math.max(1, 0.15 * k)); }
        } },
      ]),
      L.ridge({ seed: 26, cells: 5, oct: 4, base: -30, amp: 12, fill: ['#161b22', '#07090c'], rim: 'rgba(130,160,230,0.18)' }),
      L.custom((ctx, v) => {
        ctx.strokeStyle = 'rgba(40,48,58,0.9)'; ctx.lineCap = 'round';
        for (const [yw, p, s] of tufts) {
          if (!v.vis(yw, 3)) continue; const X = v.x(yw), Y = v.y(p); ctx.lineWidth = Math.max(1, 0.1 * s * v.k); ctx.beginPath();
          for (let i = -2; i <= 2; i++) { ctx.moveTo(X + i * 0.3 * s * v.k, Y); ctx.lineTo(X + i * 0.6 * s * v.k + Math.sin(v.t + yw) * 0.2 * v.k, Y - (1.4 - Math.abs(i) * 0.25) * s * v.k); }
          ctx.stroke();
        }
      }),
    ] };
  }

  // ================================================================ MANDALORE
  function brokenDome(ctx, x, y, R, a0, a1, jag) {
    ctx.beginPath(); ctx.moveTo(x - R, y);
    ctx.arc(x, y, R, Math.PI, Math.PI + a0);
    const ax = x + Math.cos(Math.PI + a0) * R, ay = y + Math.sin(Math.PI + a0) * R, bx = x + Math.cos(Math.PI + a1) * R, by = y + Math.sin(Math.PI + a1) * R;
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + R * jag;
    ctx.lineTo(lerp(ax, mx, 0.5) + R * 0.05, lerp(ay, my, 0.5) - R * 0.04); ctx.lineTo(mx, my); ctx.lineTo(lerp(mx, bx, 0.5) - R * 0.06, lerp(my, by, 0.5) + R * 0.03); ctx.lineTo(bx, by);
    ctx.arc(x, y, R, Math.PI + a1, TAU); ctx.closePath();
  }
  function mandalore() {
    const r = rng(77);
    const far = [], mid = [];
    for (let i = 0; i < 22; i++) far.push({ yaw: (i < 12 ? -70 + i * 12 : 150 + (i - 12) * 8) + r() * 5, kind: r() < 0.55 ? 'dome' : 'spire', s: 0.6 + r() * 0.9, a0: 0.4 + r() * 0.8, a1: 1.6 + r() * 0.9, jag: 0.25 + r() * 0.4 });
    for (let i = 0; i < 7; i++) mid.push({ yaw: [325, 20, 48, 95, 250, 280, 140][i] + r() * 6, s: 1.6 + r() * 1.4, a0: 0.5 + r() * 0.6, a1: 1.7 + r() * 0.8, jag: 0.3 + r() * 0.3 });
    const cracks = scatter(55, 26, (rr) => { const pts = []; let yw = rr() * 360, p = -4 - rr() * 40; for (let j = 0; j < 7; j++) { pts.push([yw, p]); yw += (rr() - 0.5) * 6; p -= 1 + rr() * 5; } return pts; });
    const shards = scatter(56, 9, (rr) => ({ yaw: rr() * 360, p: -26 - rr() * 22, s: 2 + rr() * 3, a: rr() * TAU }));
    const drawRuin = (ctx, o, col, edge, k, x, y) => {
      ctx.fillStyle = col; ctx.strokeStyle = edge;
      if (o.kind === 'spire') {
        const h = 10 * o.s * k, w = 1.4 * o.s * k;
        ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w * 0.3, y - h); ctx.lineTo(x - w * 0.05, y - h * 0.88); ctx.lineTo(x + w * 0.12, y - h * 0.97); ctx.lineTo(x + w / 2, y); ctx.closePath();
        ctx.fill(); ctx.lineWidth = 1; ctx.stroke(); return;
      }
      const R = 5 * o.s * k; brokenDome(ctx, x, y, R, o.a0, o.a1, o.jag); ctx.fill();
      ctx.lineWidth = Math.max(1, 0.08 * k); ctx.beginPath();
      for (let a = o.a0; a < o.a1; a += 0.25) { ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(Math.PI + a) * R, y + Math.sin(Math.PI + a) * R); }
      ctx.stroke();
    };
    const ruins = (list, pitch, col, edge) => L.sprites(list.map((o) => ({ yaw: o.yaw, pitch, w: 12 * (o.s || 1), draw(ctx, x, y, k) { drawRuin(ctx, o, col, edge, k, x, y); } })));
    return { start: { yaw: 0, pitch: 3 }, layers: [
      L.sky([[90, '#081011'], [45, '#122021'], [15, '#2a3f3d'], [2, '#4b665f'], [0, '#55716a']]),
      L.stars({ count: 80, minPitch: 40, alpha: 0.25, seed: 31 }),
      L.body({ yaw: 60, pitch: 16, r: 2, color: '#e3f4ec', glow: { r: 26, color: '#7fb8a8', alpha: 0.4 }, limb: 0 }),
      ruins(far.map((f) => Object.assign({}, f, { s: f.s * 0.7 })), 0.2, '#2b403f', 'rgba(130,180,170,0.15)'),
      L.fog({ pitch: 1, h: 7, color: '#55716a', alpha: 0.5 }),
      L.plane(0, [[0, '#3d5a55'], [-5, '#1c2d2c'], [-30, '#0e1819'], [-90, '#060b0c']]),
      L.fog({ pitch: -1, h: 5, color: '#4b665f', alpha: 0.35 }),
      L.custom((ctx, v) => {
        if (!v.vis(60, 10)) return; const X = v.x(60), y0 = v.y(0), y1 = v.y(-45), w = 4 * v.k;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(207,233,223,0.3)'); g.addColorStop(1, 'rgba(207,233,223,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X - w * 0.3, y0); ctx.lineTo(X + w * 0.3, y0); ctx.lineTo(X + w, y1); ctx.lineTo(X - w, y1); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }),
      ruins(mid.map((m) => Object.assign({ kind: 'dome' }, m)), -1.5, '#162324', 'rgba(140,200,185,0.25)'),
      { draw(ctx, v) {
        if (!v.vis(180, 16)) return; const x = v.x(180), y = v.y(-1), k = v.k;
        ctx.fillStyle = '#1b2a2b';
        ctx.beginPath(); ctx.moveTo(x - 9 * k, y); ctx.lineTo(x - 9 * k, y - 12 * k); ctx.quadraticCurveTo(x - 8 * k, y - 19 * k, x - 1 * k, y - 20 * k); ctx.lineTo(x - 0.5 * k, y - 17.5 * k); ctx.quadraticCurveTo(x - 6 * k, y - 16.5 * k, x - 6.5 * k, y - 11 * k); ctx.lineTo(x - 6.5 * k, y); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 9 * k, y); ctx.lineTo(x + 9 * k, y - 13 * k); ctx.lineTo(x + 7.5 * k, y - 15.5 * k); ctx.lineTo(x + 6.5 * k, y - 12 * k); ctx.lineTo(x + 6.5 * k, y); ctx.closePath(); ctx.fill();
        radial(ctx, x, y - 3 * k, 6 * k, '#4fd8c8', 0.18 + 0.08 * Math.sin(v.t * 0.9), true);
      } },
      L.custom((ctx, v) => {
        ctx.strokeStyle = 'rgba(170,225,210,0.28)'; ctx.lineWidth = 1;
        for (const pts of cracks) { if (!v.vis(pts[0][0], 20)) continue; path(ctx, v, pts); ctx.stroke(); }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < cracks.length; i++) { const [yw, p] = cracks[i][2]; if (!v.vis(yw, 1)) continue; const a = 0.5 + 0.5 * Math.sin(v.t * 1.7 + i * 2.1); if (a > 0.8) radial(ctx, v.x(yw), v.y(p), 0.9 * v.k, '#cff5ea', (a - 0.8) * 4); }
        ctx.globalCompositeOperation = 'source-over';
      }),
      L.custom((ctx, v) => {
        for (const s of shards) {
          if (!v.vis(s.yaw, s.s * 2)) continue; const X = v.x(s.yaw), Y = v.y(s.p), R = s.s * v.k;
          ctx.fillStyle = '#0b1415'; ctx.beginPath();
          for (let i = 0; i < 4; i++) { const a = s.a + (i / 4) * TAU + (i % 2) * 0.4, rr = R * (i % 2 ? 0.45 : 1); const px = X + Math.cos(a) * rr * 1.6, py = Y + Math.sin(a) * rr * 0.35; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(143,208,192,0.45)'; ctx.stroke();
        }
      }),
      L.particles({ count: 50, color: '#9fb9b0', fall: 8, wind: 12, size: 1.5, alpha: 0.35, seed: 6 }),
    ] };
  }

  // ================================================================ SCARIF
  function palm(ctx, x, y, k, h, lean, t, seed) {
    const r = rng(seed), H = h * k, sc = h / 30, sw = Math.sin(t * 0.9 + seed) * 0.6 * k * sc, topX = x + lean * k + sw, topY = y - H;
    const c1x = x + lean * 0.2 * k, c1y = y - H * 0.6;
    ctx.strokeStyle = '#8b6a49'; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const p0 = qpt(x, y, c1x, c1y, topX, topY, i / 12), p1 = qpt(x, y, c1x, c1y, topX, topY, (i + 1) / 12);
      ctx.lineWidth = lerp(1.1, 0.55, i / 12) * k * sc; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + r() * 0.3, len = (h * 0.36 + r() * h * 0.1) * k, dx = Math.cos(a) * len;
      const ex = topX + dx, ey = topY + (0.3 + 0.25 * Math.abs(Math.sin(a))) * len * 0.75 - Math.sin(a) * len * 0.12;
      const cx = topX + dx * 0.5, cy = topY - len * 0.22 - Math.sin(a) * len * 0.1;
      ctx.strokeStyle = i % 2 ? '#2f7a3a' : '#3f9a48'; ctx.lineWidth = Math.max(1, 0.45 * k * sc);
      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
      ctx.lineWidth = Math.max(1, 0.16 * k * sc); ctx.beginPath();
      for (let j = 1; j < 10; j++) {
        const u = j / 10, p = qpt(topX, topY, cx, cy, ex, ey, u), ll = ((1 - u) * 0.28 + 0.05) * len;
        ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a + 1.2) * ll * 0.4, p[1] + ll * 0.5);
        ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a - 1.2) * ll * 0.4, p[1] + ll * 0.5);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#5a4128'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(topX + (i - 1) * 0.5 * k * sc, topY + 0.5 * k * sc, 0.35 * k * sc, 0, TAU); ctx.fill(); }
  }
  function cloud(ctx, x, y, k, s, seed) {
    const r = rng(seed);
    for (let i = 0; i < 7; i++) {
      const cx = x + (r() - 0.5) * 8 * s * k, cy = y - r() * 1.6 * s * k, rr = (1.2 + r() * 1.8) * s * k;
      const g = ctx.createRadialGradient(cx, cy - rr * 0.3, rr * 0.1, cx, cy, rr);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(240,248,255,0.8)'); g.addColorStop(1, 'rgba(220,235,250,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill();
    }
  }
  function scarif() {
    const clouds = scatter(61, 12, (r) => ({ yaw: r() * 360, p: 7 + r() * 15, s: 0.8 + r() * 1.2, seed: Math.floor(r() * 1e6) }));
    const islet = (yaw, w) => ({ yaw, pitch: 0, w: w + 2, draw(ctx, x, y, k) {
      ctx.fillStyle = '#e9dcb6'; ctx.beginPath(); ctx.ellipse(x, y, w * k, 0.35 * k, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#3f7d4a'; ctx.beginPath(); ctx.ellipse(x, y - 0.1 * k, w * 0.7 * k, 0.6 * k, 0, Math.PI, TAU); ctx.fill();
      for (let i = -2; i <= 2; i++) {
        const px = x + i * w * 0.25 * k; ctx.strokeStyle = '#5a4a36'; ctx.lineWidth = Math.max(1, 0.06 * k); ctx.beginPath(); ctx.moveTo(px, y - 0.4 * k); ctx.lineTo(px + 0.1 * k, y - 1.5 * k); ctx.stroke();
        ctx.fillStyle = '#2f6a38'; ctx.beginPath(); ctx.ellipse(px + 0.1 * k, y - 1.5 * k, 0.5 * k, 0.18 * k, 0, 0, TAU); ctx.fill();
      }
    } });
    const r = rng(12), ev = []; let acc = 0;
    const wet = L.ridge({ seed: 9, cells: 4, oct: 3, base: -21.5, amp: 6, fill: '#cdb78a' });
    const nearPalms = [[335, 32, -4, 1], [24, 28, 5, 2], [152, 30, -6, 3], [206, 34, 4, 4]], midPalms = [[70, 9, 1, 5], [78, 7, -1, 6], [258, 8, 1, 7]];
    return { start: { yaw: 0, pitch: 6 }, layers: [
      L.sky([[90, '#1c5fb0'], [45, '#3c8ad4'], [15, '#86c1ec'], [3, '#d2ecf8'], [0, '#e6f5fb']]),
      L.body({ yaw: 300, pitch: 42, r: 2.4, color: '#fffdf0', glow: { r: 30, color: '#fff2c0', alpha: 0.55 }, limb: 0 }),
      L.custom((ctx, v) => {
        const yB = v.y(26); if (yB < 0) return;
        const yTop = Math.max(0, v.y(90)), a = 3 * v.k;
        ctx.save(); ctx.beginPath(); ctx.rect(0, yTop, v.W, yB - yTop); ctx.clip();
        const g = ctx.createLinearGradient(0, yB, 0, v.y(60)); g.addColorStop(0, 'rgba(190,230,255,0)'); g.addColorStop(1, 'rgba(190,230,255,' + (0.18 + 0.05 * Math.sin(v.t * 1.5)) + ')');
        ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath();
        const c0 = Math.floor((v.yaw - v.hfov / 2) / 4.5) - 1, c1 = Math.ceil((v.yaw + v.hfov / 2) / 4.5) + 1;
        for (let c = c0; c <= c1; c++) {
          const X = v.W / 2 + (c * 4.5 - v.yaw) * v.k;
          for (let rr = 0; rr < 14; rr++) {
            const pC = 26 + rr * 5.196 + (c & 1 ? 2.598 : 0); if (pC > 92) break;
            const Y = v.y(pC);
            for (let kk = 0; kk < 6; kk++) { const ang = (kk / 6) * TAU, px = X + Math.cos(ang) * a, py = Y + Math.sin(ang) * a; if (kk) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
            ctx.closePath();
          }
        }
        ctx.stroke(); ctx.restore();
      }),
      L.sprites(clouds.map((c) => ({ yaw: c.yaw, pitch: c.p, w: 10 * c.s, draw(ctx, x, y, k, t) { cloud(ctx, x + Math.sin(t * 0.05 + c.seed) * 2 * k, y, k, c.s, c.seed); } }))),
      L.custom((ctx, v) => {
        acc += v.dt * 2.2;
        while (acc > 1) { acc -= 1; const kind = r() < 0.55 ? 'flash' : 'bolt'; ev.push({ kind, yaw: lerp(70, 160, r()), p: lerp(14, 34, r()), age: 0, life: kind === 'flash' ? 0.7 : 0.45, dir: r() < 0.5 ? -1 : 1, col: r() < 0.5 ? '#ff5a4a' : '#7cff8a', s: 0.6 + r() }); }
        for (let i = ev.length - 1; i >= 0; i--) {
          const e = ev[i]; e.age += v.dt; if (e.age > e.life) { ev.splice(i, 1); continue; }
          if (!v.vis(e.yaw, 6)) continue; const X = v.x(e.yaw), Y = v.y(e.p), u = e.age / e.life;
          if (e.kind === 'flash') { radial(ctx, X, Y, (0.6 + u * 2.2) * e.s * v.k, '#ffd9a0', 0.9 * (1 - u), true); radial(ctx, X, Y, 0.4 * e.s * v.k, '#ffffff', 1 - u, true); }
          else { const dx = e.dir * (2 + u * 6) * v.k; ctx.strokeStyle = rgba(e.col, 1 - u); ctx.lineWidth = Math.max(1, 0.12 * v.k); ctx.beginPath(); ctx.moveTo(X + dx, Y - u * 1.5 * v.k); ctx.lineTo(X + dx + e.dir * 1.6 * v.k, Y - u * 1.5 * v.k - 0.3 * v.k); ctx.stroke(); }
        }
      }),
      L.plane(0, [[0, '#1f6fae'], [-3, '#2690c0'], [-9, '#2fb4c8'], [-18, '#55d3cc'], [-90, '#8eeedd']]),
      L.sprites([islet(40, 4), islet(250, 3), islet(285, 5), islet(75, 6)]),
      L.sprites(midPalms.map(([yaw, h, lean, seed]) => ({ yaw, pitch: -0.2, w: 6, draw(ctx, x, y, k, t) { palm(ctx, x, y, k, h, lean, t, seed); } }))),
      L.sprites([{ yaw: 112, pitch: 0.2, w: 8, draw(ctx, x, y, k, t) {
        const h = 26 * k, w = 1.3 * k;
        ctx.fillStyle = lin(ctx, x - w, 0, x + w, 0, ['#9aa3ad', '#e3e8ec', '#8a939c']);
        ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.6, y - h); ctx.lineTo(x + w * 0.6, y - h); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c9d0d6'; ctx.beginPath(); ctx.ellipse(x, y - h - 0.6 * k, 3.4 * k, 1.2 * k, 0, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#eef2f5'; ctx.beginPath(); ctx.ellipse(x, y - h - 0.6 * k, 3.4 * k, 0.5 * k, 0, Math.PI, TAU); ctx.fill();
        ctx.strokeStyle = '#7c868f'; ctx.lineWidth = Math.max(1, 0.1 * k); ctx.beginPath(); ctx.moveTo(x, y - h - 0.6 * k); ctx.lineTo(x, y - h - 3.2 * k); ctx.stroke();
        if (Math.sin(t * 2.5) > 0.3) radial(ctx, x, y - h - 3.3 * k, 0.9 * k, '#ff4a3a', 0.9, true);
        ctx.fillStyle = '#aeb6be'; ctx.fillRect(x - 3 * k, y - 1.2 * k, 6 * k, 0.6 * k); ctx.fillRect(x + w, y - h * 0.55, 2.2 * k, 0.35 * k);
      } }]),
      L.shimmer({ top: -0.5, bottom: -19, count: 170, color: 'rgba(255,255,255,0.55)', seed: 4 }),
      wet,
      L.custom((ctx, v) => {
        const step = 4 / v.k, a = v.yaw - v.hfov / 2 - step, b = v.yaw + v.hfov / 2 + step, off = 0.35 + 0.7 * (0.5 + 0.5 * Math.sin(v.t * 0.8));
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.2, 0.18 * v.k); ctx.beginPath();
        for (let yw = a; yw <= b; yw += step) { const X = v.W / 2 + (yw - v.yaw) * v.k, Y = v.y(wet.fn(yw) + off); if (yw === a) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
        ctx.stroke();
      }),
      L.ridge({ seed: 9, cells: 4, oct: 3, base: -24.5, amp: 6, fill: ['#f6ead0', '#e2cd9f'] }),
      L.sprites(nearPalms.map(([yaw, h, lean, seed]) => ({ yaw, pitch: -30, w: 24, draw(ctx, x, y, k, t) { palm(ctx, x, y, k, h, lean, t, seed); } }))),
    ] };
  }

  LC.SCENES = { tatooine, hoth, dagobah, bespin, endor, mustafar, ferrix, aldhani, mandalore, scarif };
})();
