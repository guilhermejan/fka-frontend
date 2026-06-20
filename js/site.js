// ─── CONFIG ───
const WHATSAPP_LINK = "https://chat.whatsapp.com/BVZANfpNxez9OgorcpWhYy?mode=gi_t";

// ─── CAROUSEL DRAG ───
(function(){
  let track, isDragging=false, startX=0, scrollLeft=0;
  document.addEventListener("DOMContentLoaded",()=>{
    track = document.getElementById("carousel-track");
    if(!track) return;
    track.addEventListener("mousedown", e=>{isDragging=true;startX=e.pageX-track.offsetLeft;scrollLeft=track.scrollLeft;track.classList.add("dragging")});
    track.addEventListener("mouseleave",()=>{isDragging=false;track.classList.remove("dragging")});
    track.addEventListener("mouseup",()=>{isDragging=false;track.classList.remove("dragging")});
    track.addEventListener("mousemove",e=>{if(!isDragging)return;e.preventDefault();const x=e.pageX-track.offsetLeft;track.scrollLeft=scrollLeft-(x-startX)*1.2});
    // hide scroll hint after first scroll
    track.addEventListener("scroll",()=>{const h=document.getElementById("scroll-hint");if(h)h.style.opacity="0"},{ once:true });
  });
})();

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
    <div class="prod-card">
      ${p.badge ? `<span class="prod-badge-new">${p.badge}</span>` : ""}
      ${p.img
        ? `<img class="prod-card-img" src="${p.img}" alt="${p.name}" draggable="false">`
        : `<div class="prod-card-img-placeholder"><i class="ti ti-keyboard"></i></div>`
      }
      <div class="prod-card-body">
        <div class="prod-card-cat">${p.cat}</div>
        <div class="prod-card-name" title="${p.name}">${p.name}</div>
        <div class="prod-card-desc">${p.desc||""}</div>
        <div class="prod-card-prices">
          <span class="prod-price">R$ ${Number(p.price).toLocaleString("pt-BR")}</span>
          ${p.oldprice ? `<span class="prod-oldprice">R$ ${Number(p.oldprice).toLocaleString("pt-BR")}</span>` : ""}
        </div>
        <button class="prod-wpp-btn" onclick="window.open('${WHATSAPP_LINK}')">
          <i class="ti ti-brand-whatsapp" style="font-size:14px"></i> Pedir pelo WhatsApp
        </button>
      </div>
    </div>
  `).join("");
}

// ─── MODAL ───
function openModal(id=null){
  editingId=id; pendingImg="";
  document.getElementById("modal-title").textContent = id ? "Editar Produto" : "Novo Produto";
  document.getElementById("img-prev").style.display="none";
  document.getElementById("img-prev").src="";
  document.getElementById("img-file").value="";
  if(id){
    const p=products.find(x=>x.id===id);
    document.getElementById("f-name").value=p.name;
    document.getElementById("f-cat").value=p.cat;
    document.getElementById("f-price").value=p.price;
    document.getElementById("f-oldprice").value=p.oldprice||"";
    document.getElementById("f-desc").value=p.desc||"";
    document.getElementById("f-active").checked=p.active;
    document.getElementById("f-badge").value=p.badge||"";
    if(p.img){pendingImg=p.img;document.getElementById("img-prev").src=p.img;document.getElementById("img-prev").style.display="block";}
  } else {
    document.getElementById("f-name").value="";
    document.getElementById("f-cat").value="Teclados";
    document.getElementById("f-price").value="";
    document.getElementById("f-oldprice").value="";
    document.getElementById("f-desc").value="";
    document.getElementById("f-active").checked=true;
    document.getElementById("f-badge").value="";
  }
  document.getElementById("modal-bg").classList.add("open");
}
function closeModal(){
  document.getElementById("modal-bg").classList.remove("open");
  editingId=null;pendingImg="";
}
function handleImg(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{
    pendingImg=ev.target.result;
    const prev=document.getElementById("img-prev");
    prev.src=pendingImg;prev.style.display="block";
  };
  reader.readAsDataURL(file);
}
async function saveProduct() {
  const name = document.getElementById("f-name").value.trim();
  const price = parseFloat(document.getElementById("f-price").value);
  if (!name || !price) {
    showToast("Preencha nome e preço.", true);
    return;
  }
  const data = {
    name,
    cat: document.getElementById("f-cat").value,
    price,
    oldprice: parseFloat(document.getElementById("f-oldprice").value) || 0,
    desc: document.getElementById("f-desc").value.trim(),
    active: document.getElementById("f-active").checked,
    badge: document.getElementById("f-badge").value,
    img: pendingImg
  };
  try {
    if (editingId) {
      const existing = products.find(x => x.id === editingId);
      data.featured = existing ? existing.featured : 0;
      await updateProduct(editingId, data);
      showToast("Produto atualizado!");
    } else {
      data.featured = 0;
      await createProduct(data);
      showToast("Produto adicionado!");
    }
    await loadProductsFromAPI();
    closeModal();
  } catch (error) {
    console.error(error);
    showToast("Erro ao salvar produto.", true);
  }
}

// ─── DELETE ───
function askDel(id){deletingId=id;document.getElementById("confirm-bg").classList.add("open");}
function closeConfirm(){document.getElementById("confirm-bg").classList.remove("open");deletingId=null;}
async function confirmDel() {
  try {
    await deleteProduct(deletingId);
    closeConfirm();
    await loadProductsFromAPI();
    showToast("Produto removido.");
  } catch (error) {
    console.error(error);
    showToast("Erro ao remover produto.", true);
  }
}

// ─── TOAST ───
function showToast(msg,err=false){
  const t=document.getElementById("toast");
  document.getElementById("toast-msg").textContent=msg;
  document.getElementById("toast-icon").className=err?"ti ti-alert-circle":"ti ti-check";
  t.className="toast"+(err?" err":"");
  void t.offsetWidth;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2800);
}

// ─── FEATURED PRODUCT ───
// O produto em destaque agora vem do backend (campo "featured" na tabela
// products), definido pelo painel admin. Não depende mais de localStorage,
// então é o mesmo para todos os visitantes do site.
function renderFeaturedSection(){
  const section = document.getElementById("featured-section");
  const inner = document.getElementById("feat-inner");
  const title = document.getElementById("feat-title");
  if(!section||!inner) return;

  // produto marcado como destaque; se nenhum, cai para o primeiro ativo
  let p = products.find(x => Number(x.featured) === 1 && x.active);
  if(!p) p = products.find(x => x.active);

  if(!p){
    section.style.display="none";
    return;
  }
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
      <p>${p.desc||"Produto premium importado exclusivamente pela FKA Imports."}</p>
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

    nextId = products.length
        ? Math.max(...products.map(p => p.id)) + 1
        : 1;

    renderCarousel();

    if (typeof renderAdminTable === "function")
        renderAdminTable();

    if (typeof renderStats === "function")
        renderStats();

    if (typeof renderFeaturedSection === "function")
        renderFeaturedSection();
}

// ─── INIT ───
document.addEventListener("DOMContentLoaded", async () => {
    await loadProductsFromAPI();
});