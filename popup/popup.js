import { getMoods, getMoodById, randomQuoteForMood } from "../shared/moods.js";
import { loadState, setTodayMood, setTodayNote, getTodayEntry } from "../shared/storage.js";
import { $, todayKey } from "../shared/utils.js";
import { fetchProStatus, startCheckout, openPortal } from "../shared/subscription.js";

console.log("Caleya popup.js loaded");

const moodsGrid = $("#moodsGrid");
const miniOrb = $("#miniOrb");
const miniLabel = $("#miniLabel");
const miniQuote = $("#miniQuote");
const energyNote = $("#energyNote");
const saveNoteBtn = $("#saveNote");
const savedHint = $("#savedHint");

// Pro UI elements
const proStatusEl = document.getElementById("proStatus");
const goProBtn = document.getElementById("goProBtn");
const manageBtn = document.getElementById("manageBtn");

let isProCached = false;

/* -----------------------------------------------------
   Mood visuals
----------------------------------------------------- */
function applyMood(mood) {
  miniOrb.style.boxShadow = `0 0 30px ${mood.glow}`;
  miniOrb.style.background = mood.color;
  miniLabel.textContent = mood.label;
  miniQuote.textContent = randomQuoteForMood(mood);
}

/* -----------------------------------------------------
   Mood grid
----------------------------------------------------- */
function renderMoods(selectedId, state) {
  moodsGrid.innerHTML = "";

  const moods = getMoods({
    includeSerendipity: state.serendipityUnlocked,
    customMoods: state.isPro ? state.customMoods : []
  });

  moods.forEach(m => {
    const btn = document.createElement("button");
    btn.className = "mood-btn";
    btn.type = "button";
    btn.dataset.moodId = m.id;

    btn.innerHTML = `
      <div class="swatch" style="background:${m.color}; box-shadow:0 0 10px ${m.glow};"></div>
      <div class="label">${m.label}${m.isEasterEgg ? " ✨" : ""}</div>
    `;

    if (m.id === selectedId) btn.classList.add("selected");

    btn.addEventListener("click", async () => {
      const newState = await setTodayMood(m.id);
      newState.isPro = isProCached;

      const mood = getMoodById(m.id, {
        includeSerendipity: newState.serendipityUnlocked,
        customMoods: newState.isPro ? newState.customMoods : []
      });

      applyMood(mood);
      renderMoods(m.id, newState);
    });

    moodsGrid.appendChild(btn);
  });
}

/* -----------------------------------------------------
   PRO UI + Stripe wiring (handlers FIRST)
----------------------------------------------------- */
async function initProUI() {
  if (!proStatusEl || !goProBtn || !manageBtn) return false;

  // Set a default UI state immediately
  proStatusEl.textContent = "Free plan";
  goProBtn.style.display = "inline-flex";
  manageBtn.style.display = "none";

  // ✅ Attach handlers RIGHT AWAY so click always works
  goProBtn.onclick = async () => {
    goProBtn.disabled = true;
    try {
      await startCheckout();
    } catch (e) {
      console.error("Go Pro click failed:", e);
      alert(e.message || "Stripe checkout failed. Open popup console for details.");
    } finally {
      goProBtn.disabled = false;
    }
  };

  manageBtn.onclick = async () => {
    manageBtn.disabled = true;
    try {
      await openPortal();
    } catch (e) {
      console.error("Portal open failed:", e);
      alert(e.message || "Portal failed. Open popup console for details.");
    } finally {
      manageBtn.disabled = false;
    }
  };

  // Then fetch status (with timeout in subscription.js)
  let status = "free";
  try {
    const res = await fetchProStatus();
    status = res.status || "free";
  } catch (e) {
    status = "free";
  }

  const isPro = status === "pro";
  isProCached = isPro;

  proStatusEl.textContent = isPro ? "Pro active" : "Free plan";
  goProBtn.style.display = isPro ? "none" : "inline-flex";
  manageBtn.style.display = isPro ? "inline-flex" : "none";

  return isPro;
}

/* -----------------------------------------------------
   INIT
----------------------------------------------------- */
async function init() {
  const isPro = await initProUI();

  const state = await loadState();
  state.isPro = isPro;

  const key = todayKey();
  const moodId = state.moodByDate[key] || state.currentMoodId;

  const mood = getMoodById(moodId, {
    includeSerendipity: state.serendipityUnlocked,
    customMoods: state.isPro ? state.customMoods : []
  });

  applyMood(mood);
  renderMoods(moodId, state);

  const entry = await getTodayEntry();
  energyNote.value = entry.note || "";

  saveNoteBtn.addEventListener("click", async () => {
    const note = energyNote.value.trim();
    await setTodayNote(note);
    savedHint.textContent = note ? "Saved." : "Cleared.";
    setTimeout(() => (savedHint.textContent = ""), 1000);
  });
}

init();
