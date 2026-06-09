const AUTH_URL = 'https://mcollector.publicvm.com';

const EYE_OPEN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function setRefreshToken(token) {
  localStorage.setItem('refreshToken', token);
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
}

async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await fetch(`${AUTH_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch { /* ignore logout API errors, we clear auth regardless */ }
  }
  clearAuth();
  window.location.href = './index.html';
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function hideError(elementId) {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

function setupPasswordToggle(toggleId, inputId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(toggleId);
  btn.addEventListener('click', function () {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.innerHTML = isPassword ? EYE_CLOSED : EYE_OPEN;
  });
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

let refreshPromise = null;

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = await res.json();
    const newAccess = data.accessToken || data.AccessToken;
    const newRefresh = data.refreshToken || data.RefreshToken;
    setToken(newAccess);
    setRefreshToken(newRefresh);
    return newAccess;
  } catch {
    clearAuth();
    return null;
  }
}

function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  }).then(async (res) => {
    if (res.status === 401) {
      if (!refreshPromise) {
        refreshPromise = tryRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (!newToken) {
        window.location.href = './index.html';
        throw new Error('Unauthorized');
      }
      return fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      }).then((retryRes) => {
        if (!retryRes.ok) throw new Error(`Request failed with status ${retryRes.status}`);
        return retryRes;
      });
    }
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return res;
  });
}
