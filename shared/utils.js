export function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatReadableDate(dStr) {
  const d = new Date(dStr);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

export function lastNDatesKeys(n = 7) {
  const keys = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    const yyyy = dd.getFullYear();
    const mm = String(dd.getMonth() + 1).padStart(2, "0");
    const day = String(dd.getDate()).padStart(2, "0");
    keys.push(`${yyyy}-${mm}-${day}`);
  }
  return keys.reverse();
}

export function monthKeys({ year, month }) {
  // month: 0-11
  const keys = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    keys.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}
export function $all(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
