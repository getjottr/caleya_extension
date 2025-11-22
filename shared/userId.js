// shared/userId.js
// Stable local user id for Caleya Pro linking.
// Using storage.local is fine for now (device-level Pro).
// If you want cross-device Pro later, switch to storage.sync.

export async function getUserId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["caleyaUserId"], (res) => {
      if (res.caleyaUserId) return resolve(res.caleyaUserId);

      const id = crypto.randomUUID();
      chrome.storage.local.set({ caleyaUserId: id }, () => resolve(id));
    });
  });
}
