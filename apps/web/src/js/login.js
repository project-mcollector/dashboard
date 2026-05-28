if (getToken()) window.location.href = './projects.html';

setupPasswordToggle('togglePassword', 'password');

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');

    hideError('loginError');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';

    try {
        const res = await fetch(`${AUTH_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            showError('loginError', 'Неверный email или пароль');
            return;
        }

        const data = await res.json();
        setToken(data.accessToken || data.AccessToken);
        setRefreshToken(data.refreshToken || data.RefreshToken);
        window.location.href = './projects.html';
    } catch (err) {
        showError('loginError', 'Ошибка соединения с сервером');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
    }
});
