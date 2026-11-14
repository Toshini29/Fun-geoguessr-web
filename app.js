(() => {
  const CFG = window.MISSION_CONFIG || {};
  const DOSSIERS = window.DOSSIERS || [];
  const STORE_KEY = "luthens-coordinates-v1";

  // Accepted country answers per dossier (normalized: lowercase, letters only)
  const ANSWERS = {
    frost: ["norway", "norge", "noreg"],
    sand: ["tunisia", "tunisie"],
    salt: ["bolivia"],
    fire: ["italy", "italia", "sicily", "sicilia"],
    jungle: ["guatemala"],
    palace: ["spain", "espana", "seville", "sevilla"],
    island: ["bolivia"],
    citadel: ["unitedkingdom", "uk", "england", "britain", "greatbritain", "london", "gb"],
    heist: ["scotland", "unitedkingdom", "uk", "britain", "greatbritain", "gb", "alba"]
  };

  const $ = (s, el = document) => el.querySelector(s);

  // ---------- State ----------
  let state = {};
  try { state = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { state = {}; }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {} };
  const get = (id) => (state[id] ||= { intel: 0, decoded: false, gaveUp: false });

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- Boot sequence ----------
  const bootLines = [
    "> establishing relay ......................... OK",
    "> routing through 4 dead drops ............... OK",
    "> signal origin ................ [REDACTED]",
    "",
    `> recipient: ${(CFG.agentName || "AGENT").toUpperCase()}`,
    "> 9 transmissions intercepted from Imperial traffic.",
    "> each one is a place. a real one.",
    "> the Empire filmed its history across your planet.",
    "> find where.",
    ""
  ];
  const boot = $("#boot"), bootText = $("#boot-text"), bootAccept = $("#boot-accept");
  let bootDone = false;

  function endBoot() {
    if (bootDone) return;
    bootDone = true;
    bootText.textContent = bootLines.join("\n");
    bootAccept.hidden = false;
    bootAccept.focus();
  }
  function closeBoot() {
    boot.classList.add("gone");
    setTimeout(() => boot.remove(), 650);
    try { sessionStorage.setItem("lc-booted", "1"); } catch (_) {}
  }

  async function runBoot() {
    let seen = false;
    try { seen = sessionStorage.getItem("lc-booted") === "1"; } catch (_) {}
    if (seen) { boot.remove(); return; }
    const cursor = '<span class="cursor">&nbsp;</span>';
    let out = "";
    for (const line of bootLines) {
      for (const ch of line) {
        if (bootDone) return;
        out += ch;
        bootText.innerHTML = escapeHtml(out) + cursor;
        await sleep(line.includes("....") ? 8 : 22);
      }
      out += "\n";
      await sleep(180);
    }
    endBoot();
  }
  $("#boot-skip").addEventListener("click", () => { endBoot(); closeBoot(); });
  bootAccept.addEventListener("click", closeBoot);

  // ---------- Briefing ----------
  $("#briefing-greeting").innerHTML =
    `${escapeHtml(CFG.agentName || "Agent")}, the network needs eyes on the ground. ` +
    `Nine places on this planet stood in for worlds in a galaxy far, far away. ` +
    `You'll be dropped into them blind.`;

  const challengeBtn = $("#challenge-btn");
  if (CFG.challengeUrl) {
    challengeBtn.href = CFG.challengeUrl;
  } else {
    challengeBtn.setAttribute("aria-disabled", "true");
    $("#challenge-note").hidden = false;
  }

  $("#reset-btn").addEventListener("click", () => {
    if (!confirm("Wipe all decoded transmissions and spent intel?")) return;
    state = {}; save(); render();
  });

  // ---------- Grid ----------
  const grid = $("#grid");
  function render() {
    grid.innerHTML = "";
    DOSSIERS.forEach((d, i) => {
      const s = get(d.id);
      const b = document.createElement("button");
      b.className = "card" + (s.decoded ? " decoded" : "");
      b.innerHTML = `
        <span class="card-num">TRANSMISSION ${pad(i + 1)}</span>
        <span class="card-name">${escapeHtml(d.codename)}</span>
        <span class="card-sector">${escapeHtml(d.sector)}</span>
        ${s.decoded ? `<span class="card-place">${escapeHtml(d.planet)} · ${escapeHtml(d.place.split(",").slice(-1)[0].trim())}</span>` : ""}
        <span class="card-foot">
          <span class="${s.decoded ? "status-dec" : "status-enc"}">${s.decoded ? (s.gaveUp ? "Exposed" : "Decoded") : "Encrypted"}</span>
          <span class="pips" title="Intel spent">${[0,1,2].map(k => `<span class="pip ${k < s.intel ? "used" : ""}"></span>`).join("")}</span>
        </span>`;
      b.addEventListener("click", () => openDossier(i));
      grid.appendChild(b);
    });
    updateProgress();
  }

  function score() {
    let pts = 0, decoded = 0, intel = 0;
    DOSSIERS.forEach(d => {
      const s = get(d.id);
      intel += s.intel;
      if (s.decoded) { decoded++; if (!s.gaveUp) pts += 3 - s.intel; }
    });
    return { pts, decoded, intel };
  }
  function rankFor(pts, decoded) {
    if (!decoded) return "—";
    if (pts >= 24) return "Fulcrum";
    if (pts >= 18) return "Spymaster";
    if (pts >= 12) return "Field agent";
    if (pts >= 6) return "Informant";
    return "Recruit";
  }
  function updateProgress() {
    const { pts, decoded } = score();
    $("#decoded-count").textContent = decoded;
    $("#progress-fill").style.width = `${(decoded / DOSSIERS.length) * 100}%`;
    $("#rating").textContent = rankFor(pts, decoded);
  }

  // ---------- Dossier ----------
  const dlg = $("#dossier"), body = $("#dossier-body");
  let current = null;

  function openDossier(i) {
    current = i;
    drawDossier();
    if (!dlg.open) dlg.showModal();
    body.scrollTop = 0;
  }

  function drawDossier(animIndex = -1) {
    const d = DOSSIERS[current], s = get(d.id);
    const intelHtml = d.intel.map((txt, k) => {
      const open = k < s.intel;
      const next = k === s.intel && !s.decoded;
      return `<div class="intel-item ${open ? "open" : "locked"}">
        <span class="tag">INTEL ${k + 1}</span>
        <span class="txt" data-k="${k}">${open ? escapeHtml(txt) : "▒▒▒▒▒▒ ▒▒▒▒ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒"}</span>
        ${next ? `<button class="btn" data-decrypt="${k}">Decrypt</button>` : ""}
      </div>`;
    }).join("");

    const mapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${d.lat},${d.lng}&heading=${d.heading || 0}`;

    body.innerHTML = `
      <div class="d-head">
        <p class="eyebrow">Transmission ${pad(current + 1)} · ${s.decoded ? "decoded" : "encrypted"}</p>
        <h2 class="d-name">${escapeHtml(d.codename)}</h2>
        <div class="d-sector">${escapeHtml(d.sector)}</div>
      </div>
      <div class="d-section">
        <h3>Scene reconstruction</h3>
        <p>${escapeHtml(d.scene)}</p>
      </div>
      <div class="d-section">
        <h3>What you may see in the frame</h3>
        <ul>${d.streetview.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>
      <div class="d-section">
        <h3>Intel · each one costs a point</h3>
        <div class="intel">${intelHtml}</div>
      </div>
      ${s.decoded ? `
      <div class="reveal">
        <span class="stamp">${s.gaveUp ? "EXPOSED" : "DECODED"}</span>
        <dl>
          <dt>World</dt><dd>${escapeHtml(d.planet)}</dd>
          <dt>Source</dt><dd>${escapeHtml(d.source)}</dd>
          <dt>On Earth</dt><dd>${escapeHtml(d.place)}</dd>
          <dt>Coords</dt><dd>${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</dd>
        </dl>
        <a class="btn" href="${mapsUrl}" target="_blank" rel="noopener">Look around in Street View ↗</a>
      </div>` : `
      <div class="d-section">
        <h3>Decode: name the country</h3>
        <form class="answer-row" id="answer-form" autocomplete="off">
          <input id="answer" placeholder="Country…" aria-label="Country" spellcheck="false">
          <button class="btn btn-primary" type="submit">Transmit</button>
        </form>
        <div class="feedback" id="feedback"></div>
        <button class="giveup" id="giveup">Compromise this file and reveal it</button>
      </div>`}
    `;

    body.querySelectorAll("[data-decrypt]").forEach(btn => btn.addEventListener("click", () => {
      const k = +btn.dataset.decrypt;
      s.intel = Math.max(s.intel, k + 1); save();
      drawDossier(k); render();
    }));

    if (animIndex >= 0) scramble(body.querySelector(`.txt[data-k="${animIndex}"]`), d.intel[animIndex]);

    const form = $("#answer-form", body);
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = $("#answer", body), guess = norm(input.value);
        if (!guess) return;
        if ((ANSWERS[d.id] || []).includes(guess)) {
          s.decoded = true; save(); render(); drawDossier(); checkFinale();
        } else {
          const fb = $("#feedback", body);
          fb.textContent = "Signal rejected. That's not it.";
          fb.className = "feedback bad";
          input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
          input.select();
        }
      });
      $("#giveup", body).addEventListener("click", () => {
        if (!confirm("Reveal this location? You won't earn any points for it.")) return;
        s.decoded = true; s.gaveUp = true; save(); render(); drawDossier(); checkFinale();
      });
    }
  }

  function scramble(el, finalText) {
    if (!el) return;
    const glyphs = "▒░█▓<>/\\|#$%&*+=?";
    let frame = 0;
    const total = 22;
    const tick = () => {
      const revealN = Math.floor((frame / total) * finalText.length);
      el.textContent = finalText.slice(0, revealN) +
        finalText.slice(revealN).replace(/\S/g, () => glyphs[Math.floor(Math.random() * glyphs.length)]);
      if (frame++ < total) requestAnimationFrame(() => setTimeout(tick, 28));
      else el.textContent = finalText;
    };
    tick();
  }

  // ---------- Finale ----------
  const finale = $("#finale");
  function checkFinale() {
    const { pts, decoded, intel } = score();
    if (decoded !== DOSSIERS.length || state.__finaleShown) return;
    state.__finaleShown = true; save();
    setTimeout(() => {
      dlg.close();
      $("#finale-name").textContent = CFG.agentName || "Agent";
      $("#finale-message").textContent = CFG.finaleMessage || "";
      $("#finale-sender").textContent = CFG.senderName || "";
      $("#finale-stats").innerHTML = `
        <div><strong>${decoded}/9</strong>decoded</div>
        <div><strong>${intel}</strong>intel spent</div>
        <div><strong>${rankFor(pts, decoded)}</strong>final rating</div>`;
      finale.hidden = false;
    }, 900);
  }
  $("#finale-close").addEventListener("click", () => { finale.hidden = true; });

  // close dialog by clicking the backdrop
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  // ---------- utils ----------
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  // state keys that aren't dossiers shouldn't break get()
  render();
  runBoot();
})();
