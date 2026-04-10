import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getAuthToken } from '../services/api';

export default function ThreeModelViewer({ modelUrl, alt, compact, onPartClick, initialViewState }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mountRef.current || !modelUrl) return;

    const container = mountRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.001, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    // Animate
    function animate() {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Load model through authenticated proxy
    const loader = new GLTFLoader();

    // Set auth header on the loader's request
    loader.manager.setURLModifier((url) => url);

    // Fetch the GLB as a blob with auth, then load from blob URL
    const token = getAuthToken();
    fetch(modelUrl, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load model: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        loader.load(
          blobUrl,
          (gltf) => {
            const model = gltf.scene;

            // Center and scale
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const boxSize = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(boxSize.x, boxSize.y, boxSize.z);

            model.position.set(-center.x, -center.y, -center.z);
            const pivot = new THREE.Group();
            pivot.add(model);
            const scale = 2 / maxDim;
            pivot.scale.setScalar(scale);

            const scaledBox = new THREE.Box3().setFromObject(pivot);
            pivot.position.y -= scaledBox.min.y;
            scene.add(pivot);

            const tryApplySavedView = () => {
              const raw = initialViewState;
              if (!raw) return false;

              let parsed = raw;
              if (typeof raw === 'string') {
                try {
                  parsed = JSON.parse(raw);
                } catch {
                  return false;
                }
              }

              const cp = parsed?.cameraPosition;
              const ct = parsed?.controlsTarget;
              const fov = parsed?.fov;
              const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

              if (
                !isNumber(cp?.x) || !isNumber(cp?.y) || !isNumber(cp?.z) ||
                !isNumber(ct?.x) || !isNumber(ct?.y) || !isNumber(ct?.z)
              ) {
                return false;
              }

              if (isNumber(fov)) {
                camera.fov = fov;
                camera.updateProjectionMatrix();
              }

              controls.target.set(ct.x, ct.y, ct.z);
              camera.position.set(cp.x, cp.y, cp.z);
              camera.lookAt(controls.target);
              return true;
            };

            // Frame camera (or reuse saved thumbnail view)
            const finalBox = new THREE.Box3().setFromObject(pivot);
            const finalCenter = finalBox.getCenter(new THREE.Vector3());
            if (!tryApplySavedView()) {
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
            }
            controls.update();

            setLoading(false);
            URL.revokeObjectURL(blobUrl);
          },
          undefined,
          (err) => {
            console.error('GLTFLoader error:', err);
            setError('Failed to load 3D model');
            setLoading(false);
            URL.revokeObjectURL(blobUrl);
          }
        );
      })
      .catch((err) => {
        console.error('Fetch model error:', err);
        setError(err.message);
        setLoading(false);
      });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Click handler for parts
    function onClick(event) {
      if (!onPartClick) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        onPartClick({ name: obj.name || 'unnamed', object: obj });
      }
    }
    renderer.domElement.addEventListener('click', onClick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, onPartClick, initialViewState]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(240,240,240,0.9)', zIndex: 10,
        }}>
          <span style={{ fontSize: compact ? '12px' : '14px', color: '#888' }}>
            Loading 3D model...
          </span>
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,240,240,0.9)', zIndex: 10,
        }}>
          <span style={{ fontSize: '12px', color: '#c00' }}>{error}</span>
        </div>
      )}
    </div>
  );
}