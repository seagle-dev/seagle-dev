/**
 * ModelModal — Full-screen modal that renders a 3D model in an interactive WebView.
 *
 * Uses Three.js + GLTFLoader embedded in a WebView with touch-based OrbitControls.
 * The model GLB is fetched with an auth token inside the WebView.
 *
 * Props:
 *   visible    — boolean, controls modal visibility
 *   model      — { id, name, file_url, thumbnail, ... } model object
 *   authToken  — Bearer token for fetching the GLB file
 *   onClose    — () => void
 */
import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../../constants/theme';
import { getModelFileUrl } from '../../../services/api';
import getModelViewerHtml from './modelViewerHtml';

const ModelModal = memo(function ModelModal({ visible, model, authToken, onClose }) {
  const [selectedPart, setSelectedPart] = useState(null);

  const modelUrl = model?.id ? getModelFileUrl(model.id) : null;

  // Debug: confirm the viewer receives the saved orientation payload.
  const viewState = model?.view_state ?? model?.viewState ?? null;
  
  // Safe logging for debugging
  useEffect(() => {
    if (visible && model) {
      console.log('[ModelModal] Opening model:', model.id, model.name);
      console.log('[ModelModal] model.view_state:', model.view_state);
    }
  }, [visible, model]);

  const html = useMemo(() => {
    if (!modelUrl) return null;
    console.log('[ModelModal] Generating HTML with viewState:', viewState);
    return getModelViewerHtml(modelUrl, authToken, viewState);
  }, [modelUrl, authToken, viewState]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[ModelModal] WebView message:', JSON.stringify(data));
      if (data.type === 'partClick') {
        setSelectedPart(data.name);
      }
    } catch { /* ignore */ }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedPart(null);
    onClose?.();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title} numberOfLines={1}>
              {model?.name || '3D Model'}
            </Text>
            {selectedPart && (
              <Text style={styles.partInfo}>
                Selected: <Text style={styles.partName}>{selectedPart}</Text>
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityLabel="Close model viewer"
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* 3D WebView */}
        <View style={styles.sceneContainer}>
          {html ? (
            <WebView
              source={{ html }}
              style={styles.webView}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              allowFileAccess
              mixedContentMode="always"
              onMessage={handleMessage}
              scrollEnabled={false}
              bounces={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No model available</Text>
            </View>
          )}
        </View>

        {/* Touch hint */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Drag to rotate · Pinch to zoom · Two-finger drag to pan
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  partInfo: {
    color: '#6baaf7',
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  partName: {
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneContainer: {
    flex: 1,
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
  },
  webView: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  footer: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.light,
    textAlign: 'center',
  },
});

export default ModelModal;
