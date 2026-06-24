
let allProducts = [];
let pendingImgFile = null;

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

function renderTable() {
  const tbody = document.getElementById("products-table");

  if (allProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = allProducts.map(p => `
    <tr>
      <td><img class="prod-img" src="${escapeHtml(p.img || './assets/images/logo.png')}" alt=""></td>
      <td class="prod-name">${escapeHtml(p.name)}</td>
      <td><span class="cat-badge">${escapeHtml(p.cat || "Sem categoria")}</span></td>
      <td class="price-current">R$ ${formatPrice(p.price)}</td>
      <td>${p.oldprice ? `<span class="price-old">R$ ${formatPrice(p.oldprice)}</span>` : "-"}</td>
      <td><span class="status-dot ${p.active ? "active" : "inactive"}">${p.active ? "Ativo" : "Inativo"}</span></td>
      <td class="actions-cell">
        <button class="btn-edit" onclick="openProductModal(${p.id})">Editar</button>
        <button class="btn-delete" onclick="removeProduct(${p.id})">🗑</button>
      </td>
    </tr>
  `).join("");
}

function renderFeatured() {
  const box = document.getElementById("featured-box");
  const featured = allProducts.find(p => Number(p.featured) === 1);

  if (!featured) {
    box.innerHTML = `<span class="empty-text">Nenhum produto em destaque</span>`;
    return;
  }

  box.innerHTML = `
    <div class="featured-product">
      <img src="${escapeHtml(featured.img || './assets/images/logo.png')}" alt="">
      <div>
        <div class="fp-name">${escapeHtml(featured.name)}</div>
        <div class="fp-cat">${escapeHtml(featured.cat || "Sem categoria")}</div>
      </div>
      <div class="fp-price">R$ ${formatPrice(featured.price)}</div>
    </div>
  `;
}

function handleImgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  pendingImgFile = file;

  const preview = document.getElementById("product-img-preview");
  const label = document.getElementById("product-img-label");
  const reader = new FileReader();
  reader.onload = ev => {
    preview.src = ev.target.result;
    preview.style.display = "block";
    label.textContent = file.name;
  };
  reader.readAsDataURL(file);
}
window.handleImgUpload = handleImgUpload;

function openProductModal(id) {
  const overlay = document.getElementById("product-modal-overlay");
  const form = document.getElementById("product-form");
  form.reset();
  pendingImgFile = null;

  const preview = document.getElementById("product-img-preview");
  const label = document.getElementById("product-img-label");
  preview.style.display = "none";
  preview.src = "";
  label.textContent = "Clique para selecionar uma imagem";
  document.getElementById("product-img").value = "";

  if (id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;
    document.getElementById("product-modal-title").textContent = "Editar Produto";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name || "";
    document.getElementById("product-cat").value = product.cat || "";
    document.getElementById("product-price").value = product.price ?? "";
    document.getElementById("product-oldprice").value = product.oldprice ?? "";
    document.getElementById("product-img").value = product.img || "";
    document.getElementById("product-badge").value = product.badge || "";
    document.getElementById("product-desc").value = product.description || "";
    document.getElementById("product-active").checked = !!product.active;

    if (product.img) {
      preview.src = product.img;
      preview.style.display = "block";
      label.textContent = "Imagem atual (selecione outra para trocar)";
    }
  } else {
    document.getElementById("product-modal-title").textContent = "Novo Produto";
    document.getElementById("product-id").value = "";
    document.getElementById("product-active").checked = true;
  }

  overlay.classList.add("open");
}
window.openProductModal = openProductModal;

function closeProductModal() {
  document.getElementById("product-modal-overlay").classList.remove("open");
  pendingImgFile = null;
}
window.closeProductModal = closeProductModal;

async function saveProduct(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.textContent = "Salvando...";
  submitBtn.disabled = true;

  const id = document.getElementById("product-id").value;

  try {
    let imgUrl = document.getElementById("product-img").value;
    if (pendingImgFile) {
      imgUrl = await uploadImage(pendingImgFile);
    }

    const payload = {
      name: document.getElementById("product-name").value.trim(),
      cat: document.getElementById("product-cat").value.trim(),
      price: parseFloat(document.getElementById("product-price").value) || 0,
      oldprice: parseFloat(document.getElementById("product-oldprice").value) || null,
      img: imgUrl,
      badge: document.getElementById("product-badge").value.trim(),
      desc: document.getElementById("product-desc").value.trim(),
      active: document.getElementById("product-active").checked
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

function openFeaturedModal() {
  const overlay = document.getElementById("featured-modal-overlay");
  const container = document.getElementById("featured-options");

  if (allProducts.length === 0) {
    container.innerHTML = `<p class="empty-row">Nenhum produto cadastrado.</p>`;
  } else {
    container.innerHTML = allProducts.map(p => `
      <button class="featured-option ${Number(p.featured) === 1 ? "is-current" : ""}" onclick="chooseFeatured(${p.id})">
        <img src="${escapeHtml(p.img || './assets/images/logo.png')}" alt="">
        <div>
          <div class="fp-name">${escapeHtml(p.name)}</div>
          <div class="fp-cat">${escapeHtml(p.cat || "Sem categoria")}</div>
        </div>
      </button>
    `).join("");
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
 
    // atualiza preview
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
 
    // volta pro placeholder
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

document.addEventListener("DOMContentLoaded", () => {
  loadHeroBgSetting();
});