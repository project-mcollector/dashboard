function initTopbar({ title, backHref = null, subtitleId = null, showUserActions = false, showDeleteAccount = false, showDeleteProject = false, rightControls = [] }) {
  const placeholder = document.getElementById('topbar');
  if (!placeholder) return;

  const header = document.createElement('header');
  header.className = 'header';

  const left = document.createElement('div');

  if (backHref) {
    const back = document.createElement('a');
    back.href = backHref;
    back.className = 'button-link topbar-back';
    back.textContent = '← Назад';
    left.appendChild(back);

    const h1 = document.createElement('h1');
    h1.className = 'page-title';
    h1.textContent = title;
    left.appendChild(h1);
  } else {
    const h1 = document.createElement('h1');
    h1.className = 'page-title';
    h1.textContent = title;
    left.appendChild(h1);

    if (subtitleId) {
      const sub = document.createElement('p');
      sub.className = 'subtitle';
      sub.id = subtitleId;
      sub.style.display = 'none';
      left.appendChild(sub);
    }
  }

  header.appendChild(left);

  if (showUserActions) {
    const right = document.createElement('div');
    right.className = 'user-info';

    const email = document.createElement('span');
    email.id = 'userEmail';
    email.className = 'user-email';
    right.appendChild(email);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'icon-button';
    logoutBtn.title = 'Выйти';
    logoutBtn.onclick = logout;
    logoutBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
    right.appendChild(logoutBtn);

    if (showDeleteAccount) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-button-danger';
      deleteBtn.title = 'Удалить аккаунт';
      deleteBtn.onclick = () => showDeleteAccountModal();
      deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
      right.appendChild(deleteBtn);
    }

    header.appendChild(right);
  }

  if (rightControls.length > 0 || showDeleteProject) {
    const right = document.createElement('div');
    right.className = 'user-info';

    rightControls.forEach(el => right.appendChild(el));

    if (showDeleteProject) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-button-danger';
      deleteBtn.title = 'Удалить проект';
      deleteBtn.onclick = () => showDeleteProjectModal();
      deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
      right.appendChild(deleteBtn);
    }

    header.appendChild(right);
  }

  placeholder.replaceWith(header);
}
