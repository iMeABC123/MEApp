// ME App — 2026 Workbook (Single User) v1.1
// Option C: "Living It Out Loud" applies ONLY to Matthew McLamb.
// Everyone else sees a neutral title.
//
// Stores everything locally on the device via localStorage.
// Features: profile, numerology basics, monthly worksheets, alignment meter,
// decision matrix, identity wheel (data foundation), year-end extraction, export/reset.

const STORAGE_KEY = "meapp_single_2026_v1";
const OWNER_NAME_CANON = "matthew mclamb";
const OWNER_TITLE_2026 = "2026 Orientation — Living It Out Loud";
const DEFAULT_TITLE_2026 = "2026 Personal Workbook";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DEFAULT_MONTH_THEMES = {
  January:  "Where I Am Now",
  February: "Choice",
  March:    "Momentum",
  April:    "Truth in Motion",
  May:      "Creative Bloom",
  June:     "Alignment",
  July:     "Expression",
  August:   "Courage Month",
  September:"Integration",
  October:  "Stability",
  November: "Protection",
  December: "Living It Out Loud"
};

// ---------- Storage ----------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureState() {
  let state = loadState();
  if (!state) {
    state = {
      profile: null,
      workbook: buildEmptyWorkbook(),
      ui: { currentView: "home", currentMonth: "January" }
    };
    saveState(state);
  }
  return state;
}

function buildEmptyWorkbook() {
  const months = {};
  MONTHS.forEach(m => {
    months[m] = {
      theme: DEFAULT_MONTH_THEMES[m] || "",
      reflection: "",
      expression: "",
      relationships: "",
      alignmentScore: 50, // 0-100
      decision: {
        prompt: "",
        fear: "",
        costOfInaction: "",
        alignedAction: "",
        smallestStep: ""
      },
      identityWheel: {
        // 0-10 sliders (simple, editable)
        selfExpression: 5,
        courage: 5,
        boundaries: 5,
        creativity: 5,
        relationships: 5,
        discipline: 5
      }
    };
  });

  return {
    year: 2026,
    title: DEFAULT_TITLE_2026,
    months,
    yearEnd: {
      stayedTrue: "",
      shifted: "",
      decisionsThatMattered: "",
      identitySnapshot: "",
      letterToPastSelf: "",
      letterToFutureSelf: ""
    }
  };
}

// Apply owner-only title (Option C)
function applyOwnerTitleIfNeeded(state) {
  const name = (state.profile?.name || "").trim().toLowerCase();
  if (name === OWNER_NAME_CANON) {
    state.workbook.title = OWNER_TITLE_2026;
  } else if (!state.workbook.title || state.workbook.title === OWNER_TITLE_2026) {
    // Keep non-owner neutral (and avoid accidentally inheriting owner title)
    state.workbook.title = DEFAULT_TITLE_2026;
  }
}

// ---------- Numerology ----------
function reduceNumber(n) {
  // keep master numbers 11/22/33
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split("").reduce((a, d) => a + Number(d), 0);
  }
  return n;
}

function lifePathFromISO(iso) {
  if (!iso) return null;
  const digits = iso.replaceAll("-", "").split("").map(Number);
  const sum = digits.reduce((a,b)=>a+b,0);
  return reduceNumber(sum);
}

function birthdayNumberFromISO(iso) {
  if (!iso) return null;
  const day = Number(iso.split("-")[2]);
  return reduceNumber(day);
}

function personalYearNumber(birthIso, year) {
  if (!birthIso) return null;
  const [,m,d] = birthIso.split("-").map(Number);
  const sum = reduceNumber(m) + reduceNumber(d) + reduceNumber(year);
  return reduceNumber(sum);
}

// ---------- Helpers ----------
function el(id) { return document.getElementById(id); }

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function alignmentLabel(score) {
  if (score >= 85) return "Fully Aligned";
  if (score >= 70) return "Mostly Aligned";
  if (score >= 50) return "Mixed / In Progress";
  if (score >= 30) return "Off Track / Draining";
  return "Silencing Myself";
}

function monthProgressSummary(m) {
  const filled =
    (m.reflection?.trim() ? 1 : 0) +
    (m.expression?.trim() ? 1 : 0) +
    (m.relationships?.trim() ? 1 : 0) +
    (m.decision?.prompt?.trim() ? 1 : 0);
  return `${filled}/4 sections filled`;
}

// ---------- Rendering ----------
function render() {
  const state = ensureState();
  applyOwnerTitleIfNeeded(state);

  const container = el("output") || el("app") || document.body;

  if (state.ui.currentView === "home") {
    container.innerHTML = renderHome(state);
    wireHome(state);
    return;
  }

  if (!state.profile) {
    state.ui.currentView = "home";
    saveState(state);
    container.innerHTML = renderHome(state);
    wireHome(state);
    return;
  }

  if (state.ui.currentView === "dashboard") {
    container.innerHTML = renderDashboard(state);
    wireDashboard(state);
    return;
  }

  if (state.ui.currentView === "month") {
    container.innerHTML = renderMonth(state);
    wireMonth(state);
    return;
  }

  if (state.ui.currentView === "yearEnd") {
    container.innerHTML = renderYearEnd(state);
    wireYearEnd(state);
    return;
  }

  state.ui.currentView = "dashboard";
  saveState(state);
  container.innerHTML = renderDashboard(state);
  wireDashboard(state);
}

function renderHome(state) {
  const p = state.profile;
  const summary = p
    ? `<div class="me-card">
         <h3>Loaded Profile</h3>
         <div><strong>${escapeHtml(p.name)}</strong></div>
         <div>Birthdate: ${escapeHtml(p.birthdate)}</div>
         <div>Birthplace: ${escapeHtml(p.birthplace)}</div>
       </div>`
    : "";

  return `
    <div class="me-card">
      <h2>ME App</h2>
      <p><strong>${escapeHtml(state.workbook.title)}</strong></p>
      <p>Enter your information above, then tap the button.</p>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <button id="btnStart" style="flex:1; min-width:160px;">Open 2026 Dashboard</button>
        <button id="btnReset" style="flex:1; min-width:160px; background:#ef4444; color:#fff;">Reset Data</button>
      </div>

      <div style="margin-top:10px; font-size: 14px; opacity:0.9;">
        Tip: Your entries are saved on this device.
      </div>
    </div>
    ${summary}
  `;
}

function wireHome(state) {
  const nameInput = el("name");
  const birthdateInput = el("birthdate");
  const birthplaceInput = el("birthplace");

  el("btnStart")?.addEventListener("click", () => {
    const name = nameInput?.value?.trim() || "";
    const birthdate = birthdateInput?.value || "";
    const birthplace = birthplaceInput?.value?.trim() || "";

    if (!name || !birthdate) {
      alert("Please enter at least your Name and Birthdate.");
      return;
    }

    state.profile = { name, birthdate, birthplace };
    applyOwnerTitleIfNeeded(state);

    state.ui.currentView = "dashboard";
    saveState(state);
    render();
  });

  el("btnReset")?.addEventListener("click", () => {
    const ok = confirm("Reset all ME App data on this phone? This cannot be undone.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    ensureState();
    render();
  });
}

function renderDashboard(state) {
  const p = state.profile;
  const lp = lifePathFromISO(p.birthdate);
  const bd = birthdayNumberFromISO(p.birthdate);
  const py = personalYearNumber(p.birthdate, state.workbook.year);

  const monthCards = MONTHS.map(m => {
    const mm = state.workbook.months[m];
    return `
      <button class="me-month" data-month="${m}">
        <div class="me-month-title">${m}</div>
        <div class="me-month-sub">Theme: ${escapeHtml(mm.theme)}</div>
        <div class="me-month-sub">${monthProgressSummary(mm)} • Alignment: ${mm.alignmentScore}/100</div>
      </button>
    `;
  }).join("");

  return `
    <div class="me-topbar">
      <div>
        <div class="me-h1">Welcome, ${escapeHtml(p.name)}</div>
        <div class="me-sub">${escapeHtml(state.workbook.title)} • Saved on this device</div>
      </div>
      <button id="btnExport" class="me-chip">Export</button>
    </div>

    <div class="me-grid">
      <div class="me-card">
        <h3>Identity Snapshot</h3>
        <div><strong>Birthdate:</strong> ${escapeHtml(p.birthdate)}</div>
        <div><strong>Birthplace:</strong> ${escapeHtml(p.birthplace)}</div>
        <hr class="me-hr"/>
        <div><strong>Life Path:</strong> ${lp ?? "—"}</div>
        <div><strong>Birthday Number:</strong> ${bd ?? "—"}</div>
        <div><strong>Personal Year (2026):</strong> ${py ?? "—"}</div>
      </div>

      <div class="me-card">
        <h3>Navigate</h3>
        <button id="btnYearEnd" class="me-primary">Year-End Extraction</button>
        <button id="btnBackHome" class="me-secondary">Edit Profile</button>
      </div>
    </div>

    <div class="me-card">
      <h3>Months</h3>
      <div class="me-months">
        ${monthCards}
      </div>
    </div>

    <style>
      .me-topbar{display:flex; justify-content:space-between; align-items:center; gap:12px; margin: 10px 0 16px;}
      .me-h1{font-size:28px; font-weight:800; margin-bottom:4px;}
      .me-sub{opacity:0.85}
      .me-chip{background:#0ea5e9; color:#021019; border:none; padding:10px 12px; border-radius:10px; font-weight:700;}
      .me-grid{display:grid; grid-template-columns: 1fr; gap:12px;}
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
      .me-hr{border:none; border-top:1px solid rgba(255,255,255,0.12); margin:12px 0;}
      .me-primary{width:100%; padding:12px; border-radius:10px; border:none; background:#38bdf8; color:#020617; font-size:16px; font-weight:700; margin-top:8px;}
      .me-secondary{width:100%; padding:12px; border-radius:10px; border:none; background:#334155; color:#f8fafc; font-size:16px; font-weight:700; margin-top:8px;}
      .me-months{display:grid; grid-template-columns: 1fr; gap:10px;}
      .me-month{width:100%; text-align:left; padding:14px; border:none; border-radius:12px; background:#0b1220; color:#f8fafc;}
      .me-month-title{font-size:18px; font-weight:800; margin-bottom:4px;}
      .me-month-sub{opacity:0.85; font-size:14px;}
      @media(min-width:650px){ .me-months{grid-template-columns: 1fr 1fr;} .me-grid{grid-template-columns: 1fr 1fr;} }
    </style>
  `;
}

function wireDashboard(state) {
  el("btnYearEnd")?.addEventListener("click", () => {
    state.ui.currentView = "yearEnd";
    saveState(state);
    render();
  });

  el("btnBackHome")?.addEventListener("click", () => {
    state.ui.currentView = "home";
    saveState(state);
    render();
  });

  el("btnExport")?.addEventListener("click", () => exportData(state));

  document.querySelectorAll(".me-month").forEach(btn => {
    btn.addEventListener("click", () => {
      const m = btn.getAttribute("data-month");
      state.ui.currentMonth = m;
      state.ui.currentView = "month";
      saveState(state);
      render();
    });
  });
}

function renderMonth(state) {
  const mName = state.ui.currentMonth;
  const m = state.workbook.months[mName];

  const idw = m.identityWheel;
  const wheelTotal = Object.values(idw).reduce((a,b)=>a+b,0);
  const wheelAvg = Math.round((wheelTotal / Object.keys(idw).length) * 10) / 10;

  return `
    <div class="me-topbar">
      <button id="btnBackDash" class="me-chip" style="background:#334155; color:#f8fafc;">← Dashboard</button>
      <div style="flex:1"></div>
      <button id="btnYearEnd2" class="me-chip">Year-End</button>
    </div>

    <div class="me-card">
      <h2 style="margin:0 0 6px;">${escapeHtml(mName)}</h2>
      <div style="opacity:0.9;">Theme: <strong>${escapeHtml(m.theme)}</strong></div>
    </div>

    <div class="me-card">
      <h3>Reflection</h3>
      <textarea id="reflection" class="me-textarea" placeholder="What came up for me this month?">${escapeHtml(m.reflection)}</textarea>

      <h3>Expression</h3>
      <textarea id="expression" class="me-textarea" placeholder="What did I say out loud that mattered? What did I avoid?">${escapeHtml(m.expression)}</textarea>

      <h3>Relationships</h3>
      <textarea id="relationships" class="me-textarea" placeholder="Where did I show up fully? Where did I shrink or over-function?">${escapeHtml(m.relationships)}</textarea>

      <button id="btnSaveMonth" class="me-primary">Save Month</button>
      <div id="saveMsg" style="margin-top:8px; opacity:0.85;"></div>
    </div>

    <div class="me-card">
      <h3>Alignment Meter</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div><strong id="alignLabel">${alignmentLabel(m.alignmentScore)}</strong></div>
        <div><strong id="alignScore">${m.alignmentScore}</strong>/100</div>
      </div>
      <input id="alignment" type="range" min="0" max="100" value="${m.alignmentScore}" style="width:100%; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; opacity:0.85; font-size:14px; margin-top:6px;">
        <span>Silencing Myself</span>
        <span>Acting Honestly</span>
      </div>
    </div>

    <div class="me-card">
      <h3>Decision Matrix</h3>
      <label class="me-label">Decision in front of me</label>
      <textarea id="d_prompt" class="me-textarea" placeholder="What decision is asking for clarity right now?">${escapeHtml(m.decision.prompt)}</textarea>

      <label class="me-label">What am I afraid will happen?</label>
      <textarea id="d_fear" class="me-textarea">${escapeHtml(m.decision.fear)}</textarea>

      <label class="me-label">Cost of not acting</label>
      <textarea id="d_cost" class="me-textarea">${escapeHtml(m.decision.costOfInaction)}</textarea>

      <label class="me-label">Aligned action</label>
      <textarea id="d_action" class="me-textarea">${escapeHtml(m.decision.alignedAction)}</textarea>

      <label class="me-label">One small step this month</label>
      <textarea id="d_step" class="me-textarea">${escapeHtml(m.decision.smallestStep)}</textarea>

      <button id="btnSaveDecision" class="me-secondary">Save Decision Matrix</button>
      <div id="saveMsg2" style="margin-top:8px; opacity:0.85;"></div>
    </div>

    <div class="me-card">
      <h3>Identity Wheel</h3>
      <div style="opacity:0.85; margin-bottom:10px;">
        Rate each area 0–10. Current average: <strong>${wheelAvg}</strong>
      </div>

      ${renderWheelSlider("Self-Expression", "selfExpression", idw.selfExpression)}
      ${renderWheelSlider("Courage", "courage", idw.courage)}
      ${renderWheelSlider("Boundaries", "boundaries", idw.boundaries)}
      ${renderWheelSlider("Creativity", "creativity", idw.creativity)}
      ${renderWheelSlider("Relationships", "relationships", idw.relationships)}
      ${renderWheelSlider("Discipline", "discipline", idw.discipline)}

      <button id="btnSaveWheel" class="me-secondary">Save Identity Wheel</button>
      <div id="saveMsg3" style="margin-top:8px; opacity:0.85;"></div>

      <div style="margin-top:14px; opacity:0.85; font-size:14px;">
        (Next upgrade: a circular visual wheel. This v1 is the data foundation.)
      </div>
    </div>

    <style>
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
      .me-primary{width:100%; padding:12px; border-radius:10px; border:none; background:#38bdf8; color:#020617; font-size:16px; font-weight:800; margin-top:10px;}
      .me-secondary{width:100%; padding:12px; border-radius:10px; border:none; background:#334155; color:#f8fafc; font-size:16px; font-weight:800; margin-top:10px;}
      .me-textarea{width:100%; min-height:110px; padding:12px; border-radius:10px; border:none; margin-top:8px; background:#0b1220; color:#f8fafc;}
      .me-label{display:block; margin-top:10px; opacity:0.9;}
      .me-chip{background:#0ea5e9; color:#021019; border:none; padding:10px 12px; border-radius:10px; font-weight:800;}
      .me-topbar{display:flex; align-items:center; gap:10px; margin: 10px 0 16px;}
      .wheel-row{background:#0b1220; padding:12px; border-radius:10px; margin-top:10px;}
      .wheel-title{font-weight:800; margin-bottom:6px;}
      .wheel-meta{display:flex; justify-content:space-between; opacity:0.85; font-size:14px;}
    </style>
  `;
}

function renderWheelSlider(label, key, value) {
  return `
    <div class="wheel-row" data-wheel="${key}">
      <div class="wheel-title">${escapeHtml(label)}</div>
      <input type="range" min="0" max="10" value="${value}" class="wheel-slider" style="width:100%;">
      <div class="wheel-meta">
        <span>0</span>
        <span><strong class="wheel-val">${value}</strong>/10</span>
        <span>10</span>
      </div>
    </div>
  `;
}

function wireMonth(state) {
  const mName = state.ui.currentMonth;
  const m = state.workbook.months[mName];

  el("btnBackDash")?.addEventListener("click", () => {
    state.ui.currentView = "dashboard";
    saveState(state);
    render();
  });

  el("btnYearEnd2")?.addEventListener("click", () => {
    state.ui.currentView = "yearEnd";
    saveState(state);
    render();
  });

  const align = el("alignment");
  align?.addEventListener("input", () => {
    const v = Number(align.value);
    el("alignScore").textContent = String(v);
    el("alignLabel").textContent = alignmentLabel(v);
  });

  el("btnSaveMonth")?.addEventListener("click", () => {
    m.reflection = el("reflection").value;
    m.expression = el("expression").value;
    m.relationships = el("relationships").value;
    saveState(state);
    el("saveMsg").textContent = "Saved ✅";
    setTimeout(()=>{ el("saveMsg").textContent = ""; }, 1200);
  });

  el("btnSaveDecision")?.addEventListener("click", () => {
    m.decision.prompt = el("d_prompt").value;
    m.decision.fear = el("d_fear").value;
    m.decision.costOfInaction = el("d_cost").value;
    m.decision.alignedAction = el("d_action").value;
    m.decision.smallestStep = el("d_step").value;
    saveState(state);
    el("saveMsg2").textContent = "Saved ✅";
    setTimeout(()=>{ el("saveMsg2").textContent = ""; }, 1200);
  });

  align?.addEventListener("change", () => {
    m.alignmentScore = Number(align.value);
    saveState(state);
  });

  document.querySelectorAll(".wheel-row").forEach(row => {
    const slider = row.querySelector(".wheel-slider");
    const valEl = row.querySelector(".wheel-val");
    slider?.addEventListener("input", () => {
      valEl.textContent = String(slider.value);
    });
  });

  el("btnSaveWheel")?.addEventListener("click", () => {
    document.querySelectorAll(".wheel-row").forEach(row => {
      const key = row.getAttribute("data-wheel");
      const slider = row.querySelector(".wheel-slider");
      m.identityWheel[key] = Number(slider.value);
    });
    saveState(state);
    el("saveMsg3").textContent = "Saved ✅";
    setTimeout(()=>{ el("saveMsg3").textContent = ""; }, 1200);
  });
}

function renderYearEnd(state) {
  const y = state.workbook.yearEnd;

  return `
    <div class="me-topbar">
      <button id="btnBackDash3" class="me-chip" style="background:#334155; color:#f8fafc;">← Dashboard</button>
      <div style="flex:1"></div>
      <button id="btnExport2" class="me-chip">Export</button>
    </div>

    <div class="me-card">
      <h2 style="margin:0 0 6px;">Year-End Extraction</h2>
      <div style="opacity:0.9;">Close 2026 with clarity, truth, and guidance.</div>
    </div>

    <div class="me-card">
      <label class="me-label">What stayed true?</label>
      <textarea id="y_true" class="me-textarea">${escapeHtml(y.stayedTrue)}</textarea>

      <label class="me-label">What shifted?</label>
      <textarea id="y_shift" class="me-textarea">${escapeHtml(y.shifted)}</textarea>

      <label class="me-label">Decisions that mattered</label>
      <textarea id="y_decisions" class="me-textarea">${escapeHtml(y.decisionsThatMattered)}</textarea>

      <label class="me-label">Identity snapshot</label>
      <textarea id="y_identity" class="me-textarea">${escapeHtml(y.identitySnapshot)}</textarea>

      <hr class="me-hr"/>

      <label class="me-label">Letter to past self (gratitude)</label>
      <textarea id="y_past" class="me-textarea">${escapeHtml(y.letterToPastSelf)}</textarea>

      <label class="me-label">Letter to 2027 self (guidance)</label>
      <textarea id="y_future" class="me-textarea">${escapeHtml(y.letterToFutureSelf)}</textarea>

      <button id="btnSaveYearEnd" class="me-primary">Save Year-End Pages</button>
      <div id="saveMsgY" style="margin-top:8px; opacity:0.85;"></div>
    </div>

    <style>
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
      .me-primary{width:100%; padding:12px; border-radius:10px; border:none; background:#38bdf8; color:#020617; font-size:16px; font-weight:800; margin-top:10px;}
      .me-textarea{width:100%; min-height:110px; padding:12px; border-radius:10px; border:none; margin-top:8px; background:#0b1220; color:#f8fafc;}
      .me-label{display:block; margin-top:10px; opacity:0.9;}
      .me-hr{border:none; border-top:1px solid rgba(255,255,255,0.12); margin:12px 0;}
      .me-chip{background:#0ea5e9; color:#021019; border:none; padding:10px 12px; border-radius:10px; font-weight:800;}
      .me-topbar{display:flex; align-items:center; gap:10px; margin: 10px 0 16px;}
    </style>
  `;
}

function wireYearEnd(state) {
  el("btnBackDash3")?.addEventListener("click", () => {
    state.ui.currentView = "dashboard";
    saveState(state);
    render();
  });

  el("btnExport2")?.addEventListener("click", () => exportData(state));

  el("btnSaveYearEnd")?.addEventListener("click", () => {
    const y = state.workbook.yearEnd;
    y.stayedTrue = el("y_true").value;
    y.shifted = el("y_shift").value;
    y.decisionsThatMattered = el("y_decisions").value;
    y.identitySnapshot = el("y_identity").value;
    y.letterToPastSelf = el("y_past").value;
    y.letterToFutureSelf = el("y_future").value;
    saveState(state);
    el("saveMsgY").textContent = "Saved ✅";
    setTimeout(()=>{ el("saveMsgY").textContent = ""; }, 1200);
  });
}

// ---------- Export ----------
function exportData(state) {
  applyOwnerTitleIfNeeded(state);
  const exportObj = {
    exportedAt: new Date().toISOString(),
    app: "ME App",
    version: "single_2026_v1.1",
    profile: state.profile,
    workbook: state.workbook
  };

  const json = JSON.stringify(exportObj, null, 2);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json).then(() => {
      alert("Export copied to clipboard ✅\n\nPaste it into Notes/Email to save or send.");
    }).catch(() => fallbackDownload(json));
  } else {
    fallbackDownload(json);
  }
}

function fallbackDownload(json) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meapp_export_2026.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Hook into your existing button ----------
function createProfile() {
  const state = ensureState();
  state.ui.currentView = "home";
  applyOwnerTitleIfNeeded(state);
  saveState(state);
  render();
}

// ---------- Boot ----------
(function boot() {
  try { render(); } catch {}
})();
