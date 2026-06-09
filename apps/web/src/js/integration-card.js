function renderIntegrationCard() {
  const placeholder = document.getElementById('integration-card');
  if (!placeholder) return;

  const card = document.createElement('div');
  card.className = 'integration-card';
  card.innerHTML = `
    <div>
      <p class="integration-title">Быстрый старт</p>
      <p class="integration-subtitle">Подключите аналитику к вашему сайту за 3 шага</p>
    </div>

    <div class="integration-step">
      <span class="integration-step-label">Шаг 1 — Установка</span>
      <div class="integration-code">npm install @mcollector/sdk</div>
    </div>

    <div class="integration-step">
      <span class="integration-step-label">Шаг 2 — Инициализация</span>
      <div class="integration-code">import { analytics } from '@mcollector/sdk'

analytics.init('YOUR_API_KEY')</div>
    </div>

    <div class="integration-step">
      <span class="integration-step-label">Шаг 3 — Трекинг</span>
      <div class="integration-code">analytics.track('page_view', {
  url: window.location.href
})</div>
    </div>

    <a href="https://www.npmjs.com/package/@mcollector/sdk" target="_blank" rel="noopener noreferrer" class="integration-link">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      Документация на npm
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  `;

  placeholder.replaceWith(card);
}

renderIntegrationCard();
