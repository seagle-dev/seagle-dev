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
import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Pressable,
} from 'react-native';
// Use legacy API to avoid runtime deprecation/throwing behavior in current expo-file-system
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '../../../constants/theme';
import { getModelFileUrl } from '../../../services/api';
import getModelViewerHtml from './modelViewerHtml';

const ModelModal = memo(function ModelModal({
  visible,
  model,
  authToken,
  onModelContextReady,
  onClose,
  presentation = 'full',
}) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [modelBase64, setModelBase64] = useState(null);
  const iframeRef = useRef(null);
  const isReaderPresentation = presentation === 'reader';

  const modelUrl = model?.localFileUri || (model?.id ? getModelFileUrl(model.id) : null);

  useEffect(() => {
    if (visible) {
      console.log('[ModelModal] visible:', visible);
      console.log('[ModelModal] model:', model);
      console.log('[ModelModal] modelUrl:', modelUrl);
      console.log('[ModelModal] localFileUri exists?', !!model?.localFileUri);
      console.log('[ModelModal] model id:', model?.id);
      console.log('[ModelModal] viewState:', viewState);
    }
  }, [visible, model, modelUrl, viewState]);

  // Debug: confirm the viewer receives the saved orientation payload.
  const viewState = model?.view_state ?? model?.viewState ?? null;
  
  // Safe logging for debugging
  useEffect(() => {
    if (visible && model) {
      console.log(`[ModelModal] Opening model on ${Platform.OS}:`, model.id, model.name);
    }
  }, [visible, model]);

  // Read GLB file as base64 to bypass WebView filesystem sandbox on iOS
  useEffect(() => {
    setModelBase64(null);
    if (!model?.localFileUri) return;

    async function readModelAsBase64() {
      try {
        console.log('[ModelModal] Reading GLB as base64 from:', model.localFileUri);
        console.log('[ModelModal] FileSystem available:', !!FileSystem);
        console.log('[ModelModal] readAsStringAsync available:', !!FileSystem.readAsStringAsync);

        const base64 = await FileSystem.readAsStringAsync(model.localFileUri, {
          encoding: 'base64',
        });
        console.log('[ModelModal] base64 read success, length:', base64.length);
        console.log('[ModelModal] Base64 length:', base64.length, 'model:', model?.id);
        setModelBase64(base64);
        onModelContextReady?.({
          id: model.id,
          name: model.name,
          localFileUri: model.localFileUri,
          thumbnail: model.thumbnail,
          view_state: model.view_state ?? null,
          modelBase64: base64,
        });
      } catch (err) {
        console.error('[ModelModal] File read failed, will fall back to remote URL:', err);
        setModelBase64(null);
      }
    }

    readModelAsBase64();
  }, [model?.localFileUri, model?.id, model?.name, model?.thumbnail, model?.view_state, onModelContextReady]);

  const html = useMemo(() => {
    if (!modelUrl) return null;
    return getModelViewerHtml(modelUrl, authToken, viewState, modelBase64);
  }, [modelUrl, authToken, viewState, modelBase64]);

  const handleMessage = useCallback((event) => {
    try {
      const data = typeof event.nativeEvent?.data === 'string'
        ? JSON.parse(event.nativeEvent.data)
        : (typeof event.data === 'string' ? JSON.parse(event.data) : null);

      if (!data) return;

      console.log('[ModelModal] Message received:', data.type);
      if (data.type === 'partClick') {
        setSelectedPart(data.name);
      }
    } catch (err) {
      console.warn('[ModelModal] Error parsing message:', err);
    }
  }, []);

  // Listen for web messages
  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [handleMessage, visible]);

  const handleClose = useCallback(() => {
    setSelectedPart(null);
    onClose?.();
  }, [onClose]);

  if (isReaderPresentation) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={handleClose}
      >
        <StatusBar barStyle="light-content" backgroundColor="rgba(17,26,80,0.28)" translucent />
        <Pressable style={styles.readerBackdrop} onPress={handleClose}>
          <Pressable style={styles.readerCard} onPress={(event) => event.stopPropagation()}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.readerCloseBtn}
              activeOpacity={0.75}
              accessibilityLabel="Close model viewer"
            >
              <Ionicons name="close" size={18} color={COLORS.orange} />
            </TouchableOpacity>

            {html ? (
              <View style={styles.readerScene}>
                {Platform.OS === 'web' ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="3D Model Viewer"
                  />
                ) : (
                <WebView
                  source={{ html }}
                  style={styles.webView}
                  allowFileAccess={true}
                  allowFileAccessFromFileURLs={true}
                  allowUniversalAccessFromFileURLs={true}
                  originWhitelist={['*', 'file://']}
                  javaScriptEnabled
                  domStorageEnabled
                  allowFileAccess
                  allowFileAccessFromFileURLs
                  allowUniversalAccessFromFileURLs
                  mixedContentMode="always"
                  onMessage={handleMessage}
                  scrollEnabled={false}
                    bounces={false}
                  />
                )}
              </View>
            ) : (
              <View style={[styles.readerScene, styles.emptyState]}>
                <Text style={styles.emptyText}>No model available</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

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

        {/* 3D WebView / Iframe */}
        <View style={styles.sceneContainer}>
          {html ? (
            Platform.OS === 'web' ? (
              <iframe
                ref={iframeRef}
                srcDoc={html}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="3D Model Viewer"
              />
            ) : (
              <WebView
                source={{ html }}
                style={styles.webView}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
                originWhitelist={['*', 'file://']}
                javaScriptEnabled
                domStorageEnabled
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                mixedContentMode="always"
                onMessage={handleMessage}
                scrollEnabled={false}
                bounces={false}
              />
            )
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No model available</Text>
            </View>
          )}
        </View>

        {/* Touch hint */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Platform.OS === 'web' 
              ? 'Drag to rotate · Scroll to zoom · Right-click drag to pan'
              : 'Drag to rotate · Pinch to zoom · Two-finger drag to pan'}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  readerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  readerCard: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 0.58,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#2f2f2f',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: { elevation: 18 },
      web: {
        boxShadow: '0 18px 40px rgba(0,0,0,0.24)',
      },
    }),
  },
  readerScene: {
    flex: 1,
    backgroundColor: '#2f2f2f',
  },
  readerCloseBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47,47,47,0.72)',
  },
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
