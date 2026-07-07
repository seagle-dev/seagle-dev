import { api, login, setToken, getToken, clearAuth } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MockAdapter from 'axios-mock-adapter';

describe('api.js', () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
    AsyncStorage.clear();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('Token Helpers', () => {
    it('should set and get token', async () => {
      await setToken('test-token');
      const token = await getToken();
      expect(token).toBe('test-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });

    it('should clear auth', async () => {
      await clearAuth();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['token', 'user']);
    });
  });

  describe('Interceptors', () => {
    it('should attach token to requests', async () => {
      await setToken('valid-token');
      mockAxios.onGet('/test').reply(200, { success: true });

      const response = await api.get('/test');
      
      expect(response.config.headers.Authorization).toBe('Bearer valid-token');
      expect(response.data.success).toBe(true);
    });
  });

  describe('Auth Endpoints', () => {
    it('should login successfully and save data', async () => {
      mockAxios.onPost('/auth/login').reply(200, {
        token: 'new-token',
        user: { id: 1, email: 'test@test.com' }
      });

      const result = await login('test@test.com', 'password123');

      expect(result.token).toBe('new-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, email: 'test@test.com' }));
    });
  });
});
