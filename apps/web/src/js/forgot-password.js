if (getToken()) window.location.href = './projects.html';

document.getElementById('forgotForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const submitBtn = document.getElementById('submitBtn');

    hideError('forgotError');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        document.getElementById('forgotForm').style.display = 'none';
        document.getElementById('pageSubtitle').style.display = 'none';
        document.getElementById('sentMessage').textContent =
            `Если аккаунт с адресом ${email} существует, мы отправили на него ссылку для сброса пароля.`;
        document.getElementById('sentState').style.display = 'block';
    } catch {
        showError('forgotError', 'Ошибка соединения с сервером');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить ссылку';
    }
});
