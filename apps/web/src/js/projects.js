/* exported showDeleteAccountModal, deleteAccount, openRenameModal, openApiKeyModal, closeApiKeyModal, copyModalApiKey, showRegenerateConfirm, doRegenerate, closeCreateSuccessModal, toggleKey */

if (!getToken()) window.location.href = './index.html';

let currentProjects = [];
let visibleKeys = new Set();
let renameTarget = null;
let apiKeyTarget = null;

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => renderProjects());

const newProjectNameInput = document.getElementById('newProjectName');
newProjectNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') createProject();
});

document.getElementById('renameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmRename();
});

async function loadData() {
  try {
    const [projectsRes, userRes] = await Promise.all([
      authFetch(`${AUTH_URL}/api/projects`),
      authFetch(`${AUTH_URL}/api/users/me`)
    ]);

    const [projectsData, userData] = await Promise.all([
      projectsRes.json(),
      userRes.json()
    ]);

    currentProjects = projectsData;

    if (userData.email) {
      document.getElementById('userEmail').textContent = userData.email;
    }

    renderProjects();
  } catch {
    showErrorBanner('Ошибка загрузки данных');
  } finally {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('projectsContainer').style.display = 'block';
  }
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const emptyStateBlock = document.getElementById('emptyStateBlock');
  const noSearchResults = document.getElementById('noSearchResults');
  const projectsCount = document.getElementById('projectsCount');
  const searchRow = document.getElementById('searchRow');
  const search = searchInput.value.toLowerCase();

  grid.innerHTML = '';

  if (currentProjects.length > 0) {
    projectsCount.textContent = `${currentProjects.length} ${getPlural(currentProjects.length, 'проект', 'проекта', 'проектов')}`;
    projectsCount.style.display = 'block';
  } else {
    projectsCount.style.display = 'none';
  }

  searchRow.style.display = currentProjects.length > 3 ? 'block' : 'none';

  if (currentProjects.length === 0) {
    emptyStateBlock.style.display = 'block';
    noSearchResults.style.display = 'none';
    return;
  }

  emptyStateBlock.style.display = 'none';

  const filtered = currentProjects.filter(p => p.name.toLowerCase().includes(search));
  noSearchResults.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card';

    const cardMain = document.createElement('div');
    cardMain.className = 'project-card-main';
    cardMain.onclick = () => {
      sessionStorage.setItem('lastProjectId', proj.id);
      window.location.href = `./dashboard.html?projectId=${proj.id}`;
    };

    const nameRow = document.createElement('div');
    nameRow.className = 'project-name-row';
    nameRow.innerHTML = `<span class="project-name">${escapeHtml(proj.name)}</span>
      <button class="rename-icon" title="Переименовать" onclick="event.stopPropagation(); openRenameModal('${proj.id}', '${escapeHtml(proj.name)}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>`;

    const arrow = document.createElement('span');
    arrow.className = 'project-arrow';
    arrow.textContent = '→';

    cardMain.appendChild(nameRow);
    cardMain.appendChild(arrow);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'project-card-actions';

    const isVisible = visibleKeys.has(proj.id);
    const apiKeyDisplay = document.createElement('span');
    apiKeyDisplay.className = 'api-key-display';
    apiKeyDisplay.textContent = isVisible ? proj.apiKey : 'proj_••••••••••••••••';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'api-key-actions';

    buttonsDiv.innerHTML = `
      <button onclick="toggleKey('${proj.id}')" title="${isVisible ? 'Скрыть ключ' : 'Показать ключ'}">
        ${isVisible ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'}
      </button>
      <button onclick="copyToClipboard('${proj.apiKey}'); this.style.color='#16a34a'; setTimeout(() => this.style.color='', 2000);" title="Скопировать">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
      <button onclick="openApiKeyModal('${proj.id}')" title="Управление ключом">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.87"/></svg>
      </button>
    `;

    actionsRow.appendChild(apiKeyDisplay);
    actionsRow.appendChild(buttonsDiv);

    card.appendChild(cardMain);
    card.appendChild(actionsRow);
    grid.appendChild(card);
  });
}

async function createProject() {
  const name = newProjectNameInput.value.trim();
  const createBtn = document.getElementById('createBtn');
  if (!name) return;

  createBtn.disabled = true;
  createBtn.textContent = 'Создание...';

  try {
    const res = await authFetch(`${AUTH_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const created = await res.json();
    currentProjects.push(created);
    newProjectNameInput.value = '';
    renderProjects();
    showCreateSuccessModal(created);
  } catch {
    showErrorBanner('Не удалось создать проект');
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = 'Создать';
  }
}

function showDeleteAccountModal() { document.getElementById('deleteAccountModal').style.display = 'flex'; }
function closeDeleteAccountModal() { document.getElementById('deleteAccountModal').style.display = 'none'; }

async function deleteAccount() {
  const btn = document.getElementById('confirmDeleteAccountBtn');
  btn.disabled = true;
  btn.textContent = 'Удаление...';
  try {
    await authFetch(`${AUTH_URL}/api/users/me`, { method: 'DELETE' });
    clearAuth();
    window.location.href = './index.html';
  } catch {
    showErrorBanner('Не удалось удалить аккаунт');
    btn.disabled = false;
    btn.textContent = 'Удалить аккаунт';
    closeDeleteAccountModal();
  }
}

function openRenameModal(id, currentName) {
  renameTarget = id;
  const input = document.getElementById('renameInput');
  input.value = currentName;
  document.getElementById('renameModal').style.display = 'flex';
  setTimeout(() => { input.focus(); input.select(); }, 100);
}

function closeRenameModal() {
  renameTarget = null;
  document.getElementById('renameModal').style.display = 'none';
}

async function confirmRename() {
  if (!renameTarget) return;
  const input = document.getElementById('renameInput');
  const newName = input.value.trim();
  if (!newName) return;

  const btn = document.getElementById('confirmRenameBtn');
  btn.disabled = true;
  btn.textContent = 'Сохранение...';

  try {
    const res = await authFetch(`${AUTH_URL}/api/projects/${renameTarget}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    const updated = await res.json();
    currentProjects = currentProjects.map(p => p.id === updated.id ? updated : p);
    renderProjects();
    closeRenameModal();
  } catch {
    showErrorBanner('Не удалось переименовать проект');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Сохранить';
  }
}

function openApiKeyModal(id) {
  apiKeyTarget = currentProjects.find(p => p.id === id);
  document.getElementById('apiKeyModalProjectName').textContent = apiKeyTarget.name;
  document.getElementById('apiKeyModalValue').textContent = apiKeyTarget.apiKey;
  hideRegenerateConfirm();
  document.getElementById('apiKeyModal').style.display = 'flex';
}

function closeApiKeyModal() {
  apiKeyTarget = null;
  document.getElementById('apiKeyModal').style.display = 'none';
}

function copyModalApiKey() {
  if (!apiKeyTarget) return;
  copyToClipboard(apiKeyTarget.apiKey);
  const btn = document.getElementById('apiKeyModalCopyBtn');
  btn.textContent = 'Скопировано ✓';
  setTimeout(() => btn.textContent = 'Скопировать', 2000);
}

function showRegenerateConfirm() {
  document.getElementById('triggerRegenerateBtn').style.display = 'none';
  document.getElementById('regenerateConfirmUI').style.display = 'block';
}

function hideRegenerateConfirm() {
  document.getElementById('triggerRegenerateBtn').style.display = 'block';
  document.getElementById('regenerateConfirmUI').style.display = 'none';
}

async function doRegenerate() {
  if (!apiKeyTarget) return;
  const btn = document.getElementById('doRegenerateBtn');
  btn.disabled = true;
  btn.textContent = 'Генерация...';

  try {
    const res = await authFetch(`${AUTH_URL}/api/projects/${apiKeyTarget.id}/api-key/regenerate`, {
      method: 'POST'
    });
    const updated = await res.json();
    currentProjects = currentProjects.map(p => p.id === updated.id ? updated : p);
    apiKeyTarget = updated;
    document.getElementById('apiKeyModalValue').textContent = updated.apiKey;
    renderProjects();
    hideRegenerateConfirm();
  } catch {
    showErrorBanner('Не удалось перегенерировать ключ');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Да, перегенерировать';
  }
}

function showCreateSuccessModal(project) {
  document.getElementById('createdApiKey').textContent = project.apiKey;
  document.getElementById('createdSnippet').textContent = `import { analytics } from '@mcollector/sdk'\n\nanalytics.init('${project.apiKey}')`;
  document.getElementById('goToDashboardBtn').onclick = () => {
    sessionStorage.setItem('lastProjectId', project.id);
    window.location.href = `./dashboard.html?projectId=${project.id}`;
  };

  const copyBtn = document.getElementById('createdCopyBtn');
  copyBtn.onclick = () => {
    copyToClipboard(project.apiKey);
    copyBtn.textContent = 'Скопировано ✓';
    setTimeout(() => copyBtn.textContent = 'Скопировать', 2000);
  };

  document.getElementById('createSuccessModal').style.display = 'flex';
}

function closeCreateSuccessModal() {
  document.getElementById('createSuccessModal').style.display = 'none';
}

function toggleKey(id) {
  if (visibleKeys.has(id)) visibleKeys.delete(id);
  else visibleKeys.add(id);
  renderProjects();
}

function showErrorBanner(msg) {
  const banner = document.getElementById('errorBanner');
  banner.textContent = msg;
  banner.style.display = 'block';
  setTimeout(() => banner.style.display = 'none', 3000);
}

function escapeHtml(unsafe) {
  return (unsafe || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPlural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
  return many;
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('renameModal').style.display !== 'none') {
    closeRenameModal();
  } else if (document.getElementById('apiKeyModal').style.display !== 'none') {
    closeApiKeyModal();
  } else if (document.getElementById('deleteAccountModal').style.display !== 'none') {
    closeDeleteAccountModal();
  } else if (document.getElementById('createSuccessModal').style.display !== 'none') {
    closeCreateSuccessModal();
  }
});

loadData();
