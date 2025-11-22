import { todayKey } from "./utils.js";

const DEFAULT_STATE = {
  currentMoodId: "calm",
  noteByDate: {},
  moodByDate: {},
  changeCount: 0,
  minimalMode: false,
  serendipityUnlocked: false,

  // PRO scaffolding
  isPro: false,
  customMoods: [],  // [{id,label,vibe,color,glow,quotes:[]}]
  themeId: "default"
};

export async function loadState() {
  const { caleyaState } = await chrome.storage.local.get("caleyaState");
  return { ...DEFAULT_STATE, ...(caleyaState || {}) };
}

export async function saveState(state) {
  await chrome.storage.local.set({ caleyaState: state });
}

export async function setTodayMood(moodId) {
  const state = await loadState();
  const key = todayKey();

  const prev = state.moodByDate[key] || state.currentMoodId;
  if (prev !== moodId) {
    state.changeCount += 1;
    if (!state.serendipityUnlocked && state.changeCount >= 50) {
      state.serendipityUnlocked = true;
    }
  }

  state.currentMoodId = moodId;
  state.moodByDate[key] = moodId;

  await saveState(state);
  return state;
}

export async function setTodayNote(note) {
  const state = await loadState();
  const key = todayKey();
  state.noteByDate[key] = note;
  await saveState(state);
  return state;
}

export async function getTodayEntry() {
  const state = await loadState();
  const key = todayKey();
  return {
    dateKey: key,
    moodId: state.moodByDate[key] || state.currentMoodId,
    note: state.noteByDate[key] || "",
    minimalMode: state.minimalMode,
    serendipityUnlocked: state.serendipityUnlocked,
    isPro: state.isPro,
    customMoods: state.customMoods,
    themeId: state.themeId
  };
}

export async function toggleMinimalMode() {
  const state = await loadState();
  state.minimalMode = !state.minimalMode;
  await saveState(state);
  return state;
}

/* ---------- PRO: dev toggle + custom moods ---------- */

export async function devTogglePro() {
  const state = await loadState();
  state.isPro = !state.isPro;
  await saveState(state);
  return state;
}

export async function addCustomMood(mood) {
  const state = await loadState();
  state.customMoods = [...state.customMoods, mood];
  await saveState(state);
  return state;
}

export async function removeCustomMood(id) {
  const state = await loadState();
  state.customMoods = state.customMoods.filter(m => m.id !== id);
  await saveState(state);
  return state;
}

export async function setTheme(themeId) {
  const state = await loadState();
  state.themeId = themeId;
  await saveState(state);
  return state;
}
