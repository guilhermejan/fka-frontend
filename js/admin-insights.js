(function () {
  const API_URL = (window.API_URL || "https://fka-backend.onrender.com/api");

  const CHANNEL_LABELS = {
    "Direct": "Acesso direto",
    "Organic Search": "Busca orgânica (Google)",
    "Paid Search": "Busca paga",
    "Organic Social": "Redes sociais (orgânico)",
    "Paid Social": "Redes sociais (pago)",
    "Referral": "Indicação de outro site",
    "Email": "E-mail",
    "Unassigned": "Não identificado"
  };

  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  function escapeAttr(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderList(containerId, items, labelKey, valueKey, labelMap) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || !items.length) {
      container.innerHTML = `<p class="empty-row">Sem dados no período</p>`;
      return;
    }
    const max = Math.max(...items.map(i => i[valueKey]));
    container.innerHTML = items.map(item => {
      const rawLabel = item[labelKey];
      const label = (labelMap && labelMap[rawLabel]) || rawLabel;
      const pct = max > 0 ? Math.round((item[valueKey] / max) * 100) : 0;
      return `
        <div class="insights-row">
          <span class="ir-label" title="${escapeAttr(rawLabel)}">${escapeAttr(label)}</span>
          <div class="ir-bar-wrap">
            <div class="ir-bar" style="width:${pct}%"></div>
          </div>
          <span class="ir-value">${item[valueKey]}</span>
        </div>
      `;
    }).join("");
  }

  function renderChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!data || !data.length) {
      container.innerHTML = `<p class="empty-row">Sem dados no período</p>`;
      return;
    }

    const W = container.clientWidth || 600;
    const H = 120;
    const PAD = { top: 10, right: 8, bottom: 28, left: 32 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const step = innerW / (data.length - 1 || 1);

    const points = data.map((d, i) => ({
      x: PAD.left + i * step,
      y: PAD.top + innerH - (d.value / maxVal) * innerH,
      value: d.value,
      label: d.label
    }));

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaD = `${pathD} L${points[points.length-1].x.toFixed(1)},${(PAD.top+innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(PAD.top+innerH).toFixed(1)} Z`;

    const yTicks = [0, Math.round(maxVal/2), maxVal].map(val => {
      const y = PAD.top + innerH - (val / maxVal) * innerH;
      return `<text x="${PAD.left - 5}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="#4a3f28" font-size="9">${val}</text>
              <line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${PAD.left + innerW}" y2="${y.toFixed(1)}" stroke="rgba(201,168,76,0.07)" stroke-width="1"/>`;
    }).join("");

    const xLabels = [0, Math.floor((data.length-1)/2), data.length-1]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .map(i => {
        const p = points[i];
        return `<text x="${p.x.toFixed(1)}" y="${(PAD.top+innerH+14).toFixed(1)}" text-anchor="middle" fill="#4a3f28" font-size="9">${data[i].label}</text>`;
      }).join("");

    const dots = points.map(p =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#c9a84c" stroke="#0f0c07" stroke-width="1.5" class="chart-dot">
        <title>${p.label}: ${p.value} visita${p.value !== 1 ? "s" : ""}</title>
      </circle>`
    ).join("");

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c9a84c" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#c9a84c" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${yTicks}
        <path d="${areaD}" fill="url(#chartGrad)"/>
        <path d="${pathD}" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        ${xLabels}
      </svg>
    `;
  }

  async function fetchJSON(path) {
    const res = await fetch(`${API_URL}${path}`, {
      credentials: "include"
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Erro ao buscar ${path}`);
    }
    return res.json();
  }

  function periodToParam(value) {
    if (value === "today") return "today";
    if (value === "yesterday") return "yesterday";
    return value;
  }

  async function loadInsights(periodValue) {
    const loadingEl = document.getElementById("insights-loading");
    const errorEl   = document.getElementById("insights-error");
    const contentEl = document.getElementById("insights-content");
    const daysLabel = document.getElementById("insights-days");

    if (!loadingEl || !contentEl) return;

    loadingEl.style.display = "block";
    errorEl.style.display   = "none";
    contentEl.style.display = "none";

    const periodLabel = {
      "today": "hoje",
      "yesterday": "ontem",
      "7": "7 dias",
      "30": "30 dias",
      "90": "90 dias"
    }[periodValue] || `${periodValue} dias`;

    if (daysLabel) daysLabel.textContent = periodLabel;

    const param = periodToParam(periodValue);

    try {
      const [overview, traffic, topProducts, wppSources, dailyViews] = await Promise.all([
        fetchJSON(`/analytics/overview?days=${param}`),
        fetchJSON(`/analytics/traffic-sources?days=${param}`),
        fetchJSON(`/analytics/top-products?days=${param}`),
        fetchJSON(`/analytics/whatsapp-sources?days=${param}`),
        fetchJSON(`/analytics/daily-views?days=${param}`)
      ]);

      document.getElementById("insight-pageviews").textContent = overview.pageViews.toLocaleString("pt-BR");
      document.getElementById("insight-users").textContent     = overview.activeUsers.toLocaleString("pt-BR");
      document.getElementById("insight-sessions").textContent  = overview.sessions.toLocaleString("pt-BR");
      document.getElementById("insight-duration").textContent  = formatDuration(overview.avgSessionSeconds);

      renderList("insights-traffic-list",      traffic.sources,      "channel", "sessions", CHANNEL_LABELS);
      renderList("insights-views-list",        topProducts.views,    "product", "count");
      renderList("insights-clicks-list",       topProducts.clicks,   "product", "count");
      renderList("insights-wpp-sources-list",  wppSources.sources,   "source",  "count");
      renderChart("insights-chart",            dailyViews.data);

      loadingEl.style.display = "none";
      contentEl.style.display = "block";
    } catch (err) {
      loadingEl.style.display = "none";
      errorEl.style.display   = "block";
      errorEl.textContent     = "Não foi possível carregar os dados do Analytics: " + err.message;
      console.error("Erro ao carregar insights:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("insights-period");
    if (!select) return;
    loadInsights(select.value);
    select.addEventListener("change", () => loadInsights(select.value));
  });
})();