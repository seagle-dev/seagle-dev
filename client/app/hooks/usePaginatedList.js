import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Shared hook for paginated FlatList data fetching.
 *
 * @param {Function} fetchFn – async (params) => { data: [], pagination: { totalItems } }
 * @param {Function} mapFn   – (rawItem) => mappedItem
 * @param {object}   filters – { search, category, ...extra query params }
 * @param {number}   limit   – items per page
 */
export default function usePaginatedList(fetchFn, mapFn, filters = {}, limit = 10) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Use refs for values that change but shouldn't recreate callbacks
  const pageRef = useRef(1);
  const filtersRef = useRef(filters);
  const isFetchingRef = useRef(false);
  const itemsLengthRef = useRef(0);
  const totalItemsRef = useRef(0);

  // Keep refs in sync
  filtersRef.current = filters;
  itemsLengthRef.current = items.length;
  totalItemsRef.current = totalItems;

  const load = useCallback(async (pageNum = 1, isRefresh = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);

      const params = { page: pageNum, limit, ...filtersRef.current };
      // Strip empty values
      Object.keys(params).forEach((k) => {
        if (params[k] === null || params[k] === undefined || params[k] === '') {
          delete params[k];
        }
      });

      const result = await fetchFn(params);
      const mapped = (result.data || []).map(mapFn);

      if (pageNum === 1) {
        setItems(mapped);
      } else {
        setItems((prev) => [...prev, ...mapped]);
      }

      setTotalItems(result.pagination?.totalItems || 0);
      pageRef.current = pageNum;
    } catch (err) {
      console.warn('usePaginatedList error:', err.message);
      if (pageNum === 1) setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [fetchFn, mapFn, limit]); // stable deps only — no filters here

  const reload = useCallback(() => {
    load(1);
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(1, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (isFetchingRef.current || itemsLengthRef.current >= totalItemsRef.current) return;
    setLoadingMore(true);
    load(pageRef.current + 1);
  }, [load]);

  // Auto-load on mount and when filters change
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    reload();
  }, [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    refreshing,
    loadingMore,
    totalItems,
    refresh,
    loadMore,
    reload,
  };
}