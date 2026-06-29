let products = [];
let nextId = 1;

const WHATSAPP_LINK = "https://chat.whatsapp.com/K8SMsIxFJke6NoRX9vRbJD";
const MOBILE_BREAKPOINT = 640;

function isMobileView() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function parseImgs(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch(_) {}
  if (typeof raw === "string" && raw.trim()) return [raw];
  return [];
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDesc(text) {
  if (!text) return "";
  return escapeHTML(text)
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.startsWith("*")
      ? `<span style="display:block;padding-left:12px;position:relative"><span style="position:absolute;left:0;color:var(--gold)">›</span>${line.slice(1).trim()}</span>`
      : `<span style="display:block">${line}</span>`
    )
    .join("");
}

/* ============================================================
   CARROSSEL MOBILE — drag to scroll
   ============================================================ */
(function(){
  let track, isDragging=false, startX=0, scrollLeft=0, dragMoved=false;
  document.addEventListener("DOMContentLoaded",()=>{
    track = document.getElementById("carousel-track");
    if(!track) return;
    track.addEventListener("mousedown", e=>{
      isDragging=true; dragMoved=false;
      startX=e.pageX-track.offsetLeft;
      scrollLeft=track.scrollLeft;
      track.classList.add("dragging");
    });
    track.addEventListener("mouseleave",()=>{isDragging=false;track.classList.remove("dragging")});
    track.addEventListener("mouseup",()=>{isDragging=false;track.classList.remove("dragging")});
    track.addEventListener("mousemove",e=>{
      if(!isDragging)return;
      e.preventDefault();
      dragMoved=true;
      const x=e.pageX-track.offsetLeft;
      track.scrollLeft=scrollLeft-(x-startX)*1.2;
    });
    track.addEventListener("scroll",()=>{
      const h=document.getElementById("scroll-hint");
      if(h)h.style.opacity="0";
      if (isMobileView()) handleCarouselLoopScroll();
      updateActiveDot();
    });
  });
})();

let _galleryImgs = [];
let _galleryIdx  = 0;

function _renderGalleryImg() {
  const wrap = document.getElementById("prod-gallery-wrap");
  if (!wrap) return;
  const url   = _galleryImgs[_galleryIdx];
  const total = _galleryImgs.length;

  wrap.innerHTML = url
    ? `<img class="prod-modal-img" src="${url}" alt="">
       ${total > 1 ? `
         <button class="prod-gallery-btn prod-gallery-prev" onclick="prodGalleryNav(-1)">&#8249;</button>
         <button class="prod-gallery-btn prod-gallery-next" onclick="prodGalleryNav(1)">&#8250;</button>
         <div class="prod-gallery-dots">
           ${_galleryImgs.map((_,i) =>
             `<button class="prod-gallery-dot${i===_galleryIdx?' active':''}" onclick="prodGalleryGo(${i})"></button>`
           ).join("")}
         </div>` : ""}
      `
    : `<div class="prod-modal-img-placeholder">Imagem não disponível</div>`;
}

function prodGalleryNav(dir) {
  _galleryIdx = (_galleryIdx + dir + _galleryImgs.length) % _galleryImgs.length;
  _renderGalleryImg();
}
function prodGalleryGo(i) {
  _galleryIdx = i;
  _renderGalleryImg();
}
window.prodGalleryNav = prodGalleryNav;
window.prodGalleryGo  = prodGalleryGo;

function openProdModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  _galleryImgs = parseImgs(p.img);
  _galleryIdx  = 0;

  const content = document.getElementById("prod-modal-content");
  content.innerHTML = `
    <div id="prod-gallery-wrap" class="prod-gallery-wrap"></div>
    <div class="prod-modal-body">
      <div class="prod-modal-top">
        <div>
          <div class="prod-modal-cat">${escapeHTML(p.cat || "")}</div>
          <div class="prod-modal-name">${escapeHTML(p.name)}</div>
        </div>
        ${p.badge ? `<span class="prod-modal-badge">${escapeHTML(p.badge)}</span>` : ""}
      </div>
      ${p.description ? `<div class="prod-modal-desc">${formatDesc(p.description)}</div>` : ""}
      <div class="prod-modal-prices">
        <span class="prod-modal-price">R$ ${Number(p.price).toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>
        ${p.oldprice ? `<span class="prod-modal-oldprice">R$ ${Number(p.oldprice).toLocaleString("pt-BR", {minimumFractionDigits:2})}</span>` : ""}
      </div>
      <a href="${WHATSAPP_LINK}" class="prod-modal-wpp" target="_blank">
        <i class="ti ti-brand-whatsapp" style="font-size:18px"></i>
        Quero este produto
      </a>
    </div>
  `;

  _renderGalleryImg();

  const overlay = document.getElementById("prod-modal-overlay");
  overlay.style.display = "flex";
  void overlay.offsetWidth;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
window.openProdModal = openProdModal;

function closeProdModal(e) {
  if (e && e.currentTarget !== e.target) return;
  const overlay = document.getElementById("prod-modal-overlay");
  overlay.classList.remove("open");
  setTimeout(() => {
    overlay.style.display = "none";
    document.body.style.overflow = "";
  }, 240);
}
window.closeProdModal = closeProdModal;

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const overlay = document.getElementById("prod-modal-overlay");
    if (overlay && overlay.classList.contains("open")) {
      overlay.classList.remove("open");
      setTimeout(() => { overlay.style.display="none"; document.body.style.overflow=""; }, 240);
    }
  }
});

/* ============================================================
   RENDER DO CARD (compartilhado entre mobile e desktop)
   ============================================================ */
function buildCardHTML(p, opts) {
  opts = opts || {};
  const imgs = parseImgs(p.img);
  const thumb = imgs[0] || "";
  const cloneAttr = opts.isClone ? ' data-clone="1" aria-hidden="true" tabindex="-1"' : "";
  return `
    <div class="prod-card" data-id="${p.id}"${cloneAttr} onclick="${opts.isClone ? "" : `handleCardClick(event,${p.id})`}">
      ${p.badge ? `<span class="prod-badge-new">${escapeHTML(p.badge)}</span>` : ""}
      ${thumb
        ? `<img class="prod-card-img" src="${thumb}" alt="${escapeHTML(p.name)}" draggable="false">`
        : `<div class="prod-card-img-placeholder"><span>Imagem não disponível</span></div>`
      }
      <div class="prod-card-body">
        <div class="prod-card-cat">${escapeHTML(p.cat)}</div>
        <div class="prod-card-name" title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</div>
        <div class="prod-card-desc">${formatDesc(p.description)}</div>
        <div class="prod-card-prices">
          <span class="prod-price">R$ ${Number(p.price).toLocaleString("pt-BR")}</span>
          ${p.oldprice ? `<span class="prod-oldprice">R$ ${Number(p.oldprice).toLocaleString("pt-BR")}</span>` : ""}
        </div>
        <button class="prod-wpp-btn" onclick="event.stopPropagation();window.open('${WHATSAPP_LINK}')">
          <i class="ti ti-brand-whatsapp" style="font-size:14px"></i> Pedir pelo WhatsApp
        </button>
      </div>
    </div>`;
}

/* ============================================================
   CARROSSEL MOBILE — loop infinito por clonagem + dots
   ============================================================ */
let _activeProducts = [];
let _realCardCount = 0;
let _loopGuard = false;

function renderMobileCarousel(track, active) {
  _activeProducts = active;
  _realCardCount = active.length;

  if (active.length <= 1) {
    track.innerHTML = active.map(p => buildCardHTML(p)).join("");
    renderCarouselDots(active, 0);
    return;
  }

  const first = active[0];
  const last  = active[active.length - 1];

  const html =
    buildCardHTML(last, { isClone: true }) +
    active.map(p => buildCardHTML(p)).join("") +
    buildCardHTML(first, { isClone: true });

  track.innerHTML = html;
  renderCarouselDots(active, 0);

  requestAnimationFrame(() => {
    const cards = track.querySelectorAll(".prod-card");
    const realFirst = cards[1];
    if (realFirst) {
      track.scrollLeft = realFirst.offsetLeft - (track.clientWidth - realFirst.offsetWidth) / 2;
    }
  });
}

function handleCarouselLoopScroll() {
  if (_loopGuard) return;
  const track = document.getElementById("carousel-track");
  if (!track || _realCardCount <= 1) return;

  const cards = track.querySelectorAll(".prod-card");
  if (cards.length < 3) return;

  const firstCloneCard = cards[0];
  const lastCloneCard  = cards[cards.length - 1];
  const firstRealCard  = cards[1];
  const lastRealCard   = cards[cards.length - 2];
  const buffer = 4;

  if (track.scrollLeft <= firstCloneCard.offsetLeft + buffer) {
    _loopGuard = true;
    track.scrollLeft = lastRealCard.offsetLeft - (track.clientWidth - lastRealCard.offsetWidth) / 2;
    requestAnimationFrame(() => { _loopGuard = false; });
  } else if (track.scrollLeft + track.clientWidth >= lastCloneCard.offsetLeft + lastCloneCard.offsetWidth - buffer) {
    _loopGuard = true;
    track.scrollLeft = firstRealCard.offsetLeft - (track.clientWidth - firstRealCard.offsetWidth) / 2;
    requestAnimationFrame(() => { _loopGuard = false; });
  }
}

function renderCarouselDots(active, activeIndex) {
  const outer = document.querySelector(".carousel-outer");
  if (!outer) return;
  let dotsWrap = document.getElementById("carousel-dots");
  if (!dotsWrap) {
    dotsWrap = document.createElement("div");
    dotsWrap.id = "carousel-dots";
    dotsWrap.className = "carousel-dots";
    outer.insertAdjacentElement("afterend", dotsWrap);
  }
  if (active.length <= 1) { dotsWrap.innerHTML = ""; return; }
  dotsWrap.innerHTML = active.map((_, i) =>
    `<button class="carousel-dot${i === activeIndex ? " active" : ""}" aria-label="Ir para produto ${i+1}" onclick="goToCarouselDot(${i})"></button>`
  ).join("");
}

function goToCarouselDot(index) {
  const track = document.getElementById("carousel-track");
  if (!track) return;
  const cards = track.querySelectorAll(".prod-card");
  const target = cards[index + 1];
  if (!target) return;
  _loopGuard = true;
  track.scrollTo({
    left: target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2,
    behavior: "smooth"
  });
  setTimeout(() => { _loopGuard = false; updateActiveDot(); }, 350);
}
window.goToCarouselDot = goToCarouselDot;

function updateActiveDot() {
  if (!isMobileView() || _realCardCount <= 1) return;
  const track = document.getElementById("carousel-track");
  if (!track) return;
  const cards = Array.from(track.querySelectorAll(".prod-card"));
  if (cards.length < 3) return;

  const trackCenter = track.scrollLeft + track.clientWidth / 2;
  let closestRealIdx = 0;
  let closestDist = Infinity;

  for (let i = 1; i < cards.length - 1; i++) {
    const card = cards[i];
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - trackCenter);
    if (dist < closestDist) {
      closestDist = dist;
      closestRealIdx = i - 1;
    }
  }

  const dotsWrap = document.getElementById("carousel-dots");
  if (!dotsWrap) return;
  dotsWrap.querySelectorAll(".carousel-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === closestRealIdx);
  });
}

/* ============================================================
   ESTADO DOS FILTROS
   ============================================================ */
let _filterState = {
  cat: "todos",
  sort: "default",
  priceMin: 0,
  priceMax: 99999,
  open: false
};

function _getFilteredProducts() {
  const active = products.filter(p => p.active);

  let result = active.filter(p => {
    if (_filterState.cat !== "todos" && p.cat !== _filterState.cat) return false;
    const price = Number(p.price);
    if (price < _filterState.priceMin || price > _filterState.priceMax) return false;
    return true;
  });

  if (_filterState.sort === "price_asc") {
    result.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (_filterState.sort === "price_desc") {
    result.sort((a, b) => Number(b.price) - Number(a.price));
  }

  return result;
}

function _hasActiveFilters() {
  const active = products.filter(p => p.active);
  const prices = active.map(p => Number(p.price));
  const globalMin = prices.length ? Math.min(...prices) : 0;
  const globalMax = prices.length ? Math.max(...prices) : 99999;
  return (
    _filterState.cat !== "todos" ||
    _filterState.sort !== "default" ||
    _filterState.priceMin > globalMin ||
    _filterState.priceMax < globalMax
  );
}

/* ============================================================
   RENDER DA BARRA DE FILTROS
   ============================================================ */
function renderFilterBar() {
  // Remove barra antiga se existir
  const old = document.getElementById("filter-bar-wrap");
  if (old) old.remove();

  const active = products.filter(p => p.active);
  if (!active.length) return;

  // Categorias únicas
  const cats = ["todos", ...new Set(active.map(p => p.cat).filter(Boolean))];

  // Faixa de preço global
  const prices = active.map(p => Number(p.price));
  const globalMin = Math.floor(Math.min(...prices));
  const globalMax = Math.ceil(Math.max(...prices));

  // Garante que o estado não está fora da faixa
  if (_filterState.priceMin < globalMin) _filterState.priceMin = globalMin;
  if (_filterState.priceMax > globalMax) _filterState.priceMax = globalMax;

  const hasFilters = _hasActiveFilters();

  const wrap = document.createElement("div");
  wrap.id = "filter-bar-wrap";

  // --- Botão toggle ---
  const btn = document.createElement("button");
  btn.className = "btn-filter-toggle" +
    (_filterState.open ? " active" : "") +
    (hasFilters ? " has-filters" : "");
  btn.innerHTML = `<i class="ti ti-adjustments-horizontal"></i> Filtrar`;
  btn.onclick = toggleFilterBar;
  wrap.appendChild(btn);

  // --- Painel colapsável ---
  const bar = document.createElement("div");
  bar.id = "filter-bar";
  bar.className = "filter-bar" + (_filterState.open ? " filter-bar-open" : "");

  // Linha 1: categorias
  const rowCat = document.createElement("div");
  rowCat.className = "filter-row";
  cats.forEach(cat => {
    const pill = document.createElement("button");
    pill.className = "filter-pill" + (_filterState.cat === cat ? " active" : "");
    pill.textContent = cat === "todos" ? "Todos" : cat;
    pill.onclick = () => {
      _filterState.cat = cat;
      renderFilterBar();
      renderCarousel();
    };
    rowCat.appendChild(pill);
  });
  bar.appendChild(rowCat);

  // Linha 2: ordenação
  const rowSort = document.createElement("div");
  rowSort.className = "filter-row";

  const sortLabel = document.createElement("span");
  sortLabel.style.cssText = "font-size:11px;color:#3d3320;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-right:4px";
  sortLabel.textContent = "Ordenar:";
  rowSort.appendChild(sortLabel);

  [
    { value: "default",    label: "Padrão" },
    { value: "price_asc",  label: "Menor preço" },
    { value: "price_desc", label: "Maior preço" }
  ].forEach(opt => {
    const pill = document.createElement("button");
    pill.className = "filter-pill" + (_filterState.sort === opt.value ? " active" : "");
    pill.textContent = opt.label;
    pill.onclick = () => {
      _filterState.sort = opt.value;
      renderFilterBar();
      renderCarousel();
    };
    rowSort.appendChild(pill);
  });

  // Botão limpar
  if (hasFilters) {
    const clear = document.createElement("button");
    clear.className = "filter-pill filter-pill-clear";
    clear.innerHTML = `<i class="ti ti-x" style="font-size:11px"></i> Limpar`;
    clear.onclick = () => {
      _filterState.cat = "todos";
      _filterState.sort = "default";
      _filterState.priceMin = globalMin;
      _filterState.priceMax = globalMax;
      renderFilterBar();
      renderCarousel();
    };
    rowSort.appendChild(clear);
  }
  bar.appendChild(rowSort);

  // Linha 3: slider de preço (só se houver variação de preço)
  if (globalMax > globalMin) {
    const rowPrice = document.createElement("div");
    rowPrice.className = "filter-row filter-row-price";

    const labels = document.createElement("div");
    labels.className = "price-range-labels";
    labels.innerHTML = `
      <span>Preço</span>
      <span class="price-range-values" id="price-range-display">
        R$ ${_filterState.priceMin.toLocaleString("pt-BR")} — R$ ${_filterState.priceMax.toLocaleString("pt-BR")}
      </span>`;
    rowPrice.appendChild(labels);

    const sliderWrap = document.createElement("div");
    sliderWrap.className = "price-range-slider";

    const fill = document.createElement("div");
    fill.className = "price-range-fill";

    const inputMin = document.createElement("input");
    inputMin.type = "range";
    inputMin.min = globalMin;
    inputMin.max = globalMax;
    inputMin.value = _filterState.priceMin;

    const inputMax = document.createElement("input");
    inputMax.type = "range";
    inputMax.min = globalMin;
    inputMax.max = globalMax;
    inputMax.value = _filterState.priceMax;

    function updateFill() {
      const pct = v => ((v - globalMin) / (globalMax - globalMin)) * 100;
      fill.style.left  = pct(Number(inputMin.value)) + "%";
      fill.style.width = (pct(Number(inputMax.value)) - pct(Number(inputMin.value))) + "%";
      const display = document.getElementById("price-range-display");
      if (display) {
        display.textContent =
          `R$ ${Number(inputMin.value).toLocaleString("pt-BR")} — R$ ${Number(inputMax.value).toLocaleString("pt-BR")}`;
      }
    }

    inputMin.oninput = () => {
      if (Number(inputMin.value) > Number(inputMax.value)) inputMin.value = inputMax.value;
      _filterState.priceMin = Number(inputMin.value);
      updateFill();
      renderCarousel();
    };
    inputMax.oninput = () => {
      if (Number(inputMax.value) < Number(inputMin.value)) inputMax.value = inputMin.value;
      _filterState.priceMax = Number(inputMax.value);
      updateFill();
      renderCarousel();
    };

    sliderWrap.appendChild(fill);
    sliderWrap.appendChild(inputMin);
    sliderWrap.appendChild(inputMax);
    rowPrice.appendChild(sliderWrap);
    bar.appendChild(rowPrice);

    requestAnimationFrame(updateFill);
  }

  wrap.appendChild(bar);

  // Insere após o carousel-header
  const header = document.querySelector(".carousel-header");
  if (header) header.insertAdjacentElement("afterend", wrap);
}

function toggleFilterBar() {
  _filterState.open = !_filterState.open;
  renderFilterBar();
}
window.toggleFilterBar = toggleFilterBar;

/* ============================================================
   RENDER PRINCIPAL — decide entre carrossel mobile e grid desktop
   ============================================================ */
function renderCarousel(){
  const track = document.getElementById("carousel-track");
  if(!track) return;

  const filtered = _getFilteredProducts();

  if(!filtered.length){
    track.innerHTML = `<div style="padding:40px;color:#444;font-size:13px;text-align:center;width:100%">Nenhum produto encontrado com esses filtros.</div>`;
    const dotsWrap = document.getElementById("carousel-dots");
    if (dotsWrap) dotsWrap.innerHTML = "";
    return;
  }

  if (isMobileView()) {
    renderMobileCarousel(track, filtered);
  } else {
    track.innerHTML = filtered.map(p => buildCardHTML(p)).join("");
    const dotsWrap = document.getElementById("carousel-dots");
    if (dotsWrap) dotsWrap.innerHTML = "";
  }
}

function handleCardClick(e, id) {
  if (e.target.closest(".prod-wpp-btn")) return;
  openProdModal(id);
}
window.handleCardClick = handleCardClick;

let _lastWasMobile = null;
let _resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const nowMobile = isMobileView();
    if (_lastWasMobile === null) _lastWasMobile = nowMobile;
    if (nowMobile !== _lastWasMobile) {
      _lastWasMobile = nowMobile;
      renderCarousel();
    }
  }, 150);
});

function renderFeaturedSection(){
  const section = document.getElementById("featured-section");
  const inner = document.getElementById("feat-inner");
  const title = document.getElementById("feat-title");
  if(!section||!inner) return;

  let p = products.find(x => Number(x.featured) === 1 && x.active);
  if(!p) p = products.find(x => x.active);
  if(!p){ section.style.display="none"; return; }

  section.style.display="block";
  title.textContent = p.name;

  const imgs = parseImgs(p.img);
  const thumb = imgs[0] || "";

  inner.innerHTML = `
    ${thumb
      ? `<img src="${thumb}" alt="${escapeHTML(p.name)}" class="feat-prod-img">`
      : `<div class="feat-prod-placeholder">Imagem não disponível</div>`
    }
    <div class="featured-text">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="background:rgba(201,168,76,.1);color:var(--gold);font-size:10px;font-weight:700;padding:3px 9px;border-radius:4px;border:1px solid rgba(201,168,76,.2);text-transform:uppercase;letter-spacing:.5px">${escapeHTML(p.cat)}</span>
        ${p.badge?`<span style="background:var(--gold);color:#0a0a0a;font-size:9px;font-weight:800;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px">${escapeHTML(p.badge)}</span>`:""}
      </div>
      <h2>${escapeHTML(p.name)}</h2>
      <p>${formatDesc(p.description || "Produto premium importado exclusivamente pela FKA Imports.")}</p>
      <div class="feat-badges" style="margin-bottom:18px">
        <span class="feat-badge">R$ ${Number(p.price).toLocaleString("pt-BR")}</span>
        ${p.oldprice?`<span class="feat-badge" style="text-decoration:line-through;opacity:.5;border-color:transparent">R$ ${Number(p.oldprice).toLocaleString("pt-BR")}</span>`:""}
      </div>
      <a href="${WHATSAPP_LINK}" class="btn-gold" style="width:fit-content">
        <i class="ti ti-brand-whatsapp" style="font-size:16px"></i>Consultar disponibilidade
      </a>
    </div>
  `;
}

async function applyHeroBg() {
  try {
    const isMobile = window.innerWidth <= 640;
    const key = isMobile ? "hero_bg_mobile" : "hero_bg_desktop";
    const url = await getSetting(key);
    const hero = document.querySelector(".hero");
    if (!hero) return;
    if (url && url.trim() !== "") {
      hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url('${url}')`;
      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center";
    } else {
      hero.style.backgroundImage = "";
      hero.style.backgroundSize = "";
      hero.style.backgroundPosition = "";
    }
  } catch(e) {}
}

async function loadProductsFromAPI() {
  products = await getProducts();
  nextId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  renderFilterBar();
  renderCarousel();
  renderFeaturedSection();
  applyHeroBg();
}

document.addEventListener("DOMContentLoaded", async () => {
  _lastWasMobile = isMobileView();
  await loadProductsFromAPI();
});