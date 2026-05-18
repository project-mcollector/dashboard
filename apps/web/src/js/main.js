const AUTH_URL = 'http://127.0.0.1:5003';
const DATA_URL = 'http://127.0.0.1:5002';

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

async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await fetch(`${AUTH_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch {}
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
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

let refreshPromise = null;

async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return null;
    }

    const data = await res.json();
    const newAccess = data.accessToken || data.AccessToken;
    const newRefresh = data.refreshToken || data.RefreshToken;
    setToken(newAccess);
    setRefreshToken(newRefresh);
    return newAccess;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
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
        throw new Error("Unauthorized");
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

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

document.addEventListener("DOMContentLoaded", () => {
  // basic init handling if needed
});
