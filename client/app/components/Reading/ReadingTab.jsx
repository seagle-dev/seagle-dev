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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../../constants/theme';
import { getBookPdfUrl } from '../../../services/api';
import useAnnotations from '../../hooks/useAnnotations';
import PdfViewer from './PdfViewer';
import ModelModal from './ModelModal';

export default function ReadingTab({ book }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const bookId = book?.id;
  const pdfUrl = bookId ? getBookPdfUrl(bookId) : null;

  // Debug: confirm the exact PDF URL handed to the WebView reader.
  useEffect(() => {
    console.log('[ReadingTab] book:', book);
    console.log('[ReadingTab] bookId:', bookId, 'pdfUrl:', pdfUrl);
  }, [book, bookId, pdfUrl]);

  // Fetch annotations for the current page
  const { annotations, loading: annotLoading } = useAnnotations(bookId, currentPage);

  // Load auth token on mount
  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => {
      if (t) setAuthToken(t);
    });
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
      // Find the enriched annotation from our hook data
      const enriched = annotations.find((a) => a.id === annotation?.id);
      setSelectedAnnotation(enriched || annotation);
    },
    [annotations],
  );

  const handleCloseModal = useCallback(() => {
    setSelectedAnnotation(null);
  }, []);

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

  if (!authToken) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.loadingText}>Authenticating…</Text>
      </View>
    );
  }

  /* ---------- Render ---------- */
  return (
    <View style={styles.container}>
      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <PdfViewer
          pdfUrl={pdfUrl}
          authToken={authToken}
          page={currentPage}
          annotations={annotations}
          onPageLoaded={handlePageLoaded}
          onHotspotClick={handleHotspotClick}
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

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          style={[styles.navBtn, currentPage <= 1 && styles.navBtnDisabled]}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentPage <= 1 ? COLORS.textMuted : COLORS.navy}
          />
          <Text
            style={[
              styles.navBtnText,
              currentPage <= 1 && styles.navBtnTextDisabled,
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={styles.navPageText}>
            Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => goToPage(currentPage + 1)}
          disabled={totalPages ? currentPage >= totalPages : false}
          style={[
            styles.navBtn,
            totalPages && currentPage >= totalPages && styles.navBtnDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navBtnText,
              totalPages && currentPage >= totalPages && styles.navBtnTextDisabled,
            ]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              totalPages && currentPage >= totalPages
                ? COLORS.textMuted
                : COLORS.navy
            }
          />
        </TouchableOpacity>
      </View>

      {/* 3D Model Modal */}
      <ModelModal
        visible={!!selectedAnnotation}
        model={selectedAnnotation?.model}
        authToken={authToken}
        onClose={handleCloseModal}
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

  /* Bottom nav */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgLight,
    gap: 4,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: COLORS.navy,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  navBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  navCenter: {
    alignItems: 'center',
  },
  navPageText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});
