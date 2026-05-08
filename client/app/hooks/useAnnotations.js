/**
 * useAnnotations
 *
 * Loads database-derived mapping data through the offline cache layer:
 * - First use for a book downloads all mappings and model files.
 * - Later reads use the local mapping JSON and local GLB files.
 * - Current-page lookup is constant-time: lookup.pages[String(page)].
 */
import { getToken } from '../../services/api';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ensureOfflineBookMapping,
  getPageMappings,
  readOfflineBookMapping,
} from '../../services/offlineLibraryCache';

export default function useAnnotations(bookId, currentPage, enabled = true) {
  const [lookup, setLookup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !bookId) {
      setLookup(null);
      return;
    }

    let cancelled = false;

    async function loadOfflineLookup() {
      setLoading(true);
      setError(null);
      setLookup(null);

      try {
        // DEBUG: Check if token exists
        const token = await getToken();
        console.log('[useAnnotations] Token exists?', !!token);
        if (token) {
          console.log('[useAnnotations] Token preview:', token.substring(0, 20) + '...');
        }

        const local = await readOfflineBookMapping(bookId);
        if (local) {
          if (!cancelled) setLookup(local);
          return;
        }

        const hydrated = await ensureOfflineBookMapping(bookId);
        if (!cancelled) setLookup(hydrated);
      } catch (err) {
        if (!cancelled) {
          console.error('useAnnotations offline cache error:', err.message);
          console.error('Full error:', err); // <-- Log full error object
          setError(err.message);
          setLookup(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOfflineLookup();
    return () => { cancelled = true; };
  }, [bookId, enabled]);

  const pageAnnotations = useMemo(
    () => (enabled && currentPage ? getPageMappings(lookup, currentPage) : []),
    [enabled, lookup, currentPage],
  );

  const modelMap = useMemo(() => {
    const map = new Map();
    Object.values(lookup?.models ?? {}).forEach((model) => {
      if (model?.id != null) map.set(model.id, model);
    });
    return map;
  }, [lookup]);

  const annotationsWithModels = useMemo(
    () => pageAnnotations.map((annotation) => ({
      ...annotation,
      model: annotation.model ?? modelMap.get(annotation.model_id) ?? null,
    })),
    [pageAnnotations, modelMap],
  );

  const invalidatePage = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    try {
      const refreshed = await ensureOfflineBookMapping(bookId, { force: true });
      setLookup(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  return {
    annotations: annotationsWithModels,
    loading,
    error,
    modelMap,
    invalidatePage,
  };
}
