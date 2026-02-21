import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fetchBookPdf, fetchMappings, postMapping, deleteMapping, detectImages } from '../services/api';
import { Worker, Viewer, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function PdfAnnotator({ book, models }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
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
  const [mode, setMode] = useState('auto');

  useEffect(() => {
    setPageNumber(1);
    // Clean up previous blob URL
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);

    fetchBookPdf(book.id)
      .then((r) => setPdfUrl(r.pdfUrl))
      .catch((err) => console.error('fetchBookPdf error:', err));

    // Cleanup on unmount
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [book]);

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
      const images = result?.images || [];
      console.log('Detected images:', images);
      setDetectedImages(images);
    } catch (err) {
      console.error('Detection failed:', err);
      alert('Failed to detect images on this page');
    } finally {
      setDetecting(false);
    }
  }

  async function handleAssignModel(detection) {
    const modelId = assignModel || selectedModel;
    if (!modelId) {
      alert('Please select a model first');
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

  async function handleDelete(id) {
    await deleteMapping(id);
    const r = await fetchMappings(book.id, pageNumber);
    const data = Array.isArray(r) ? r : (r?.data || r || []);
    setMappings(data);
  }

  function onDocumentLoadSuccess(e) {
    setNumPages(e.doc.numPages);
  }

  function goToNextPage() {
    if (pageNumber < numPages) { setPageNumber(pageNumber + 1); setAnnotationBox(null); }
  }
  function goToPreviousPage() {
    if (pageNumber > 1) { setPageNumber(pageNumber - 1); setAnnotationBox(null); }
  }

  const renderPage = useCallback((props) => {
    return (
      <>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}

        {detectedImages.length > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {detectedImages.map((det) => (
              <div
                key={det.id}
                onClick={(e) => { e.stopPropagation(); setSelectedDetection(det); setAssignModel(selectedModel); }}
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
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s',
                }}
                title={det.figureLabel ? `${det.figureLabel}: ${det.figureTitle || ''}` : 'Detected image — click to assign model'}
              >
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
  }, [detectedImages, mappings, selectedDetection, selectedModel]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Controls */}
      <div style={{ padding: '12px 16px', background: '#f5f5f5', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button onClick={goToPreviousPage} disabled={pageNumber <= 1}
            style={{ padding: '8px 16px', background: pageNumber <= 1 ? '#ccc' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            ← Previous
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Page:</span>
            <input type="number" value={pageNumber}
              onChange={(e) => { const val = Number(e.target.value); if (val >= 1 && val <= (numPages || 1)) { setPageNumber(val); setAnnotationBox(null); } }}
              min={1} max={numPages || 1}
              style={{ width: '60px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'center' }}
            />
            <span style={{ color: '#666' }}>of {numPages || '?'}</span>
          </label>
          <button onClick={goToNextPage} disabled={pageNumber >= numPages}
            style={{ padding: '8px 16px', background: pageNumber >= numPages ? '#ccc' : '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            Next →
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>Model:</span>
            <select value={selectedModel || ''} onChange={(e) => setSelectedModel(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setMode('auto')}
              style={{ padding: '6px 14px', background: mode === 'auto' ? '#28a745' : '#e0e0e0', color: mode === 'auto' ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              🔍 Auto Detect
            </button>
            <button onClick={() => setMode('manual')}
              style={{ padding: '6px 14px', background: mode === 'manual' ? '#007bff' : '#e0e0e0', color: mode === 'manual' ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              ✏️ Manual Draw
            </button>
          </div>

          {mode === 'auto' && (
            <button onClick={handleDetectImages} disabled={detecting}
              style={{ padding: '6px 16px', background: detecting ? '#ccc' : '#ff9800', color: '#fff', border: 'none', borderRadius: '4px', cursor: detecting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {detecting ? '⏳ Detecting...' : '🖼️ Detect Images on Page'}
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

        <aside style={{ width: '300px', background: '#f9f9f9', borderLeft: '1px solid #ddd', padding: '16px', overflowY: 'auto', flexShrink: 0 }}>
          {selectedDetection && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
              <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#856404' }}>Assign Model to Image</h4>
              {selectedDetection.figureLabel && <p style={{ fontSize: '13px', margin: '0 0 4px', fontWeight: 'bold' }}>{selectedDetection.figureLabel}</p>}
              {selectedDetection.figureTitle && <p style={{ fontSize: '12px', margin: '0 0 8px', color: '#666' }}>"{selectedDetection.figureTitle}"</p>}
              <p style={{ fontSize: '11px', color: '#999', margin: '0 0 8px' }}>
                Region: ({(selectedDetection.x * 100).toFixed(0)}%, {(selectedDetection.y * 100).toFixed(0)}%) —
                {(selectedDetection.width * 100).toFixed(0)}% × {(selectedDetection.height * 100).toFixed(0)}%
              </p>
              <select value={assignModel || ''} onChange={(e) => setAssignModel(Number(e.target.value))}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '8px' }}>
                {models.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
              <button onClick={() => handleAssignModel(selectedDetection)}
                style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '6px' }}>
                ✓ Confirm & Save
              </button>
              <button onClick={() => { setSelectedDetection(null); setAssignModel(null); }}
                style={{ width: '100%', padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          {mode === 'manual' && annotationBox && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
              <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#856404' }}>New Manual Annotation</h4>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>Size: {Math.round(annotationBox.width)} × {Math.round(annotationBox.height)}px</p>
              <button onClick={confirmManualAnnotation}
                style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
                ✓ Confirm Annotation
              </button>
              <button onClick={() => setAnnotationBox(null)}
                style={{ width: '100%', padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}

          {detectedImages.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#28a745' }}>🖼️ Detected Images ({detectedImages.length})</h4>
              <p style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>Click an image region on the PDF or below to assign a 3D model</p>
              {detectedImages.map((det) => (
                <div key={det.id}
                  onClick={() => { setSelectedDetection(det); setAssignModel(selectedModel); }}
                  style={{
                    padding: '8px', background: selectedDetection?.id === det.id ? '#fff3cd' : '#fff',
                    border: selectedDetection?.id === det.id ? '2px solid #ffc107' : '1px solid #ddd',
                    borderRadius: '4px', marginBottom: '6px', cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{det.figureLabel || det.id}</div>
                  {det.figureTitle && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{det.figureTitle}</div>}
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                    ({(det.x * 100).toFixed(0)}%, {(det.y * 100).toFixed(0)}%) — {(det.width * 100).toFixed(0)}%×{(det.height * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Saved Annotations (page {pageNumber}) — {mappings.length}</h4>
          {mappings.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No annotations on this page</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {mappings.map((m) => (
                <li key={m.id} style={{ padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{m.label || `Model ${m.model_id}`}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Position: ({(m.x * 100).toFixed(1)}%, {(m.y * 100).toFixed(1)}%)</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>Size: {(m.width * 100).toFixed(0)}% × {(m.height * 100).toFixed(0)}%</div>
                  <button onClick={() => handleDelete(m.id)}
                    style={{ marginTop: '8px', padding: '4px 8px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}