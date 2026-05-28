const token = getToken();
const projectId = getQueryParam('projectId');

if (!token) window.location.href = './index.html';
if (!projectId) window.location.href = './projects.html';

async function loadDashboard() {
    let failed = false;
    try {
        const to = new Date().toISOString();
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const base = `${AUTH_URL}/api/v1/projects/${projectId}/analytics`;

        const [overviewRes, eventsRes, usersRes] = await Promise.all([
            authFetch(`${base}/overview?from=${from}&to=${to}`),
            authFetch(`${base}/events/timeseries?from=${from}&to=${to}&interval=day`),
            authFetch(`${base}/users/timeseries?from=${from}&to=${to}&interval=day`),
        ]);

        const overviewData = await overviewRes.json();
        const eventsData = await eventsRes.json();
        const usersData = await usersRes.json();

        document.getElementById('statEvents').textContent = overviewData.totalEvents || 0;
        document.getElementById('statUsers').textContent = overviewData.uniqueUsers || 0;
        document.getElementById('statPageviews').textContent = overviewData.pageViews || 0;

        renderChart('eventsChart', eventsData, 'events');
        renderChart('usersChart', usersData, 'users');
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

    timeseriesData.forEach((point) => {
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

        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });
}

loadDashboard();
