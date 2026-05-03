/**
 * useAnnotations — React Native hook for page-based annotation fetching.
 *
 * - Maintains an in-memory cache (Map) of fetched pages to avoid redundant API calls
 * - Returns annotations ONLY for the current page (memoized)
 * - Also fetches the full model catalog once per bookId (for resolving model_id → model data)
 * - Enriches annotations with model name/thumbnail
 *
 * Annotation shape from API:
 *   { id, book_id, model_id, page_number, x, y, width, height, label }
 *   x/y/width/height are decimals (0–1) representing percentage positions
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchMappings, fetchAllModels } from '../../services/api';

export default function useAnnotations(bookId, currentPage, enabled = true) {
  const cacheRef = useRef(new Map());
  const [pageAnnotations, setPageAnnotations] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the model catalog once when bookId changes
  useEffect(() => {
    if (!enabled || !bookId) return;
    cacheRef.current = new Map();

    let cancelled = false;
    fetchAllModels()
      .then((data) => {
        if (!cancelled) {
          const modelsArray = Array.isArray(data) ? data : [];
          console.log('[useAnnotations] Models fetched from API:', modelsArray.length, 'models');
          if (modelsArray.length > 0 && modelsArray[0]?.view_state) {
            console.log('[useAnnotations] First model has view_state:', modelsArray[0].view_state);
          }
          setModels(modelsArray);
        }
      })
      .catch((err) => {
        if (!cancelled) console.warn('Failed to fetch models:', err.message);
      });

    return () => { cancelled = true; };
  }, [bookId, enabled]);

  // Fetch annotations for the current page (with cache)
  useEffect(() => {
    if (!enabled || !bookId || !currentPage) {
      setPageAnnotations([]);
      return;
    }

    if (cacheRef.current.has(currentPage)) {
      setPageAnnotations(cacheRef.current.get(currentPage));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMappings(bookId, currentPage)
      .then((data) => {
        if (cancelled) return;
        const annotations = Array.isArray(data) ? data : (data?.data || []);
        cacheRef.current.set(currentPage, annotations);
        setPageAnnotations(annotations);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('useAnnotations error:', err.message);
        setError(err.message);
        setPageAnnotations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [bookId, currentPage, enabled]);

  // Model lookup map: model_id → model object
  const modelMap = useMemo(() => {
    const map = new Map();
    models.forEach((m) => map.set(m.id, m));
    return map;
  }, [models]);

  // Enrich annotations with model data
  const annotationsWithModels = useMemo(
    () => {
      const enriched = pageAnnotations.map((a) => ({
        ...a,
        model: (() => {
          const fromCatalog = modelMap.get(a.model_id) || null;
          if (fromCatalog) {
            return {
              ...fromCatalog,
              view_state:
                fromCatalog.view_state ??
                fromCatalog.viewState ??
                a.model_view_state ??
                null,
              thumbnail: fromCatalog.thumbnail ?? a.model_thumbnail ?? null,
              name: fromCatalog.name ?? a.model_name ?? a.label ?? '3D Model',
            };
          }

          if (!a.model_id) return null;

          return {
            id: a.model_id,
            name: a.model_name ?? a.label ?? '3D Model',
            thumbnail: a.model_thumbnail ?? null,
            view_state: a.model_view_state ?? null,
          };
        })(),
      }));
      if (enriched.length > 0 && enriched[0]?.model) {
        console.log('[useAnnotations] First annotation model:', enriched[0].model.name, 'has view_state:', !!enriched[0].model.view_state);
      }
      return enriched;
    },
    [pageAnnotations, modelMap],
  );

  const invalidatePage = useCallback((page) => {
    cacheRef.current.delete(page ?? currentPage);
  }, [currentPage]);

  return {
    annotations: annotationsWithModels,
    loading,
    error,
    modelMap,
    invalidatePage,
  };
}
