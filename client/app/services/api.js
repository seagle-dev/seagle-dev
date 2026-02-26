import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Replace with your actual PC's local IP address
// Find it by running `ipconfig` in terminal and looking for IPv4 Address
const BASE_URL = 'http://192.168.254.193:5000/api'; // <-- PUT YOUR PC's LAN IP HERE

// For Android emulator only: use 'http://10.0.2.2:5000/api'
// For iOS simulator: 'http://localhost:5000/api' works
// For physical device: use your PC's LAN IP
//http://192.168.254.193:5000/api
async function getToken() {
  return await AsyncStorage.getItem('token');
}

async function authHeaders() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await authHeaders()),
    ...options.headers,
  };

  console.log(`[API] ${options.method || 'GET'} ${BASE_URL}${endpoint}`);

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  } catch (networkErr) {
    console.error('[API] Network error:', networkErr.message);
    throw new Error('Cannot connect to server. Check your network and BASE_URL.');
  }

  let body;
  try {
    body = await res.json();
  } catch (e) {
    body = {};
  }

  console.log(`[API] Response ${res.status}:`, JSON.stringify(body).slice(0, 200));

  if (!res.ok) {
    const err = new Error(body.message || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return body;
}

// ==================== AUTH ====================

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    await AsyncStorage.setItem('token', data.token);
  }
  return data;
}

export async function register(email, password) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    await AsyncStorage.setItem('token', data.token);
  }
  return data;
}

export async function firebaseAuth(idToken) {
  const data = await request('/auth/firebase', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  if (data.token) {
    await AsyncStorage.setItem('token', data.token);
  }
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}

// ==================== HOME ====================

export async function fetchHome() {
  return request('/home');
}

// ==================== LIBRARY ====================

export async function fetchBooks({ search, category, page = 1, limit = 10, sort = 'newest' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sort', sort);

  return request(`/library/books?${params.toString()}`);
}

export async function fetchModels({ search, category, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  params.append('page', String(page));
  params.append('limit', String(limit));

  return request(`/library/models?${params.toString()}`);
}

// ==================== BOOK ASSETS ====================

export function getBookCoverUrl(bookId) {
  return `${BASE_URL}/admin/books/${bookId}/cover`;
}

export function getBookPdfUrl(bookId) {
  return `${BASE_URL}/admin/books/${bookId}/pdf`;
}