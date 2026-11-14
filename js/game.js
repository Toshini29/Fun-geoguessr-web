/* Luthen's Coordinates: game flow and UI. */
(function () {
  'use strict';
  const LC = window.LC, CFG = window.MISSION_CONFIG || {}, W = LC.WORLDS, Sfx = LC.Sfx, clamp = LC.util.clamp;
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const pad = (n) => String(n).padStart(2, '0');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const NAME = CFG.agentName || 'Agent', TOTAL = W.rounds.length, MAX = TOTAL * 5000, HINT_COST = 500, KEY = 'lc-space-v1';

  // ---------------------------------------------------------------- state
  const fresh = () => ({ round: 0, hints: 0, results: [] });
  let st = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.results)) return s; } catch (_) {} return fresh(); })();
  const testing = /[?&](scene|orbit)=/.test(location.search);
  const save = () => { if (testing) return; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) {} };
  const total = () => st.results.reduce((a, r) => a + r.pts, 0);
  const rank = (t) => { const r = t / MAX; return r >= 0.9 ? 'Fulcrum' : r >= 0.75 ? 'Spymaster' : r >= 0.6 ? 'Pathfinder' : r >= 0.4 ? 'Field agent' : r >= 0.2 ? 'Informant' : 'Recruit'; };

  // ---------------------------------------------------------------- stage + galaxy
  const stage = new LC.Stage($('#stage'));
  const galaxy = LC.renderGalaxy(Math.min(1400, Math.max(1000, Math.round(Math.max(innerWidth, innerHeight) * 1.1))), 42);
  const galaxyView = new LC.GalaxyView(galaxy);
  stage.show(galaxyView);
  const nav = new LC.NavMap($('#navmap'), W.all, galaxy, () => { Sfx.select(); updateSel(); });

  const panels = ['boot', 'title', 'orbit', 'surface', 'intel', 'nav', 'result', 'final'];
  function show(...ids) { for (const p of panels) $('#' + p).hidden = !ids.includes(p); }

  // ---------------------------------------------------------------- sound toggle
  const ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function syncSound() { document.querySelectorAll('.sound-btn').forEach((b) => { b.innerHTML = Sfx.muted ? ICON_OFF : ICON_ON; b.setAttribute('aria-label', Sfx.muted ? 'Turn sound on' : 'Turn sound off'); }); }
  document.querySelectorAll('.sound-btn').forEach((b) => (b.onclick = () => { Sfx.init(); Sfx.setMuted(!Sfx.muted); syncSound(); }));
  syncSound();

  // ---------------------------------------------------------------- boot
  const bootLines = [
    '> establishing relay ....................... OK', '> routing through 4 dead drops ............. OK', '> source ....................... [REDACTED]', '',
    '> recipient: AGENT ' + NAME.toUpperCase(), '> new assignment: LUTHEN RAEL.', '> antiques dealer. Coruscant. probably not just antiques.', '> ' + TOTAL + ' sightings intercepted. names scrubbed.', '> follow the trail. find out who he really is.',
  ];
  let bootDone = false;
  async function runBoot() {
    const el = $('#boot-text'); let out = '';
    for (const line of bootLines) {
      for (const ch of line) { if (bootDone) return; out += ch; el.textContent = out; await sleep(line.includes('....') ? 6 : 20); }
      out += '\n'; await sleep(150);
    }
    finishBoot();
  }
  function finishBoot() { if (bootDone) return; bootDone = true; $('#boot-text').textContent = bootLines.join('\n'); $('#boot-accept').hidden = false; $('#boot-accept').focus(); }
  function accept() { Sfx.init(); Sfx.blip(); showTitle(); }
  $('#boot-skip').onclick = () => { finishBoot(); accept(); };
  $('#boot-accept').onclick = accept;

  // ---------------------------------------------------------------- title
  function showTitle() {
    show('title'); stage.paused = false; stage.show(galaxyView); Sfx.ambient(null); stopBell();
    $('#title-lead').textContent = 'Agent ' + NAME + ', you have been assigned to track Luthen Rael. He has been sighted on ' + TOTAL + ' worlds, but every report has the planet name scrubbed out. Jump to each sighting, look around, and tell the navicomputer where he was.';
    const mid = st.round > 0 && st.round < TOTAL, done = st.round >= TOTAL;
    $('#btn-start').textContent = done ? 'See your final report' : mid ? 'Continue: transmission ' + (st.round + 1) + ' of ' + TOTAL : 'Begin mission';
    $('#btn-restart').hidden = !(mid || done);
  }
  $('#btn-start').onclick = () => { Sfx.init(); if (st.round >= TOTAL) showFinal(); else startRound(); };
  $('#btn-restart').onclick = () => { if (!confirm('Start over? Your score will be wiped.')) return; st = fresh(); save(); startRound(); };

  // ---------------------------------------------------------------- a round: jump -> orbit -> surface
  let cur = null, orbit = null, bellTimer = null, bellTimeout = null;
  function startRound() {
    cur = W.byId[W.rounds[st.round]]; save(); stopBell();
    show(); stage.paused = false; Sfx.ambient(null); Sfx.jump(2.2);
    orbit = new LC.Orbit(cur.planet); let flashed = false;
    stage.show(new LC.Hyper({ dur: 2.2,
      tick: (p) => { orbit.gen(12); if (p > 0.84 && !flashed) { flashed = true; stage.fade('#e6eeff', 0, 1, 0.35); } },
      done: () => { orbit.finish(); stage.show(orbit); stage.fade('#e6eeff', 1, 0, 0.9); showOrbit(); } }));
  }
  function showOrbit() {
    show('orbit'); $('#orbit-round').textContent = pad(st.round + 1) + ' / ' + pad(TOTAL); $('#orbit-story').textContent = cur.story;
    typeInto($('#orbit-scan'), cur.scan);
  }
  $('#btn-descend').onclick = () => {
    Sfx.blip(); show(); const atmo = cur.planet.atmo || '#cfe0ff'; orbit.descend();
    stage.fade(atmo, 0, 1, 1.1, () => {
      const pano = new LC.Pano(LC.SCENES[cur.scene]());
      pano.onFrame = compass; pano.onFirstMove = () => $('#hud-hint').classList.add('gone');
      stage.show(pano); stage.fade(atmo, 1, 0, 1.0); showSurface();
      Sfx.ambient(cur.ambient); if (cur.bell) startBell();
    });
  };
  function showSurface() {
    show('surface');
    $('#hud-round').textContent = pad(st.round + 1) + ' / ' + pad(TOTAL);
    $('#hud-score').textContent = fmt(total()) + ' pts';
    $('#hud-hint').classList.remove('gone'); updateIntelBtn();
  }
  function startBell() {
    stopBell();
    const ring = () => { LC.bellAt = stage.time; Sfx.bell(); };
    bellTimeout = setTimeout(ring, 2500); bellTimer = setInterval(ring, 14000);
  }
  function stopBell() { clearTimeout(bellTimeout); clearInterval(bellTimer); bellTimer = bellTimeout = null; }

  // compass strip
  const strip = $('#compass-strip'), PX = 2;
  (function () {
    const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' }; let html = '';
    for (let a = -360; a <= 720; a += 15) {
      const n = ((a % 360) + 360) % 360, x = (a + 360) * PX;
      html += names[n] !== undefined ? '<span class="c-lbl' + (n === 0 ? ' n' : '') + '" style="left:' + x + 'px">' + names[n] + '</span>' : '<span class="c-tick" style="left:' + x + 'px"></span>';
    }
    strip.innerHTML = html;
  })();
  function compass(yaw) { strip.style.transform = 'translateX(' + (strip.parentElement.clientWidth / 2 - (yaw + 360) * PX) + 'px)'; }

  // ---------------------------------------------------------------- intel
  function updateIntelBtn() { $('#intel-count').textContent = 3 - st.hints; }
  $('#btn-intel').onclick = () => { Sfx.blip(); renderIntel(); $('#intel').hidden = false; };
  $('#intel-close').onclick = () => { $('#intel').hidden = true; };
  function renderIntel(anim) {
    const list = $('#intel-list'); list.innerHTML = '';
    cur.intel.forEach((txt, i) => {
      const open = i < st.hints, row = document.createElement('div');
      row.className = 'intel-row' + (open ? ' open' : '');
      row.innerHTML = '<span class="tag">Intel ' + (i + 1) + '</span><span class="txt">' + (open ? esc(txt) : '▒▒▒▒▒ ▒▒▒▒ ▒▒▒▒▒▒▒ ▒▒▒▒') + '</span>';
      if (i === st.hints) {
        const b = document.createElement('button'); b.className = 'btn small'; b.textContent = 'Decrypt −' + HINT_COST;
        b.onclick = () => { st.hints++; save(); Sfx.select(); renderIntel(i); updateIntelBtn(); };
        row.appendChild(b);
      }
      list.appendChild(row);
      if (anim === i) scramble(row.querySelector('.txt'), txt);
    });
    $('#intel-cost').textContent = st.hints ? 'This round: −' + fmt(st.hints * HINT_COST) + ' points' : 'Each decrypt costs ' + HINT_COST + ' points.';
  }

  // ---------------------------------------------------------------- navicomputer
  $('#btn-nav').onclick = () => {
    Sfx.blip(); $('#intel').hidden = true; show('nav'); stage.paused = true;
    nav.result = null; nav.final = null; nav.locked = false; nav.start(); updateSel();
  };
  $('#btn-nav-back').onclick = () => { nav.stop(); $('#nav-list').hidden = true; stage.paused = false; show('surface'); };
  function updateSel() {
    const w = nav.sel && W.byId[nav.sel];
    $('#nav-selected').innerHTML = w ? '<span class="dim">Coordinates set:</span> <b>' + esc(w.name) + '</b>' : 'Tap a world to set coordinates';
    $('#btn-lock').disabled = !w || nav.locked;
  }
  $('#btn-nav-list').onclick = () => {
    const l = $('#nav-list'); l.hidden = !l.hidden; if (l.hidden) return; l.innerHTML = '';
    W.all.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((w) => {
      const b = document.createElement('button'); b.className = 'list-item' + (nav.sel === w.id ? ' on' : ''); b.textContent = w.name;
      b.onclick = () => { nav.sel = w.id; nav.focus(w.x, w.y, Math.max(nav.z, 2.2), 0.6); l.hidden = true; Sfx.select(); updateSel(); };
      l.appendChild(b);
    });
  };
  $('#btn-lock').onclick = () => {
    if (!nav.sel || nav.locked) return;
    nav.locked = true; $('#nav-list').hidden = true;
    const g = W.byId[nav.sel], a = cur, d = Math.hypot(g.x - a.x, g.y - a.y), hit = g.id === a.id;
    const base = hit ? 5000 : Math.round(3500 * Math.exp(-d / 0.22)), spent = st.hints * HINT_COST, pts = Math.max(0, base - spent);
    st.results.push({ id: a.id, guess: g.id, pts, hints: st.hints }); st.round++; st.hints = 0; save();
    nav.result = { guess: g.id, answer: a.id, t: 0 };
    nav.focus((g.x + a.x) / 2, (g.y + a.y) / 2, hit ? 2.4 : clamp(0.9 / Math.max(0.25, d), 1, 3), 0.9);
    stopBell(); Sfx.ambient(null); if (hit) Sfx.hit(); else Sfx.miss();
    updateSel(); showResult(hit, d, pts, spent, a);
  };

  function showResult(hit, d, pts, spent, w) {
    const earth = w.earth || {};
    const link = earth.q ? ' <a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(earth.q) + '" target="_blank" rel="noopener">See it on Google Maps ↗</a>' : '';
    $('#res-status').textContent = hit ? 'Direct hit' : 'Off by ' + fmt(Math.round((d * 60000) / 100) * 100) + ' light-years';
    $('#res-status').className = 'res-status ' + (hit ? 'good' : 'bad');
    $('#res-points').textContent = '+' + fmt(pts);
    $('#res-spent').textContent = spent ? '(intel −' + fmt(spent) + ')' : '';
    $('#res-name').textContent = w.name;
    $('#res-source').textContent = w.source;
    $('#res-line').textContent = w.line; $('#res-story').textContent = w.story;
    $('#res-earth').innerHTML = '<span class="dim">Filmed on Earth:</span> ' + esc(earth.place || 'In a studio') + '.' + link;
    $('#btn-next').textContent = st.round >= TOTAL ? 'See final report' : 'Next transmission ▸';
    $('#result').hidden = false;
  }
  $('#btn-next').onclick = () => { $('#result').hidden = true; nav.stop(); stage.paused = false; if (st.round >= TOTAL) showFinal(); else startRound(); };

  // ---------------------------------------------------------------- final report
  function showFinal() {
    stopBell(); Sfx.ambient(null); nav.stop(); show('final'); stage.paused = false; stage.show(galaxyView);
    const t = total();
    $('#final-name').textContent = NAME;
    $('#final-score').textContent = fmt(t); $('#final-max').textContent = fmt(MAX); $('#final-rank').textContent = rank(t);
    $('#final-list').innerHTML = st.results.map((r, i) => {
      const w = W.byId[r.id], g = W.byId[r.guess];
      return '<li><span class="dim">' + pad(i + 1) + '</span><span>' + esc(w.name) + (r.guess !== r.id ? ' <span class="dim">(you said ' + esc(g.name) + ')</span>' : ' ✓') + '</span><b>' + fmt(r.pts) + '</b></li>';
    }).join('');
    $('#final-msg').textContent = CFG.finaleMessage || '';
    $('#final-sign').textContent = CFG.senderName ? '— ' + CFG.senderName : '';
    const bonus = $('#final-bonus');
    if (CFG.challengeUrl) { bonus.hidden = false; $('#final-bonus-link').href = CFG.challengeUrl; } else bonus.hidden = true;
    Sfx.hit();
  }
  $('#btn-again').onclick = () => { if (!confirm('Play the whole mission again from the start?')) return; st = fresh(); save(); startRound(); };
  $('#btn-final-title').onclick = showTitle;

  // ---------------------------------------------------------------- little text effects
  async function typeInto(el, text) {
    el.textContent = '';
    for (let i = 0; i <= text.length; i++) { el.textContent = text.slice(0, i); await sleep(18); }
  }
  function scramble(el, text) {
    if (!el) return;
    const glyphs = '▒░█▓<>/\\|#$%&*+=?'; let frame = 0; const n = 22;
    const tick = () => {
      const k = Math.floor((frame / n) * text.length);
      el.textContent = text.slice(0, k) + text.slice(k).replace(/\S/g, () => glyphs[Math.floor(Math.random() * glyphs.length)]);
      if (frame++ < n) setTimeout(tick, 30); else el.textContent = text;
    };
    tick();
  }

  // ---------------------------------------------------------------- go
  const q = new URLSearchParams(location.search);
  if (q.has('scene') && W.byId[q.get('scene')]) { // test hook: ?scene=hoth jumps straight to a surface
    bootDone = true; Sfx.init(); cur = W.byId[q.get('scene')];
    const pano = new LC.Pano(LC.SCENES[cur.scene]()); pano.onFrame = compass; stage.show(pano); showSurface();
    if (q.has('yaw')) pano.yaw = +q.get('yaw');
  } else if (q.has('orbit') && W.byId[q.get('orbit')]) {
    bootDone = true; cur = W.byId[q.get('orbit')]; orbit = new LC.Orbit(cur.planet); orbit.finish(); stage.show(orbit); showOrbit();
  } else if (q.has('skip')) { bootDone = true; accept(); } else runBoot();
})();
