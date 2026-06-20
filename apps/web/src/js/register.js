if (getToken()) window.location.href = './projects.html';

setupPasswordToggle('togglePassword', 'password');
setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

const emailInput = document.getElementById('email');
const gmailWarning = document.getElementById('gmailWarning');
emailInput.addEventListener('input', () => {
  sessionStorage.setItem('authEmail', emailInput.value);
  const isGmail = /@gmail\.com\s*$/i.test(emailInput.value);
  gmailWarning.style.display = isGmail ? 'block' : 'none';
});
const savedEmail = sessionStorage.getItem('authEmail');
if (savedEmail) {
  emailInput.value = savedEmail;
  emailInput.dispatchEvent(new Event('input'));
}

function updateHint(id, check) {
  const el = document.getElementById(id);
  const text = el.dataset.text;
  el.textContent = (check ? '✓ ' : '○ ') + text;
  el.style.color = check ? '#16a34a' : '';
}

const passwordInput = document.getElementById('password');
passwordInput.addEventListener('input', function () {
  const pwd = this.value;
  if (!pwd) return;

  document.getElementById('passwordHints').style.display = 'flex';

  updateHint('hint-length', pwd.length >= 8);
  updateHint('hint-lower', /[a-z]/.test(pwd));
  updateHint('hint-upper', /[A-Z]/.test(pwd));
  updateHint('hint-special', /[^a-zA-Z0-9]/.test(pwd));
});

let createdProjectId = null;

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const organizationName = document.getElementById('organizationName').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('submitBtn');

  hideError('registerError');

  if (password !== confirmPassword) {
    showError('registerError', 'Пароли не совпадают');
    return;
  }

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[^a-zA-Z0-9]/.test(password)
  ];
  if (checks.includes(false)) {
    showError('registerError', 'Пароль не соответствует требованиям');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Регистрация...';

  try {
    const res = await fetch(`${AUTH_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, organizationName })
    });

    if (!res.ok) {
      let errMsg = 'Ошибка регистрации';
      const responseText = await res.text();
      try {
        const errorData = JSON.parse(responseText);
        errMsg = errorData.message || errMsg;
      } catch {
        errMsg = responseText || errMsg;
      }
      showError('registerError', errMsg);
      return;
    }

    const loginRes = await fetch(`${AUTH_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) {
      showError('registerError', 'Аккаунт создан, но не удалось авторизоваться. Пожалуйста, войдите.');
      window.location.href = './index.html';
      return;
    }

    let data;
    try {
      data = await loginRes.json();
    } catch {
      showError('registerError', 'Ошибка при авторизации: неверный ответ сервера');
      return;
    }
    setToken(data.accessToken || data.AccessToken);
    setRefreshToken(data.refreshToken || data.RefreshToken);

    const projectRes = await authFetch(`${AUTH_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: organizationName })
    });

    let project;
    try {
      project = await projectRes.json();
    } catch {
      showError('registerError', 'Ошибка при создании проекта: неверный ответ сервера');
      return;
    }
    createdProjectId = project.id;

    document.getElementById('apiKeyText').textContent = project.apiKey;
    document.getElementById('codeBlock').textContent = `import { analytics } from '@mcollector/sdk'\n\nanalytics.init('${project.apiKey}')`;
    document.getElementById('modalOverlay').style.display = 'flex';

  } catch {
    showError('registerError', 'Ошибка соединения с сервером');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Зарегистрироваться';
  }
});

document.getElementById('copyBtn').addEventListener('click', function () {
  const key = document.getElementById('apiKeyText').textContent;
  copyToClipboard(key);
  this.textContent = 'Скопировано ✓';
  setTimeout(() => this.textContent = 'Скопировать', 2000);
});

document.getElementById('goToDashboardBtn').addEventListener('click', function () {
  window.location.href = `./dashboard.html?projectId=${createdProjectId}`;
});

document.getElementById('goToProjectsBtn').addEventListener('click', function () {
  window.location.href = './projects.html';
});
