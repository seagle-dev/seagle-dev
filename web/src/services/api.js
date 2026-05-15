import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh', {});
    const newToken = response.data.token;
    setToken(newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

const savedToken = localStorage.getItem('token');
if (savedToken) api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;

export function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.request.use((config) => {
  const tok = localStorage.getItem('token');
  if (tok) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${tok}`;
    }
  }
  return config;
});

async function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export async function autoLogin() {
  const res = await api.get('/auth/auto');
  const token = res?.data?.token;
  if (token) setToken(token);
  return res.data;
}

export const fetchAdminBooks = async () => {
  let token = localStorage.getItem('token');
  if (isTokenExpired(token)) {
    token = await refreshToken();
    if (!token) throw new Error('Unable to refresh token');
  }
  const response = await api.get('/admin/books');
  return unwrap(response);
};

/**
 * Fetch the PDF for a book — returns a blob URL for the proxied stream.
 * The backend streams the file from GCS, no signed URLs involved.
 */
export async function fetchBookPdf(bookId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${baseURL}/admin/books/${bookId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  return { pdfUrl: blobUrl };
}

/**
 * Get the proxy URL for a model file (GLB/GLTF).
 * This URL is passed directly to Three.js GLTFLoader.
 * The token is added via a custom loader setup.
 */
export function getModelFileUrl(modelId) {
  return `${baseURL}/admin/models/${modelId}/file`;
}

/**
 * Get the proxy URL for a model thumbnail.
 */
export function getModelThumbnailUrl(modelId) {
  return `${baseURL}/admin/models/${modelId}/thumbnail`;
}

export async function fetchModels() {
  const res = await api.get('/admin/models');
  return unwrap(res);
}

export async function fetchMappings(bookId, page) {
  const res = await api.get('/admin/mappings', { params: { book_id: bookId, page } });
  return unwrap(res);
}

export async function postMapping(mapping) {
  const res = await api.post('/admin/mappings', mapping);
  return unwrap(res);
}

export async function deleteMapping(id) {
  await api.delete(`/admin/mappings/${id}`);
}

export async function detectImages(bookId, page) {
  const res = await api.get(`/admin/books/${bookId}/detect-images`, { params: { page } });
  return unwrap(res);
}

// ==================== UPLOAD ENDPOINTS ====================

export async function uploadBook(pdfFile, { title, description, category } = {}) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);
  if (category) formData.append('category', category);

  const res = await api.post('/admin/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return unwrap(res);
}

export async function deleteBook(bookId) {
  await api.delete(`/admin/books/${bookId}`);
}

export async function uploadModel(modelFile, { name, category } = {}) {
  const formData = new FormData();
  formData.append('model', modelFile);
  if (name) formData.append('name', name);
  if (category) formData.append('category', category);

  const res = await api.post('/admin/models', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return unwrap(res);
}

export async function uploadModelThumbnail(modelId, thumbnailBlob, viewState = null) {
  const formData = new FormData();
  formData.append('thumbnail', thumbnailBlob, 'thumbnail.png');
  if (viewState) {
    formData.append('viewState', JSON.stringify(viewState));
  }

  const res = await api.post(`/admin/models/${modelId}/thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(res);
}

export async function deleteModel(modelId) {
  await api.delete(`/admin/models/${modelId}`);
}

export async function updateModelViewState(modelId, viewState) {
  const res = await api.patch(`/admin/models/${modelId}/view-state`, { viewState });
  return unwrap(res);
}

/**
 * Helper: get auth token for use with custom loaders (Three.js).
 */
export function getAuthToken() {
  return localStorage.getItem('token');
}

export default api;