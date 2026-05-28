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
import FloatingAnnotationToolbar from './FloatingAnnotationToolbar';
import SaveConfirmationModal from '../SaveConfirmationModal';

const webViewProps = {
  allowFileAccess: true,
  allowFileAccessFromFileURLs: true,
  allowUniversalAccessFromFileURLs: true,
  originWhitelist: ['*', 'file://'],
  javaScriptEnabled: true,
  domStorageEnabled: true,
  mixedContentMode: 'always',
  scrollEnabled: false,
  bounces: false,
};

function ModelViewerFrame({ html, iframeRef, webViewRef, onMessage }) {
  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="3D Model Viewer"
      />
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={styles.webView}
      onMessage={onMessage}
      {...webViewProps}
    />
  );
}

function useModelBase64({ model, onModelContextReady }) {
  const [modelBase64, setModelBase64] = useState(null);

  useEffect(() => {
    setModelBase64(null);
    if (!model?.localFileUri) return;

    async function readModelAsBase64() {
      try {
        const base64 = await FileSystem.readAsStringAsync(model.localFileUri, {
          encoding: 'base64',
        });
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

  return modelBase64;
}

const ModelModal = memo(function ModelModal({
  visible,
  model,
  authToken,
  onModelContextReady,
  onClose,
  presentation = 'full',
  activeTool: externalActiveTool,
  onSelectTool: externalOnSelectTool,
}) {
  const [selectedPart, setSelectedPart] = useState(null);
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const isReaderPresentation = presentation === 'reader';

  // Local state for when used outside ReadingTab, or synced from props
  const [localActiveTool, setLocalActiveTool] = useState(null);
  const activeTool = externalActiveTool !== undefined ? externalActiveTool : localActiveTool;
  const onSelectTool = externalOnSelectTool || setLocalActiveTool;

  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);

  // Save/Dirty State
  const [isDirty, setIsDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const postToViewer = useCallback((payload) => {
    const msg = JSON.stringify(payload);
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    } else {
      webViewRef.current?.postMessage(msg);
    }
  }, []);

  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowSaveModal(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleSaveAndExit = async () => {
    setShowSaveModal(false);
    postToViewer({ type: 'requestAnnotations' });
  };

  const handleDiscardAndExit = () => {
    setShowSaveModal(false);
    setIsDirty(false);
    onClose();
  };

  useEffect(() => {
    postToViewer({ type: 'setTool', tool: activeTool });
  }, [activeTool, postToViewer]);

  useEffect(() => {
    if (undoTrigger > 0) postToViewer({ type: 'undo' });
  }, [undoTrigger, postToViewer]);

  useEffect(() => {
    if (clearTrigger > 0) postToViewer({ type: 'clear' });
  }, [clearTrigger, postToViewer]);

  const modelUrl = useMemo(() => {
    if (model?.localFileUri) return model.localFileUri;
    if (model?.id) return getModelFileUrl(model.id);
    return null;
  }, [model]);

  const modelBase64 = useModelBase64({ model, onModelContextReady });

  const viewState = useMemo(() => model?.view_state ?? null, [model]);

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

      if (data.type === 'partClick') {
        setSelectedPart(data.name);
      } else if (data.type === 'loaded') {
        console.log('[ModelModal] WebView reported model loaded');
      } else if (data.type === 'dirty') {
        setIsDirty(true);
      } else if (data.type === 'annotationsData') {
        console.log('[ModelModal] Saving 3D annotations:', data.data);
        // TODO: Persist 3D annotations
        setIsDirty(false);
        onClose();
      }
    } catch (err) {
      console.warn('[ModelModal] Message parse failed:', err.message);
    }
  }, [onClose]);

  if (!visible) return null;

  if (isReaderPresentation) {
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={handleCloseAttempt}>
        <View style={styles.readerBackdrop}>
          <Pressable
            style={styles.readerBackdropPressTarget}
            pointerEvents="box-only"
            onPress={handleCloseAttempt}
          />
          <View style={styles.readerCard}>
            <View style={styles.readerScene}>
              {html && (
                <ModelViewerFrame
                  html={html}
                  iframeRef={iframeRef}
                  webViewRef={webViewRef}
                  onMessage={handleMessage}
                />
              )}
            </View>
            <TouchableOpacity style={styles.readerCloseBtn} onPress={handleCloseAttempt}>
              <Ionicons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        <SaveConfirmationModal
          visible={showSaveModal}
          onSave={handleSaveAndExit}
          onDiscard={handleDiscardAndExit}
          onCancel={() => setShowSaveModal(false)}
        />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCloseAttempt}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

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
            onPress={handleCloseAttempt}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.sceneContainer}>
          {html ? (
            <ModelViewerFrame
              html={html}
              iframeRef={iframeRef}
              webViewRef={webViewRef}
              onMessage={handleMessage}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No model available</Text>
            </View>
          )}

          <FloatingAnnotationToolbar
            activeTool={activeTool}
            expanded={isToolbarExpanded}
            onToggleExpanded={() => setIsToolbarExpanded(!isToolbarExpanded)}
            onSelectTool={(tool) => {
              onSelectTool(activeTool === tool ? null : tool);
            }}
            onUndo={() => setUndoTrigger((prev) => prev + 1)}
            onClear={() => setClearTrigger((prev) => prev + 1)}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Platform.OS === 'web'
              ? 'Drag to rotate · Scroll to zoom · Right-click drag to pan'
              : 'Drag to rotate · Pinch to zoom · Two-finger drag to pan'}
          </Text>
        </View>
      </SafeAreaView>
      <SaveConfirmationModal
        visible={showSaveModal}
        onSave={handleSaveAndExit}
        onDiscard={handleDiscardAndExit}
        onCancel={() => setShowSaveModal(false)}
      />
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  partInfo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  partName: {
    color: COLORS.orange,
    fontWeight: '600',
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
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZES.sm,
  },
  footer: {
    height: 40,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.light,
    textAlign: 'center',
  },
  readerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  readerBackdropPressTarget: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    elevation: 0,
  },
  readerCard: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 0.58,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#2f2f2f',
    zIndex: 1,
    elevation: 1,
  },
  readerScene: {
    flex: 1,
    backgroundColor: '#2f2f2f',
  },
  readerCloseBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

export default ModelModal;
