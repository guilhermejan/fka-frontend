let products = [];
let nextId = 1;

// ─── CONFIG ───
const WHATSAPP_LINK = "https://chat.whatsapp.com/BVZANfpNxez9OgorcpWhYy?mode=gi_t";

// ─── CAROUSEL DRAG ───
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
    },{ once:true });
  });
})();

// ─── MODAL DE PRODUTO ───
function openProdModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  const content = document.getElementById("prod-modal-content");
  content.innerHTML = `
    ${p.img
      ? `<img class="prod-modal-img" src="${p.img}" alt="${p.name}">`
      : `<div class="prod-modal-img-placeholder"><i class="ti ti-keyboard"></i></div>`
    }
    <div class="prod-modal-body">
      <div class="prod-modal-top">
        <div>
          <div class="prod-modal-cat">${p.cat || ""}</div>
          <div class="prod-modal-name">${p.name}</div>
        </div>
        ${p.badge ? `<span class="prod-modal-badge">${p.badge}</span>` : ""}
      </div>
      ${p.description ? `<div class="prod-modal-desc">${p.description}</div>` : ""}
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

  const overlay = document.getElementById("prod-modal-overlay");
  overlay.style.display = "flex";
  // força reflow pra animação funcionar
  void overlay.offsetWidth;
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

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

// fecha com ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const overlay = document.getElementById("prod-modal-overlay");
    if (overlay && overlay.classList.contains("open")) {
      overlay.classList.remove("open");
      setTimeout(() => {
        overlay.style.display = "none";
        document.body.style.overflow = "";
      }, 240);
    }
  }
});

// ─── RENDER CAROUSEL ───
function renderCarousel(){
  const track = document.getElementById("carousel-track");
  if(!track) return;
  const active = products.filter(p=>p.active);
  if(!active.length){
    track.innerHTML = `<div style="padding:40px;color:#444;font-size:13px;text-align:center;width:100%">Nenhum produto ativo no momento.</div>`;
    return;
  }
  track.innerHTML = active.map(p=>`
    <div class="prod-card" onclick="handleCardClick(event, ${p.id})">
      ${p.badge ? `<span class="prod-badge-new">${p.badge}</span>` : ""}
      ${p.img
        ? `<img class="prod-card-img" src="${p.img}" alt="${p.name}" draggable="false">`
        : `<div class="prod-card-img-placeholder"><i class="ti ti-keyboard"></i></div>`
      }
      <div class="prod-card-body">
        <div class="prod-card-cat">${p.cat}</div>
        <div class="prod-card-name" title="${p.name}">${p.name}</div>
        <div class="prod-card-desc">${p.description||""}</div>
        <div class="prod-card-prices">
          <span class="prod-price">R$ ${Number(p.price).toLocaleString("pt-BR")}</span>
          ${p.oldprice ? `<span class="prod-oldprice">R$ ${Number(p.oldprice).toLocaleString("pt-BR")}</span>` : ""}
        </div>
        <button class="prod-wpp-btn" onclick="event.stopPropagation();window.open('${WHATSAPP_LINK}')">
          <i class="ti ti-brand-whatsapp" style="font-size:14px"></i> Pedir pelo WhatsApp
        </button>
      </div>
    </div>
  `).join("");
}

// Só abre modal se não foi um drag
function handleCardClick(e, id) {
  // se o clique veio do botão de WhatsApp, ignora
  if (e.target.closest(".prod-wpp-btn")) return;
  openProdModal(id);
}
window.handleCardClick = handleCardClick;

// ─── FEATURED PRODUCT ───
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

  inner.innerHTML = `
    ${p.img
      ? `<img src="${p.img}" alt="${p.name}" class="feat-prod-img">`
      : `<div class="feat-prod-placeholder"><i class="ti ti-keyboard"></i></div>`
    }
    <div class="featured-text">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="background:rgba(201,168,76,.1);color:var(--gold);font-size:10px;font-weight:700;padding:3px 9px;border-radius:4px;border:1px solid rgba(201,168,76,.2);text-transform:uppercase;letter-spacing:.5px">${p.cat}</span>
        ${p.badge?`<span style="background:var(--gold);color:#0a0a0a;font-size:9px;font-weight:800;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px">${p.badge}</span>`:""}
      </div>
      <h2>${p.name}</h2>
      <p>${p.description||"Produto premium importado exclusivamente pela FKA Imports."}</p>
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

async function loadProductsFromAPI() {
  products = await getProducts();
  nextId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  renderCarousel();
  if (typeof renderFeaturedSection === "function") renderFeaturedSection();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductsFromAPI();
});

// Função exposta pro botão X do modal
window.openProdModal = openProdModal;