import { getMoods, getMoodById, randomQuoteForMood } from "../shared/moods.js";
import {
  loadState,
  setTodayMood,
  setTodayNote,
  getTodayEntry,
  toggleMinimalMode
} from "../shared/storage.js";
import * as Utils from "../shared/utils.js";
import { fetchProStatus, startCheckout } from "../shared/subscription.js";

/* ---------- Safe fallbacks ---------- */
const $ = Utils.$ || ((sel) => document.querySelector(sel));
const todayKey =
  Utils.todayKey ||
  (() => new Date().toISOString().slice(0, 10));

const formatReadableDate =
  Utils.formatReadableDate ||
  ((key) =>
    new Date(key).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }));

const lastNDatesKeys =
  Utils.lastNDatesKeys ||
  ((n) => {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const c = new Date(d);
      c.setDate(d.getDate() - i);
      out.push(c.toISOString().slice(0, 10));
    }
    return out;
  });

/* ---------- DOM ---------- */
const pageRoot = $("#pageRoot");
const moodsGrid = $("#moodsGrid");
const orb = $("#orb");
const orbIcon = $("#orbIcon");
const orbLabel = $("#orbLabel");
const todayDateEl = $("#todayDate");
const resetMoodBtn = $("#resetMood");

const energyNote = $("#energyNote");
const saveNoteBtn = $("#saveNote");
const savedHint = $("#savedHint");

const todayMoodPill = $("#todayMoodPill");
const streakBadge = $("#streakBadge");
const todayNoteText = $("#todayNoteText");
const dailyQuote = $("#dailyQuote");

const minimalToggle = $("#minimalToggle");

/* Weekly */
const weeklySummary = $("#weeklySummary");
const weeklyBars = $("#weeklyBars");
const weeklyFoot = $("#weeklyFoot");

/* Pro ribbon */
const proRibbon = $("#proRibbon");
const upgradeBtn = $("#upgradeBtn");

/* Pro sections + locks */
const actionSuiteLock = $("#actionSuiteLock");
const actionSuitePreview = $("#actionSuitePreview");
const actionSuiteUpgradeBtn = $("#actionSuiteUpgradeBtn");
const actionSuiteBody = $("#actionSuiteBody");

const insightLock = $("#insightLock");
const insightPreview = $("#insightPreview");
const insightUpgradeBtn = $("#insightUpgradeBtn");
const insightBody = $("#insightBody");

const monthlyLock = $("#monthlyLock");
const monthlyPreview = $("#monthlyPreview");
const monthlyUpgradeBtn = $("#monthlyUpgradeBtn");
const monthlyBody = $("#monthlyBody");

const exportBtn = $("#exportBtn"); // Pro-only tool

let isProCached = false;

/* -----------------------------------------------------
   Pro content (10 variants per tone, rotate daily)
----------------------------------------------------- */
const PRO_ACTION_VARIANTS = {
  calm: [
    { title:"Soft Start", bullets:["Clear one small surface.","Pick one priority for the morning.","Do a 90-second breath reset before starting."], anchor:"Slow is a strategy today." },
    { title:"Quiet Momentum", bullets:["Reduce inputs for 30 minutes.","Finish one lingering task.","Reward yourself with a short walk."], anchor:"Let calm be productive." },
    { title:"Single-Thread Focus", bullets:["Turn off notifications for 45 minutes.","Choose one task and complete it fully.","Write a 1-line win recap."], anchor:"One thing at a time." },
    { title:"Gentle Alignment", bullets:["Check in with your body posture.","Pick the easiest next step.","Say no to one unnecessary thing."], anchor:"Ease creates space." },
    { title:"Uncluttered Mind", bullets:["Brain-dump 10 thoughts.","Circle 1 that matters.","Start there."], anchor:"Clarity comes from landing." },
    { title:"Emotional Ground", bullets:["Name what you’re feeling.","Give yourself permission to feel it.","Choose a tiny next action."], anchor:"Feelings guide, not govern." },
    { title:"Compassion Loop", bullets:["Ask: what do I need right now?","Give yourself 5 minutes of it.","Then begin."], anchor:"Care fuels action." },
    { title:"Clear Edges", bullets:["Set one boundary for today.","Protect a 30-minute block.","Leave room for rest."], anchor:"Boundaries are kindness." },
    { title:"Light Completion", bullets:["Finish one half-done thing.","Put it away.","Enjoy the clean slate."], anchor:"Completion is calming." },
    { title:"Even Pace", bullets:["Work in 25-minute intervals.","Pause for 2 minutes between.","Notice the steadiness."], anchor:"Consistency wins today." }
  ],
  energized: [
    { title:"Momentum Builder", bullets:["Start with your hardest task.","Move fast for 20 minutes.","Capture the win and keep going."], anchor:"Let energy create progress." },
    { title:"Bold First Step", bullets:["Pick the task you’ve been avoiding.","Do the first 5 minutes now.","Ride the spark."], anchor:"Action makes confidence." },
    { title:"Sprint + Recover", bullets:["45 minutes focused push.","10 minutes recharge.","Repeat once."], anchor:"Power needs rhythm." },
    { title:"Visibility Move", bullets:["Share something you’re working on.","Ask for quick feedback.","Keep building."], anchor:"Energy loves connection." },
    { title:"Stack Wins", bullets:["Choose 3 small tasks.","Finish them back-to-back.","Enjoy the surge."], anchor:"Small wins multiply." },
    { title:"Creative Heat", bullets:["Do something slightly risky today.","Ship a draft.","Refine later."], anchor:"Create now, edit later." },
    { title:"Body-Led Boost", bullets:["Take a brisk 8-minute walk.","Come back and start immediately.","Don’t overthink."], anchor:"Motion turns into clarity." },
    { title:"Big Picture Push", bullets:["Ask what matters most this week.","Pick one move that advances it.","Do it today."], anchor:"Aim high, act small." },
    { title:"Make It Loud", bullets:["Put on music.","Set a 30-minute timer.","Blast through a backlog task."], anchor:"Use the fire." },
    { title:"Drive Channel", bullets:["Write your 1-sentence goal.","List 2 supporting moves.","Start move #1 now."], anchor:"Direction gives energy meaning." }
  ],
  focused: [
    { title:"Deep Work Block", bullets:["Schedule a 60-minute no-interrupt block.","One target outcome only.","Close with a 2-line summary."], anchor:"Protect your focus." },
    { title:"Precision List", bullets:["Write your top 3 tasks.","Delete one.","Do the remaining two."], anchor:"Less = sharper." },
    { title:"Single Outcome Day", bullets:["Define the ONE outcome that makes today a win.","Start there.","Finish before noon if you can."], anchor:"One win beats many starts." },
    { title:"Noise Filter", bullets:["Unfollow/ignore one distracting input today.","Reclaim 15 minutes.","Spend it on your goal."], anchor:"Feed focus." },
    { title:"Task Surgery", bullets:["Split your hardest task into 3 steps.","Do step 1 now.","Only think about step 2 after."], anchor:"Small cuts, big shift." },
    { title:"Closing Loop", bullets:["Finish one open loop you’ve carried.","Send the message / file / form.","Close it."], anchor:"Closure clears bandwidth." },
    { title:"Attention Anchor", bullets:["Pick a physical anchor (post-it, tab, timer).","Return to it whenever you drift.","Notice the improvement."], anchor:"Train the lens." },
    { title:"Flow Match", bullets:["Do your most natural task first.","Then the hardest.","Let flow carry you."], anchor:"Ease opens depth." },
    { title:"Boundary Focus", bullets:["Say no to one request.","Protect your block.","Commit guilt-free."], anchor:"Focus is a choice." },
    { title:"Finish Line", bullets:["Pick a finish time for one task.","Work backwards from it.","Cross the line."], anchor:"Deadlines sharpen." }
  ],
  grounded: [
    { title:"Steady Progress", bullets:["Start with a simple routine.","Do one practical task.","Return to center before the next."], anchor:"Stability is movement." },
    { title:"Body Check-In", bullets:["Roll shoulders back.","Plant feet.","Take 3 slow breaths."], anchor:"You are here." },
    { title:"Rooted Planning", bullets:["Write what matters today.","Match it to your energy.","Go slow and sure."], anchor:"Grounded beats rushed." },
    { title:"Hold the Line", bullets:["Pick one boundary.","Stick to it.","Notice how good it feels."], anchor:"Safe edges create freedom." },
    { title:"Practical Wins", bullets:["Do one admin task you’ve delayed.","Clear one clutter spot.","Enjoy the calm."], anchor:"Order supports peace." },
    { title:"Simple Nourish", bullets:["Drink water now.","Eat something steady later.","Protect your basics."], anchor:"Basics are power." },
    { title:"Slow Confidence", bullets:["Start where you are.","Do the next right thing.","Repeat."], anchor:"Trust builds quietly." },
    { title:"Support System", bullets:["Ask for help once today.","Let someone in.","Keep moving."], anchor:"Being supported is grounded." },
    { title:"Stability First", bullets:["Before starting, tidy your space.","Then work.","Then rest."], anchor:"Stability fuels action." },
    { title:"Anchor Task", bullets:["Pick a task that brings you back to life.","Do it early.","Use it as your anchor."], anchor:"Your center knows." }
  ],
  reflective: [
    { title:"Meaning Lens", bullets:["Ask: what is today teaching me?","Write one line.","Act from it."], anchor:"Let reflection guide." },
    { title:"Quiet Review", bullets:["List 3 recent wins.","Name what made them happen.","Do more of that."], anchor:"Patterns are clues." },
    { title:"Emotional Clarity", bullets:["Name your emotion.","Name its need.","Meet it gently."], anchor:"Feelings point forward." },
    { title:"Reframe Move", bullets:["Find one sticky thought.","Write a kinder alternative.","Practice it today."], anchor:"Change starts in language." },
    { title:"Gratitude Thread", bullets:["Write 5 things you appreciate.","Circle 1.","Let it shape your next choice."], anchor:"Appreciation steadies." },
    { title:"Growth Note", bullets:["Ask: where am I evolving?","Write a sentence.","Celebrate it quietly."], anchor:"You’re growing." },
    { title:"Pause + Choose", bullets:["Insert a 5-second pause before decisions.","Ask: what aligns?","Choose that."], anchor:"Slow choices land better." },
    { title:"Past → Present", bullets:["What carried you here?","What are you ready to release?","Write both."], anchor:"Reflection clears weight." },
    { title:"Future Glimpse", bullets:["Write one hope for the next month.","Write one step toward it.","Do the step."], anchor:"Hope is an action." },
    { title:"Self-Trust", bullets:["Recall a time you handled hard things.","Notice your strength.","Bring it to today."], anchor:"You’ve done this before." }
  ]
};

const PRO_INSIGHT_VARIANTS = {
  calm: [
    "Calm days tend to restore clarity. Notice what feels easier when you slow down.",
    "You’re in a tone that supports steady progress, not speed. Let it be enough.",
    "Your nervous system may be asking for spaciousness today. Choose fewer inputs."
  ],
  energized: [
    "When you feel energized, the best move is a clear target. Point the fire.",
    "Energy is a gift — but it burns cleaner with structure. Add one boundary.",
    "Today’s tone makes momentum easy. Start fast on one meaningful thing."
  ],
  focused: [
    "Focused tones shine when you commit to fewer tasks. Protect the lane.",
    "Your attention is sharp today. Use it on something that matters long-term.",
    "When Focused shows up, distractions feel louder. Quiet them early."
  ],
  grounded: [
    "Grounded tones support stability. The basics you do today will compound.",
    "In this tone, small practical moves are powerful. Keep it simple.",
    "Being grounded doesn’t mean still. It means moving from your center."
  ],
  reflective: [
    "Reflective tones help you spot patterns. What’s repeating lately?",
    "You’re in a tone that values meaning. Let your choices be intentional.",
    "Reflection turns experience into wisdom. Capture one lesson today."
  ]
};

/* deterministic daily variant selection */
function dailyIndex(seedStr, len) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return len ? h % len : 0;
}

/* ---------- core helpers ---------- */
function setThemeVars(mood) {
  document.documentElement.style.setProperty("--mood-color", mood.color);
  document.documentElement.style.setProperty("--mood-glow", mood.glow);
}

function applyMood(mood, { animate = true } = {}) {
  setThemeVars(mood);

  if (orb) orb.style.boxShadow = `0 0 70px ${mood.glow}`;
  if (orbLabel) orbLabel.textContent = `${mood.label} • ${mood.vibe}`;

  if (orbIcon) {
    orbIcon.style.filter =
      `drop-shadow(0 10px 25px rgba(0,0,0,0.06)) drop-shadow(0 0 26px ${mood.glow})`;
  }

  if (animate && orb) {
    orb.classList.remove("pulse");
    void orb.offsetWidth;
    orb.classList.add("pulse");
  }

  if (dailyQuote) dailyQuote.textContent = randomQuoteForMood(mood);
}

/* ---------- mood grid ---------- */
function renderMoods(selectedId) {
  if (!moodsGrid) return;
  moodsGrid.innerHTML = "";

  const moods = getMoods({ customMoods: [] });

  moods.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "mood-btn";
    btn.type = "button";
    btn.dataset.moodId = m.id;

    btn.innerHTML = `
      <div class="swatch" style="background:${m.color}; box-shadow: 0 0 18px ${m.glow};"></div>
      <div class="label">${m.label}</div>
    `;

    if (m.id === selectedId) btn.classList.add("selected");

    btn.addEventListener("click", async () => {
      const newState = await setTodayMood(m.id);
      const mood = getMoodById(m.id, { customMoods: [] });

      applyMood(mood);
      renderMoods(m.id);
      renderTodayCard(newState);
      renderWeekly(newState);
      renderProSections(newState);
    });

    moodsGrid.appendChild(btn);
  });
}

/* ---------- streak ---------- */
function computeStreak(state) {
  const keys = lastNDatesKeys(7).reverse();
  const todayId = state.moodByDate[todayKey()] || state.currentMoodId;
  let streak = 0;

  for (const k of keys) {
    const id = state.moodByDate[k];
    if (!id || id !== todayId) break;
    streak++;
  }
  return { todayId, streak };
}

/* ---------- today card ---------- */
async function renderTodayCard(stateMaybe) {
  const state = stateMaybe || await loadState();
  const key = todayKey();
  const moodId = state.moodByDate[key] || state.currentMoodId;
  const note = state.noteByDate[key] || "";
  const mood = getMoodById(moodId, { customMoods: [] });

  if (todayMoodPill) {
    todayMoodPill.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:${mood.color};display:inline-block;"></span>
      ${mood.label}
    `;
  }

  if (todayNoteText) todayNoteText.textContent = note || "No intention saved yet.";

  const { streak } = computeStreak(state);
  if (streakBadge) {
    if (streak >= 3) {
      streakBadge.hidden = false;
      streakBadge.textContent = `${streak}-day ${mood.label} streak`;
    } else {
      streakBadge.hidden = true;
    }
  }
}

/* ---------- weekly ---------- */
function renderWeekly(state) {
  if (!weeklySummary || !weeklyBars || !weeklyFoot) return;

  const keys = lastNDatesKeys(7);
  const ids = keys.map(k => state.moodByDate[k]).filter(Boolean);
  const moods = getMoods({ customMoods: [] });

  if (!ids.length) {
    weeklySummary.textContent = "Your week will take shape as you set tones.";
  } else {
    const counts = {};
    ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = moods.find(m => m.id === sorted[0][0]);
    const topCount = sorted[0][1];

    if (sorted.length === 1) {
      weeklySummary.textContent = `This week leaned ${top.label}.`;
    } else {
      const second = moods.find(m => m.id === sorted[1][0]);
      const secondCount = sorted[1][1];
      weeklySummary.textContent =
        `This week leaned ${top.label} (${topCount}) and ${second.label} (${secondCount}).`;
    }
  }

  weeklyBars.innerHTML = "";
  keys.forEach(k => {
    const id = state.moodByDate[k] || state.currentMoodId;
    const mood = getMoodById(id, { customMoods: [] });

    const bar = document.createElement("div");
    bar.className = "week-bar";
    bar.style.height = `${30 + Math.random() * 45}px`;
    bar.style.setProperty("--bar-color", mood.color);
    bar.style.setProperty("--bar-glow", mood.glow);

    bar.innerHTML = `<div class="dot"></div><div class="label">${k.slice(5)}</div>`;
    weeklyBars.appendChild(bar);
  });

  weeklyFoot.textContent = !ids.length
    ? "Keep setting your tone — your week will fill in here."
    : `You’ve set ${ids.length} tone${ids.length === 1 ? "" : "s"} this week.`;
}

/* ---------- minimal ---------- */
function applyMinimalMode(isMinimal) {
  if (!pageRoot || !minimalToggle) return;
  pageRoot.classList.toggle("minimal", isMinimal);
  minimalToggle.classList.toggle("active", isMinimal);
  minimalToggle.textContent = isMinimal ? "Minimal mode on" : "Minimal mode";
}

/* -----------------------------------------------------
   PRO RENDER + GATING
----------------------------------------------------- */
function renderActionSuite(moodId) {
  if (!actionSuiteBody) return;

  const variants = PRO_ACTION_VARIANTS[moodId] || PRO_ACTION_VARIANTS.calm;
  const idx = dailyIndex(`${todayKey()}::${moodId}::action`, variants.length);
  const v = variants[idx];

  actionSuiteBody.innerHTML = `
    <div class="action-title">${v.title}</div>
    <ul class="action-list">
      ${v.bullets.map(b => `<li>${b}</li>`).join("")}
    </ul>
    <div class="action-anchor">${v.anchor}</div>
  `;
}

function renderInsight(moodId) {
  if (!insightBody) return;

  const variants = PRO_INSIGHT_VARIANTS[moodId] || PRO_INSIGHT_VARIANTS.calm;
  const idx = dailyIndex(`${todayKey()}::${moodId}::insight`, variants.length);
  insightBody.textContent = variants[idx];
}

function renderMonthlyPreview(state) {
  if (!monthlyPreview) return;

  const keys = lastNDatesKeys(30);
  monthlyPreview.innerHTML = "";

  keys.forEach(k => {
    const id = state.moodByDate[k];
    const cell = document.createElement("div");
    cell.className = "mini-cell";

    if (id) {
      const mood = getMoodById(id, { customMoods: [] });
      cell.style.background = mood.color;
      cell.title = mood.label;
    } else {
      cell.style.background = "rgba(0,0,0,0.04)";
      cell.title = "No tone set";
    }

    monthlyPreview.appendChild(cell);
  });
}

function renderMonthlyBody(state) {
  if (!monthlyBody) return;

  const keys = lastNDatesKeys(30);
  const ids = keys.map(k => state.moodByDate[k]).filter(Boolean);
  const moods = getMoods({ customMoods: [] });

  if (!ids.length) {
    monthlyBody.innerHTML = `<div class="muted">No tones set yet this month.</div>`;
    return;
  }

  const counts = {};
  ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);

  const top3 = sorted.slice(0,3).map(([id,c])=>{
    const m = moods.find(x=>x.id===id);
    return { mood: m, count:c };
  });

  monthlyBody.innerHTML = `
    <div class="monthly-top">
      ${top3.map(t => `
        <div class="monthly-pill">
          <span class="dot" style="background:${t.mood.color}"></span>
          <span>${t.mood.label}</span>
          <span class="count">${t.count}</span>
        </div>
      `).join("")}
    </div>
    <div class="monthly-note">
      You set ${ids.length} tone${ids.length===1?"":"s"} in the last 30 days.
    </div>
  `;
}

function renderProSections(state) {
  const moodId = state.moodByDate[todayKey()] || state.currentMoodId;

  renderMonthlyPreview(state);

  if (state.isPro) {
    if (actionSuiteLock) actionSuiteLock.hidden = true;
    if (actionSuiteBody) {
      actionSuiteBody.hidden = false;
      renderActionSuite(moodId);
    }

    if (insightLock) insightLock.hidden = true;
    if (insightBody) {
      insightBody.hidden = false;
      renderInsight(moodId);
    }

    if (monthlyLock) monthlyLock.hidden = true;
    if (monthlyBody) {
      monthlyBody.hidden = false;
      renderMonthlyBody(state);
    }

    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.title = "";
    }
  } else {
    if (actionSuiteLock) actionSuiteLock.hidden = false;
    if (actionSuiteBody) actionSuiteBody.hidden = true;

    if (insightLock) insightLock.hidden = false;
    if (insightBody) insightBody.hidden = true;

    if (monthlyLock) monthlyLock.hidden = false;
    if (monthlyBody) monthlyBody.hidden = true;

    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.title = "Pro required";
    }
  }

  // Fill blur previews
  if (actionSuitePreview) {
    const variants = PRO_ACTION_VARIANTS[moodId] || PRO_ACTION_VARIANTS.calm;
    const idx = dailyIndex(`${todayKey()}::${moodId}::action`, variants.length);
    const v = variants[idx];
    actionSuitePreview.innerHTML = `${v.title}<br/>${v.bullets.slice(0,2).join(" • ")}`;
  }

  if (insightPreview) {
    const variants = PRO_INSIGHT_VARIANTS[moodId] || PRO_INSIGHT_VARIANTS.calm;
    const idx = dailyIndex(`${todayKey()}::${moodId}::insight`, variants.length);
    insightPreview.textContent = variants[idx];
  }
}

/* -----------------------------------------------------
   PRO EXPORT (1-page recap)
----------------------------------------------------- */
function buildOnePageRecapHTML(state) {
  const keys = lastNDatesKeys(30);
  const entries = keys.map(k => {
    const id = state.moodByDate[k];
    if (!id) return null;
    const mood = getMoodById(id, { customMoods: [] });
    const note = state.noteByDate[k] || "";
    return { dateKey: k, mood, note };
  }).filter(Boolean);

  const moods = getMoods({ customMoods: [] });
  const counts = {};
  entries.forEach(e => counts[e.mood.id] = (counts[e.mood.id] || 0) + 1);
  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  const top3 = sorted.slice(0,3).map(([id,c])=>{
    const m = moods.find(x=>x.id===id);
    return { mood: m, count:c };
  });

  const titleMonth = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Caleya Monthly Recap</title>
  <style>
    body{
      font-family: system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      margin: 32px;
      color:#0b0f1a;
    }
    h1{ margin:0 0 6px 0; font-size:22px; }
    .sub{ color:#6a7396; font-size:13px; margin-bottom:18px; }
    .top3{ display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
    .pill{
      display:inline-flex; align-items:center; gap:8px;
      background:#f6f7fb; border:1px solid rgba(0,0,0,0.06);
      padding:6px 10px; border-radius:999px; font-size:13px;
    }
    .dot{ width:10px;height:10px;border-radius:50%; }
    table{ width:100%; border-collapse:collapse; font-size:12.5px; }
    th,td{ text-align:left; padding:8px 6px; border-bottom:1px solid #eee; vertical-align:top; }
    th{ font-size:12px; color:#6a7396; font-weight:600; }
    .mood-cell{
      display:inline-flex; align-items:center; gap:6px; font-weight:600;
    }
    .note{ color:#141a2b; }
    .muted{ color:#6a7396; }
    @media print{
      body{ margin: 18px; }
    }
  </style>
</head>
<body>
  <h1>Caleya Monthly Recap</h1>
  <div class="sub">${titleMonth} • ${entries.length} tones set</div>

  <div class="top3">
    ${top3.map(t=>`
      <div class="pill">
        <span class="dot" style="background:${t.mood.color}"></span>
        ${t.mood.label} (${t.count})
      </div>
    `).join("")}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:110px;">Date</th>
        <th style="width:140px;">Tone</th>
        <th>Intention</th>
      </tr>
    </thead>
    <tbody>
      ${entries.map(e=>`
        <tr>
          <td>${new Date(e.dateKey).toLocaleDateString()}</td>
          <td>
            <span class="mood-cell">
              <span class="dot" style="background:${e.mood.color}"></span>
              ${e.mood.label}
            </span>
          </td>
          <td class="note">${e.note || `<span class="muted">—</span>`}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <script>
    window.onload = () => {
      setTimeout(()=>window.print(), 250);
    }
  </script>
</body>
</html>
`;
}

function runExport(state) {
  const html = buildOnePageRecapHTML(state);

  const w = window.open("", "_blank");
  if (!w) {
    alert("Pop-up blocked. Allow pop-ups for Caleya to export.");
    return;
  }

  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* ---------- Pro wiring ---------- */
async function initProUI(state) {
  // Wire upgrade CTAs to checkout
  const upgradeButtons = [
    upgradeBtn,
    actionSuiteUpgradeBtn,
    insightUpgradeBtn,
    monthlyUpgradeBtn
  ].filter(Boolean);

  upgradeButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await startCheckout();
      } catch (e) {
        console.error("Checkout failed:", e);
        alert(e.message || "Stripe checkout failed.");
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Export button special handling
  exportBtn?.addEventListener("click", async () => {
    if (!state.isPro) {
      await startCheckout();
      return;
    }
    runExport(state);
  });

  // Fetch status safely
  let status = "free";
  try {
    const res = await fetchProStatus();
    status = res.status || "free";
  } catch {}

  const isPro = status === "pro";
  isProCached = isPro;

  if (proRibbon) proRibbon.hidden = isPro;
  if (upgradeBtn) upgradeBtn.style.display = isPro ? "none" : "inline-flex";

  return isPro;
}

/* ---------- init ---------- */
async function init() {
  try {
    let state = await loadState();

    const isPro = await initProUI(state);
    state.isPro = isPro;

    const entry = await getTodayEntry();
    if (todayDateEl) todayDateEl.textContent = formatReadableDate(entry.dateKey);

    const mood = getMoodById(entry.moodId, { customMoods: [] });
    applyMood(mood, { animate: false });
    renderMoods(entry.moodId);

    if (energyNote) energyNote.value = entry.note || "";
    applyMinimalMode(entry.minimalMode);

    saveNoteBtn?.addEventListener("click", async () => {
      const note = (energyNote?.value || "").trim();
      state = await setTodayNote(note);
      if (savedHint) {
        savedHint.textContent = note ? "Saved." : "Cleared.";
        setTimeout(() => (savedHint.textContent = ""), 1200);
      }
      renderTodayCard(state);
      renderWeekly(state);
      renderProSections(state);
    });

    resetMoodBtn?.addEventListener("click", async () => {
      state = await setTodayMood("calm");
      const m = getMoodById("calm", { customMoods: [] });

      applyMood(m);
      renderMoods("calm");
      renderTodayCard(state);
      renderWeekly(state);
      renderProSections(state);
    });

    minimalToggle?.addEventListener("click", async () => {
      state = await toggleMinimalMode();
      applyMinimalMode(state.minimalMode);
    });

    await renderTodayCard(state);
    renderWeekly(state);
    renderProSections(state);
  } catch (err) {
    console.error("Caleya newtab.js init crashed:", err);
  }
}

init();
