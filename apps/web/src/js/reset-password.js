const token = getQueryParam('token');
const email = getQueryParam('email');

if (!token || !email) {
    showError('resetError', 'Неверная ссылка для сброса');
    document.getElementById('formFields').style.display = 'none';
}

document.getElementById('resetForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!token || !email) return;

    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');

    hideError('resetError');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';

    try {
        const res = await fetch(`${AUTH_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token, newPassword: password })
        });

        if (!res.ok) {
            showError('resetError', 'Ошибка при сбросе пароля');
            return;
        }

        document.getElementById('formFields').style.display = 'none';
        document.getElementById('resetSuccess').style.display = 'block';
    } catch (err) {
        showError('resetError', 'Ошибка соединения с сервером');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Сохранить';
    }
});
