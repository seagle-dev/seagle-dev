import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchBookPdf, fetchMappings, postMapping, deleteMapping, detectImages } from '../services/api';
import { Worker, Viewer, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from './Toast';

const MIN_DETECTION_SIZE = 0.02;
const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export default function PdfAnnotator({ book, models }) {
  const toast = useToast();
  const [pageNumber, setPageNumber] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  // ...existing code...
  const [mappings, setMappings] = useState([]);
  const [selectedModel, setSelectedModel] = useState(models?.[0]?.id || null);

  const [detectedImages, setDetectedImages] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [assignModel, setAssignModel] = useState(null);

  const containerRef = useRef();
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotationBox, setAnnotationBox] = useState(null);
  const startRef = useRef(null);
  const detectionEditRef = useRef(null);
  const [mode, setMode] = useState('auto');

  useEffect(() => {
    let activeBlobUrl = null;
    let isActive = true;

    setPageNumber(1);
    setPdfUrl((currentUrl) => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });

    fetchBookPdf(book.id)
      .then((r) => {
        activeBlobUrl = r.pdfUrl;
        if (isActive) setPdfUrl(r.pdfUrl);
      })
      .catch((err) => console.error('fetchBookPdf error:', err));

    return () => {
      isActive = false;
      if (activeBlobUrl && activeBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [book.id]);

  // ...existing code... (rest of the component stays exactly the same)
  useEffect(() => {
    if (book?.id && pageNumber) {
      fetchMappings(book.id, pageNumber)
        .then((r) => {
          const data = Array.isArray(r) ? r : (r?.data || r || []);
          setMappings(data);
        })
        .catch((err) => console.error('fetchMappings error:', err));
      setDetectedImages([]);
      setSelectedDetection(null);
    }
  }, [book, pageNumber]);

  useEffect(() => {
    if (models && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  async function handleDetectImages() {
    setDetecting(true);
    try {
      const result = await detectImages(book.id, pageNumber);
      const images = (result?.images || []).map((image, index) => ({
        ...image,
        id: image.id ?? `det-${pageNumber}-${index}`,
      }));
      console.log('Detected images:', images);
      setDetectedImages(images);
    } catch (err) {
      console.error('Detection failed:', err);
      toast.error('Failed to detect images on this page');
    } finally {
      setDetecting(false);
    }
  }

  async function handleAssignModel(detection) {
    const modelId = assignModel || selectedModel;
    if (!modelId) {
      toast.warning('Please select a model first');
      return;
    }

    const payload = {
      book_id: book.id,
      page_number: pageNumber,
      x: detection.x,
      y: detection.y,
      width: detection.width,
      height: detection.height,
      model_id: modelId,
      label: detection.figureLabel || detection.figureTitle || '',
    };

    try {
      await postMapping(payload);
      const r = await fetchMappings(book.id, pageNumber);
      const data = Array.isArray(r) ? r : (r?.data || r || []);
      setMappings(data);
      setDetectedImages(prev => prev.filter(d => d.id !== detection.id));
      setSelectedDetection(null);
      setAssignModel(null);
    } catch (err) {
      console.error('Failed to save mapping:', err);
      alert('Failed to save annotation');
    }
  }

  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  const selectDetection = useCallback((detection) => {
    setSelectedDetection(detection);
    setAssignModel(selectedModel);
  }, [selectedModel]);

  const updateDetection = useCallback((detectionId, nextDetection) => {
    setDetectedImages(prev => prev.map((det) => (
      det.id === detectionId ? { ...det, ...nextDetection } : det
    )));
    setSelectedDetection(prev => (
      prev?.id === detectionId ? { ...prev, ...nextDetection } : prev
    ));
  }, []);

  const handleDetectionEditMove = useCallback((e) => {
    const edit = detectionEditRef.current;
    if (!edit) return;

    const dx = (e.clientX - edit.startX) / edit.pageRect.width;
    const dy = (e.clientY - edit.startY) / edit.pageRect.height;
    const original = edit.original;
    let next = { ...original };

    if (edit.action === 'move') {
      next.x = Math.min(clamp(original.x + dx), 1 - original.width);
      next.y = Math.min(clamp(original.y + dy), 1 - original.height);
    } else {
      const right = original.x + original.width;
      const bottom = original.y + original.height;
      let left = original.x;
      let top = original.y;
      let nextRight = right;
      let nextBottom = bottom;

      if (edit.action.includes('w')) left = clamp(original.x + dx);
      if (edit.action.includes('e')) nextRight = clamp(right + dx);
      if (edit.action.includes('n')) top = clamp(original.y + dy);
      if (edit.action.includes('s')) nextBottom = clamp(bottom + dy);

      if (nextRight - left < MIN_DETECTION_SIZE) {
        if (edit.action.includes('w')) left = nextRight - MIN_DETECTION_SIZE;
        else nextRight = left + MIN_DETECTION_SIZE;
      }
      if (nextBottom - top < MIN_DETECTION_SIZE) {
        if (edit.action.includes('n')) top = nextBottom - MIN_DETECTION_SIZE;
        else nextBottom = top + MIN_DETECTION_SIZE;
      }

      left = clamp(left);
      top = clamp(top);
      nextRight = clamp(nextRight);
      nextBottom = clamp(nextBottom);

      next = {
        ...next,
        x: left,
        y: top,
        width: Math.max(MIN_DETECTION_SIZE, nextRight - left),
        height: Math.max(MIN_DETECTION_SIZE, nextBottom - top),
      };
    }

    updateDetection(edit.detectionId, next);
  }, [updateDetection]);

  const endDetectionEdit = useCallback(() => {
    detectionEditRef.current = null;
    window.removeEventListener('pointermove', handleDetectionEditMove);
    window.removeEventListener('pointerup', endDetectionEdit);
  }, [handleDetectionEditMove]);

  const beginDetectionEdit = useCallback((e, detection, action) => {
    e.preventDefault();
    e.stopPropagation();
    selectDetection(detection);

    const pageLayer = e.currentTarget.closest('[data-detection-layer="true"]');
    if (!pageLayer) return;

    detectionEditRef.current = {
      action,
      detectionId: detection.id,
      original: detection,
      pageRect: pageLayer.getBoundingClientRect(),
      startX: e.clientX,
      startY: e.clientY,
    };

    window.addEventListener('pointermove', handleDetectionEditMove);
    window.addEventListener('pointerup', endDetectionEdit);
  }, [endDetectionEdit, handleDetectionEditMove, selectDetection]);

  useEffect(() => () => endDetectionEdit(), [endDetectionEdit]);

  function getPdfPageLayer() {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector('.rpv-core__page-layer');
  }

  function onMouseDown(e) {
    if (mode !== 'manual' || !containerRef.current) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    setIsDrawing(true);
    e.preventDefault();
    e.stopPropagation();
  }

  function onMouseMove(e) {
    if (!isDrawing || !startRef.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const start = startRef.current;
    const left = Math.min(start.x, e.clientX) - containerRect.left;
    const top = Math.min(start.y, e.clientY) - containerRect.top;
    const width = Math.abs(e.clientX - start.x);
    const height = Math.abs(e.clientY - start.y);
    setAnnotationBox({ left, top, width, height });
  }

  function onMouseUp() {
    if (!isDrawing) return;
    setIsDrawing(false);
  }

  function confirmManualAnnotation() {
    if (!annotationBox) return;
    const pageLayer = getPdfPageLayer();
    if (!pageLayer) {
      alert('Please wait for the PDF to fully load');
      setAnnotationBox(null);
      return;
    }
    const pageRect = pageLayer.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const pageOffsetX = pageRect.left - containerRect.left;
    const pageOffsetY = pageRect.top - containerRect.top;
    const boxLeftInPage = annotationBox.left - pageOffsetX;
    const boxTopInPage = annotationBox.top - pageOffsetY;

    const rel = {
      x: clamp(boxLeftInPage / pageRect.width),
      y: clamp(boxTopInPage / pageRect.height),
      width: clamp(annotationBox.width / pageRect.width),
      height: clamp(annotationBox.height / pageRect.height)
    };

    const payload = {
      book_id: book.id,
      page_number: pageNumber,
      x: rel.x,
      y: rel.y,
      width: rel.width,
      height: rel.height,
      model_id: selectedModel,
      label: '',
    };

    postMapping(payload)
      .then(() => fetchMappings(book.id, pageNumber).then((r) => {
        const data = Array.isArray(r) ? r : (r?.data || r || []);
        setMappings(data);
      }))
      .catch((err) => console.error('postMapping error:', err));

    setAnnotationBox(null);
  }

  const handleDelete = useCallback((id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Annotation',
      message: 'Are you sure you want to delete this annotation mapping? This will remove the 3D model link from this PDF region.',
      onConfirm: async () => {
        try {
          await deleteMapping(id);
          const r = await fetchMappings(book.id, pageNumber);
          const data = Array.isArray(r) ? r : (r?.data || r || []);
          setMappings(data);
        } catch (err) {
          console.error('Failed to delete mapping:', err);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [book.id, pageNumber]);

  function onDocumentLoadSuccess(e) {
// ... existing code ...
    setNumPages(e.doc.numPages);
  }

  function goToNextPage() {
    if (pageNumber < numPages) { setPageNumber(pageNumber + 1); setAnnotationBox(null); }
  }
  function goToPreviousPage() {
    if (pageNumber > 1) { setPageNumber(pageNumber - 1); setAnnotationBox(null); }
  }

  const renderPage = useCallback((props) => {
// ... rest of renderPage implementation stays exactly the same
    return (
      <>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}

        {detectedImages.length > 0 && (
          <div data-detection-layer="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {detectedImages.map((det) => (
              <div
                key={det.id}
                onClick={(e) => { e.stopPropagation(); selectDetection(det); }}
                onPointerDown={(e) => beginDetectionEdit(e, det, 'move')}
                style={{
                  position: 'absolute',
                  left: `${det.x * 100}%`,
                  top: `${det.y * 100}%`,
                  width: `${det.width * 100}%`,
                  height: `${det.height * 100}%`,
                  border: selectedDetection?.id === det.id ? '3px solid #ff6600' : '2px dashed #00cc44',
                  background: selectedDetection?.id === det.id ? 'rgba(255, 102, 0, 0.15)' : 'rgba(0, 204, 68, 0.1)',
                  borderRadius: '4px',
                  pointerEvents: 'auto',
                  cursor: selectedDetection?.id === det.id ? 'move' : 'pointer',
                  zIndex: 10,
                  transition: detectionEditRef.current ? 'none' : 'all 0.2s',
                }}
                title={det.figureLabel ? `${det.figureLabel}: ${det.figureTitle || ''}` : 'Detected image — click to assign model'}
              >
                {selectedDetection?.id === det.id && RESIZE_HANDLES.map((handle) => {
                  const isNorth = handle.includes('n');
                  const isSouth = handle.includes('s');
                  const isWest = handle.includes('w');
                  const isEast = handle.includes('e');

                  return (
                    <span
                      key={handle}
                      onPointerDown={(e) => beginDetectionEdit(e, det, handle)}
                      style={{
                        position: 'absolute',
                        width: handle === 'n' || handle === 's' ? '26px' : '10px',
                        height: handle === 'e' || handle === 'w' ? '26px' : '10px',
                        left: isWest ? '-6px' : isEast ? 'auto' : '50%',
                        right: isEast ? '-6px' : 'auto',
                        top: isNorth ? '-6px' : isSouth ? 'auto' : '50%',
                        bottom: isSouth ? '-6px' : 'auto',
                        transform: !isWest && !isEast ? 'translateX(-50%)' : !isNorth && !isSouth ? 'translateY(-50%)' : 'none',
                        background: '#fff',
                        border: '2px solid #ff6600',
                        borderRadius: '999px',
                        boxSizing: 'border-box',
                        cursor: `${handle}-resize`,
                        zIndex: 20,
                      }}
                    />
                  );
                })}
                {det.figureLabel && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: 0,
                    background: '#00cc44',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                  }}>
                    {det.figureLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {mappings.length > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 6 }}>
            {mappings.filter(m => m.page_number === props.pageIndex + 1).map((m) => (
              <div
                key={m.id}
                style={{
                  position: 'absolute',
                  left: `${m.x * 100}%`,
                  top: `${m.y * 100}%`,
                  width: `${m.width * 100}%`,
                  height: `${m.height * 100}%`,
                  border: '2px solid rgba(0,150,255,0.8)',
                  background: 'rgba(0,150,255,0.1)',
                  borderRadius: '4px',
                  pointerEvents: 'auto',
                  zIndex: 12,
                }}
                title={`${m.label || ''} (model ${m.model_id})`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                  style={{
                    background: '#fff',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '12px',
                    borderRadius: '3px',
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                  }}
                >
                  ✕
                </button>
                <span style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '4px',
                  background: 'rgba(0,150,255,0.8)',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                }}>
                  {m.label || `Model #${m.model_id}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }, [detectedImages, mappings, selectedDetection, beginDetectionEdit, selectDetection, handleDelete]);

  const renderRightSidebar = () => (
    <aside 
      className={isMobile ? 'mobile-drawer-right' : ''}
      style={isMobile ? {} : { width: '300px', background: 'var(--color-bg-white)', borderLeft: '1px solid var(--color-border)', padding: '16px', overflowY: 'auto', flexShrink: 0 }}
    >
      {isMobile && (
        <button onClick={() => setIsSidebarOpen(false)} className="drawer-close-btn" aria-label="Close annotations" style={{ top: '8px', right: '8px' }}>
          ✕
        </button>
      )}
      
      {selectedDetection && (
        <div style={{ marginBottom: '16px', padding: '14px', background: 'var(--color-orange-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-orange)', boxShadow: 'var(--shadow-sm)', marginTop: isMobile ? '32px' : '0' }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-navy)', fontWeight: 'bold' }}>Assign Model to Image</h4>
          {selectedDetection.figureLabel && <p style={{ fontSize: '13px', margin: '0 0 4px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{selectedDetection.figureLabel}</p>}
          {selectedDetection.figureTitle && <p style={{ fontSize: '12px', margin: '0 0 8px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{selectedDetection.figureTitle}"</p>}
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 10px' }}>
            Region: ({(selectedDetection.x * 100).toFixed(0)}%, {(selectedDetection.y * 100).toFixed(0)}%)
          </p>
          <select value={assignModel || ''} onChange={(e) => setAssignModel(Number(e.target.value))}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '10px', color: 'var(--color-navy)', fontWeight: '600' }}>
            {models.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>
          <button 
            onClick={() => handleAssignModel(selectedDetection)}
            className="btn-accent"
            style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: 'var(--radius-md)' }}
          >
            ✓ Confirm & Save
          </button>
          <button 
            onClick={() => { setSelectedDetection(null); setAssignModel(null); }}
            className="btn-secondary"
            style={{ width: '100%', padding: '6px', borderRadius: 'var(--radius-md)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {mode === 'manual' && annotationBox && (
        <div style={{ marginBottom: '16px', padding: '14px', background: 'var(--color-orange-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-orange)', boxShadow: 'var(--shadow-sm)', marginTop: isMobile ? '32px' : '0' }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-navy)', fontWeight: 'bold' }}>New Manual Annotation</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Size: {Math.round(annotationBox.width)} × {Math.round(annotationBox.height)}px</p>
          <button 
            onClick={confirmManualAnnotation}
            className="btn-accent"
            style={{ width: '100%', padding: '8px', marginBottom: '6px', borderRadius: 'var(--radius-md)' }}
          >
            ✓ Confirm Annotation
          </button>
          <button 
            onClick={() => setAnnotationBox(null)}
            className="btn-secondary"
            style={{ width: '100%', padding: '6px', borderRadius: 'var(--radius-md)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {detectedImages.length > 0 && (
        <div style={{ marginBottom: '20px', marginTop: (isMobile && !selectedDetection && !(mode === 'manual' && annotationBox)) ? '36px' : '0' }}>
          <h4 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--color-navy)', fontWeight: 'bold' }}>🖼️ Detected Images ({detectedImages.length})</h4>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>Click an image region on the PDF or below to assign a 3D model</p>
          {detectedImages.map((det) => (
            <div key={det.id}
              onClick={() => selectDetection(det)}
              style={{
                padding: '10px', 
                background: selectedDetection?.id === det.id ? 'var(--color-orange-bg)' : 'var(--color-bg-white)',
                border: selectedDetection?.id === det.id ? '2px solid var(--color-orange)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', 
                marginBottom: '8px', 
                cursor: 'pointer', 
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseOver={(e) => {
                if (selectedDetection?.id !== det.id) {
                  e.currentTarget.style.borderColor = 'var(--color-text-muted)';
                }
              }}
              onMouseOut={(e) => {
                if (selectedDetection?.id !== det.id) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)' }}>{det.figureLabel || det.id}</div>
              {det.figureTitle && <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{det.figureTitle}</div>}
              <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Position: ({(det.x * 100).toFixed(0)}%, {(det.y * 100).toFixed(0)}%)
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: (isMobile && detectedImages.length === 0 && !selectedDetection && !(mode === 'manual' && annotationBox)) ? '36px' : '0' }}>
        <h4 style={{ marginTop: 0, marginBottom: '12px', fontWeight: 'bold', color: 'var(--color-navy)' }}>Saved Annotations (page {pageNumber}) — {mappings.length}</h4>
        {mappings.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0', fontSize: '12px' }}>No annotations on this page</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mappings.map((m) => (
              <li key={m.id} style={{ padding: '12px', background: 'var(--color-bg-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{m.label || `Model ${m.model_id}`}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Position: ({(m.x * 100).toFixed(1)}%, {(m.y * 100).toFixed(1)}%)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Size: {(m.width * 100).toFixed(0)}% × {(m.height * 100).toFixed(0)}%</div>
                <button 
                  onClick={() => handleDelete(m.id)}
                  className="btn-danger"
                  style={{ marginTop: '10px', padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-md)' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ... rest of the return implementation ... */}
      {/* Top Controls */}
      <div style={{ padding: '14px 24px', background: 'var(--color-bg-white)', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: 'var(--shadow-sm)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={goToPreviousPage} 
            disabled={pageNumber <= 1}
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}
          >
            ← Previous
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-navy)' }}>Page:</span>
            <input type="number" value={pageNumber}
              onChange={(e) => { const val = Number(e.target.value); if (val >= 1 && val <= (numPages || 1)) { setPageNumber(val); setAnnotationBox(null); } }}
              min={1} max={numPages || 1}
              style={{ width: '60px', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center', fontWeight: '600' }}
            />
            <span>of {numPages || '?'}</span>
          </label>
          <button 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}
          >
            Next →
          </button>
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid var(--color-orange)', color: 'var(--color-orange)', fontWeight: 'bold' }}
            >
              📋 Annotations
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-navy)' }}>Model:</span>
            <select value={selectedModel || ''} onChange={(e) => setSelectedModel(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', minWidth: '200px', fontWeight: '600', color: 'var(--color-navy)' }}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--color-border)', padding: '3px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-primary)' }}>
            <button onClick={() => setMode('auto')}
              style={{ 
                padding: '6px 14px', 
                background: mode === 'auto' ? 'var(--color-navy)' : 'transparent', 
                color: mode === 'auto' ? 'var(--color-white)' : 'var(--color-text-secondary)', 
                border: 'none', 
                borderRadius: 'var(--radius-sm)', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              🔍 Auto Detect
            </button>
            <button onClick={() => setMode('manual')}
              style={{ 
                padding: '6px 14px', 
                background: mode === 'manual' ? 'var(--color-navy)' : 'transparent', 
                color: mode === 'manual' ? 'var(--color-white)' : 'var(--color-text-secondary)', 
                border: 'none', 
                borderRadius: 'var(--radius-sm)', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              ✏️ Manual Draw
            </button>
          </div>

          {mode === 'auto' && (
            <button 
              onClick={handleDetectImages} 
              disabled={detecting}
              className="btn-accent"
              style={{ padding: '8px 16px', fontSize: '13.5px' }}
            >
              {detecting ? '⏳ Detecting...' : '🖼️ Detect Images'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            border: '1px solid #ccc',
            overflow: 'auto',
            background: '#525252',
            cursor: mode === 'manual' ? 'crosshair' : 'default',
            userSelect: 'none'
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {pdfUrl ? (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                key={`${book.id}-${pageNumber}`}
                fileUrl={pdfUrl}
                defaultScale={SpecialZoomLevel.PageFit}
                initialPage={pageNumber - 1}
                scrollMode={ScrollMode.Page}
                onDocumentLoad={onDocumentLoadSuccess}
                renderPage={renderPage}
              />
            </Worker>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff' }}>
              Loading PDF...
            </div>
          )}

          {mode === 'manual' && annotationBox && (
            <div style={{
              position: 'absolute',
              left: `${annotationBox.left}px`,
              top: `${annotationBox.top}px`,
              width: `${annotationBox.width}px`,
              height: `${annotationBox.height}px`,
              border: '3px dashed red',
              background: 'rgba(255, 0, 0, 0.2)',
              pointerEvents: 'none',
              zIndex: 1000,
            }} />
          )}
        </div>

        {isMobile ? (
          isSidebarOpen && (
            <>
              <div className="mobile-drawer-overlay" onClick={() => setIsSidebarOpen(false)} style={{ zIndex: 1000 }} />
              {renderRightSidebar()}
            </>
          )
        ) : (
          renderRightSidebar()
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
