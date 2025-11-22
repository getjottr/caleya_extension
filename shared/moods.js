// shared/moods.js
// Caleya core moods (curated 5) — Serendipity removed

const CORE_MOODS = [
  {
    id: "calm",
    label: "Calm",
    vibe: "steady & clear",
    color: "#8FCBFF",
    glow: "rgba(143,203,255,0.55)",
    quotes: [
      "Soft is still strong.",
      "Let today be spacious.",
      "Breathe first. Then begin.",
      "Move gently, with intention."
    ]
  },
  {
    id: "energized",
    label: "Energized",
    vibe: "alive & driven",
    color: "#7FE3C1",
    glow: "rgba(127,227,193,0.55)",
    quotes: [
      "Your energy is a gift. Aim it well.",
      "Light the match, then take the step.",
      "Build momentum from one small win."
    ]
  },
  {
    id: "focused",
    label: "Focused",
    vibe: "locked in",
    color: "#BCAEFF",
    glow: "rgba(188,174,255,0.55)",
    quotes: [
      "One thing at a time counts.",
      "Clarity beats speed.",
      "Give your attention a home."
    ]
  },
  {
    id: "grounded",
    label: "Grounded",
    vibe: "safe & centered",
    color: "#F4D97A",
    glow: "rgba(244,217,122,0.55)",
    quotes: [
      "You are allowed to be here.",
      "Root before you rise.",
      "Steady is a kind of progress."
    ]
  },
  {
    id: "reflective",
    label: "Reflective",
    vibe: "quiet clarity",
    color: "#F6B8D2",
    glow: "rgba(246,184,210,0.50)",
    quotes: [
      "Notice what your day is teaching you.",
      "Let the signal surface slowly.",
      "There’s wisdom in the pause."
    ]
  }
];

// Public API — keep these signatures so the rest of the app doesn’t break
export function getMoods(opts = {}) {
  const { customMoods = [] } = opts;
  return [...CORE_MOODS, ...(customMoods || [])];
}

export function getMoodById(id, opts = {}) {
  const list = getMoods(opts);
  return list.find(m => m.id === id) || CORE_MOODS[0];
}

export function randomQuoteForMood(mood) {
  const quotes = mood?.quotes || [];
  if (!quotes.length) return "";
  return quotes[Math.floor(Math.random() * quotes.length)];
}
