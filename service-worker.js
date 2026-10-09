// Antigravity Status Checker - Service Worker (Manifest V3)

const CHECK_ALARM_NAME = 'antigravity-periodic-check';
const CHECK_URL = 'https://generativelanguage.googleapis.com';

// Setup periodic alarm and initial check on install/startup
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.alarms.create(CHECK_ALARM_NAME, {
    periodInMinutes: 5,
    delayInMinutes: 0.1
  });
  await runHealthCheck();
});

chrome.runtime.onStartup.addListener(async () => {
  await runHealthCheck();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === CHECK_ALARM_NAME) {
    await runHealthCheck();
  }
});

// Listen to requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRIGGER_HEALTH_CHECK') {
    (async () => {
      const result = await runHealthCheck();
      sendResponse(result);
    })();
    return true; // Keep message channel open for async response
  }
});

async function runHealthCheck() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  const startTime = Date.now();

  try {
    const response = await fetch(CHECK_URL, {
      method: 'GET',
      mode: 'no-cors', // Avoid CORS preflight block for simple ping
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    // With no-cors, an opaque response (type: 'opaque') indicates successful network connection
    // Let's also do a targeted fetch to check if Google blocks or sanctions
    const statusData = {
      status: 'connected',
      latency,
      timestamp: Date.now()
    };

    await updateBadge('OK', '#10B981');
    await chrome.storage.local.set({ lastCheck: statusData });
    return statusData;
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    const statusData = {
      status: isTimeout ? 'timeout' : 'blocked',
      error: err.message,
      timestamp: Date.now()
    };

    await updateBadge(isTimeout ? 'TIME' : 'ERR', '#EF4444');
    await chrome.storage.local.set({ lastCheck: statusData });
    return statusData;
  }
}

async function updateBadge(text, color) {
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (e) {
    console.error('Failed to set badge:', e);
  }
}
