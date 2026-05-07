/**
 * ReadingTab — Top-level orchestrator for the mobile PDF reader system.
 *
 * Wires together:
 *   PdfViewer  ↔  useAnnotations  ↔  ModelModal
 *
 * Receives a `book` object (from route params) and manages:
 *   - Current page state
 *   - Total page count
 *   - Annotation fetching (via useAnnotations hook)
 *   - 3D model modal (via ModelModal)
 *   - Page navigation (prev / next / direct input)
 *   - Floating annotation list sidebar
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../../constants/theme';
import {
  clearAuth,
  getBookPdfUrl,
  getToken,
  refreshToken,
} from '../../../services/api';
import useAnnotations from '../../hooks/useAnnotations';
import PdfViewer from './PdfViewer';
import ModelModal from './ModelModal';

export default function ReadingTab({ book }) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [modelContextMap, setModelContextMap] = useState({});
  const [modelContextVersion, setModelContextVersion] = useState(0);

  const bookId = book?.id;
  const pdfUrl = bookId ? getBookPdfUrl(bookId) : null;

  // Debug: confirm the exact PDF URL handed to the WebView reader.
  useEffect(() => {
    console.log('[ReadingTab] book:', book);
    console.log('[ReadingTab] bookId:', bookId, 'pdfUrl:', pdfUrl);
  }, [book, bookId, pdfUrl]);

  // Fetch annotations for the current page
  const { annotations, loading: annotLoading } = useAnnotations(
    bookId,
    currentPage,
    !!authToken,
  );

  // Load and validate auth token before protected reader requests start.
  useEffect(() => {
    let cancelled = false;

    async function loadAuthToken() {
      setAuthLoading(true);
      setAuthError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No saved session');
        }

        // refreshToken verifies the current token and returns a fresh one.
        // Avoid /auth/profile here because older/running backends may not expose it.
        const newToken = await refreshToken();
        if (!cancelled) setAuthToken(newToken);
      } catch (err) {
        console.warn('[ReadingTab] auth validation failed:', err.message);
        await clearAuth();
        if (!cancelled) {
          setAuthToken(null);
          setAuthError('Your session expired. Please log in again.');
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    loadAuthToken();
    return () => { cancelled = true; };
  }, []);

  // Reset page when book changes
  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(null);
  }, [bookId]);

  /* ---------- Callbacks ---------- */
  const handlePageLoaded = useCallback((page, total) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);

  const handleHotspotClick = useCallback(
    (annotation) => {
      const enriched = annotations.find((a) => String(a.id) === String(annotation?.id));
      setSelectedAnnotation(enriched || annotation);
    },
    [annotations],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedAnnotation(null);
  }, []);

  const handleModelContextReady = useCallback((modelContext) => {
    if (!modelContext?.id) return;

    setModelContextMap((current) => ({
      ...current,
      [String(modelContext.id)]: modelContext,
    }));
    setModelContextVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function preloadPageModelContexts() {
      const pageModels = annotations
        .map((annotation) => annotation?.model)
        .filter((model) => model?.id != null && model?.localFileUri);

      if (!pageModels.length) return;

      for (const model of pageModels) {
        const modelKey = String(model.id);
        if (modelContextMap[modelKey]?.modelBase64) continue;

        try {
          const base64 = await FileSystem.readAsStringAsync(model.localFileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (cancelled) return;

          setModelContextMap((current) => ({
            ...current,
            [modelKey]: {
              id: model.id,
              name: model.name,
              localFileUri: model.localFileUri,
              thumbnail: model.thumbnail,
              view_state: model.view_state ?? null,
              modelBase64: base64,
            },
          }));
          setModelContextVersion((current) => current + 1);
        } catch (err) {
          console.warn('[ReadingTab] preloadPageModelContexts failed:', model.localFileUri, err.message);
        }
      }
    }

    preloadPageModelContexts();
    return () => { cancelled = true; };
  }, [annotations, modelContextMap]);

  const goToPage = useCallback(
    (page) => {
      if (page < 1 || (totalPages && page > totalPages)) return;
      setCurrentPage(page);
    },
    [totalPages],
  );

  const handleError = useCallback((message) => {
    console.error('[ReadingTab] PDF error:', message);
  }, []);

  /* ---------- Loading / Error states ---------- */
  if (!book) {
    return (
      <View style={styles.centered}>
        <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>No book selected</Text>
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loadingText}>Authenticating…</Text>
      </View>
    );
  }

  if (!authToken) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.emptyText}>{authError || 'Please log in to read this book.'}</Text>
      </View>
    );
  }

  /* ---------- Render ---------- */
  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {book?.title || 'Anatomy 101'}
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {/* PDF Viewer */}
      <View style={[styles.pdfContainer, selectedAnnotation && styles.pdfContainerDimmed]}>
        <PdfViewer
          pdfUrl={pdfUrl}
          authToken={authToken}
          page={currentPage}
          annotations={annotations}
          modelContextMap={modelContextMap}
          modelContextVersion={modelContextVersion}
          onPageLoaded={handlePageLoaded}
          onHotspotClick={handleHotspotClick}
          onRequestModelContext={async (modelId) => {
            if (modelId == null) return null;

            const cached = modelContextMap[String(modelId)] || modelContextMap[modelId] || null;
            if (cached?.modelBase64) return cached;

            const matchedAnnotation = annotations.find((annotation) => String(annotation.model_id) === String(modelId));
            const model = matchedAnnotation?.model || null;
            if (!model?.localFileUri) return cached;

            try {
              const base64 = await FileSystem.readAsStringAsync(model.localFileUri, {
                encoding: FileSystem.EncodingType.Base64,
              });

              const context = {
                id: model.id,
                name: model.name,
                localFileUri: model.localFileUri,
                thumbnail: model.thumbnail,
                view_state: model.view_state ?? null,
                modelBase64: base64,
              };

              setModelContextMap((current) => ({
                ...current,
                [String(model.id)]: context,
              }));
              setModelContextVersion((current) => current + 1);
              return context;
            } catch (err) {
              console.warn('[ReadingTab] onRequestModelContext failed:', model.localFileUri, err.message);
              return cached;
            }
          }}
          onError={handleError}
        />

        {/* Page info badge (top-right overlay) */}
        {totalPages && (
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>
              {currentPage} / {totalPages}
            </Text>
          </View>
        )}

        {/* Annotation count badge (top-left overlay) */}
        {annotations.length > 0 && (
          <View style={styles.annotBadge}>
            <Ionicons name="cube-outline" size={12} color={COLORS.white} />
            <Text style={styles.annotBadgeText}>
              {annotations.length} model{annotations.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Annotation loading indicator */}
        {annotLoading && (
          <View style={styles.annotLoading}>
            <ActivityIndicator size="small" color={COLORS.white} />
          </View>
        )}
      </View>

      {/* 3D Model Modal */}
      <ModelModal
        visible={!!selectedAnnotation}
        model={
          selectedAnnotation?.model ||
          (selectedAnnotation
            ? {
                id: selectedAnnotation.model_id,
                name: selectedAnnotation.displayName || selectedAnnotation.label || '3D Model',
                localFileUri: selectedAnnotation.modelUrl,
                thumbnail: selectedAnnotation.thumbnailUrl,
                view_state: selectedAnnotation.view_state ?? null,
              }
            : null)
        }
        authToken={authToken}
        onModelContextReady={handleModelContextReady}
        onClose={handleCloseModal}
        presentation="reader"
      />
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ece4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: '#FCF4DD',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.serifBold,
    color: COLORS.navy,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgPrimary,
    gap: SPACING.md,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginTop: SPACING.md,
  },

  /* PDF area */
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  pdfContainerDimmed: {
    opacity: 0.42,
  },
  pageBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  pageBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  annotBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(74, 144, 217, 0.85)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  annotBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  annotLoading: {
    position: 'absolute',
    top: SPACING.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
});
