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
import React, { useRef, useEffect, useCallback, memo } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getModelThumbnailUrl, getModelFileUrl } from '../../../services/api';
import getPdfViewerHtml from './pdfViewerHtml';

const PdfViewer = memo(function PdfViewer({
  pdfUrl,
  authToken,
  page,
  annotations = [],
  onPageLoaded,
  onHotspotClick,
  onError,
}) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const lastSentPage = useRef(null);
  const lastSentAnnotationsKey = useRef(null);

  // Generate the HTML once (pdfUrl + token are stable for a given book)
  const html = React.useMemo(
    () => getPdfViewerHtml(pdfUrl, authToken),
    [pdfUrl, authToken],
  );

  // Send message helper
  const postToViewer = (payload) => {
    const msg = JSON.stringify(payload);
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    } else {
      webViewRef.current?.postMessage(msg);
    }
  };

  // Debug: confirm the reader is mounting with the expected URL/token state.
  useEffect(() => {
    console.log(`[PdfViewer] mounted on ${Platform.OS} with pdfUrl:`, pdfUrl);
  }, [pdfUrl]);

  // Send page navigation command when page prop changes
  useEffect(() => {
    if (page && page !== lastSentPage.current) {
      lastSentPage.current = page;
      postToViewer({ type: 'goToPage', page });
    }
  }, [page]);

  // Send annotations to the WebView when they change
  useEffect(() => {
    const key = annotations.map((a) => a.id).join(',');
    if (key === lastSentAnnotationsKey.current) return;
    lastSentAnnotationsKey.current = key;

    const payload = annotations.map((a) => ({
      id: a.id,
      page_number: a.page_number,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
      label: a.label,
      model_id: a.model_id,
      displayName: a.model?.name || a.label || '3D Model',
      thumbnailUrl: a.model_id ? getModelThumbnailUrl(a.model_id) : null,
      modelUrl: a.model_id ? getModelFileUrl(a.model_id) : null,
      view_state: a.model?.view_state ?? a.model?.viewState ?? a.model_view_state ?? null,
    }));

    postToViewer({ type: 'setAnnotations', annotations: payload });
  }, [annotations]);

  // Handle messages from the WebView
  const handleMessage = useCallback(
    (event) => {
      try {
        const data = typeof event.nativeEvent?.data === 'string' 
          ? JSON.parse(event.nativeEvent.data) 
          : (typeof event.data === 'string' ? JSON.parse(event.data) : null);

        if (!data) return;
        
        console.log('[PdfViewer] Message received:', data.type);
        switch (data.type) {
          case 'pageLoaded':
            onPageLoaded?.(data.page, data.totalPages);
            break;
          case 'hotspotClick':
            const fullAnnotation = annotations.find(
              (a) => a.id === data.annotation?.id,
            );
            onHotspotClick?.(fullAnnotation || data.annotation);
            break;
          case 'error':
            onError?.(data.message);
            break;
        }
      } catch (err) {
        console.warn('[PdfViewer] Error parsing message:', err);
      }
    },
    [annotations, onPageLoaded, onHotspotClick, onError],
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
      mixedContentMode="always"
      onMessage={handleMessage}
      scrollEnabled={true}
      bounces={true}
      showsVerticalScrollIndicator={true}
      showsHorizontalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: '#f0ece4',
  },
});

export default PdfViewer;
