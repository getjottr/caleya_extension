// background/service-worker.js
// Caleya no longer opens checkout from background.
// Popup directly calls startCheckout().

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Keep listener alive for future features if needed
  sendResponse?.({ ok: true });
  return false;
});
