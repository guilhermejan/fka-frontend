let allProducts = [];
let imgUrls = []; // todas as URLs finais (existentes + recém upadas)

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "./acesso.html";
    return;
  }
  loadProducts();
  document.getElementById("product-form")
    .addEventListener("submit", saveProduct);
});

function logout() {
  localStorage.removeItem("token");
  window.location.href = "./acesso.html";
}
window.logout = logout;

// ===============================
// CARREGAR PRODUTOS
// ===============================

async function loadProducts() {
  const tbody = document.getElementById("products-table");
  try {
    allProducts = await getProducts();
  } catch (error) {
    console.error("Erro buscando produtos:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Erro ao carregar produtos.</td></tr>`;
    return;
  }
  renderStats();
  renderTable();
  renderFeatured();
}
window.loadProducts = loadProducts;

function renderStats() {
  const total = allProducts.length;
  const active = allProducts.filter(p => p.active).length;
  const categories = new Set(allProducts.map(p => p.cat).filter(Boolean)).size;
  const withPhoto = allProducts.filter(p => p.img && p.img.trim() !== "").length;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-active").textContent = active;
  document.getElementById("stat-categories").textContent = categories;
  document.getElementById("stat-with-photo").textContent = withPhoto;
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

function renderTable() {
  const tbody = document.getElementById("products-table");
  if (allProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Nenhum produto cadastrado.</td></tr>`;
    return;
  }
  tbody.innerHTML = allProducts.map(p => {
    const imgs = parseImgs(p.img);
    const thumb = imgs[0] || "";
    return `
    <tr>
      <td><img class="prod-img" src="${escapeHtml(thumb || './assets/images/logo.png')}" alt=""></td>
      <td class="prod-name">${escapeHtml(p.name)}</td>
      <td><span class="cat-badge">${escapeHtml(p.cat || "Sem categoria")}</span></td>
      <td class="price-current">R$ ${formatPrice(p.price)}</td>
      <td>${p.oldprice ? `<span class="price-old">R$ ${formatPrice(p.oldprice)}</span>` : "-"}</td>
      <td><span class="status-dot ${p.active ? "active" : "inactive"}">${p.active ? "Ativo" : "Inativo"}</span></td>
      <td class="actions-cell">
        <button class="btn-edit" onclick="openProductModal(${p.id})">Editar</button>
        <button class="btn-delete" onclick="removeProduct(${p.id})">🗑</button>
      </td>
    </tr>`;
  }).join("");
}

function renderFeatured() {
  const box = document.getElementById("featured-box");
  const featured = allProducts.find(p => Number(p.featured) === 1);
  if (!featured) {
    box.innerHTML = `<span class="empty-text">Nenhum produto em destaque</span>`;
    return;
  }
  const imgs = parseImgs(featured.img);
  const thumb = imgs[0] || "./assets/images/logo.png";
  box.innerHTML = `
    <div class="featured-product">
      <img src="${escapeHtml(thumb)}" alt="">
      <div>
        <div class="fp-name">${escapeHtml(featured.name)}</div>
        <div class="fp-cat">${escapeHtml(featured.cat || "Sem categoria")}</div>
      </div>
      <div class="fp-price">R$ ${formatPrice(featured.price)}</div>
    </div>`;
}

// ===============================
// SLOTS DE IMAGEM
// ===============================
// imgUrls é um array misto:
//   - string  → URL já salva no Cloudinary
//   - object  → { file: File, preview: objectURL } ainda não upado

function renderImgSlots() {
  const container = document.getElementById("img-slots-container");
  if (!container) return;

  const MAX = 5;
  let html = "";

  imgUrls.forEach((item, i) => {
    const src = typeof item === "string" ? item : item.preview;
    const isFirst = i === 0;
    html += `
      <div class="img-slot filled">
        <img src="${escapeHtml(src)}" alt="">
        ${isFirst ? `<span class="img-slot-principal">Principal</span>` : ""}
        <button type="button" class="img-slot-remove" onclick="removeImgSlot(${i})" title="Remover">&times;</button>
      </div>`;
  });

  const remaining = MAX - imgUrls.length;
  for (let i = 0; i < remaining; i++) {
    html += `
      <div class="img-slot empty" onclick="openSlotPicker(event)" title="Adicionar imagem">
        <span class="img-slot-plus">+</span>
        <span class="img-slot-label">Adicionar</span>
      </div>`;
  }

  container.innerHTML = html;
}

function openSlotPicker(e) {
  if (e) e.stopPropagation();
  if (imgUrls.length >= 5) return;
  document.getElementById("product-img-file").click();
}

function removeImgSlot(idx) {
  const item = imgUrls[idx];
  if (item && typeof item === "object" && item.preview) {
    URL.revokeObjectURL(item.preview);
  }
  imgUrls.splice(idx, 1);
  renderImgSlots();
}
window.removeImgSlot = removeImgSlot;

function handleImgUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  const slotsLeft = 5 - imgUrls.length;
  files.slice(0, slotsLeft).forEach(file => {
    imgUrls.push({ file, preview: URL.createObjectURL(file) });
  });

  renderImgSlots();
}
window.handleImgUpload = handleImgUpload;

// ===============================
// MODAL DE PRODUTO
// ===============================

function openProductModal(id) {
  const overlay = document.getElementById("product-modal-overlay");
  const form = document.getElementById("product-form");
  form.reset();
  imgUrls = [];

  if (id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    document.getElementById("product-modal-title").textContent = "Editar Produto";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name || "";
    document.getElementById("product-cat").value = product.cat || "";
    document.getElementById("product-price").value = product.price ?? "";
    document.getElementById("product-oldprice").value = product.oldprice ?? "";
    document.getElementById("product-badge").value = product.badge || "";
    document.getElementById("product-desc").value = product.description || "";
    document.getElementById("product-active").checked = !!product.active;

    // carrega URLs existentes como strings simples
    imgUrls = parseImgs(product.img);
  } else {
    document.getElementById("product-modal-title").textContent = "Novo Produto";
    document.getElementById("product-id").value = "";
    document.getElementById("product-active").checked = true;
  }

  renderImgSlots();
  const fileInput = document.getElementById("product-img-file");
  fileInput.onchange = handleImgUpload;
  overlay.classList.add("open");
}
window.openProductModal = openProductModal;

function closeProductModal() {
  // revoga object URLs pendentes
  imgUrls.forEach(item => {
    if (item && item._objectUrl) URL.revokeObjectURL(item._objectUrl);
  });
  imgUrls = [];
  document.getElementById("product-modal-overlay").classList.remove("open");
}
window.closeProductModal = closeProductModal;

// ===============================
// SALVAR PRODUTO
// ===============================

async function saveProduct(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.textContent = "Salvando...";
  submitBtn.disabled = true;

  const id = document.getElementById("product-id").value;

  try {
    const finalUrls = [];

    for (const item of imgUrls) {
      if (typeof item === "object" && item.file) {
        const url = await uploadImage(item.file);
        if (item.preview) URL.revokeObjectURL(item.preview);
        finalUrls.push(url);
      } else {
        finalUrls.push(item);
      }
    }

    const imgValue = finalUrls.length === 0 ? "" :
                     finalUrls.length === 1 ? finalUrls[0] :
                     JSON.stringify(finalUrls);

    const payload = {
      name:     document.getElementById("product-name").value.trim(),
      cat:      document.getElementById("product-cat").value.trim(),
      price:    parseFloat(document.getElementById("product-price").value) || 0,
      oldprice: parseFloat(document.getElementById("product-oldprice").value) || null,
      img:      imgValue,
      badge:    document.getElementById("product-badge").value.trim(),
      desc:     document.getElementById("product-desc").value.trim(),
      active:   document.getElementById("product-active").checked
    };

    if (id) {
      const existing = allProducts.find(p => p.id === Number(id));
      payload.featured = existing ? existing.featured : 0;
      await updateProduct(id, payload);
    } else {
      payload.featured = 0;
      await createProduct(payload);
    }

    closeProductModal();
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar produto: " + error.message);
  } finally {
    submitBtn.textContent = "Salvar";
    submitBtn.disabled = false;
  }
}

async function removeProduct(id) {
  if (!confirm("Excluir este produto?")) return;
  try {
    await deleteProduct(id);
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("Erro ao excluir produto.");
  }
}
window.removeProduct = removeProduct;

// ===============================
// DESTAQUE
// ===============================

function openFeaturedModal() {
  const overlay = document.getElementById("featured-modal-overlay");
  const container = document.getElementById("featured-options");

  if (allProducts.length === 0) {
    container.innerHTML = `<p class="empty-row">Nenhum produto cadastrado.</p>`;
  } else {
    container.innerHTML = allProducts.map(p => {
      const imgs = parseImgs(p.img);
      const thumb = imgs[0] || "./assets/images/logo.png";
      return `
        <button class="featured-option ${Number(p.featured) === 1 ? "is-current" : ""}" onclick="chooseFeatured(${p.id})">
          <img src="${escapeHtml(thumb)}" alt="">
          <div>
            <div class="fp-name">${escapeHtml(p.name)}</div>
            <div class="fp-cat">${escapeHtml(p.cat || "Sem categoria")}</div>
          </div>
        </button>`;
    }).join("");
  }

  overlay.classList.add("open");
}
window.openFeaturedModal = openFeaturedModal;

function closeFeaturedModal() {
  document.getElementById("featured-modal-overlay").classList.remove("open");
}
window.closeFeaturedModal = closeFeaturedModal;

async function chooseFeatured(id) {
  try {
    await setFeatured(id, allProducts);
    closeFeaturedModal();
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("Erro ao definir destaque.");
  }
}
window.chooseFeatured = chooseFeatured;

// ===============================
// CONFIGURAÇÕES — HERO BG
// ===============================

async function loadHeroBgSetting() {
  try {
    const url = await getSetting("hero_bg");
    const box = document.getElementById("hero-bg-preview-box");
    const btnRemove = document.getElementById("btn-remove-bg");
    if (!box) return;
    if (url && url.trim() !== "") {
      box.outerHTML = `<img id="hero-bg-preview-box" class="hero-bg-preview" src="${url}" alt="Fundo atual">`;
      if (btnRemove) btnRemove.style.display = "inline-flex";
    } else {
      if (btnRemove) btnRemove.style.display = "none";
    }
  } catch(e) {
    console.log("Sem configuração de fundo salva.");
  }
}

async function handleHeroBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const btn = document.querySelector(".settings-section .btn-primary");
  btn.textContent = "Fazendo upload...";
  btn.disabled = true;
  try {
    const url = await uploadImage(file);
    await updateSetting("hero_bg", url);
    const box = document.getElementById("hero-bg-preview-box");
    if (box) {
      const img = document.createElement("img");
      img.id = "hero-bg-preview-box";
      img.className = "hero-bg-preview";
      img.src = url;
      img.alt = "Fundo atual";
      box.replaceWith(img);
    }
    const btnRemove = document.getElementById("btn-remove-bg");
    if (btnRemove) btnRemove.style.display = "inline-flex";
    alert("Fundo atualizado com sucesso!");
  } catch(err) {
    console.error(err);
    alert("Erro ao fazer upload: " + err.message);
  } finally {
    btn.textContent = "Upload de imagem";
    btn.disabled = false;
    e.target.value = "";
  }
}

async function removeHeroBg() {
  if (!confirm("Remover a imagem de fundo e voltar ao grid padrão?")) return;
  try {
    await updateSetting("hero_bg", "");
    const box = document.getElementById("hero-bg-preview-box");
    if (box) {
      const div = document.createElement("div");
      div.id = "hero-bg-preview-box";
      div.className = "hero-bg-default";
      div.textContent = "Grid padrão (default)";
      box.replaceWith(div);
    }
    const btnRemove = document.getElementById("btn-remove-bg");
    if (btnRemove) btnRemove.style.display = "none";
    alert("Fundo removido. O site voltará ao grid padrão.");
  } catch(err) {
    console.error(err);
    alert("Erro ao remover fundo: " + err.message);
  }
}

window.handleHeroBgUpload = handleHeroBgUpload;
window.removeHeroBg = removeHeroBg;

// ===============================
// UTILS
// ===============================

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("open");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadHeroBgSetting();
});