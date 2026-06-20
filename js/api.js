// URL do backend em produção
const API_URL = "https://fka-backend.onrender.com/api";

// Cloud name do Cloudinary
const CLOUDINARY_CLOUD_NAME = "dk98eyikn";
const CLOUDINARY_UPLOAD_PRESET = "fka_unsigned";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

// ===============================
// UPLOAD DE IMAGEM (Cloudinary)
// ===============================
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) throw new Error("Falha ao fazer upload da imagem");
  const data = await response.json();
  return data.secure_url;
}
window.uploadImage = uploadImage;

// ===============================
// PEGAR PRODUTOS
// ===============================
async function getProducts() {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error("Falha ao buscar produtos");
  return await response.json();
}

// ===============================
// CRIAR PRODUTO
// ===============================
async function createProduct(product) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(product)
  });
  if (!response.ok) throw new Error("Falha ao criar produto");
  return await response.json();
}

// ===============================
// ATUALIZAR PRODUTO
// ===============================
async function updateProduct(id, product) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(product)
  });
  if (!response.ok) throw new Error("Falha ao atualizar produto");
  return await response.json();
}

// ===============================
// DELETAR PRODUTO
// ===============================
async function deleteProduct(id) {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  });
  if (!response.ok) throw new Error("Falha ao excluir produto");
  return await response.json();
}

// ===============================
// DEFINIR PRODUTO EM DESTAQUE
// ===============================
async function setFeatured(productId, allProducts) {
  const updates = allProducts.map(p => {
    const payload = { ...p, featured: p.id === productId ? 1 : 0 };
    return updateProduct(p.id, payload);
  });
  return Promise.all(updates);
}

// ===============================
// SETTINGS
// ===============================
async function getSetting(key) {
  const response = await fetch(`${API_URL}/settings/${key}`);
  if (!response.ok) return "";
  const data = await response.json();
  return data.value || "";
}

async function updateSetting(key, value) {
  const response = await fetch(`${API_URL}/settings/${key}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ value })
  });
  if (!response.ok) throw new Error("Falha ao salvar configuração");
  return await response.json();
}

window.getProducts = getProducts;
window.createProduct = createProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.setFeatured = setFeatured;
window.getSetting = getSetting;
window.updateSetting = updateSetting;