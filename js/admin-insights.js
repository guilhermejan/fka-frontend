// admin-insights.js
// Busca dados do Google Analytics (via backend) e renderiza no painel admin.
// Depende de window.API_URL e do token salvo em localStorage (mesmo padrão usado em api.js).

(function () {
  const API_URL = (window.API_URL || "https://fka-backend.onrender.com/api");

  function authHeaders() {
    const token = localStorage.getItem("token");
    return { "Authorization": `Bearer ${token}` };
  }

  // Tradução dos nomes de canal que o GA4 retorna, para algo mais legível em pt-BR.
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

  function renderList(containerId, items, labelKey, valueKey, labelMap) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!items || !items.length) {
      container.innerHTML = `<p class="empty-row">Sem dados no período</p>`;
      return;
    }
    container.innerHTML = items.map(item => {
      const rawLabel = item[labelKey];
      const label = (labelMap && labelMap[rawLabel]) || rawLabel;
      return `
        <div class="insights-row">
          <span class="ir-label" title="${escapeAttr(rawLabel)}">${escapeAttr(label)}</span>
          <span class="ir-value">${item[valueKey]}</span>
        </div>
      `;
    }).join("");
  }

  function escapeAttr(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchJSON(path) {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Erro ao buscar ${path}`);
    }
    return res.json();
  }

  async function loadInsights(days) {
    const loadingEl = document.getElementById("insights-loading");
    const errorEl = document.getElementById("insights-error");
    const contentEl = document.getElementById("insights-content");
    const daysLabel = document.getElementById("insights-days");

    if (!loadingEl || !contentEl) return; // seção não está presente nesta página

    loadingEl.style.display = "block";
    errorEl.style.display = "none";
    contentEl.style.display = "none";
    if (daysLabel) daysLabel.textContent = days;

    try {
      const [overview, traffic, topProducts, wppSources] = await Promise.all([
        fetchJSON(`/analytics/overview?days=${days}`),
        fetchJSON(`/analytics/traffic-sources?days=${days}`),
        fetchJSON(`/analytics/top-products?days=${days}`),
        fetchJSON(`/analytics/whatsapp-sources?days=${days}`)
      ]);

      document.getElementById("insight-pageviews").textContent = overview.pageViews.toLocaleString("pt-BR");
      document.getElementById("insight-users").textContent = overview.activeUsers.toLocaleString("pt-BR");
      document.getElementById("insight-sessions").textContent = overview.sessions.toLocaleString("pt-BR");
      document.getElementById("insight-duration").textContent = formatDuration(overview.avgSessionSeconds);

      renderList("insights-traffic-list", traffic.sources, "channel", "sessions", CHANNEL_LABELS);
      renderList("insights-views-list", topProducts.views, "product", "count");
      renderList("insights-clicks-list", topProducts.clicks, "product", "count");
      renderList("insights-wpp-sources-list", wppSources.sources, "source", "count");

      loadingEl.style.display = "none";
      contentEl.style.display = "block";
    } catch (err) {
      loadingEl.style.display = "none";
      errorEl.style.display = "block";
      errorEl.textContent = "Não foi possível carregar os dados do Analytics: " + err.message;
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