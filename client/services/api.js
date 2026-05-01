import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Replace this with your computer's current local Wi-Fi IP address.
// This single IP will work for Expo Go on physical devices, iOS Simulators, and Android Emulators.
const HOST_IP = '10.204.15.213';

const DEFAULT_BASE = `http://${HOST_IP}:5000/api`;

export const api = axios.create({
  baseURL: DEFAULT_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TOKEN HELPERS ====================

export async function setToken(token) {
  if (token) {
    await AsyncStorage.setItem('token', token);
  } else {
    await AsyncStorage.removeItem('token');
  }
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}

export async function clearAuth() {
  await AsyncStorage.multiRemove(['token', 'user']);
}

// ==================== AUTH ====================

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  const { token, user } = res.data;
  await setToken(token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return { token, user };
}

export async function register(email, password) {
  const res = await api.post('/auth/register', { email, password });
  const { token, user } = res.data;
  await setToken(token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  return { token, user };
}

export async function refreshToken() {
  const res = await api.post('/auth/refresh');
  const { token } = res.data;
  await setToken(token);
  return token;
}

export async function fetchProfile() {
  const res = await api.get('/auth/profile');
  return res.data;
}

// ==================== LIBRARY (public) ====================

export async function fetchBooks({ search, category, page = 1, limit = 10, sort = 'newest' } = {}) {
  const params = { page, limit, sort };
  if (search) params.search = search;
  if (category) params.category = category;
  const res = await api.get('/library/books', { params });
  return res.data; // { data: [...], pagination: {...} }
}

export async function fetchModels({ search, category, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (search) params.search = search;
  if (category) params.category = category;
  const res = await api.get('/library/models', { params });
  return res.data;
}

export async function fetchAllModels() {
  const res = await api.get('/library/models', { params: { limit: 1000 } });
  return res.data.data || res.data;
}

export async function fetchMappings(bookId, page) {
  const res = await api.get('/library/mappings', { params: { book_id: bookId, page } });
  return res.data.data || res.data;
}

// ==================== HOME (auth required) ====================

export async function fetchHome() {
  const res = await api.get('/home');
  return res.data; // { recentlyRead: [...], trending: [...] }
}

// ==================== HELPERS ====================

/**
 * Build the full URL for a book cover image proxy endpoint.
 */
export function getBookCoverUrl(bookId) {
  return `${DEFAULT_BASE}/admin/books/${bookId}/cover`;
}

/**
 * Build the full URL for a book PDF proxy endpoint.
 */
export function getBookPdfUrl(bookId) {
  return `${DEFAULT_BASE}/admin/books/${bookId}/pdf`;
}

/**
 * Build the full URL for a model file (GLB/GLTF).
 */
export function getModelFileUrl(modelId) {
  return `${DEFAULT_BASE}/admin/models/${modelId}/file`;
}

/**
 * Build the full URL for a model thumbnail.
 */
export function getModelThumbnailUrl(modelId) {
  return `${DEFAULT_BASE}/admin/models/${modelId}/thumbnail`;
}

