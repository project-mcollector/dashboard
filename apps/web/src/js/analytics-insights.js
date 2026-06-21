/* exported computeAnalyticsInsights, renderAnalyticsInsights */

const ERROR_THRESHOLD = 10;
const ANOMALY_MULTIPLIER = 2;

const MONTHS_RU_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function formatInsightDate(timestamp, periodDays) {
  const date = new Date(timestamp);
  if (isNaN(date)) return String(timestamp);

  const day = date.getDate();
  const month = MONTHS_RU_SHORT[date.getMonth()];
  if (periodDays <= 1) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  }
  return `${day} ${month}`;
}

function findPeak(timeseries) {
  if (!timeseries || timeseries.length === 0) return null;

  let peak = timeseries[0];
  for (let i = 1; i < timeseries.length; i++) {
    if ((timeseries[i].count || 0) > (peak.count || 0)) {
      peak = timeseries[i];
    }
  }
  return peak;
}

function detectAnomalies(timeseries, multiplier = ANOMALY_MULTIPLIER) {
  if (!timeseries || timeseries.length < 3) return [];

  const counts = timeseries.map((p) => p.count || 0);
  const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length;
  if (avg === 0) return [];

  const threshold = avg * multiplier;
  return timeseries.filter((p) => (p.count || 0) > threshold && (p.count || 0) > 0);
}

function computeTrend(timeseries) {
  if (!timeseries || timeseries.length < 4) return null;

  const mid = Math.floor(timeseries.length / 2);
  const firstHalf = timeseries.slice(0, mid);
  const secondHalf = timeseries.slice(mid);

  const avgFirst = firstHalf.reduce((s, p) => s + (p.count || 0), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, p) => s + (p.count || 0), 0) / secondHalf.length;

  if (avgFirst === 0 && avgSecond === 0) return null;

  const change = avgFirst === 0 ? 100 : ((avgSecond - avgFirst) / avgFirst) * 100;
  return { avgFirst, avgSecond, change };
}

function computeAnalyticsInsights({ overview, eventsSeries, usersSeries, errorLogCount, periodDays }) {
  const insights = [];

  const uptime = overview?.uptime ?? 0;
  if (uptime >= 99.9) {
    insights.push({
      type: 'success',
      title: 'Uptime',
      text: `Сервис работает стабильно — доступность ${uptime}% за выбранный период.`,
    });
  } else if (uptime >= 99) {
    insights.push({
      type: 'info',
      title: 'Uptime',
      text: `Незначительные перебои — доступность ${uptime}%. Рекомендуется проверить логи.`,
    });
  } else if (uptime >= 95) {
    insights.push({
      type: 'warning',
      title: 'Uptime',
      text: `Заметное снижение доступности — uptime ${uptime}%. Стоит разобрать инциденты.`,
    });
  } else {
    insights.push({
      type: 'danger',
      title: 'Uptime',
      text: `Критически низкая доступность — ${uptime}%. Требуется срочный разбор.`,
    });
  }

  const eventsPeak = findPeak(eventsSeries);
  if (eventsPeak && (eventsPeak.count || 0) > 0) {
    const unit = periodDays <= 1 ? 'за час' : 'за день';
    insights.push({
      type: 'info',
      title: 'Пик нагрузки',
      text: `Максимум событий — ${eventsPeak.count} ${unit} (${formatInsightDate(eventsPeak.timestamp, periodDays)}).`,
    });
  }

  const eventAnomalies = detectAnomalies(eventsSeries);
  if (eventAnomalies.length > 0) {
    const worst = eventAnomalies.reduce((a, b) => ((a.count || 0) > (b.count || 0) ? a : b));
    insights.push({
      type: 'warning',
      title: 'Аномалия нагрузки',
      text: `Обнаружено ${eventAnomalies.length} всплеск(ов) активности. Пик — ${worst.count} событий (${formatInsightDate(worst.timestamp, periodDays)}).`,
    });
  }

  const usersTrend = computeTrend(usersSeries);
  if (usersTrend && Math.abs(usersTrend.change) >= 15) {
    const direction = usersTrend.change > 0 ? 'выросла' : 'снизилась';
    const type = usersTrend.change > 0 ? 'success' : 'warning';
    insights.push({
      type,
      title: 'Аудитория',
      text: `Активность пользователей ${direction} на ${Math.abs(Math.round(usersTrend.change))}% во второй половине периода.`,
    });
  }

  if (errorLogCount > ERROR_THRESHOLD) {
    insights.push({
      type: 'danger',
      title: 'Ошибки',
      text: `Зафиксировано ${errorLogCount} ошибок — превышен порог (${ERROR_THRESHOLD}). Проверьте логи.`,
    });
  } else if (errorLogCount > 0) {
    insights.push({
      type: 'info',
      title: 'Ошибки',
      text: `За период — ${errorLogCount} ${pluralizeErrors(errorLogCount)}. Уровень в пределах нормы.`,
    });
  } else {
    insights.push({
      type: 'success',
      title: 'Ошибки',
      text: 'Критических ошибок в логах за период не обнаружено.',
    });
  }

  const totalEvents = overview?.totalEvents || 0;
  const uniqueUsers = overview?.uniqueUsers || 0;
  if (totalEvents > 0 && uniqueUsers > 0) {
    const perUser = (totalEvents / uniqueUsers).toFixed(1);
    insights.push({
      type: 'info',
      title: 'Активность',
      text: `В среднем ${perUser} событий на пользователя за период.`,
    });
  }

  return insights;
}

function pluralizeErrors(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ошибка';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'ошибки';
  return 'ошибок';
}

function renderAnalyticsInsights(containerId, insights) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.replaceChildren();

  if (!insights || insights.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'chart-empty';
    empty.textContent = 'Недостаточно данных для выводов';
    container.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'insights-grid';

  insights.forEach((insight) => {
    const card = document.createElement('div');
    card.className = `insight-card insight-card--${insight.type}`;

    const title = document.createElement('p');
    title.className = 'insight-card__title';
    title.textContent = insight.title;

    const text = document.createElement('p');
    text.className = 'insight-card__text';
    text.textContent = insight.text;

    card.appendChild(title);
    card.appendChild(text);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}
