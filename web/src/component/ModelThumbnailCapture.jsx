import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { getAuthToken } from '../services/api';

export default function ModelThumbnailCapture({ modelUrl, modelName, onCapture, onCancel }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!mountRef.current || !modelUrl) return;

    const container = mountRef.current;
    const size = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3B3D3F);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.001, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controlsRef.current = controls;

    function animate() {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Load via authenticated fetch → blob → GLTFLoader
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
        const loader = new GLTFLoader();
        loader.load(blobUrl, (gltf) => {
          const model = gltf.scene;
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

          const finalBox = new THREE.Box3().setFromObject(pivot);
          const finalCenter = finalBox.getCenter(new THREE.Vector3());
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

          setReady(true);
          URL.revokeObjectURL(blobUrl);
        }, undefined, (err) => {
          console.error('Failed to load model for thumbnail:', err);
          URL.revokeObjectURL(blobUrl);
        });
      })
      .catch((err) => {
        console.error('Fetch model error:', err);
      });

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  function handleCapture() {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    setCapturing(true);
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    rendererRef.current.render(sceneRef.current, camera);
    rendererRef.current.domElement.toBlob((blob) => {
      setCapturing(false);
      
      // Extract view state
      const viewState = {
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
      };
      
      if (onCapture) onCapture({ blob, viewState });
    }, 'image/png');
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={onCancel}
    >
      <div style={{
        background: '#3B3D3F', borderRadius: '12px', padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: '460px', width: '100%',
        color: '#F5F5F5',
      }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#F5F5F5' }}>
          📸 Capture Thumbnail
        </h3>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(245, 245, 245, 0.7)' }}>
          Rotate the model to your preferred view, then click Capture.
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#F5F5F5' }}>
          {modelName}
        </p>

        <div ref={mountRef} style={{
          width: 400, height: 400, borderRadius: '8px', overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(to bottom, #444648 0%, #3B3D3F 50%, #2D2F31 100%)', marginBottom: '12px',
        }} />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleCapture} disabled={!ready || capturing}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '6px',
              background: ready ? '#388e3c' : '#ccc', color: '#fff',
              fontWeight: 'bold', fontSize: '13px',
              cursor: ready ? 'pointer' : 'not-allowed',
            }}>
            {capturing ? '⏳ Capturing...' : ready ? '📸 Capture Thumbnail' : '⏳ Loading model...'}
          </button>
          <button onClick={() => { if (onCapture) onCapture({ blob: null, viewState: null }); }}
            style={{
              padding: '10px 16px', background: '#757575', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
            }}>
            Skip
          </button>
          <button onClick={onCancel}
            style={{
              padding: '10px 16px', background: '#ef5350', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}