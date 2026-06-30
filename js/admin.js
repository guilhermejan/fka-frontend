let allProducts = [];
let imgUrls = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "./acesso.html";
    return;
  }
  loadProducts();
  loadHeroBgPreview();
  loadReviews();
  document.getElementById("product-form")
    .addEventListener("submit", saveProduct);
  document.getElementById("review-form")
    .addEventListener("submit", saveReview);
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

function initDropzone() {
  const zone = document.getElementById("img-dropzone");
  const input = document.getElementById("product-img-file");
  if (!zone || !input) return;

  zone.addEventListener("click", () => input.click());

  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    addFiles(files);
  });

  input.addEventListener("change", e => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    input.value = "";
  });
}

function addFiles(files) {
  const slotsLeft = 5 - imgUrls.length;
  if (slotsLeft <= 0) return;
  files.slice(0, slotsLeft).forEach(file => {
    imgUrls.push({ file, preview: URL.createObjectURL(file) });
  });
  renderImgPreviews();
}

function renderImgPreviews() {
  const container = document.getElementById("img-previews");
  const zone = document.getElementById("img-dropzone");
  if (!container) return;

  container.innerHTML = imgUrls.map((item, i) => {
    const src = typeof item === "string" ? item : item.preview;
    const isPrimary = i === 0;
    return `
      <div class="img-preview-item">
        <img src="${escapeHtml(src)}" alt="">
        ${isPrimary ? `<span class="img-preview-principal">Principal</span>` : ""}
        <button type="button" class="img-preview-remove" onclick="removeImgItem(${i})" title="Remover">&times;</button>
      </div>`;
  }).join("");

  if (zone) {
    zone.style.display = imgUrls.length >= 5 ? "none" : "flex";
  }

  const counter = document.getElementById("img-counter");
  if (counter) counter.textContent = `${imgUrls.length}/5 imagens`;
}

function removeImgItem(idx) {
  const item = imgUrls[idx];
  if (item && typeof item === "object" && item.preview) {
    URL.revokeObjectURL(item.preview);
  }
  imgUrls.splice(idx, 1);
  renderImgPreviews();
}
window.removeImgItem = removeImgItem;

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
    imgUrls = parseImgs(product.img);
  } else {
    document.getElementById("product-modal-title").textContent = "Novo Produto";
    document.getElementById("product-id").value = "";
    document.getElementById("product-active").checked = true;
  }

  overlay.classList.add("open");
  setTimeout(() => {
    renderImgPreviews();
    initDropzone();
  }, 50);
}
window.openProductModal = openProductModal;

function closeProductModal() {
  imgUrls.forEach(item => {
    if (item && typeof item === "object" && item.preview) {
      URL.revokeObjectURL(item.preview);
    }
  });
  imgUrls = [];
  document.getElementById("product-modal-overlay").classList.remove("open");
}
window.closeProductModal = closeProductModal;

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

// ── HERO BG (desktop + mobile) ──────────────────────────────

let _heroBgBase64 = { desktop: null, mobile: null };

function onHeroBgSelected(input, type) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById(`hero-bg-filename-${type}`).textContent = file.name;
  const reader = new FileReader();
  reader.onload = function(e) {
    _heroBgBase64[type] = e.target.result;
    document.getElementById(`hero-bg-preview-${type}`).src = e.target.result;
    document.getElementById(`hero-bg-preview-${type}`).style.display = "block";
    document.getElementById(`hero-bg-default-${type}`).style.display = "none";
  };
  reader.readAsDataURL(file);
}
window.onHeroBgSelected = onHeroBgSelected;

async function saveHeroBg(type) {
  if (!_heroBgBase64[type]) { alert("Selecione uma imagem primeiro."); return; }
  try {
    await updateSetting(`hero_bg_${type}`, _heroBgBase64[type]);
    alert("Fundo salvo com sucesso!");
  } catch(e) {
    alert("Erro ao salvar: " + e.message);
  }
}
window.saveHeroBg = saveHeroBg;

async function removeHeroBg(type) {
  if (!confirm("Remover a imagem de fundo?")) return;
  try {
    await updateSetting(`hero_bg_${type}`, "");
    document.getElementById(`hero-bg-preview-${type}`).style.display = "none";
    document.getElementById(`hero-bg-default-${type}`).style.display = "flex";
    document.getElementById(`hero-bg-filename-${type}`).textContent = "";
    _heroBgBase64[type] = null;
    alert("Fundo removido!");
  } catch(e) {
    alert("Erro ao remover: " + e.message);
  }
}
window.removeHeroBg = removeHeroBg;

async function loadHeroBgPreview() {
  for (const type of ["desktop", "mobile"]) {
    try {
      const url = await getSetting(`hero_bg_${type}`);
      if (url && url.trim()) {
        document.getElementById(`hero-bg-preview-${type}`).src = url;
        document.getElementById(`hero-bg-preview-${type}`).style.display = "block";
        document.getElementById(`hero-bg-default-${type}`).style.display = "none";
      }
    } catch(e) {}
  }
}

// ── REVIEWS (Avaliações) ────────────────────────────────────

let allReviews = [];
let reviewProofImg = null; // { file, preview } ou string (URL existente) ou null

async function loadReviews() {
  const tbody = document.getElementById("reviews-table");
  try {
    allReviews = await getReviews();
  } catch (error) {
    console.error("Erro buscando avaliações:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Erro ao carregar avaliações.</td></tr>`;
    return;
  }
  renderReviewsTable();
}
window.loadReviews = loadReviews;

function renderStars(n) {
  const full = "★".repeat(n);
  const empty = "☆".repeat(5 - n);
  return full + empty;
}

function renderReviewsTable() {
  const tbody = document.getElementById("reviews-table");
  if (allReviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Nenhuma avaliação cadastrada.</td></tr>`;
    return;
  }
  tbody.innerHTML = allReviews.map(r => `
    <tr>
      <td class="prod-name">${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.location || "-")}</td>
      <td>${renderStars(r.stars)}</td>
      <td>${r.proof_img ? `<span class="cat-badge">✓ Anexada</span>` : `<span style="color:var(--mute,#888)">-</span>`}</td>
      <td><span class="status-dot ${r.active ? "active" : "inactive"}">${r.active ? "Ativo" : "Inativo"}</span></td>
      <td class="actions-cell">
        <button class="btn-edit" onclick="openReviewModal(${r.id})">Editar</button>
        <button class="btn-delete" onclick="removeReview(${r.id})">🗑</button>
      </td>
    </tr>`).join("");
}

function openReviewModal(id) {
  const overlay = document.getElementById("review-modal-overlay");
  const form = document.getElementById("review-form");
  form.reset();
  reviewProofImg = null;

  if (id) {
    const review = allReviews.find(r => r.id === id);
    if (!review) return;
    document.getElementById("review-modal-title").textContent = "Editar Avaliação";
    document.getElementById("review-id").value = review.id;
    document.getElementById("review-name").value = review.name || "";
    document.getElementById("review-location").value = review.location || "";
    document.getElementById("review-text").value = review.text || "";
    document.getElementById("review-stars").value = review.stars || 5;
    document.getElementById("review-active").checked = !!review.active;
    if (review.proof_img) reviewProofImg = review.proof_img;
  } else {
    document.getElementById("review-modal-title").textContent = "Nova Avaliação";
    document.getElementById("review-id").value = "";
    document.getElementById("review-stars").value = 5;
    document.getElementById("review-active").checked = true;
  }

  overlay.classList.add("open");
  renderReviewProofPreview();
}
window.openReviewModal = openReviewModal;

function closeReviewModal() {
  if (reviewProofImg && typeof reviewProofImg === "object" && reviewProofImg.preview) {
    URL.revokeObjectURL(reviewProofImg.preview);
  }
  reviewProofImg = null;
  document.getElementById("review-modal-overlay").classList.remove("open");
}
window.closeReviewModal = closeReviewModal;

function onReviewProofSelected(input) {
  const file = input.files[0];
  if (!file) return;
  if (reviewProofImg && typeof reviewProofImg === "object" && reviewProofImg.preview) {
    URL.revokeObjectURL(reviewProofImg.preview);
  }
  reviewProofImg = { file, preview: URL.createObjectURL(file) };
  renderReviewProofPreview();
  input.value = "";
}
window.onReviewProofSelected = onReviewProofSelected;

function removeReviewProof() {
  if (reviewProofImg && typeof reviewProofImg === "object" && reviewProofImg.preview) {
    URL.revokeObjectURL(reviewProofImg.preview);
  }
  reviewProofImg = null;
  renderReviewProofPreview();
}
window.removeReviewProof = removeReviewProof;

function renderReviewProofPreview() {
  const box = document.getElementById("review-proof-preview");
  if (!box) return;
  if (!reviewProofImg) {
    box.innerHTML = `<span class="empty-text">Nenhum print anexado</span>`;
    return;
  }
  const src = typeof reviewProofImg === "string" ? reviewProofImg : reviewProofImg.preview;
  box.innerHTML = `
    <div class="img-preview-item">
      <img src="${escapeHtml(src)}" alt="">
      <button type="button" class="img-preview-remove" onclick="removeReviewProof()" title="Remover">&times;</button>
    </div>`;
}

async function saveReview(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.textContent = "Salvando...";
  submitBtn.disabled = true;

  const id = document.getElementById("review-id").value;

  try {
    let proofUrl = null;
    if (reviewProofImg) {
      if (typeof reviewProofImg === "object" && reviewProofImg.file) {
        proofUrl = await uploadImage(reviewProofImg.file);
        if (reviewProofImg.preview) URL.revokeObjectURL(reviewProofImg.preview);
      } else {
        proofUrl = reviewProofImg;
      }
    }

    const payload = {
      name:      document.getElementById("review-name").value.trim(),
      location:  document.getElementById("review-location").value.trim(),
      text:      document.getElementById("review-text").value.trim(),
      stars:     parseInt(document.getElementById("review-stars").value, 10) || 5,
      proof_img: proofUrl,
      active:    document.getElementById("review-active").checked
    };

    if (id) {
      await updateReview(id, payload);
    } else {
      await createReview(payload);
    }

    closeReviewModal();
    await loadReviews();
  } catch (error) {
    console.error(error);
    alert("Erro ao salvar avaliação: " + error.message);
  } finally {
    submitBtn.textContent = "Salvar";
    submitBtn.disabled = false;
  }
}

async function removeReview(id) {
  if (!confirm("Excluir esta avaliação?")) return;
  try {
    await deleteReview(id);
    await loadReviews();
  } catch (error) {
    console.error(error);
    alert("Erro ao excluir avaliação.");
  }
}
window.removeReview = removeReview;
