// ME App — 2026 Workbook (Single User) v1.6
// - Autosaves every keystroke (debounced)
// - Adds Daily + Weekly logging inside each month
// - Keeps Monthly reflection/expression/relationships + decision matrix + alignment + identity wheel (visual)
// - Prevents losing typed text when navigating back/forth

const STORAGE_KEY = "meapp_single_2026_v1";
const YEAR = 2026;

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

const WHEEL_KEYS = [
  ["selfExpression", "Self-Expression"],
  ["courage", "Courage"],
  ["boundaries", "Boundaries"],
  ["creativity", "Creativity"],
  ["relationships", "Relationships"],
  ["discipline", "Discipline"]
];

// ---------- Storage ----------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function debounce(fn, wait=250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
const autosave = debounce((state) => saveState(state), 250);

function buildEmptyMonth(name) {
  return {
    theme: DEFAULT_MONTH_THEMES[name] || "",
    // Monthly
    reflection: "",
    expression: "",
    relationships: "",
    alignmentScore: 50,
    decision: { prompt:"", fear:"", costOfInaction:"", alignedAction:"", smallestStep:"" },
    identityWheel: { selfExpression:5, courage:5, boundaries:5, creativity:5, relationships:5, discipline:5 },
    // Daily & Weekly
    dailyLogs: {}, // { "YYYY-MM-DD": "text" }
    weeklyLogs: { week1:"", week2:"", week3:"", week4:"", week5:"" },
    // UI helpers (remember last selected day/week inside the month)
    _uiDailyDate: "",
    _uiWeeklyKey: "week1"
  };
}

function buildEmptyWorkbook() {
  const months = {};
  MONTHS.forEach(m => months[m] = buildEmptyMonth(m));
  return {
    year: YEAR,
    title: "2026 Personal Workbook",
    themeLine: "",
    profileInsights: {
      lifePath: null,
      birthdayNumber: null,
      personalYear: null,
      sunSign: "",
      chineseZodiac: { element: "", animal: "" }
    },
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

function migrate(state) {
  if (!state.ui) state.ui = { currentView: "home", currentMonth: "January" };
  if (!state.workbook) state.workbook = buildEmptyWorkbook();
  if (!state.workbook.months) state.workbook.months = {};

  MONTHS.forEach(m => {
    if (!state.workbook.months[m]) state.workbook.months[m] = buildEmptyMonth(m);
    const mm = state.workbook.months[m];

    if (!mm.decision) mm.decision = { prompt:"", fear:"", costOfInaction:"", alignedAction:"", smallestStep:"" };
    if (!mm.identityWheel) mm.identityWheel = { selfExpression:5, courage:5, boundaries:5, creativity:5, relationships:5, discipline:5 };
    WHEEL_KEYS.forEach(([k]) => { if (mm.identityWheel[k] === undefined) mm.identityWheel[k] = 5; });

    if (mm.alignmentScore === undefined) mm.alignmentScore = 50;
    if (!mm.dailyLogs) mm.dailyLogs = {};
    if (!mm.weeklyLogs) mm.weeklyLogs = { week1:"", week2:"", week3:"", week4:"", week5:"" };
    if (!mm._uiWeeklyKey) mm._uiWeeklyKey = "week1";
    if (mm._uiDailyDate === undefined) mm._uiDailyDate = "";
    if (mm.reflection === undefined) mm.reflection = "";
    if (mm.expression === undefined) mm.expression = "";
    if (mm.relationships === undefined) mm.relationships = "";
    if (!mm.theme) mm.theme = DEFAULT_MONTH_THEMES[m] || "";
  });

  if (!state.workbook.yearEnd) {
    state.workbook.yearEnd = {
      stayedTrue:"", shifted:"", decisionsThatMattered:"", identitySnapshot:"",
      letterToPastSelf:"", letterToFutureSelf:""
    };
  }
}

function ensureState() {
  let s = loadState();
  if (!s) {
    s = { profile:null, workbook:buildEmptyWorkbook(), ui:{ currentView:"home", currentMonth:"January" } };
    saveState(s);
  } else {
    migrate(s);
    saveState(s);
  }
  return s;
}

function hardResetAll() {
  localStorage.removeItem(STORAGE_KEY);
  return ensureState();
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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function alignmentLabel(score) {
  if (score >= 85) return "Fully Aligned";
  if (score >= 70) return "Mostly Aligned";
  if (score >= 50) return "Mixed / In Progress";
  if (score >= 30) return "Off Track / Draining";
  return "Silencing Myself";
}

function monthProgressSummary(m) {
  const hasDaily = Object.values(m.dailyLogs || {}).some(v => String(v||"").trim());
  const hasWeekly = Object.values(m.weeklyLogs || {}).some(v => String(v||"").trim());
  const filled =
    (m.reflection?.trim()?1:0) +
    (m.expression?.trim()?1:0) +
    (m.relationships?.trim()?1:0) +
    (m.decision?.prompt?.trim()?1:0) +
    (hasDaily?1:0) +
    (hasWeekly?1:0);
  return `${filled}/6 areas touched`;
}

function wheelAverage(w) {
  const vals = WHEEL_KEYS.map(([k]) => Number(w[k] ?? 0));
  const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
  return Math.round(avg * 10) / 10;
}

// ---------- Identity Wheel Drawing (Canvas radar chart) ----------
function drawIdentityWheel(canvas, wheelValues, options={}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const cssW = options.size || 280;
  const cssH = options.size || 280;
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);

  ctx.clearRect(0,0,cssW,cssH);

  const cx = cssW/2, cy = cssH/2;
  const radius = Math.min(cssW, cssH) * 0.36;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";

  const rings = 5;
  for (let r=1; r<=rings; r++){
    const rr = radius * (r/rings);
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI*2);
    ctx.stroke();
  }

  const n = WHEEL_KEYS.length;
  for (let i=0;i<n;i++){
    const ang = (-Math.PI/2) + (i*(2*Math.PI/n));
    const x = cx + radius * Math.cos(ang);
    const y = cy + radius * Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(248,250,252,0.85)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  WHEEL_KEYS.forEach(([,label], i) => {
    const ang = (-Math.PI/2) + (i*(2*Math.PI/n));
    const lx = cx + (radius*1.18) * Math.cos(ang);
    const ly = cy + (radius*1.18) * Math.sin(ang);
    const metrics = ctx.measureText(label);

    let tx = lx - metrics.width/2;
    let ty = ly + 4;
    if (lx < cx - radius*0.2) tx = lx - metrics.width;
    if (lx > cx + radius*0.2) tx = lx;
    if (Math.abs(ly - cy) < 10) ty = ly + 14;

    ctx.fillText(label, tx, ty);
  });

  const getVal = (key) => Math.max(0, Math.min(10, Number(wheelValues[key] ?? 0)));
  const pts = WHEEL_KEYS.map(([k], i) => {
    const v = getVal(k) / 10;
    const ang = (-Math.PI/2) + (i*(2*Math.PI/n));
    return { x: cx + (radius * v) * Math.cos(ang), y: cy + (radius * v) * Math.sin(ang) };
  });

  ctx.beginPath();
  pts.forEach((p, i) => { if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
  ctx.closePath();
  ctx.fillStyle = "rgba(56,189,248,0.18)";
  ctx.fill();

  ctx.strokeStyle = "rgba(56,189,248,0.75)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(56,189,248,0.95)";
  pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x,p.y, 3, 0, Math.PI*2); ctx.fill(); });
}

// ---------- Render ----------
function render() {
  const state = ensureState();
  const container = el("output") || el("app") || document.body;

  if (state.ui.currentView === "home") {
    container.innerHTML = renderHome(state);
    wireHome(state);
    return;
  }

  if (!state.profile) {
    state.ui.currentView = "home";
    autosave(state);
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
  autosave(state);
  container.innerHTML = renderDashboard(state);
  wireDashboard(state);
}

function renderHome(state) {
  return `
    <div class="me-card">
      <h2>ME App</h2>
      <p><strong>${escapeHtml(state.workbook.title)}</strong></p>
      <p>Autosave is ON. You can type without losing anything.</p>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
        <button id="btnStart" style="flex:1; min-width:160px;">Open 2026 Dashboard</button>
        <button id="btnReset" style="flex:1; min-width:160px; background:#ef4444; color:#fff;">Reset Data</button>
      </div>
    </div>

    <div class="me-card">
      <h3>Profile</h3>
      <div style="opacity:.85; font-size:14px; margin-bottom:8px;">
        Use the Name / Birthdate fields above, then tap Open.
      </div>
    </div>

    <style>
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
    </style>
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
    state.ui.currentView = "dashboard";
    autosave(state);
    render();
  });

  el("btnReset")?.addEventListener("click", () => {
    const ok = confirm("Reset all ME App data on this device? This cannot be undone.");
    if (!ok) return;
    hardResetAll();
    render();
  });
}

function renderDashboard(state) {
  const monthCards = MONTHS.map(m => {
    const mm = state.workbook.months[m];
    return `
      <button class="me-month" data-month="${m}">
        <div class="me-month-title">${m}</div>
        <div class="me-month-sub">Theme: ${escapeHtml(mm.theme)}</div>
        <div class="me-month-sub">${monthProgressSummary(mm)} • Alignment: ${mm.alignmentScore}/100 • Wheel avg: ${wheelAverage(mm.identityWheel)}</div>
      </button>
    `;
  }).join("");

  return `
    <div class="me-topbar">
      <div class="me-h1">Dashboard</div>
      <div style="display:flex; gap:10px;">
        <button id="btnYearEnd" class="me-chip">Year-End</button>
        <button id="btnExport" class="me-chip">Export</button>
      </div>
    </div>

    <div class="me-card">
      <h3>Months</h3>
      <div class="me-months">${monthCards}</div>
    </div>

    <style>
      .me-topbar{display:flex; justify-content:space-between; align-items:center; gap:12px; margin: 10px 0 16px;}
      .me-h1{font-size:26px; font-weight:900;}
      .me-chip{background:#0ea5e9; color:#021019; border:none; padding:10px 12px; border-radius:10px; font-weight:900;}
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
      .me-months{display:grid; grid-template-columns:1fr; gap:10px;}
      .me-month{width:100%; text-align:left; padding:14px; border:none; border-radius:12px; background:#0b1220; color:#f8fafc;}
      .me-month-title{font-size:18px; font-weight:900; margin-bottom:4px;}
      .me-month-sub{opacity:0.85; font-size:14px;}
      @media(min-width:650px){ .me-months{grid-template-columns:1fr 1fr;} }
    </style>
  `;
}

function wireDashboard(state) {
  el("btnYearEnd")?.addEventListener("click", () => {
    state.ui.currentView = "yearEnd";
    autosave(state);
    render();
  });

  el("btnExport")?.addEventListener("click", () => exportData(state));

  document.querySelectorAll(".me-month").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.currentMonth = btn.getAttribute("data-month");
      state.ui.currentView = "month";
      autosave(state);
      render();
    });
  });
}

function renderMonth(state) {
  const name = state.ui.currentMonth;
  const m = state.workbook.months[name];

  const dailyDate = m._uiDailyDate || todayISO();
  const dailyText = m.dailyLogs[dailyDate] || "";
  const weeklyKey = m._uiWeeklyKey || "week1";
  const weeklyText = m.weeklyLogs[weeklyKey] || "";

  return `
    <div class="me-topbar">
      <button id="btnBackDash" class="me-chip" style="background:#334155; color:#f8fafc;">← Dashboard</button>
      <div style="flex:1"></div>
      <button id="btnYearEnd2" class="me-chip">Year-End</button>
    </div>

    <div class="me-card">
      <h2 style="margin:0 0 6px;">${escapeHtml(name)}</h2>
      <div style="opacity:0.85; font-size:14px;">Autosave ON — everything you type is saved.</div>
    </div>

    <div class="me-card">
      <h3>Identity Wheel</h3>
      <div style="opacity:.85; margin-bottom:8px;">Average: <strong>${wheelAverage(m.identityWheel)}</strong>/10</div>
      <canvas id="monthWheel"></canvas>
    </div>

    <div class="me-card">
      <h3>Daily Log</h3>
      <label class="me-label">Date</label>
      <input id="dailyDate" type="date" value="${escapeHtml(dailyDate)}" />
      <label class="me-label">Entry</label>
      <textarea id="dailyText" class="me-textarea">${escapeHtml(dailyText)}</textarea>
    </div>

    <div class="me-card">
      <h3>Weekly Log</h3>
      <label class="me-label">Week</label>
      <select id="weeklyKey" class="me-select">
        ${["week1","week2","week3","week4","week5"].map(k => `
          <option value="${k}" ${k===weeklyKey?"selected":""}>${k.toUpperCase()}</option>
        `).join("")}
      </select>
      <label class="me-label">Entry</label>
      <textarea id="weeklyText" class="me-textarea">${escapeHtml(weeklyText)}</textarea>
    </div>

    <div class="me-card">
      <h3>Monthly Reflection</h3>
      <textarea id="reflection" class="me-textarea">${escapeHtml(m.reflection)}</textarea>

      <h3>Expression</h3>
      <textarea id="expression" class="me-textarea">${escapeHtml(m.expression)}</textarea>

      <h3>Relationships</h3>
      <textarea id="relationships" class="me-textarea">${escapeHtml(m.relationships)}</textarea>
    </div>

    <div class="me-card">
      <h3>Alignment Meter</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div><strong id="alignLabel">${alignmentLabel(m.alignmentScore)}</strong></div>
        <div><strong id="alignScore">${m.alignmentScore}</strong>/100</div>
      </div>
      <input id="alignment" type="range" min="0" max="100" value="${m.alignmentScore}" style="width:100%; margin-top:10px;">
    </div>

    <div class="me-card">
      <h3>Decision Matrix</h3>
      <label class="me-label">Decision</label>
      <textarea id="d_prompt" class="me-textarea">${escapeHtml(m.decision.prompt)}</textarea>

      <label class="me-label">Fear</label>
      <textarea id="d_fear" class="me-textarea">${escapeHtml(m.decision.fear)}</textarea>

      <label class="me-label">Cost of inaction</label>
      <textarea id="d_cost" class="me-textarea">${escapeHtml(m.decision.costOfInaction)}</textarea>

      <label class="me-label">Aligned action</label>
      <textarea id="d_action" class="me-textarea">${escapeHtml(m.decision.alignedAction)}</textarea>

      <label class="me-label">Smallest step</label>
      <textarea id="d_step" class="me-textarea">${escapeHtml(m.decision.smallestStep)}</textarea>
    </div>

    <div class="me-card">
      <h3>Identity Wheel Sliders</h3>
      ${WHEEL_KEYS.map(([key,label]) => `
        <div class="wheel-row" data-wheel="${key}">
          <div class="wheel-title">${escapeHtml(label)}</div>
          <input type="range" min="0" max="10" value="${Number(m.identityWheel[key] ?? 0)}" class="wheel-slider" style="width:100%;">
          <div class="wheel-meta">
            <span>0</span>
            <span><strong class="wheel-val">${Number(m.identityWheel[key] ?? 0)}</strong>/10</span>
            <span>10</span>
          </div>
        </div>
      `).join("")}
    </div>

    <style>
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
      .me-textarea{width:100%; min-height:110px; padding:12px; border-radius:10px; border:none; margin-top:8px; background:#0b1220; color:#f8fafc;}
      .me-label{display:block; margin-top:10px; opacity:0.9; font-weight:900;}
      .me-select{width:100%; padding:12px; border-radius:10px; border:none; margin-top:8px; background:#0b1220; color:#f8fafc;}
      .me-chip{background:#0ea5e9; color:#021019; border:none; padding:10px 12px; border-radius:10px; font-weight:900;}
      .me-topbar{display:flex; align-items:center; gap:10px; margin: 10px 0 16px; flex-wrap:wrap;}
      .wheel-row{background:#0b1220; padding:12px; border-radius:10px; margin-top:10px;}
      .wheel-title{font-weight:900; margin-bottom:6px;}
      .wheel-meta{display:flex; justify-content:space-between; opacity:0.85; font-size:14px;}
    </style>
  `;
}

function wireMonth(state) {
  const name = state.ui.currentMonth;
  const m = state.workbook.months[name];

  el("btnBackDash")?.addEventListener("click", () => {
    state.ui.currentView = "dashboard";
    autosave(state);
    render();
  });

  el("btnYearEnd2")?.addEventListener("click", () => {
    state.ui.currentView = "yearEnd";
    autosave(state);
    render();
  });

  // Draw wheel initial
  drawIdentityWheel(el("monthWheel"), m.identityWheel, { size: 280 });

  // bind autosave helper
  const bind = (id, setter) => {
    const node = el(id);
    node?.addEventListener("input", () => { setter(node.value); autosave(state); });
  };

  // Daily
  const dailyDate = el("dailyDate");
  const dailyText = el("dailyText");
  dailyDate?.addEventListener("change", () => {
    m._uiDailyDate = dailyDate.value || todayISO();
    autosave(state);
    render(); // refresh displayed dailyText for that date
  });
  dailyText?.addEventListener("input", () => {
    const d = (dailyDate?.value || m._uiDailyDate || todayISO());
    m.dailyLogs[d] = dailyText.value;
    autosave(state);
  });

  // Weekly
  const weeklyKey = el("weeklyKey");
  const weeklyText = el("weeklyText");
  weeklyKey?.addEventListener("change", () => {
    m._uiWeeklyKey = weeklyKey.value || "week1";
    autosave(state);
    render();
  });
  weeklyText?.addEventListener("input", () => {
    const k = (weeklyKey?.value || m._uiWeeklyKey || "week1");
    m.weeklyLogs[k] = weeklyText.value;
    autosave(state);
  });

  // Monthly text areas
  bind("reflection", (v)=> m.reflection = v);
  bind("expression", (v)=> m.expression = v);
  bind("relationships", (v)=> m.relationships = v);

  // Decision matrix
  bind("d_prompt", (v)=> m.decision.prompt = v);
  bind("d_fear", (v)=> m.decision.fear = v);
  bind("d_cost", (v)=> m.decision.costOfInaction = v);
  bind("d_action", (v)=> m.decision.alignedAction = v);
  bind("d_step", (v)=> m.decision.smallestStep = v);

  // Alignment
  const align = el("alignment");
  align?.addEventListener("input", () => {
    const v = Number(align.value);
    m.alignmentScore = v;
    el("alignScore").textContent = String(v);
    el("alignLabel").textContent = alignmentLabel(v);
    autosave(state);
  });

  // Wheel sliders
  document.querySelectorAll(".wheel-row").forEach(row => {
    const key = row.getAttribute("data-wheel");
    const slider = row.querySelector(".wheel-slider");
    const valEl = row.querySelector(".wheel-val");
    slider?.addEventListener("input", () => {
      valEl.textContent = String(slider.value);
      m.identityWheel[key] = Number(slider.value);
      drawIdentityWheel(el("monthWheel"), m.identityWheel, { size: 280 });
      autosave(state);
    });
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
      <h2>Year-End Extraction</h2>
      <div style="opacity:.85;">Autosave ON here too.</div>
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

      <label class="me-label">Letter to past self</label>
      <textarea id="y_past" class="me-textarea">${escapeHtml(y.letterToPastSelf)}</textarea>

      <label class="me-label">Letter to 2027 self</label>
      <textarea id="y_future" class="me-textarea">${escapeHtml(y.letterToFutureSelf)}</textarea>
    </div>

    <style>
      .me-card{background:#1e293b; padding:16px; border-radius:12px; margin-bottom:12px;}
      .me-textarea{width:100%; min-height:110px; padding:12px; border-radius:10px; border:none; margin-top:8px; background:#0b1220; color:#f8fafc;}
      .me-label{display:block; margin-top:10px; opacity:0.9; font-weight:900;}
      .me-chip{background:#0ea5e9; color:#021019; border:none; padding:10px 12px; border-radius:10px; font-weight:900;}
      .me-topbar{display:flex; align-items:center; gap:10px; margin: 10px 0 16px; flex-wrap:wrap;}
    </style>
  `;
}

function wireYearEnd(state) {
  el("btnBackDash3")?.addEventListener("click", () => {
    state.ui.currentView = "dashboard";
    autosave(state);
    render();
  });

  el("btnExport2")?.addEventListener("click", () => exportData(state));

  const bind = (id, setter) => {
    const node = el(id);
    node?.addEventListener("input", () => { setter(node.value); autosave(state); });
  };

  bind("y_true", (v)=> state.workbook.yearEnd.stayedTrue = v);
  bind("y_shift", (v)=> state.workbook.yearEnd.shifted = v);
  bind("y_decisions", (v)=> state.workbook.yearEnd.decisionsThatMattered = v);
  bind("y_identity", (v)=> state.workbook.yearEnd.identitySnapshot = v);
  bind("y_past", (v)=> state.workbook.yearEnd.letterToPastSelf = v);
  bind("y_future", (v)=> state.workbook.yearEnd.letterToFutureSelf = v);
}

// ---------- Export ----------
function exportData(state) {
  const exportObj = {
    exportedAt: new Date().toISOString(),
    app: "ME App",
    version: "single_2026_v1.6_autosave_daily_weekly_monthly",
    profile: state.profile,
    workbook: state.workbook
  };

  const json = JSON.stringify(exportObj, null, 2);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json).then(() => {
      alert("Export copied to clipboard ✅\n\nPaste into Notes/Email to save or send.");
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

// ---------- Boot ----------
(function boot() {
  try { render(); } catch {}
})();
