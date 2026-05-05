/**
 * modelViewerHtml — HTML template for the 3D model WebView.
 *
 * Uses Three.js + GLTFLoader + OrbitControls to render a GLB model interactively.
 * Fetches the model file with an auth token, loads the GLB, and provides
 * touch-based orbit/zoom/pan controls.
 *
 * WebView → RN messages:
 *   { type: 'partClick', name: '...' }
 *   { type: 'loaded' }
 *   { type: 'error', message: '...' }
 */
export default function getModelViewerHtml(modelUrl, authToken, initialViewState = null) {
  console.log('[getModelViewerHtml] Called with initialViewState:', initialViewState);
  const viewStateStr = initialViewState ? JSON.stringify(initialViewState) : 'null';
  const modelUrlStr = JSON.stringify(modelUrl);
  const authHeaders = JSON.stringify(
    authToken ? { Authorization: `Bearer ${authToken}` } : {},
  );
  console.log('[getModelViewerHtml] Stringified viewState:', viewStateStr);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #303030; }
    canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    #loading {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #303030;
      font-family: -apple-system, sans-serif;
      color: rgba(255,255,255,0.78); font-size: 14px;
    }
    #debugInfo {
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(0,0,0,0.8); color: #0f0; font-family: monospace; 
      font-size: 9px; padding: 5px; max-width: 200px; overflow: hidden;
      max-height: 100px; overflow-y: auto; z-index: 9999; display: none;
    }
    #toolbar {
      position: absolute;
      left: 50%;
      bottom: 18px;
      z-index: 20;
      display: flex;
      align-items: center;
      transform: translateX(-50%);
      background: #fff;
      border: 1px solid rgba(17, 26, 80, 0.08);
      border-radius: 6px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
      overflow: hidden;
    }
    .tool-btn {
      width: 37px;
      height: 33px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0;
      border-right: 1px solid #d8deef;
      background: #fff;
      color: #111A50;
      appearance: none;
      -webkit-appearance: none;
    }
    .tool-btn:last-child { border-right: 0; }
    .tool-btn:active { background: #f0f3fb; }
    .tool-btn svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      pointer-events: none;
    }
    .spin {
      width: 32px; height: 32px;
      border: 3px solid rgba(255,255,255,0.25); border-top-color: #FF8C42;
      border-radius: 50%;
      animation: sp 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes sp { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading"><div class="spin"></div>Loading 3D model…</div>
  <div id="debugInfo"></div>
  <div id="toolbar" aria-label="Model controls">
    <button class="tool-btn" id="resetBtn" title="Reset view" aria-label="Reset view">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></svg>
    </button>
    <button class="tool-btn" id="zoomInBtn" title="Zoom in" aria-label="Zoom in">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
    </button>
    <button class="tool-btn" id="zoomOutBtn" title="Zoom out" aria-label="Zoom out">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/></svg>
    </button>
    <button class="tool-btn" id="rotateBtn" title="Auto rotate" aria-label="Auto rotate">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    </button>
    <button class="tool-btn" id="panBtn" title="Pan with two fingers" aria-label="Pan with two fingers">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M12 2v5"/><path d="M12 17v5"/><path d="M2 12h5"/><path d="M17 12h5"/></svg>
    </button>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>

  <script type="module">
    console.log('[modelViewerHtml] Script module loaded');
    
    const debugDiv = document.getElementById('debugInfo');
    function debugLog(msg) {
      console.log(msg);
      const line = document.createElement('div');
      line.textContent = msg;
      debugDiv.appendChild(line);
      debugDiv.scrollTop = debugDiv.scrollHeight;
    }
    
    import * as THREE from 'three';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    console.log('[modelViewerHtml] Three.js imports successful:', { THREE: !!THREE, GLTFLoader: !!GLTFLoader, OrbitControls: !!OrbitControls });

    const loadingEl = document.getElementById('loading');

    function sendMessage(data) {
      console.log('[modelViewerHtml] sendMessage:', data);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), '*');
      }
    }

    // ---- Scene Setup ----
    console.log('[modelViewerHtml] Setting up scene...');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x303030);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.set(0, 0, 4);
    console.log('[modelViewerHtml] Scene created, camera setup complete');

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    try {
      document.body.appendChild(renderer.domElement);
      console.log('[modelViewerHtml] Renderer appended to DOM, canvas size:', renderer.domElement.width, 'x', renderer.domElement.height);
    } catch (e) {
      console.error('[modelViewerHtml] Failed to append renderer:', e.message);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);
    console.log('[modelViewerHtml] Lights added to scene');

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.autoRotateSpeed = 2;
    console.log('[modelViewerHtml] OrbitControls initialized');

    let defaultView = null;

    function setDefaultView(finalBox, finalCenter) {
      const finalSize = finalBox.getSize(new THREE.Vector3());
      const fov = camera.fov * (Math.PI / 180);
      const dist = (Math.max(finalSize.x, finalSize.y, finalSize.z) / 2) / Math.tan(fov / 2) * 1.5;
      defaultView = {
        target: finalCenter.clone(),
        position: new THREE.Vector3(
          finalCenter.x + dist * 0.4,
          finalCenter.y + dist * 0.3,
          finalCenter.z + dist
        ),
      };
    }

    function resetView() {
      if (!defaultView) return;
      controls.target.copy(defaultView.target);
      camera.position.copy(defaultView.position);
      camera.lookAt(defaultView.target);
      controls.update();
    }

    function zoomBy(multiplier) {
      const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
      direction.multiplyScalar(multiplier);
      camera.position.copy(controls.target).add(direction);
      controls.update();
    }

    document.getElementById('resetBtn').addEventListener('click', resetView);
    document.getElementById('zoomInBtn').addEventListener('click', () => zoomBy(0.82));
    document.getElementById('zoomOutBtn').addEventListener('click', () => zoomBy(1.18));
    document.getElementById('rotateBtn').addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
    });
    document.getElementById('panBtn').addEventListener('click', () => {
      renderer.domElement.style.cursor = 'grab';
      setTimeout(() => { renderer.domElement.style.cursor = 'default'; }, 900);
    });

    function loadBlobWithXhr(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
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
    }

    async function fetchModelBlob(url) {
      const isLocalFile = url.startsWith('file://') || url.startsWith('content://');
      try {
        const resp = await fetch(url, isLocalFile ? undefined : { headers: ${authHeaders} });
        console.log('[modelViewerHtml] Fetch response status:', resp.status);
        if (!resp.ok && !isLocalFile) throw new Error('HTTP ' + resp.status);
        return resp.blob();
      } catch (err) {
        if (!isLocalFile) throw err;
        console.log('[modelViewerHtml] fetch local file failed, trying XHR:', err.message);
        return loadBlobWithXhr(url);
      }
    }

    function applySavedViewState() {
      debugLog('[modelViewerHtml] applySavedViewState called');
      let state = ${viewStateStr};
      debugLog('[modelViewerHtml] raw state type: ' + typeof state + ', value: ' + JSON.stringify(state).substring(0, 100));
      console.log('[modelViewerHtml] initialViewState raw:', state);
      
      if (!state) {
        debugLog('[modelViewerHtml] No saved view state (state is null/falsy)');
        console.log('[modelViewerHtml] No saved view state provided');
        return false;
      }

      if (typeof state === 'string') {
        try {
          state = JSON.parse(state);
          debugLog('[modelViewerHtml] Parsed JSON view state');
          console.log('[modelViewerHtml] Parsed JSON view state');
        } catch (err) {
          debugLog('[modelViewerHtml] JSON parse failed: ' + err.message);
          console.error('[modelViewerHtml] Failed to parse view state JSON:', err.message);
          return false;
        }
      }

      const cp = state?.cameraPosition;
      const ct = state?.controlsTarget;
      const fov = state?.fov;
      const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

      debugLog('[modelViewerHtml] cam: ' + JSON.stringify(cp).substring(0,50) + ' tgt: ' + JSON.stringify(ct).substring(0,50));
      console.log('[modelViewerHtml] view state parts:', { cp, ct, fov });

      if (
        !isNumber(cp?.x) || !isNumber(cp?.y) || !isNumber(cp?.z) ||
        !isNumber(ct?.x) || !isNumber(ct?.y) || !isNumber(ct?.z)
      ) {
        debugLog('[modelViewerHtml] Invalid coordinates - cam: ' + (isNumber(cp?.x) ? 'OK' : 'INVALID') + 
                 ' tgt: ' + (isNumber(ct?.x) ? 'OK' : 'INVALID'));
        console.error('[modelViewerHtml] saved view_state coordinates invalid', { cp, ct });
        return false;
      }

      if (isNumber(fov)) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
        debugLog('[modelViewerHtml] Applied FOV: ' + fov);
        console.log('[modelViewerHtml] Set FOV to', fov);
      }

      controls.target.set(ct.x, ct.y, ct.z);
      camera.position.set(cp.x, cp.y, cp.z);
      camera.lookAt(controls.target);
      controls.update();
      debugLog('[modelViewerHtml] ✓ Applied view state');
      console.log('[modelViewerHtml] Successfully applied saved view_state');
      return true;
    }

    // Raycaster for part clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let meshes = [];

    renderer.domElement.addEventListener('pointerup', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        sendMessage({ type: 'partClick', name: hit.name || hit.parent?.name || 'Unnamed' });
      }
    });

    // ---- Load Model ----
    async function loadModel() {
      try {
        const modelUrl = ${modelUrlStr};
        console.log('[modelViewerHtml] Starting model load from:', modelUrl);
        const blob = await fetchModelBlob(modelUrl);
        console.log('[modelViewerHtml] Model blob received, size:', blob.size, 'bytes');
        
        const blobUrl = URL.createObjectURL(blob);
        console.log('[modelViewerHtml] Blob URL created:', blobUrl);

        const loader = new GLTFLoader();
        loader.load(
          blobUrl,
          (gltf) => {
            console.log('[modelViewerHtml] GLTF loaded successfully');
            const model = gltf.scene;
            console.log('[modelViewerHtml] Model loaded');

            // Collect meshes for raycasting
            model.traverse((child) => {
              if (child.isMesh) meshes.push(child);
            });
            console.log('[modelViewerHtml] Collected', meshes.length, 'meshes for raycasting');

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
            console.log('[modelViewerHtml] Applied web-aligned pivot transform');

            const finalBox = new THREE.Box3().setFromObject(pivot);
            const finalCenter = finalBox.getCenter(new THREE.Vector3());
            setDefaultView(finalBox, finalCenter);

            if (!applySavedViewState()) {
              console.log('[modelViewerHtml] No saved view state, using default camera');
              resetView();
            }

            loadingEl.style.display = 'none';
            sendMessage({ type: 'loaded' });
            URL.revokeObjectURL(blobUrl);
            console.log('[modelViewerHtml] Model fully loaded and visible');
          },
          (progress) => {
            console.log('[modelViewerHtml] Load progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
          },
          (err) => {
            console.error('[modelViewerHtml] GLTF loader error:', err);
            throw new Error('GLTF load error: ' + err.message);
          }
        );
      } catch (err) {
        console.error('[modelViewerHtml] loadModel caught error:', err.message);
        loadingEl.innerHTML = '<div style="color:#c0392b;text-align:center;">' +
          '<div style="font-size:28px;margin-bottom:8px;">⚠️</div>' +
          'Failed to load model<br><span style="font-size:12px;color:#999;">' +
          err.message + '</span></div>';
        sendMessage({ type: 'error', message: err.message });
      }
    }

    // ---- Animation Loop ----
    let frameCount = 0;
    function animate() {
      frameCount++;
      if (frameCount === 1) {
        console.log('[modelViewerHtml] Animation loop started');
      }
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    console.log('[modelViewerHtml] animate() function called');

    // ---- Resize ----
    window.addEventListener('resize', () => {
      console.log('[modelViewerHtml] Window resize event');
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log('[modelViewerHtml] Calling loadModel()...');
    loadModel();
  </script>
</body>
</html>
`;
}
