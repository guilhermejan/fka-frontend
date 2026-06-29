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
      if (!isMobileView()) return;
      isDragging=true; dragMoved=false;
      startX=e.pageX-track.offsetLeft;
      scrollLeft=track.scrollLeft;
      track.classList.add("dragging");
    });
    track.addEventListener("mouseleave",()=>{isDragging=false;track.classList.remove("dragging")});
    track.addEventListener("mouseup",()=>{isDragging=false;track.classList.remove("dragging")});
    track.addEventListener("mousemove",e=>{
      if(!isDragging || !isMobileView())return;
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
let _activeProducts = [];   // lista de produtos ativos, na ordem exibida
let _realCardCount = 0;     // quantos cards "reais" existem (sem clones)
let _loopGuard = false;     // evita reentrância no listener de scroll

function renderMobileCarousel(track, active) {
  _activeProducts = active;
  _realCardCount = active.length;

  if (active.length <= 1) {
    // não precisa de loop/clones com 0 ou 1 produto
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

  // posiciona o scroll no primeiro card "real" (depois do clone do último)
  requestAnimationFrame(() => {
    const cards = track.querySelectorAll(".prod-card");
    const realFirst = cards[1]; // index 0 é o clone do último
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
  const lastRealCard    = cards[cards.length - 2];

  const buffer = 4; // px de tolerância

  // chegou no clone do começo (rolando pra esquerda) -> pula pro último real
  if (track.scrollLeft <= firstCloneCard.offsetLeft + buffer) {
    _loopGuard = true;
    track.scrollLeft = lastRealCard.offsetLeft - (track.clientWidth - lastRealCard.offsetWidth) / 2;
    requestAnimationFrame(() => { _loopGuard = false; });
  }
  // chegou no clone do fim (rolando pra direita) -> pula pro primeiro real
  else if (track.scrollLeft + track.clientWidth >= lastCloneCard.offsetLeft + lastCloneCard.offsetWidth - buffer) {
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
  if (active.length <= 1) {
    dotsWrap.innerHTML = "";
    return;
  }
  dotsWrap.innerHTML = active.map((_, i) =>
    `<button class="carousel-dot${i === activeIndex ? " active" : ""}" aria-label="Ir para produto ${i+1}" onclick="goToCarouselDot(${i})"></button>`
  ).join("");
}

function goToCarouselDot(index) {
  const track = document.getElementById("carousel-track");
  if (!track) return;
  const cards = track.querySelectorAll(".prod-card");
  // +1 porque o índice 0 é o clone do último
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

  // ignora o primeiro (clone do último) e o último (clone do primeiro)
  for (let i = 1; i < cards.length - 1; i++) {
    const card = cards[i];
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const dist = Math.abs(cardCenter - trackCenter);
    if (dist < closestDist) {
      closestDist = dist;
      closestRealIdx = i - 1; // -1 pra compensar o clone na posição 0
    }
  }

  const dotsWrap = document.getElementById("carousel-dots");
  if (!dotsWrap) return;
  dotsWrap.querySelectorAll(".carousel-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === closestRealIdx);
  });
}

/* ============================================================
   RENDER PRINCIPAL — decide entre carrossel mobile e grid desktop
   ============================================================ */
function renderCarousel(){
  const track = document.getElementById("carousel-track");
  if(!track) return;
  const active = products.filter(p=>p.active);

  if(!active.length){
    track.innerHTML = `<div style="padding:40px;color:#444;font-size:13px;text-align:center;width:100%">Nenhum produto ativo no momento.</div>`;
    const dotsWrap = document.getElementById("carousel-dots");
    if (dotsWrap) dotsWrap.innerHTML = "";
    return;
  }

  if (isMobileView()) {
    renderMobileCarousel(track, active);
  } else {
    // grid desktop: sem clones, sem dots, sem drag
    track.innerHTML = active.map(p => buildCardHTML(p)).join("");
    const dotsWrap = document.getElementById("carousel-dots");
    if (dotsWrap) dotsWrap.innerHTML = "";
  }
}

function handleCardClick(e, id) {
  if (e.target.closest(".prod-wpp-btn")) return;
  openProdModal(id);
}
window.handleCardClick = handleCardClick;

/* Re-renderiza ao trocar entre mobile/desktop (ex: girar o celular,
   redimensionar a janela), evitando re-render a cada pixel de resize */
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
  renderCarousel();
  renderFeaturedSection();
  applyHeroBg();
}

document.addEventListener("DOMContentLoaded", async () => {
  _lastWasMobile = isMobileView();
  await loadProductsFromAPI();
});