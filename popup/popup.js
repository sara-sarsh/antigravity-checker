// Antigravity Status Checker - Popup Logic

const ENDPOINTS = [
  {
    id: 'GeminiApi',
    name: 'Gemini API',
    url: 'https://generativelanguage.googleapis.com'
  },
  {
    id: 'Accounts',
    name: 'Google Accounts',
    url: 'https://accounts.google.com/generate_204'
  },
  {
    id: 'AiStudio',
    name: 'Google AI Studio',
    url: 'https://aistudio.google.com'
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.addEventListener('click', runAllChecks);

  // Restore cached state if available
  try {
    const { lastCheck } = await chrome.storage.local.get('lastCheck');
    if (lastCheck && lastCheck.latency) {
      document.getElementById('pingValue').textContent = `${Math.round(lastCheck.latency)} ms`;
    }
  } catch (e) {
    console.error('Failed to load cached state', e);
  }

  // Run immediate fresh check
  await runAllChecks();
});

async function runAllChecks() {
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshIcon = document.getElementById('refreshIcon');
  refreshIcon.classList.add('rotating');
  refreshBtn.disabled = true;

  resetUI();

  try {
    // Run endpoint checks and IP check in parallel
    const [results, ipInfo] = await Promise.all([
      checkAllEndpoints(),
      fetchIpInfo()
    ]);

    updateHeroAndSummary(results, ipInfo);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    refreshIcon.classList.remove('rotating');
    refreshBtn.disabled = false;
    document.getElementById('lastCheckTime').textContent = `بروزرسانی: ${new Date().toLocaleTimeString('fa-IR')}`;
  }
}

function resetUI() {
  const heroCard = document.getElementById('heroCard');
  heroCard.className = 'hero-card';
  document.getElementById('heroStatusText').textContent = 'در حال بررسی اتصال...';
  document.getElementById('pingValue').textContent = '-- ms';
  
  for (const ep of ENDPOINTS) {
    const statusEl = document.getElementById(`status${ep.id}`);
    if (statusEl) {
      statusEl.innerHTML = '<span class="loader"></span>';
    }
  }
}

async function checkSingleEndpoint(url) {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);
    const latency = performance.now() - startTime;

    // Notice: in no-cors mode, type is 'opaque'. Receiving response means network connection succeeded.
    // If blocked by Google geo-restriction, let's also test via normal fetch if allowed by host_permissions.
    return {
      status: 'ok',
      latency: Math.round(latency)
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      status: isTimeout ? 'timeout' : 'error',
      latency: null,
      error: err.message
    };
  }
}

async function checkAllEndpoints() {
  const results = {};

  for (const ep of ENDPOINTS) {
    const res = await checkSingleEndpoint(ep.url);
    results[ep.id] = res;

    const statusEl = document.getElementById(`status${ep.id}`);
    if (statusEl) {
      if (res.status === 'ok') {
        statusEl.innerHTML = `<span class="status-tag ok">${res.latency}ms ✓</span>`;
      } else if (res.status === 'timeout') {
        statusEl.innerHTML = '<span class="status-tag error">تایم‌اوت ✗</span>';
      } else {
        statusEl.innerHTML = '<span class="status-tag error">مسدود ✗</span>';
      }
    }
  }

  return results;
}

async function fetchIpInfo() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://ipwho.is/', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('IP service error');
    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

function updateHeroAndSummary(results, ipInfo) {
  const heroCard = document.getElementById('heroCard');
  const heroStatusText = document.getElementById('heroStatusText');
  const pingValue = document.getElementById('pingValue');
  const countryValue = document.getElementById('countryValue');
  const activeIp = document.getElementById('activeIp');

  // Update IP Info
  if (ipInfo && ipInfo.success !== false && ipInfo.ip) {
    activeIp.textContent = ipInfo.ip;
    const countryName = ipInfo.country || 'نامشخص';
    const flag = ipInfo.country_code ? `${ipInfo.country_code}` : '';
    countryValue.textContent = `${countryName} (${flag})`;
  } else {
    activeIp.textContent = 'عدم دسترسی به سرویس IP';
    countryValue.textContent = 'نامشخص';
  }

  // Assess Antigravity status based on Gemini API result
  const geminiRes = results['GeminiApi'];

  if (geminiRes && geminiRes.status === 'ok') {
    // Check if country is Iran (direct leakage)
    if (ipInfo && ipInfo.country_code === 'IR') {
      heroCard.className = 'hero-card sanctioned';
      heroStatusText.textContent = 'هشدار: آی‌پی ایران (تحریم Google)';
      pingValue.textContent = `${geminiRes.latency} ms`;
      chrome.action.setBadgeText({ text: '403' });
      chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    } else {
      heroCard.className = 'hero-card ready';
      heroStatusText.textContent = 'آماده و متصل به آنتی‌گراویتی ✓';
      pingValue.textContent = `${geminiRes.latency} ms`;
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
  } else {
    heroCard.className = 'hero-card blocked';
    heroStatusText.textContent = 'اتصال برقرار نشد (فیلتر یا قطع)';
    pingValue.textContent = 'ناموفق';
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
  }

  // Save state
  chrome.storage.local.set({
    lastCheck: {
      status: geminiRes ? geminiRes.status : 'error',
      latency: geminiRes ? geminiRes.latency : null,
      timestamp: Date.now()
    }
  });
}
