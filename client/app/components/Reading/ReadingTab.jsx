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
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import FloatingAnnotationToolbar from './FloatingAnnotationToolbar';
import SaveConfirmationModal from '../SaveConfirmationModal';

const getLocalAnnotationKey = (bookId) => `readerAnnotations:${bookId}`;

export default function ReadingTab({ book }) {
  const router = useRouter();
  const pdfViewerRef = useRef(null);
  const bookId = book?.id;
  const pdfUrl = bookId ? getBookPdfUrl(bookId) : null;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [modelContextMap, setModelContextMap] = useState({});
  const [modelContextVersion, setModelContextVersion] = useState(0);
  const modelContextMapRef = useRef({});

  // Annotation Tool State
  const [activeTool, setActiveTool] = useState(null);
  const [activeColor, setActiveColor] = useState('#FF3B30');
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);
  
  // Save/Dirty State
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'back' | 'close'
  const [savedUserAnnotations, setSavedUserAnnotations] = useState({});

  const handleBack = useCallback(() => {
    if (isDirty) {
      setPendingAction('back');
      setShowSaveModal(true);
      return true; // prevent immediate back
    }
    router.back();
    return true;
  }, [isDirty, router]);

  // Intercept hardware back button on Android
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [handleBack]);

  const handleSaveAndExit = async () => {
    setShowSaveModal(false);
    // Trigger annotation extraction from WebView
    pdfViewerRef.current?.getAnnotations();
  };

  const handleAnnotationsExport = useCallback(async (data) => {
    if (!bookId) return;

    try {
      const payload = {
        bookId,
        updatedAt: new Date().toISOString(),
        pages: data || {},
      };
      await AsyncStorage.setItem(getLocalAnnotationKey(bookId), JSON.stringify(payload));
      setSavedUserAnnotations(payload.pages);
      setIsDirty(false);

      if (pendingAction === 'back') {
        router.back();
      }
      setPendingAction(null);
    } catch (err) {
      console.warn('[ReadingTab] Failed to save local annotations:', err.message);
    }
  }, [bookId, pendingAction, router]);

  const handleDiscardAndExit = () => {
    setShowSaveModal(false);
    setIsDirty(false);
    if (pendingAction === 'back') {
      router.back();
    }
    setPendingAction(null);
  };

  // Animation constants
  const HEADER_HEIGHT = Platform.OS === 'ios' ? 110 : 80;
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScroll = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  
  const headerTranslate = clampedScroll.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = clampedScroll.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.75, HEADER_HEIGHT],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    modelContextMapRef.current = modelContextMap;
  }, [modelContextMap]);

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

  useEffect(() => {
    let cancelled = false;

    async function loadLocalAnnotations() {
      if (!bookId) {
        setSavedUserAnnotations({});
        return;
      }

      try {
        const raw = await AsyncStorage.getItem(getLocalAnnotationKey(bookId));
        if (cancelled) return;

        if (!raw) {
          setSavedUserAnnotations({});
          return;
        }

        const parsed = JSON.parse(raw);
        setSavedUserAnnotations(parsed?.pages || {});
      } catch (err) {
        console.warn('[ReadingTab] Failed to load local annotations:', err.message);
        if (!cancelled) setSavedUserAnnotations({});
      }
    }

    loadLocalAnnotations();
    return () => { cancelled = true; };
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

  const handleScroll = useCallback((event) => {
    if (event.scrollY != null) {
      scrollY.setValue(event.scrollY);
    }
  }, [scrollY]);

  const storeModelContext = useCallback((modelContext) => {
    if (!modelContext?.id) return;

    const key = String(modelContext.id);
    const existing = modelContextMapRef.current[key];
    const unchanged =
      existing &&
      existing.localFileUri === modelContext.localFileUri &&
      existing.thumbnail === modelContext.thumbnail &&
      existing.name === modelContext.name &&
      JSON.stringify(existing.view_state ?? null) === JSON.stringify(modelContext.view_state ?? null);

    if (unchanged) return;

    const next = {
      ...modelContextMapRef.current,
      [key]: modelContext,
    };
    modelContextMapRef.current = next;
    setModelContextMap(next);
    setModelContextVersion((version) => version + 1);
  }, []);

  const handleModelContextReady = useCallback((modelContext) => {
    storeModelContext(modelContext);
  }, [storeModelContext]);

  useEffect(() => {
    let cancelled = false;

    async function preloadPageModelContexts() {
      const pageModels = annotations
        .map((annotation) => annotation?.model)
        .filter((model) => model?.id != null && model?.localFileUri);

      if (!pageModels.length) return;

      for (const model of pageModels) {
        const modelKey = String(model.id);
        if (modelContextMapRef.current[modelKey]?.modelBase64) continue;

        try {
          const base64 = await FileSystem.readAsStringAsync(model.localFileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (cancelled) return;

          storeModelContext({
            id: model.id,
            name: model.name,
            localFileUri: model.localFileUri,
            thumbnail: model.thumbnail,
            view_state: model.view_state ?? null,
            modelBase64: base64,
          });
        } catch (err) {
          console.warn('[ReadingTab] preloadPageModelContexts failed:', model.localFileUri, err.message);
        }
      }
    }

    preloadPageModelContexts();
    return () => { cancelled = true; };
  }, [annotations, storeModelContext]);

  const handleError = useCallback((message) => {
    console.error('[ReadingTab] PDF error:', message);
  }, []);

  /* ---------- Render ---------- */
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

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <Animated.View style={[
        styles.header, 
        { 
          transform: [{ translateY: headerTranslate }],
          opacity: headerOpacity,
        }
      ]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {book?.title || 'Anatomy 101'}
          </Text>
        </View>

        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={COLORS.navy} />
        </TouchableOpacity>
      </Animated.View>

      {/* PDF Viewer */}
      <View style={[styles.pdfContainer, selectedAnnotation && styles.pdfContainerDimmed]}>
        <PdfViewer
          ref={pdfViewerRef}
          pdfUrl={pdfUrl}
          authToken={authToken}
          page={currentPage}
          annotations={annotations}
          userAnnotations={savedUserAnnotations}
          modelContextMap={modelContextMap}
          modelContextVersion={modelContextVersion}
          activeTool={activeTool}
          activeColor={activeColor}
          onUndoRequest={undoTrigger}
          onClearRequest={clearTrigger}
          onDirty={() => setIsDirty(true)}
          onAnnotationsExport={handleAnnotationsExport}
          onPageLoaded={handlePageLoaded}
          onHotspotClick={handleHotspotClick}
          onScroll={handleScroll}
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
              storeModelContext(context);
              return context;
            } catch (err) {
              console.warn('[ReadingTab] onRequestModelContext failed:', model.localFileUri, err.message);
              return cached;
            }
          }}
          onError={handleError}
        />

        {/* Floating Annotation Toolbar */}
        {!selectedAnnotation && (
          <FloatingAnnotationToolbar
            activeTool={activeTool}
            expanded={isToolbarExpanded}
            onToggleExpanded={() => setIsToolbarExpanded(!isToolbarExpanded)}
            onSelectTool={(tool) => {
              setActiveTool(activeTool === tool ? null : tool);
            }}
            onUndo={() => setUndoTrigger((prev) => prev + 1)}
            onClear={() => setClearTrigger((prev) => prev + 1)}
            onCancel={() => setActiveTool(null)}
            activeColor={activeColor}
            onSelectColor={setActiveColor}
          />
        )}

      </View>

      {/* 3D Model Modal */}
      <ModelModal
        visible={!!selectedAnnotation}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
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

      {/* Save Confirmation Modal */}
      <SaveConfirmationModal
        visible={showSaveModal}
        onSave={handleSaveAndExit}
        onDiscard={handleDiscardAndExit}
        onCancel={() => setShowSaveModal(false)}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: '#FCF4DD',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
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
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  pdfContainerDimmed: {
    opacity: 0.42,
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
