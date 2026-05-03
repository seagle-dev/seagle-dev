/**
 * pdfViewerHtml — HTML template for the PDF WebView.
 *
 * Renders a single PDF page at a time using PDF.js.
 * Renders annotation hotspots as absolutely positioned HTML elements.
 * Communicates with React Native via window.ReactNativeWebView.postMessage().
 *
 * RN → WebView messages:
 *   { type: 'goToPage', page: N }
 *   { type: 'setAnnotations', annotations: [...] }
 *
 * WebView → RN messages:
 *   { type: 'pageLoaded', page: N, totalPages: M }
 *   { type: 'hotspotClick', annotation: {...} }
 *   { type: 'error', message: '...' }
 */
export default function getPdfViewerHtml(pdfUrl, authToken) {
  const authHeaders = JSON.stringify(
    authToken ? { Authorization: `Bearer ${authToken}` } : {},
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f0ece4; }
    #page-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
    #annotations-layer {
      position: absolute;
      top: 0; left: 0;
      pointer-events: none;
    }
    .hotspot {
      position: absolute;
      pointer-events: auto;
      cursor: default;
      border: 2px solid rgba(74, 144, 217, 0.7);
      border-radius: 6px;
      background: rgba(74, 144, 217, 0.06);
      display: block;
      transition: background 0.2s, border-color 0.2s;
      overflow: hidden;
    }
    .hotspot:hover,
    .hotspot:active {
      background: rgba(74, 144, 217, 0.2);
      border-color: rgba(74, 144, 217, 1);
    }
    .hotspot-viewer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: #d9d9d9;
      touch-action: none;
    }
    .hotspot-thumb {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
      background: #d9d9d9;
    }
    .hotspot-activate {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 4;
      border: none;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      line-height: 1;
      cursor: pointer;
    }
    .hotspot-label {
      position: absolute;
      left: 4px;
      bottom: 4px;
      z-index: 4;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      margin-bottom: 4px;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hotspot-open {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 4;
      border: none;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 10px;
      padding: 4px 6px;
      line-height: 1;
      cursor: pointer;
    }
    .hotspot-fallback {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #d9d9d9;
      color: #666;
      font-family: -apple-system, sans-serif;
      font-size: 11px;
      text-align: center;
      padding: 4px;
    }
    #loading-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f0ece4;
      font-family: -apple-system, sans-serif;
      color: #888;
      font-size: 14px;
    }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #ddd;
      border-top-color: #4a90d9;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="page-container">
    <canvas id="pdf-canvas"></canvas>
    <div id="annotations-layer"></div>
    <div id="loading-overlay"><div class="spinner"></div>Loading PDF…</div>
  </div>

  <script type="module">
    import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
    import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
    import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
    window.__INLINE_THREE__ = { THREE, OrbitControls, GLTFLoader };
  </script>

  <script>
    // ---- State ----
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 0;
    let currentAnnotations = [];
    let rendering = false;
    const inlineViewers = [];
    let threeRuntimePromise = null;
    let legacyRuntimePromise = null;
    const modelBlobUrlCache = new Map();
    const modelBlobPromiseCache = new Map();

    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('page-container');
    const annotLayer = document.getElementById('annotations-layer');
    const loadingOverlay = document.getElementById('loading-overlay');

    function sendMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function clearInlineViewers() {
      inlineViewers.forEach((cleanup) => {
        try {
          cleanup();
        } catch (e) {
          console.warn('[pdfViewerHtml] inline viewer cleanup error', e?.message || e);
        }
      });
      inlineViewers.length = 0;
    }

    function loadScript(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load script: ' + url));
        document.head.appendChild(script);
      });
    }

    function loadLegacyThreeRuntime() {
      if (!legacyRuntimePromise) {
        legacyRuntimePromise = (async () => {
          if (!window.THREE) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
          }

          if (!window.THREE?.OrbitControls && !window.OrbitControls) {
            await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
          }

          if (!window.THREE?.GLTFLoader && !window.GLTFLoader) {
            await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
          }

          const THREE = window.THREE;
          const OrbitControls = window.THREE?.OrbitControls || window.OrbitControls;
          const GLTFLoader = window.THREE?.GLTFLoader || window.GLTFLoader;

          if (!THREE || !OrbitControls || !GLTFLoader) {
            throw new Error('legacy three runtime incomplete');
          }

          return { THREE, OrbitControls, GLTFLoader };
        })();
      }
      return legacyRuntimePromise;
    }

    function loadThreeRuntime() {
      if (!threeRuntimePromise) {
        threeRuntimePromise = new Promise((resolve, reject) => {
          const maxAttempts = 50;
          let attempts = 0;

          const checkRuntime = () => {
            attempts += 1;
            if (window.__INLINE_THREE__) {
              resolve(window.__INLINE_THREE__);
              return;
            }
            if (attempts >= maxAttempts) {
              loadLegacyThreeRuntime()
                .then(resolve)
                .catch((legacyErr) => {
                  reject(new Error('three runtime unavailable: ' + (legacyErr?.message || legacyErr)));
                });
              return;
            }
            setTimeout(checkRuntime, 100);
          };

          checkRuntime();
        });
      }
      return threeRuntimePromise;
    }

    async function getModelBlobUrl(ann) {
      if (!ann?.modelUrl) throw new Error('missing model URL');

      if (modelBlobUrlCache.has(ann.modelUrl)) {
        return modelBlobUrlCache.get(ann.modelUrl);
      }

      if (!modelBlobPromiseCache.has(ann.modelUrl)) {
        const fetchPromise = fetch(ann.modelUrl, {
          headers: ${authHeaders}
        })
          .then((response) => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.blob();
          })
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            modelBlobUrlCache.set(ann.modelUrl, blobUrl);
            modelBlobPromiseCache.delete(ann.modelUrl);
            return blobUrl;
          })
          .catch((err) => {
            modelBlobPromiseCache.delete(ann.modelUrl);
            throw err;
          });

        modelBlobPromiseCache.set(ann.modelUrl, fetchPromise);
      }

      return modelBlobPromiseCache.get(ann.modelUrl);
    }

    async function initInlineModelViewer(rootEl, ann) {
      if (!ann.modelUrl) {
        const fb = document.createElement('div');
        fb.className = 'hotspot-fallback';
        fb.textContent = '3D unavailable';
        rootEl.appendChild(fb);
        return;
      }

      let runtime;
      try {
        runtime = await loadThreeRuntime();
      } catch (err) {
        const reason = err?.message || String(err);
        console.warn('[pdfViewerHtml] three runtime load failed:', reason);
        const fb = document.createElement('div');
        fb.className = 'hotspot-fallback';
        fb.textContent = '3D loader failed: ' + reason;
        rootEl.appendChild(fb);
        return;
      }

      const { THREE, OrbitControls, GLTFLoader } = runtime;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(rootEl.clientWidth || 200, rootEl.clientHeight || 140);
      rootEl.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe0e0e0);

      const camera = new THREE.PerspectiveCamera(
        45,
        (rootEl.clientWidth || 1) / (rootEl.clientHeight || 1),
        0.01,
        100
      );
      camera.position.set(0, 0, 4);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.5;
      controls.maxDistance = 20;

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(5, 8, 6);
      scene.add(key);

      let raf = null;
      let stopped = false;

      const resize = () => {
        if (stopped) return;
        const w = Math.max(rootEl.clientWidth, 1);
        const h = Math.max(rootEl.clientHeight, 1);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const animate = () => {
        if (stopped) return;
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };

      const applySavedViewState = (state) => {
        if (!state) return false;
        const cp = state.cameraPosition;
        const ct = state.controlsTarget;
        const fov = state.fov;
        const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

        if (!cp || !ct) return false;
        if (!isNumber(cp.x) || !isNumber(cp.y) || !isNumber(cp.z)) return false;
        if (!isNumber(ct.x) || !isNumber(ct.y) || !isNumber(ct.z)) return false;

        if (isNumber(fov)) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }

        controls.target.set(ct.x, ct.y, ct.z);
        camera.position.set(cp.x, cp.y, cp.z);
        camera.lookAt(controls.target);
        controls.update();
        return true;
      };

      const loader = new GLTFLoader();

      getModelBlobUrl(ann)
        .then((modelBlobUrl) => {
          loader.load(
            modelBlobUrl,
            (gltf) => {
              const model = gltf.scene;

              // Match web transform pipeline: center -> pivot scale -> floor align.
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              const boxSize = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z) || 1;

              model.position.set(-center.x, -center.y, -center.z);
              const pivot = new THREE.Group();
              pivot.add(model);
              const scale = 2 / maxDim;
              pivot.scale.setScalar(scale);

              const scaledBox = new THREE.Box3().setFromObject(pivot);
              pivot.position.y -= scaledBox.min.y;
              scene.add(pivot);

              const finalBox = new THREE.Box3().setFromObject(pivot);
              const finalCenter = finalBox.getCenter(new THREE.Vector3());

              const usedSaved = applySavedViewState(ann.view_state);
              if (!usedSaved) {
                const finalSize = finalBox.getSize(new THREE.Vector3());
                const fov = camera.fov * (Math.PI / 180);
                const dist = (Math.max(finalSize.x, finalSize.y, finalSize.z) / 2) / Math.tan(fov / 2) * 1.5;

                controls.target.copy(finalCenter);
                camera.position.set(
                  finalCenter.x + dist * 0.4,
                  finalCenter.y + dist * 0.3,
                  finalCenter.z + dist
                );
                camera.lookAt(finalCenter);
                controls.update();
              }

              resize();
              animate();
            },
            undefined,
            () => {
              throw new Error('GLTF parse failed');
            }
          );
        })
        .catch((err) => {
          console.warn('[pdfViewerHtml] inline model failed:', err.message);
          const fb = document.createElement('div');
          fb.className = 'hotspot-fallback';
          fb.textContent = ann.thumbnailUrl ? 'Preview only' : '3D failed';
          rootEl.appendChild(fb);

          if (ann.thumbnailUrl) {
            const img = document.createElement('img');
            img.src = ann.thumbnailUrl;
            img.alt = ann.displayName || '3D preview';
            img.style.position = 'absolute';
            img.style.inset = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.zIndex = '1';
            rootEl.appendChild(img);
          }
        });

      const onResize = () => resize();
      window.addEventListener('resize', onResize);

      inlineViewers.push(() => {
        stopped = true;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      });
    }

    // ---- PDF Loading ----
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    async function loadPdf() {
      try {
        // Debug: log the exact PDF URL and auth state used inside the WebView.
        console.log('[pdfViewerHtml] loading pdfUrl:', '${pdfUrl}');
        console.log('[pdfViewerHtml] auth token present:', ${authToken ? 'true' : 'false'});

        // Fetch the PDF with auth
        const response = await fetch('${pdfUrl}', {
          headers: ${authHeaders}
        });
        console.log('[pdfViewerHtml] fetch status:', response.status, response.statusText);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const arrayBuffer = await response.arrayBuffer();

        console.log('[pdfViewerHtml] pdf bytes received:', arrayBuffer.byteLength);

        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        totalPages = pdfDoc.numPages;

        console.log('[pdfViewerHtml] pdf loaded, totalPages:', totalPages);

        loadingOverlay.style.display = 'none';
        renderPage(currentPage);
      } catch (err) {
        console.error('[pdfViewerHtml] loadPdf failed:', err);
        loadingOverlay.innerHTML = '<div style="color:#c0392b;text-align:center;">' +
          '<div style="font-size:28px;margin-bottom:8px;">⚠️</div>' +
          'Failed to load PDF<br><span style="font-size:12px;color:#999;">' +
          err.message + '</span></div>';
        sendMessage({ type: 'error', message: err.message });
      }
    }

    // ---- Page Rendering ----
    async function renderPage(pageNum) {
      if (!pdfDoc || rendering) return;
      rendering = true;

      try {
        console.log('[pdfViewerHtml] renderPage:', pageNum);
        const page = await pdfDoc.getPage(pageNum);
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Scale to fit the container
        const scaleW = containerW / unscaledViewport.width;
        const scaleH = containerH / unscaledViewport.height;
        const scale = Math.min(scaleW, scaleH);

        // Use device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 2;
        const viewport = page.getViewport({ scale: scale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = (viewport.width / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        // Position annotation layer to match the canvas
        annotLayer.style.width = canvas.style.width;
        annotLayer.style.height = canvas.style.height;
        // Center the annotation layer on the canvas
        annotLayer.style.left = canvas.offsetLeft + 'px';
        annotLayer.style.top = canvas.offsetTop + 'px';

        currentPage = pageNum;
        renderAnnotations();
        sendMessage({ type: 'pageLoaded', page: currentPage, totalPages: totalPages });
      } catch (err) {
        console.error('[pdfViewerHtml] renderPage failed:', err);
        sendMessage({ type: 'error', message: 'Render error: ' + err.message });
      } finally {
        rendering = false;
      }
    }

    // ---- Annotations ----
    function renderAnnotations() {
      clearInlineViewers();
      annotLayer.innerHTML = '';
      currentAnnotations.forEach(function(ann) {
        const div = document.createElement('div');
        div.className = 'hotspot';
        div.style.left = (ann.x * 100) + '%';
        div.style.top = (ann.y * 100) + '%';
        div.style.width = (ann.width * 100) + '%';
        div.style.height = (ann.height * 100) + '%';

        const viewerEl = document.createElement('div');
        viewerEl.className = 'hotspot-viewer';
        div.appendChild(viewerEl);

        if (ann.thumbnailUrl) {
          const thumb = document.createElement('img');
          thumb.className = 'hotspot-thumb';
          thumb.src = ann.thumbnailUrl;
          thumb.alt = ann.displayName || '3D preview';
          thumb.onerror = function() { thumb.remove(); };
          viewerEl.appendChild(thumb);
        }

        const activateBtn = document.createElement('button');
        activateBtn.className = 'hotspot-activate';
        activateBtn.textContent = 'Interact';
        let startedInline = false;
        const startInline = () => {
          if (startedInline) return;
          startedInline = true;
          activateBtn.remove();
          viewerEl.innerHTML = '';
          initInlineModelViewer(viewerEl, ann);
        };
        activateBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          startInline();
        });
        viewerEl.addEventListener('pointerdown', function() {
          startInline();
        }, { once: true });
        div.appendChild(activateBtn);

        const openBtn = document.createElement('button');
        openBtn.className = 'hotspot-open';
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          sendMessage({ type: 'hotspotClick', annotation: ann });
        });
        div.appendChild(openBtn);

        const label = document.createElement('span');
        label.className = 'hotspot-label';
        label.textContent = ann.displayName || ann.label || '3D Model';
        div.appendChild(label);

        annotLayer.appendChild(div);
      });
    }

    // ---- Messages from RN ----
    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('[pdfViewerHtml] RN message:', data);
        if (data.type === 'goToPage' && data.page >= 1 && data.page <= totalPages) {
          renderPage(data.page);
        } else if (data.type === 'setAnnotations') {
          currentAnnotations = data.annotations || [];
          // Warm up runtime in background to reduce first interaction latency.
          loadThreeRuntime().catch(() => {});
          renderAnnotations();
        }
      } catch (e) { /* ignore parse errors */ }
    }

    // Listen for messages from both iOS and Android WebView
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    // Handle resize (orientation change)
    window.addEventListener('resize', function() {
      if (pdfDoc && !rendering) renderPage(currentPage);
    });

    window.addEventListener('beforeunload', clearInlineViewers);
    window.addEventListener('beforeunload', () => {
      modelBlobUrlCache.forEach((url) => URL.revokeObjectURL(url));
      modelBlobUrlCache.clear();
      modelBlobPromiseCache.clear();
    });

    // Start
    loadPdf();
  </script>
</body>
</html>
`;
}
