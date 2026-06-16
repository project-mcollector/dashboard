/* exported showSdkInfoModal, closeSdkInfoModal, showDeleteProjectModal, closeDeleteProjectModal, deleteProject */

const projectId = getQueryParam('projectId') || sessionStorage.getItem('lastProjectId');
if (projectId) sessionStorage.setItem('lastProjectId', projectId);

if (!getToken()) window.location.href = './index.html';
if (!projectId) window.location.href = './projects.html';

const projectName = sessionStorage.getItem('lastProjectName') || '';
const projectApiKey = sessionStorage.getItem('lastApiKey') || '';
if (projectName) document.title = `MCollector - ${projectName}`;

function buildPeriodControls() {
  const nav = document.createElement('div');
  nav.className = 'period-nav';

  const prevBtn = document.createElement('button');
  prevBtn.id = 'prevPeriodBtn';
  prevBtn.className = 'period-nav-btn';
  prevBtn.textContent = '←';

  const label = document.createElement('span');
  label.id = 'periodLabel';
  label.className = 'period-nav-label';

  const nextBtn = document.createElement('button');
  nextBtn.id = 'nextPeriodBtn';
  nextBtn.className = 'period-nav-btn';
  nextBtn.textContent = '→';
  nextBtn.disabled = true;

  nav.appendChild(prevBtn);
  nav.appendChild(label);
  nav.appendChild(nextBtn);

  const range = document.createElement('div');
  range.className = 'date-range';
  range.id = 'dateRange';

  [[1, '1д'], [7, '7д'], [30, '30д'], [90, '90д']].forEach(([days, text]) => {
    const btn = document.createElement('button');
    btn.className = 'date-range-btn' + (days === 30 ? ' date-range-btn--active' : '');
    btn.dataset.days = String(days);
    btn.textContent = text;
    range.appendChild(btn);
  });

  return [nav, range];
}

function buildInfoButton() {
  const btn = document.createElement('button');
  btn.className = 'icon-button';
  btn.title = 'Интеграция SDK';
  btn.onclick = () => showSdkInfoModal();
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>';
  return btn;
}

initTopbar({ title: projectName, backHref: './projects.html', showDeleteProject: true, rightControls: [...buildPeriodControls(), buildInfoButton()] });

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
let periodDays = 30;
let periodOffset = 0;

function getPeriodDates() {
  const MS = 24 * 60 * 60 * 1000;
  const to = new Date(Date.now() - periodOffset * periodDays * MS);
  const from = new Date(to - periodDays * MS);
  return { from, to };
}

function formatPeriodLabel(from, to) {
  const fmt = (d) => `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
  if (periodDays === 1) return fmt(from);
  const fromStr = from.getFullYear() !== to.getFullYear()
    ? `${fmt(from)} ${from.getFullYear()}`
    : fmt(from);
  return `${fromStr} – ${fmt(to)}`;
}

function updatePeriodControls() {
  document.querySelectorAll('.date-range-btn').forEach(btn => {
    btn.classList.toggle('date-range-btn--active', Number(btn.dataset.days) === periodDays);
  });
  const { from, to } = getPeriodDates();
  document.getElementById('periodLabel').textContent = formatPeriodLabel(from, to);
  document.getElementById('nextPeriodBtn').disabled = periodOffset === 0;
}

document.querySelectorAll('.date-range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    periodDays = Number(btn.dataset.days);
    periodOffset = 0;
    updatePeriodControls();
    loadDashboard();
  });
});

document.getElementById('prevPeriodBtn').addEventListener('click', () => {
  periodOffset++;
  updatePeriodControls();
  loadDashboard();
});

document.getElementById('nextPeriodBtn').addEventListener('click', () => {
  periodOffset--;
  updatePeriodControls();
  loadDashboard();
});

updatePeriodControls();

async function loadDashboard() {
  document.getElementById('loadingIndicator').style.display = 'block';
  document.getElementById('dashboardContent').style.display = 'none';
  document.getElementById('errorIndicator').style.display = 'none';
  let failed = false;
  try {
    const { from, to } = getPeriodDates();
    const interval = periodDays <= 1 ? 'hour' : 'day';
    const base = `${ANALYTICS_URL}/api/v1/projects/${projectId}/analytics`;

    const [overviewRes, eventsRes, usersRes, countsRes] = await Promise.all([
      authFetch(`${base}/overview?from=${from.toISOString()}&to=${to.toISOString()}`),
      authFetch(`${base}/events/timeseries?from=${from.toISOString()}&to=${to.toISOString()}&interval=${interval}`),
      authFetch(`${base}/users/timeseries?from=${from.toISOString()}&to=${to.toISOString()}&interval=${interval}`),
      authFetch(`${base}/events/counts?from=${from.toISOString()}&to=${to.toISOString()}`),
    ]);

    const overviewData = await overviewRes.json();
    const eventsData = await eventsRes.json();
    const usersData = await usersRes.json();
    const countsData = await countsRes.json();

    document.getElementById('statEvents').textContent = overviewData.totalEvents || 0;
    document.getElementById('statUsers').textContent = overviewData.uniqueUsers || 0;
    document.getElementById('statPageviews').textContent = overviewData.pageViews || 0;

    const unit = periodDays <= 1 ? 'часам' : 'дням';
    document.querySelector('#eventsChart').closest('.chart-section').querySelector('.chart-container-title').textContent = `События по ${unit}`;
    document.querySelector('#usersChart').closest('.chart-section').querySelector('.chart-container-title').textContent = `Пользователи по ${unit}`;
    renderChart('eventsChart', eventsData, 'events');
    renderChart('usersChart', usersData, 'users');
    renderEventCounts(countsData, base, from, to, interval);
  } catch (err) {
    failed = true;
    console.error(err);
    document.getElementById('errorIndicator').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'none';
  } finally {
    document.getElementById('loadingIndicator').style.display = 'none';
    if (!failed) {
      document.getElementById('dashboardContent').style.display = 'block';
    }
  }
}

function renderChart(containerId, timeseriesData, type) {
  const container = document.getElementById(containerId);
  container.replaceChildren();

  if (!timeseriesData || timeseriesData.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'chart-empty';
    emptyState.textContent = 'Нет данных за период';
    container.appendChild(emptyState);
    return;
  }

  const counts = timeseriesData.map((d) => d.count || 0);
  const maxCount = Math.max(...counts, 1);
  const labelStep = Math.ceil(timeseriesData.length / 30);

  timeseriesData.forEach((point, index) => {
    const heightPercent = ((point.count || 0) / maxCount) * 100;

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';

    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    if (type === 'users') bar.classList.add('users');
    bar.style.height = `${heightPercent}%`;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = `${point.count || 0}`;
    bar.appendChild(tooltip);

    const label = document.createElement('div');
    label.className = 'chart-label';
    const dateObj = new Date(point.timestamp);
    if (!isNaN(dateObj)) {
      const d = dateObj.getDate().toString().padStart(2, '0');
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      label.textContent = `${d}.${m}`;
    } else {
      label.textContent = point.timestamp || '';
    }
    if (index % labelStep !== 0) label.style.visibility = 'hidden';

    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

let selectedEvent = null;
let selectedEventData = null;

function renderEventCounts(eventCounts, base, from, to, interval) {
  const container = document.getElementById('eventCountsTable');
  container.replaceChildren();

  if (!eventCounts || eventCounts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'chart-empty';
    empty.textContent = 'Нет данных';
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Название', 'Всего', ''].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  eventCounts.forEach(event => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.textContent = event.name;

    const countCell = document.createElement('td');
    countCell.textContent = event.count;

    const actionCell = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'button-small';
    btn.textContent = selectedEvent === event.name ? 'Скрыть' : 'График';
    btn.addEventListener('click', () => handleEventClick(event.name, base, from, to, interval));

    actionCell.appendChild(btn);
    row.appendChild(nameCell);
    row.appendChild(countCell);
    row.appendChild(actionCell);
    tbody.appendChild(row);

    if (selectedEvent === event.name) {
      const chartRow = document.createElement('tr');
      const chartCell = document.createElement('td');
      chartCell.colSpan = 3;

      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      chartContainer.id = 'selectedEventChart';

      chartCell.appendChild(chartContainer);
      chartRow.appendChild(chartCell);
      tbody.appendChild(chartRow);
    }
  });

  table.appendChild(tbody);
  container.appendChild(table);

  if (selectedEvent && selectedEventData) {
    renderChart('selectedEventChart', selectedEventData, 'events');
  }
}

async function handleEventClick(eventName, base, from, to, interval) {
  if (selectedEvent === eventName) {
    selectedEvent = null;
    selectedEventData = null;
  } else {
    const res = await authFetch(
        `${base}/events/timeseries?from=${from.toISOString()}&to=${to.toISOString()}&interval=${interval}&eventName=${encodeURIComponent(eventName)}`
    );
    const data = await res.json();
    selectedEvent = eventName;
    selectedEventData = data;
  }
  loadDashboard();
}

function populateSdkModal(apiKey) {
  document.getElementById('sdkApiKey').textContent = apiKey;
  document.getElementById('sdkSnippet').textContent = `import { analytics } from '@mcollector/sdk'\n\nanalytics.init('${apiKey}')`;
  const copyBtn = document.getElementById('sdkCopyBtn');
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(apiKey);
    copyBtn.style.color = '#16a34a';
    setTimeout(() => copyBtn.style.color = '', 2000);
  };
}

async function showSdkInfoModal() {
  document.getElementById('sdkInfoModal').style.display = 'flex';

  if (projectApiKey) {
    populateSdkModal(projectApiKey);
    return;
  }

  document.getElementById('sdkApiKey').textContent = 'Загрузка...';
  document.getElementById('sdkSnippet').textContent = '';

  try {
    const res = await authFetch(`${AUTH_URL}/api/projects/${projectId}`);
    const project = await res.json();
    const key = project.apiKey || '';
    sessionStorage.setItem('lastApiKey', key);
    populateSdkModal(key);
  } catch {
    document.getElementById('sdkApiKey').textContent = 'Ошибка загрузки';
  }
}

function closeSdkInfoModal() {
  document.getElementById('sdkInfoModal').style.display = 'none';
}

function showDeleteProjectModal() {
  document.getElementById('deleteProjectModal').style.display = 'flex';
}

function closeDeleteProjectModal() {
  document.getElementById('deleteProjectModal').style.display = 'none';
}

async function deleteProject() {
  const btn = document.getElementById('confirmDeleteProjectBtn');
  btn.disabled = true;
  btn.textContent = 'Удаление...';
  try {
    await authFetch(`${AUTH_URL}/api/projects/${projectId}`, { method: 'DELETE' });
    sessionStorage.removeItem('lastProjectId');
    window.location.href = './projects.html';
  } catch {
    btn.disabled = false;
    btn.textContent = 'Удалить проект';
    closeDeleteProjectModal();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('sdkInfoModal').style.display !== 'none') closeSdkInfoModal();
  else closeDeleteProjectModal();
});

loadDashboard();
