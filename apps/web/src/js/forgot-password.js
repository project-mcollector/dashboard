if (getToken()) window.location.href = './projects.html';

document.getElementById('forgotForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const submitBtn = document.getElementById('submitBtn');
    const successEl = document.getElementById('forgotSuccess');

    hideError('forgotError');
    successEl.style.display = 'none';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        const res = await fetch(`${AUTH_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!res.ok) {
            showError('forgotError', 'Произошла ошибка, проверьте email');
            return;
        }

        successEl.textContent = 'Ссылка для сброса отправлена на ваш email';
        successEl.style.display = 'block';
    } catch {
        showError('forgotError', 'Ошибка соединения с сервером');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    }
});
