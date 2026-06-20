const userId = getQueryParam('userId');
const token = getQueryParam('token');

if (!userId || !token) {
    document.getElementById('formState').style.display = 'none';
    document.getElementById('invalidState').style.display = 'block';
}

setupPasswordToggle('togglePassword', 'password');

function updateHint(id, check) {
    const el = document.getElementById(id);
    const text = el.dataset.text;
    el.textContent = (check ? '✓ ' : '○ ') + text;
    el.style.color = check ? '#16a34a' : '';
}

const passwordInput = document.getElementById('password');
passwordInput.addEventListener('input', function () {
    const pwd = this.value;
    if (!pwd) {
        document.getElementById('passwordHints').style.display = 'none';
        return;
    }
    document.getElementById('passwordHints').style.display = 'flex';
    updateHint('hint-length', pwd.length >= 8);
    updateHint('hint-lower', /[a-z]/.test(pwd));
    updateHint('hint-upper', /[A-Z]/.test(pwd));
    updateHint('hint-special', /[^a-zA-Z0-9]/.test(pwd));
});

document.getElementById('resetForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!userId || !token) return;

    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');

    hideError('resetError');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';

    try {
        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token, password })
        });

        if (!res.ok) {
            const text = await res.text();
            showError('resetError', text || 'Ошибка при сбросе пароля');
            return;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        document.getElementById('formState').style.display = 'none';
        document.getElementById('successState').style.display = 'block';
    } catch {
        showError('resetError', 'Ошибка соединения с сервером');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Сохранить пароль';
    }
});
