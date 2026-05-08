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
  
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; min-height: 100%; background: #f0ece4; font-family: -apple-system, sans-serif; }
    #viewer {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0;
      gap: 15px;
    }
    .page-container {
      position: relative;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .page-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .annotations-layer {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
    }
    .hotspot {
      position: absolute;
      pointer-events: auto;
      cursor: default;
      border: 0;
      border-radius: 4px;
      background: transparent;
      display: block;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      overflow: hidden;
      box-shadow: none;
    }
    .hotspot.is-3d-active {
      background: #303030;
      box-shadow: 0 2px 6px rgba(0,0,0,0.14);
    }
    .hotspot.is-3d-active:hover,
    .hotspot.is-3d-active:active {
      transform: translateY(-1px);
      box-shadow: 0 5px 14px rgba(0,0,0,0.18);
    }
    .hotspot-viewer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      touch-action: none;
      overscroll-behavior: contain;
      display: none;
      pointer-events: none;
    }
    .hotspot.is-3d-active .hotspot-viewer {
      display: block;
      pointer-events: auto;
    }
    .hotspot-viewer canvas {
      position: relative;
      z-index: 2;
      touch-action: none;
    }
    .hotspot-thumb {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
      background: #303030;
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
      display: none;
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
      display: none;
    }
    .hotspot.is-3d-active .hotspot-open {
      display: block;
    }
    .hotspot-toggle {
      position: absolute;
      top: 4px;
      left: 4px;
      z-index: 5;
      min-width: 34px;
      height: 24px;
      border: 1px solid rgba(255,255,255,0.9);
      border-radius: 12px;
      background: rgba(17, 26, 80, 0.82);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.22);
    }
    .hotspot.is-3d-active .hotspot-toggle {
      background: rgba(255, 140, 66, 0.92);
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
      font-size: 11px;
      text-align: center;
      padding: 4px;
    }
    .hotspot-status {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8e8e8;
      color: #666;
      font-size: 11px;
      text-align: center;
      padding: 8px;
    }
    #loading-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f0ece4;
      z-index: 1000;
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

    .page-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ccc;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  <div id="loading-overlay"><div class="spinner"></div>Loading PDF…</div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    window.__INLINE_THREE__ = { THREE, OrbitControls, GLTFLoader };
  </script>

  <script>
    // ---- State ----
    let pdfDoc = null;
    let totalPages = 0;
    let lastReportedPage = null;
    let currentAnnotationsMap = new Map(); // pageNum -> annotations[]
    const pageAnnotationSignatures = new Map();
    const pageRenderState = new Map(); // pageNum -> { rendering: bool, rendered: bool }
    const inlineViewers = [];
    const activeInlineViewerCleanups = new Map();
    const activeInlineViewerKeys = new Set();
    const inlineViewStateCache = new Map();
    let threeRuntimePromise = null;
    let legacyRuntimePromise = null;
    const modelBlobUrlCache = new Map();
    const modelBlobPromiseCache = new Map();
      const modelContextCache = new Map();
      const modelContextWaiters = new Map();
      let inlineRequestSeq = 0;

    const viewerContainer = document.getElementById('viewer');
    const loadingOverlay = document.getElementById('loading-overlay');

    function sendMessage(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), '*');
      }
    }

    function clearInlineViewers() {
      inlineViewers.forEach((cleanup) => {
        try { cleanup(); } catch (e) { }
      });
      inlineViewers.length = 0;
      activeInlineViewerCleanups.clear();
    }

    function getInlineViewerKey(ann) {
      return String(ann?.id ?? ann?.model_id ?? ann?.modelUrl ?? 'unknown');
    }

    function stopInlineModelViewer(viewerKey) {
      const cleanup = activeInlineViewerCleanups.get(viewerKey);
      if (cleanup) cleanup();
    }

    function getAnnotationRenderSignature(annotations) {
      return JSON.stringify((annotations || []).map((ann) => ({
        id: ann?.id,
        model_id: ann?.model_id,
        x: ann?.x,
        y: ann?.y,
        width: ann?.width,
        height: ann?.height,
        label: ann?.label,
        displayName: ann?.displayName,
        modelUrl: ann?.modelUrl,
        thumbnailUrl: ann?.thumbnailUrl,
        view_state: ann?.view_state ?? null,
        modelBase64Length: ann?.modelBase64?.length ?? 0,
      })));
    }

    function isFiniteNumber(value) {
      return typeof value === 'number' && Number.isFinite(value);
    }

    function isValidInlineViewState(state) {
      const cp = state?.cameraPosition;
      const ct = state?.controlsTarget;
      return (
        isFiniteNumber(cp?.x) && isFiniteNumber(cp?.y) && isFiniteNumber(cp?.z) &&
        isFiniteNumber(ct?.x) && isFiniteNumber(ct?.y) && isFiniteNumber(ct?.z)
      );
    }

    // (Same THREE runtime loading functions as before...)
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
          if (!window.THREE) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
          if (!window.THREE?.OrbitControls && !window.OrbitControls) await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
          if (!window.THREE?.GLTFLoader && !window.GLTFLoader) await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
          const THREE = window.THREE;
          const OrbitControls = window.THREE?.OrbitControls || window.OrbitControls;
          const GLTFLoader = window.THREE?.GLTFLoader || window.GLTFLoader;
          return { THREE, OrbitControls, GLTFLoader };
        })();
      }
      return legacyRuntimePromise;
    }

    function loadThreeRuntime() {
      if (!threeRuntimePromise) {
        threeRuntimePromise = new Promise((resolve, reject) => {
          let attempts = 0;
          const check = () => {
            if (window.__INLINE_THREE__) { resolve(window.__INLINE_THREE__); return; }
            if (attempts++ > 50) { loadLegacyThreeRuntime().then(resolve).catch(reject); return; }
            setTimeout(check, 100);
          };
          check();
        });
      }
      return threeRuntimePromise;
    }

    function requestModelContextFromRN(ann) {
      return new Promise((resolve) => {
        const requestId = 'model-' + (ann?.model_id ?? ann?.id ?? 'unknown') + '-' + Date.now() + '-' + inlineRequestSeq++;
        modelContextWaiters.set(requestId, resolve);
        sendMessage({
          type: 'requestModelContext',
          requestId,
          modelId: ann?.model_id ?? ann?.id ?? null,
        });

        setTimeout(() => {
          if (modelContextWaiters.has(requestId)) {
            modelContextWaiters.delete(requestId);
            resolve(null);
          }
        }, 2500);
      });
    }

    async function getModelBlobUrl(ann) {
      if (!ann) throw new Error('missing annotation');
      const cachedContext = modelContextCache.get(String(ann.model_id ?? ann.id));
      if (cachedContext?.modelBase64) {
        const key = 'base64:' + String(ann.model_id ?? ann.id);
        if (modelBlobUrlCache.has(key)) return modelBlobUrlCache.get(key);
        const binary = atob(cachedContext.modelBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes.buffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        modelBlobUrlCache.set(key, url);
        return url;
      }

      // Prefer provided inline base64 data immediately; RN context can lag behind annotation delivery.
      if (ann.modelBase64) {
        const key = 'base64:' + String(ann.id);
        if (modelBlobUrlCache.has(key)) return modelBlobUrlCache.get(key);
        const binary = atob(ann.modelBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes.buffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        modelBlobUrlCache.set(key, url);
        return url;
      }

      const requestedContext = await requestModelContextFromRN(ann);
      if (requestedContext?.modelBase64) {
        modelContextCache.set(String(requestedContext.id), requestedContext);
        const key = 'base64:' + String(requestedContext.id);
        if (modelBlobUrlCache.has(key)) return modelBlobUrlCache.get(key);
        const binary = atob(requestedContext.modelBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes.buffer], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        modelBlobUrlCache.set(key, url);
        return url;
      }

      if (!ann?.modelUrl) throw new Error('missing model URL');
      if (modelBlobUrlCache.has(ann.modelUrl)) return modelBlobUrlCache.get(ann.modelUrl);
      if (!modelBlobPromiseCache.has(ann.modelUrl)) {
        const isLocalFile = ann.modelUrl.startsWith('file://') || ann.modelUrl.startsWith('content://');
        const requestBlob = fetch(ann.modelUrl, isLocalFile ? undefined : { headers: ${authHeaders} })
          .then(r => r.blob())
          .catch(err => {
            if (!isLocalFile) throw err;
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', ann.modelUrl, true);
              xhr.responseType = 'blob';
              xhr.onload = () => {
                if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                  resolve(xhr.response);
                } else {
                  reject(new Error('XHR ' + xhr.status));
                }
              };
              xhr.onerror = () => reject(new Error('XHR failed'));
              xhr.send();
            });
          });

        modelBlobPromiseCache.set(ann.modelUrl, requestBlob.then(b => {
            const url = URL.createObjectURL(b);
            modelBlobUrlCache.set(ann.modelUrl, url);
            return url;
          }));
      }
      return modelBlobPromiseCache.get(ann.modelUrl);
    }

    async function initInlineModelViewer(rootEl, ann) {
      if (!rootEl || rootEl.dataset.viewerStarted === 'true') return;
      rootEl.dataset.viewerStarted = 'true';

      const viewerKey = getInlineViewerKey(ann);
      const existingCleanup = activeInlineViewerCleanups.get(viewerKey);
      if (existingCleanup) existingCleanup();

      const statusEl = rootEl.querySelector('.hotspot-status');
      if (statusEl) {
        statusEl.textContent = 'Loading 3D model...';
        statusEl.style.display = 'flex';
      }
      let runtime;
      try {
        runtime = await loadThreeRuntime();
      } catch (e) {
        if (statusEl) statusEl.textContent = 'Unable to load 3D runtime';
        rootEl.dataset.viewerStarted = 'false';
        return;
      }
      const { THREE, OrbitControls, GLTFLoader } = runtime;
      const thumb = rootEl.querySelector('.hotspot-thumb');
      if (thumb) thumb.style.display = 'block';
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(rootEl.clientWidth, rootEl.clientHeight);
      renderer.setClearColor(0xe8e8e8, 1);
      // ensure canvas fills container and is positioned correctly
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.zIndex = '2';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';
      rootEl.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe8e8e8);
      const camera = new THREE.PerspectiveCamera(45, rootEl.clientWidth / rootEl.clientHeight, 0.01, 100);
      camera.position.set(0, 0, 4);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.5;
      controls.maxDistance = 20;
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const light = new THREE.DirectionalLight(0xffffff, 0.9);
      light.position.set(5, 8, 6);
      scene.add(light);
      let stopped = false, raf;
      const animate = () => { if (!stopped) { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(animate); } };
      const loader = new GLTFLoader();
      console.log('[pdfViewerHtml] initInlineModelViewer ann:', ann);

      function saveInlineViewState() {
        inlineViewStateCache.set(viewerKey, {
          cameraPosition: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
          controlsTarget: {
            x: controls.target.x,
            y: controls.target.y,
            z: controls.target.z,
          },
          fov: camera.fov,
        });
      }

      function restoreInlineViewState() {
        const savedState = inlineViewStateCache.get(viewerKey);
        if (!isValidInlineViewState(savedState)) return false;

        if (isFiniteNumber(savedState.fov)) {
          camera.fov = savedState.fov;
          camera.updateProjectionMatrix();
        }
        controls.target.set(
          savedState.controlsTarget.x,
          savedState.controlsTarget.y,
          savedState.controlsTarget.z,
        );
        camera.position.set(
          savedState.cameraPosition.x,
          savedState.cameraPosition.y,
          savedState.cameraPosition.z,
        );
        camera.lookAt(controls.target);
        controls.update();
        return true;
      }

      controls.addEventListener?.('change', saveInlineViewState);

      ['touchstart', 'touchmove', 'pointerdown', 'pointermove', 'wheel'].forEach((eventName) => {
        renderer.domElement.addEventListener(eventName, (ev) => {
          ev.stopPropagation();
          if (eventName === 'touchmove' || eventName === 'wheel') ev.preventDefault();
        }, { passive: false });
      });
      getModelBlobUrl(ann).then(url => {
        console.log('[pdfViewerHtml] initInlineModelViewer loading url:', url);
        loader.load(url, gltf => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.position.set(-center.x, -center.y, -center.z);
          const pivot = new THREE.Group(); pivot.add(model);
          pivot.scale.setScalar(2 / maxDim);
          const scaledBox = new THREE.Box3().setFromObject(pivot);
          pivot.position.y -= scaledBox.min.y;
          scene.add(pivot);
          const finalBox = new THREE.Box3().setFromObject(pivot);
          const finalCenter = finalBox.getCenter(new THREE.Vector3());
          const finalSize = finalBox.getSize(new THREE.Vector3());
          const fov = camera.fov * (Math.PI / 180);
          const dist = (Math.max(finalSize.x, finalSize.y, finalSize.z) / 2) / Math.tan(fov / 2) * 1.55;
          if (!restoreInlineViewState()) {
            controls.target.copy(finalCenter);
            camera.position.set(finalCenter.x + dist * 0.24, finalCenter.y + dist * 0.18, finalCenter.z + dist);
            camera.lookAt(finalCenter);
            controls.update();
            saveInlineViewState();
          }
          if (thumb) thumb.style.display = 'none';
          if (statusEl) statusEl.style.display = 'none';
          try { rootEl.style.background = 'transparent'; } catch (e) {}
          console.log('[pdfViewerHtml] Inline model loaded successfully for ann id:', ann.id);
          animate();
        }, (progress) => {
          // progress
        }, (err) => {
          console.error('[pdfViewerHtml] GLTFLoader inline error for ann', ann, err);
          if (thumb) thumb.style.display = 'block';
          if (statusEl) statusEl.textContent = 'Unable to load 3D model';
          rootEl.dataset.viewerStarted = 'false';
        });
      }).catch(err => {
        console.error('[pdfViewerHtml] getModelBlobUrl failed for ann', ann, err);
        if (statusEl) statusEl.textContent = 'Unable to load 3D model';
        rootEl.dataset.viewerStarted = 'false';
      });
      const cleanup = () => {
        if (stopped) return;
        saveInlineViewState();
        stopped = true;
        cancelAnimationFrame(raf);
        controls.dispose();
        renderer.dispose();
        try { renderer.domElement.remove(); } catch (e) {}
        rootEl.dataset.viewerStarted = 'false';
        activeInlineViewerCleanups.delete(viewerKey);
      };
      activeInlineViewerCleanups.set(viewerKey, cleanup);
      inlineViewers.push(cleanup);
    }

    // ---- PDF Loading ----
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    async function loadPdf() {
      try {
        const response = await fetch('${pdfUrl}', { headers: ${authHeaders} });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const arrayBuffer = await response.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        totalPages = pdfDoc.numPages;
        loadingOverlay.style.display = 'none';
        
        // Load the first page to get a baseline aspect ratio
        const firstPage = await pdfDoc.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 1 });
        const baselineAspect = firstViewport.width / firstViewport.height;

        // Initialize viewer with placeholders
        for (let i = 1; i <= totalPages; i++) {
          await createPageElement(i, baselineAspect);
        }
        setupObserver();
      } catch (err) {
        sendMessage({ type: 'error', message: err.message });
      }
    }

    async function createPageElement(pageNum, fallbackAspect) {
      let aspect = fallbackAspect || 0.707; // Default to A4 aspect
      
      try {
        const containerWidth = viewerContainer.clientWidth || window.innerWidth;
        const width = Math.max(containerWidth - 20, 100);
        const height = width / aspect;

        const container = document.createElement('div');
        container.id = 'page-' + pageNum;
        container.className = 'page-container';
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        container.dataset.page = pageNum;

        container.innerHTML =
          '<div class="page-placeholder" style="height:' + height + 'px">Page ' + pageNum + '</div>' +
          '<canvas class="page-canvas" style="display:none"></canvas>' +
          '<div class="annotations-layer"></div>';

        viewerContainer.appendChild(container);
        pageRenderState.set(pageNum, { rendering: false, rendered: false });
      } catch (err) {
        console.error('Failed to create placeholder for page', pageNum, err);
      }
    }

    function setupObserver() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const pageNum = parseInt(entry.target.dataset.page);
          if (entry.isIntersecting) {
            renderPage(pageNum);
            // Report current visible page - use a higher threshold for reporting
            if (entry.intersectionRatio > 0.6 && pageNum !== lastReportedPage) {
              lastReportedPage = pageNum;
              sendMessage({ type: 'pageLoaded', page: pageNum, totalPages: totalPages });
            }
          }
        });
      }, { 
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '100px 0px' // Start rendering before they come into view
      });

      document.querySelectorAll('.page-container').forEach(el => observer.observe(el));
    }

    async function renderPage(pageNum) {
      const state = pageRenderState.get(pageNum);
      if (!state || state.rendering || state.rendered) return;
      state.rendering = true;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const container = document.getElementById('page-' + pageNum);
        if (!container) return;
        
        const canvas = container.querySelector('.page-canvas');
        const ctx = canvas.getContext('2d');
        const placeholder = container.querySelector('.page-placeholder');

        // Cap DPR at 2.0 to avoid massive memory usage on high-density screens
        const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
        const viewport = page.getViewport({ scale: (container.clientWidth / page.getViewport({ scale: 1 }).width) * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';

        // Clear before render
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        state.rendered = true;
        
        // Render annotations if we have any for this page
        renderAnnotationsForPage(pageNum);
      } catch (err) {
        console.error('Render failed for page', pageNum, err);
      } finally {
        state.rendering = false;
      }
    }

    function renderAnnotationsForPage(pageNum) {
      const container = document.getElementById('page-' + pageNum);
      if (!container) return;
      const layer = container.querySelector('.annotations-layer');
      const annotations = currentAnnotationsMap.get(pageNum) || [];
      const signature = getAnnotationRenderSignature(annotations);
      if (pageAnnotationSignatures.get(pageNum) === signature && layer.children.length > 0) {
        return;
      }
      pageAnnotationSignatures.set(pageNum, signature);

      layer.querySelectorAll('.hotspot').forEach((hotspot) => {
        const cleanup = activeInlineViewerCleanups.get(hotspot.dataset.inlineViewerKey);
        if (cleanup) cleanup();
      });
      layer.innerHTML = '';
      annotations.forEach(ann => {
        const viewerKey = getInlineViewerKey(ann);
        const div = document.createElement('div');
        div.className = 'hotspot';
        div.dataset.inlineViewerKey = viewerKey;
        if (activeInlineViewerKeys.has(viewerKey)) {
          div.classList.add('is-3d-active');
        }
        div.style.left = (ann.x * 100) + '%';
        div.style.top = (ann.y * 100) + '%';
        div.style.width = (ann.width * 100) + '%';
        div.style.height = (ann.height * 100) + '%';

        const viewerEl = document.createElement('div');
        viewerEl.className = 'hotspot-viewer';
        viewerEl.innerHTML = '<div class="hotspot-status">Loading 3D model...</div>';
        div.appendChild(viewerEl);

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'hotspot-toggle';
        toggleButton.setAttribute('aria-label', activeInlineViewerKeys.has(viewerKey) ? 'Show original image' : 'Show 3D model');
        toggleButton.textContent = activeInlineViewerKeys.has(viewerKey) ? '2D' : '3D';
        toggleButton.onclick = (e) => {
          e.stopPropagation();
          const enabled = !div.classList.contains('is-3d-active');
          div.classList.toggle('is-3d-active', enabled);
          toggleButton.textContent = enabled ? '2D' : '3D';
          toggleButton.setAttribute('aria-label', enabled ? 'Show original image' : 'Show 3D model');

          if (enabled) {
            activeInlineViewerKeys.add(viewerKey);
            try { initInlineModelViewer(viewerEl, ann); } catch (err) { console.error('initInlineModelViewer failed', err); }
          } else {
            activeInlineViewerKeys.delete(viewerKey);
            stopInlineModelViewer(viewerKey);
          }
        };
        div.appendChild(toggleButton);

        // Visible only after the inline 3D preview is enabled.
        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'hotspot-open';
        openButton.setAttribute('aria-label', 'Open model');
        openButton.innerHTML = '<span style="display:block;width:24px;height:8px;background:#FF8C42;border:2px solid #fff;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.22);"></span>';
        openButton.onclick = (e) => {
          e.stopPropagation();
          sendMessage({ type: 'hotspotClick', annotation: ann });
        };
        div.appendChild(openButton);

        if (ann.thumbnailUrl) {
          const thumb = document.createElement('img');
          thumb.className = 'hotspot-thumb';
          thumb.src = ann.thumbnailUrl;
          viewerEl.appendChild(thumb);
        }

        const label = document.createElement('span');
        label.className = 'hotspot-label';
        label.textContent = ann.displayName || ann.label || '3D Model';
        div.appendChild(label);

        layer.appendChild(div);

        if (activeInlineViewerKeys.has(viewerKey)) {
          try { initInlineModelViewer(viewerEl, ann); } catch (err) { console.error('initInlineModelViewer failed', err); }
        }
      });
    }

    // ---- Messages from RN ----
    function handleMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'goToPage') {
          const el = document.getElementById('page-' + data.page);
          if (el) el.scrollIntoView();
        } else if (data.type === 'setAnnotations') {
          const incoming = data.annotations || [];
          const pg = data.page || incoming[0]?.page_number;
          if (!pg) return;

          currentAnnotationsMap.set(pg, incoming);

          // Refresh visible page's annotations if it's the one we just received
          const el = document.getElementById('page-' + pg);
          if (el && pageRenderState.get(pg)?.rendered) renderAnnotationsForPage(pg);
          } else if (data.type === 'modelContextResponse') {
            if (data.modelContext?.id != null) {
              modelContextCache.set(String(data.modelContext.id), data.modelContext);
            }
            const waiter = modelContextWaiters.get(data.requestId);
            if (waiter) {
              modelContextWaiters.delete(data.requestId);
              waiter(data.modelContext || null);
            }
        }
      } catch (e) { }
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
    loadPdf();
  </script>
</body>
</html>
`;
}
