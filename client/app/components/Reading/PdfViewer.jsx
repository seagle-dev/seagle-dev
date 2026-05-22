/**
 * PdfViewer — WebView-based PDF renderer for React Native.
 *
 * Renders a single PDF page at a time using an embedded PDF.js viewer.
 * Annotation hotspots are drawn inside the WebView (so they align perfectly
 * with the PDF canvas coordinates). Communication with RN is via postMessage.
 *
 * Props:
 *   pdfUrl        — server URL that streams the PDF (requires auth header)
 *   authToken     — Bearer token for fetching the PDF
 *   page          — 1-indexed page number to display
 *   annotations   — enriched annotations array for the current page
 *   onPageLoaded  — (page, totalPages) => void
 *   onHotspotClick — (annotation) => void
 *   onError       — (message) => void
 */
import React, { useRef, useEffect, useCallback, memo, forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getModelThumbnailUrl, getModelFileUrl } from '../../../services/api';
import getPdfViewerHtml from './pdfViewerHtml';
import * as FileSystem from 'expo-file-system/legacy';

const PdfViewer = memo(forwardRef(function PdfViewer({
  pdfUrl,
  authToken,
  page,
  annotations = [],
  userAnnotations = {},
  modelContextMap = {},
  modelContextVersion = 0,
  activeTool,
  onUndoRequest,
  onClearRequest,
  onDirty,
  onAnnotationsExport,
  onRequestModelContext,
  onPageLoaded,
  onHotspotClick,
  onScroll,
  onError,
}, ref) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const lastSentAnnotationsKey = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);

  const postToViewer = useCallback((payload) => {
    const msg = JSON.stringify(payload);
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    } else {
      webViewRef.current?.postMessage(msg);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getAnnotations: () => {
      postToViewer({ type: 'requestAnnotations' });
    },
  }));

  // Send tool changes to WebView
  useEffect(() => {
    if (!viewerReady) return;
    postToViewer({ type: 'setTool', tool: activeTool });
  }, [activeTool, postToViewer, viewerReady]);

  // Handle actions
  useEffect(() => {
    if (!viewerReady) return;
    if (onUndoRequest > 0) {
      postToViewer({ type: 'undo' });
    }
  }, [onUndoRequest, postToViewer, viewerReady]);

  useEffect(() => {
    if (!viewerReady) return;
    if (onClearRequest > 0) {
      postToViewer({ type: 'clear' });
    }
  }, [onClearRequest, postToViewer, viewerReady]);

  // Generate the HTML once (pdfUrl + token are stable for a given book)
  const html = React.useMemo(
    () => getPdfViewerHtml(pdfUrl, authToken),
    [pdfUrl, authToken],
  );

  useEffect(() => {
    setViewerReady(false);
    lastSentAnnotationsKey.current = null;
  }, [html]);

  const pendingModelContextRequests = useRef(new Map());

  // Send annotations to the WebView when they change - include modelBase64 for local files
  useEffect(() => {
    if (!viewerReady) return;
    let mounted = true;
    const key = `${page}:${modelContextVersion}:${annotations.map((a) => a.id).join(',')}`;
    if (key === lastSentAnnotationsKey.current) return;
    lastSentAnnotationsKey.current = key;

    async function prepareAndPost() {
      const payload = await Promise.all(
        annotations.map(async (a) => {
          const base = {
            id: a.id,
            page_number: a.page_number,
            x: a.x,
            y: a.y,
            width: a.width,
            height: a.height,
            label: a.label,
            model_id: a.model_id,
            displayName: a.model?.name || a.label || '3D Model',
            thumbnailUrl: a.model?.localFileUri
              ? (a.model?.thumbnail || null)
              : (a.model?.thumbnail || (a.model_id ? getModelThumbnailUrl(a.model_id) : null)),
            modelUrl: a.model?.localFileUri || (a.model_id ? getModelFileUrl(a.model_id) : null),
            view_state: a.model?.view_state ?? a.model?.viewState ?? a.model_view_state ?? null,
          };

          const sharedContext = modelContextMap[String(a.model_id)] || modelContextMap[a.model_id] || null;
          if (sharedContext) {
            base.modelBase64 = sharedContext.modelBase64 || base.modelBase64 || null;
            base.modelUrl = sharedContext.localFileUri || base.modelUrl;
            base.thumbnailUrl = sharedContext.thumbnail || base.thumbnailUrl;
            base.view_state = sharedContext.view_state ?? base.view_state ?? null;
            base.displayName = sharedContext.name || base.displayName;
          }

          // If there's a local file, attempt to read as base64 for inline viewer
          if (!base.modelBase64 && a.model?.localFileUri) {
            try {
              const b64 = await FileSystem.readAsStringAsync(a.model.localFileUri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              base.modelBase64 = b64;
            } catch (err) {
              console.warn('[PdfViewer] Failed to read localFileUri as base64', a.model.localFileUri, err.message);
              base.modelBase64 = null;
            }
          }

          return base;
        })
      );

      if (!mounted) return;
      postToViewer({ type: 'setAnnotations', page, annotations: payload });
    }

    prepareAndPost();

    return () => { mounted = false; };
  }, [annotations, page, modelContextMap, modelContextVersion, postToViewer, viewerReady]);

  useEffect(() => {
    if (!viewerReady) return;
    postToViewer({ type: 'setUserAnnotations', data: userAnnotations || {} });
  }, [userAnnotations, postToViewer, viewerReady]);

  // Handle messages from the WebView
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = typeof event.nativeEvent?.data === 'string' 
          ? JSON.parse(event.nativeEvent.data) 
          : (typeof event.data === 'string' ? JSON.parse(event.data) : null);

        if (!data) return;
        
        switch (data.type) {
          case 'viewerReady':
            setViewerReady(true);
            break;
          case 'pageLoaded':
            onPageLoaded?.(data.page, data.totalPages);
            break;
          case 'hotspotClick':
            const fullAnnotation = annotations.find(
              (a) => a.id === data.annotation?.id,
            );
            onHotspotClick?.(fullAnnotation || data.annotation);
            break;
          case 'requestModelContext': {
            const modelId = data.modelId;
            if (pendingModelContextRequests.current.has(String(modelId))) return;
            const requestPromise = Promise.resolve(onRequestModelContext?.(modelId))
              .then((context) => {
                postToViewer({
                  type: 'modelContextResponse',
                  requestId: data.requestId,
                  modelId,
                  modelContext: context || null,
                });
              })
              .catch((err) => {
                postToViewer({
                  type: 'modelContextResponse',
                  requestId: data.requestId,
                  modelId,
                  modelContext: null,
                  error: err?.message || 'Failed to resolve model context',
                });
              })
              .finally(() => {
                pendingModelContextRequests.current.delete(String(modelId));
              });
            pendingModelContextRequests.current.set(String(modelId), requestPromise);
            break;
          }
          case 'error':
            onError?.(data.message);
            break;
          case 'scroll':
            onScroll?.(data);
            break;
          case 'dirty':
            onDirty?.();
            break;
          case 'annotationsData':
            onAnnotationsExport?.(data.data);
            break;
        }
      } catch (err) {
        console.warn('[PdfViewer] Error parsing message:', err);
      }
    },
    [annotations, onPageLoaded, onHotspotClick, onScroll, onError, onRequestModelContext, onDirty, onAnnotationsExport, postToViewer],
  );

  // Listen for web messages
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [handleMessage]);

  if (!pdfUrl) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webView}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="PDF Viewer"
        />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={styles.webView}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowFileAccessFromFileURLs
      allowUniversalAccessFromFileURLs
      mixedContentMode="always"
      onMessage={handleMessage}
      onLoadStart={() => setViewerReady(false)}
      scrollEnabled={true}
      bounces={true}
      showsVerticalScrollIndicator={true}
      showsHorizontalScrollIndicator={false}
    />
  );
}));

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: '#f0ece4',
  },
});

export default PdfViewer;
