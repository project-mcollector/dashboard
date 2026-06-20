const userId = getQueryParam('userId');
const token = getQueryParam('token');

let createdProjectId = null;

function showSuccess() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('successState').style.display = 'block';
}

function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('confirmError').textContent = message;
    document.getElementById('errorState').style.display = 'block';
}

async function confirm() {
    if (!userId || !token) {
        showError('Неверная ссылка для подтверждения.');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/confirm-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token })
        });

        if (!res.ok) {
            const text = await res.text();
            showError(text || 'Не удалось подтвердить email.');
            return;
        }

        const data = await res.json();
        setToken(data.accessToken || data.AccessToken);
        setRefreshToken(data.refreshToken || data.RefreshToken);
        localStorage.removeItem('pendingEmail');

        const orgName = localStorage.getItem('pendingOrgName');
        if (orgName) {
            localStorage.removeItem('pendingOrgName');
            try {
                const projectRes = await authFetch(`${API_URL}/api/projects`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: orgName })
                });
                const project = await projectRes.json();
                createdProjectId = project.id;

                document.getElementById('apiKeyText').textContent = project.apiKey;
                document.getElementById('sdkSnippet').textContent =
                    `import { analytics } from '@mcollector/sdk'\n\nanalytics.init('${project.apiKey}')`;
                document.getElementById('loadingState').style.display = 'none';
                document.getElementById('projectModal').style.display = 'flex';
                return;
            } catch {
                // Email confirmed but project creation failed — go to projects, user can create manually
            }
        }

        showSuccess();
    } catch {
        showError('Ошибка соединения с сервером.');
    }
}

confirm();

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

// Resend confirmation email
const knownEmail = localStorage.getItem('pendingEmail');
if (!knownEmail) {
    document.getElementById('resendEmailWrapper').style.display = 'block';
}

document.getElementById('resendBtn').addEventListener('click', async function () {
    const email = knownEmail || document.getElementById('resendEmail').value;
    if (!email) return;

    this.disabled = true;
    this.textContent = 'Отправка...';

    try {
        await fetch(`${API_URL}/api/auth/resend-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        document.getElementById('resendForm').style.display = 'none';
        document.getElementById('resendDone').style.display = 'block';
    } catch {
        this.disabled = false;
        this.textContent = 'Отправить письмо повторно';
    }
});
