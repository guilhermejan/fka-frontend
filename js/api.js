const API_URL = "https://fka-backend.onrender.com/api";

const CLOUDINARY_CLOUD_NAME = "dk98eyikn";

async function uploadImage(file) {
    const signRes = await fetch(`${API_URL}/upload/sign`, {
        method: "POST",
        credentials: "include"
    });

    if (!signRes.ok) throw new Error("Falha ao obter assinatura de upload");
    const { timestamp, signature, api_key, cloud_name } = await signRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("api_key", api_key);
    formData.append("folder", "fka");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!response.ok) throw new Error("Falha ao fazer upload da imagem");
    const data = await response.json();
    return data.secure_url;
}
window.uploadImage = uploadImage;

async function getProducts() {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error("Falha ao buscar produtos");
    return await response.json();
}

async function createProduct(product) {
    const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error("Falha ao criar produto");
    return await response.json();
}

async function updateProduct(id, product) {
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error("Falha ao atualizar produto");
    return await response.json();
}

async function deleteProduct(id) {
    const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!response.ok) throw new Error("Falha ao excluir produto");
    return await response.json();
}

async function setFeatured(productId) {
    const response = await fetch(`${API_URL}/products/featured/${productId}`, {
        method: "PUT",
        credentials: "include"
    });
    if (!response.ok) throw new Error("Falha ao definir destaque");
    return await response.json();
}

async function getSetting(key) {
    const response = await fetch(`${API_URL}/settings/${key}`, {
        credentials: "include"
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.value || "";
}

async function updateSetting(key, value) {
    const response = await fetch(`${API_URL}/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value })
    });
    if (!response.ok) throw new Error("Falha ao salvar configuração");
    return await response.json();
}

async function getReviews() {
    const response = await fetch(`${API_URL}/reviews`);
    if (!response.ok) throw new Error("Falha ao buscar avaliações");
    return await response.json();
}

async function getReviewsAdmin() {
    const response = await fetch(`${API_URL}/reviews/admin`, {
        credentials: "include"
    });
    if (!response.ok) throw new Error("Falha ao buscar avaliações");
    return await response.json();
}

async function createReview(review) {
    const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(review)
    });
    if (!response.ok) throw new Error("Falha ao criar avaliação");
    return await response.json();
}

async function updateReview(id, review) {
    const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(review)
    });
    if (!response.ok) throw new Error("Falha ao atualizar avaliação");
    return await response.json();
}

async function deleteReview(id) {
    const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!response.ok) throw new Error("Falha ao excluir avaliação");
    return await response.json();
}

window.getProducts = getProducts;
window.createProduct = createProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.setFeatured = setFeatured;
window.getSetting = getSetting;
window.updateSetting = updateSetting;
window.getReviews = getReviews;
window.getReviewsAdmin = getReviewsAdmin;
window.createReview = createReview;
window.updateReview = updateReview;
window.deleteReview = deleteReview;