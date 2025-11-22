// shared/subscription.js
import { getUserId } from "./userId.js";

const WORKER_BASE = "https://caleya.getjottr.workers.dev";
const TIMEOUT_MS = 8000;

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

export async function fetchProStatus() {
  const userId = await getUserId();
  try {
    const r = await fetchWithTimeout(
      `${WORKER_BASE}/status?userId=${encodeURIComponent(userId)}`
    );
    if (!r.ok) return { status: "free", isPro: false };
    const data = await r.json();
    return {
      status: data.status || "free",
      isPro: !!data.isPro || data.status === "pro"
    };
  } catch (e) {
    console.error("fetchProStatus failed:", e);
    return { status: "free", isPro: false };
  }
}

async function postJSON(path, body) {
  const r = await fetchWithTimeout(`${WORKER_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}

export async function startCheckout() {
  const userId = await getUserId();

  let res = await postJSON("/create-checkout", {
    userId,
    successUrl: "https://www.getjottr.com/caleya",
    cancelUrl: "https://www.getjottr.com/caleya",
  });

  if (!res.ok || !res.data?.url) {
    console.warn("Primary checkout route failed, trying fallback…", res.data);
    res = await postJSON("/create-checkout-session", {
      userId,
      successUrl: "https://www.getjottr.com/caleya",
      cancelUrl: "https://www.getjottr.com/caleya",
    });
  }

  if (res.data?.url) {
    chrome.tabs.create({ url: res.data.url });
    return;
  }

  const errMsg =
    res.data?.error ||
    "Checkout failed (no url returned). Check worker logs.";
  console.error("startCheckout failed:", res.data);
  throw new Error(errMsg);
}

export async function openPortal() {
  const userId = await getUserId();

  const r = await fetchWithTimeout(`${WORKER_BASE}/create-portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      returnUrl: "https://www.getjottr.com/caleya",
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (data.url) {
    chrome.tabs.create({ url: data.url });
    return;
  }

  console.error("openPortal failed:", data);
  throw new Error(data.error || "Portal failed");
}
