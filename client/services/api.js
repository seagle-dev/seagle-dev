import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 to reach host machine's localhost
const DEFAULT_BASE = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : 'http://localhost:5000/api';

const api = axios.create({
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

export default api;
