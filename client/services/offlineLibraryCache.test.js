import * as offlineCache from './offlineLibraryCache';
import * as FileSystem from 'expo-file-system/legacy';

describe('offlineLibraryCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clearOfflineCache', () => {
    it('should delete book root directory', async () => {
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true });
      await offlineCache.clearOfflineCache();
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe('readOfflineBookMapping', () => {
    it('should return null if file does not exist', async () => {
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });
      const mapping = await offlineCache.readOfflineBookMapping(1);
      expect(mapping).toBeNull();
    });

    it('should return parsed mapping if file exists', async () => {
      FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: true });
      FileSystem.readAsStringAsync.mockResolvedValueOnce(JSON.stringify({ pages: { 1: [] } }));
      const mapping = await offlineCache.readOfflineBookMapping(1);
      expect(mapping).toEqual({ pages: { 1: [] } });
    });
  });

  describe('getOfflineModelFileUri', () => {
    it('should return null if modelId is null', () => {
      expect(offlineCache.getOfflineModelFileUri(null)).toBeNull();
    });

    it('should return path with model id', () => {
      const uri = offlineCache.getOfflineModelFileUri(123);
      expect(uri).toContain('model_123.glb');
    });
  });
});
