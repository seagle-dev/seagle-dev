import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchBookPdf, fetchMappings, fetchModels } from '../services/api';
import { Worker, Viewer, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import ThreeModelViewer from './ThreeModelViewer';

// ...existing code... (InlineModelOverlay stays the same)
const InlineModelOverlay = React.memo(function InlineModelOverlay({ mapping, model }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedBone, setSelectedBone] = useState(null);

  if (!model?.file_url) {
    return (
      <div style={{
        position: 'absolute',
        left: `${mapping.x * 100}%`,
        top: `${mapping.y * 100}%`,
        width: `${mapping.width * 100}%`,
        height: `${mapping.height * 100}%`,
        border: '2px dashed rgba(74, 144, 217, 0.6)',
        background: 'rgba(74, 144, 217, 0.05)',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px',
          borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap',
        }}>
          {model?.name || mapping.label || 'Model unavailable'}
        </span>
      </div>
    );
  }

  const handlePartClick = useCallback((info) => {
    setSelectedBone(info);
  }, []);

  return (
    <>
      <div style={{
        position: 'absolute',
        left: `${mapping.x * 100}%`,
        top: `${mapping.y * 100}%`,
        width: `${mapping.width * 100}%`,
        height: `${mapping.height * 100}%`,
        zIndex: 20,
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.92), rgba(255,255,255,0.75))',
          backdropFilter: 'blur(4px)',
          padding: '2px 6px',
          zIndex: 30,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <span style={{
            color: '#333', fontSize: '10px', fontWeight: '600',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%',
          }}>
            {model.name || mapping.label || '3D Model'}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            style={{
              background: 'transparent', color: '#4a90d9', border: 'none',
              borderRadius: '3px', padding: '1px 5px', fontSize: '12px',
              cursor: 'pointer', lineHeight: '16px',
            }}
            title="View fullscreen">
            ⛶
          </button>
        </div>

        <div style={{ width: '100%', height: '100%', paddingTop: '22px', boxSizing: 'border-box' }}>
          <ThreeModelViewer
            modelUrl={model.file_url}
            alt={model.name}
            compact={true}
            onPartClick={handlePartClick}
          />
        </div>
      </div>

      {expanded && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
          }}
          onClick={() => setExpanded(false)}
        >
          <div style={{
            padding: '12px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '500' }}>
              {model.name || mapping.label || '3D Model'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedBone && (
                <span style={{ color: '#4a90d9', fontSize: '13px' }}>
                  Selected: <b>{selectedBone.name}</b>
                </span>
              )}
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                  borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                ✕
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1, margin: '12px 20px 20px', borderRadius: '8px',
              overflow: 'hidden', background: '#f0f0f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ThreeModelViewer
              modelUrl={model.file_url}
              alt={model.name}
              compact={false}
              onPartClick={handlePartClick}
            />
          </div>
        </div>
      )}
    </>
  );
});

export default function BookViewer({ book }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [allMappings, setAllMappings] = useState({});
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerKey, setViewerKey] = useState(0);

  useEffect(() => {
    if (book?.id) {
      setPageNumber(1);
      setLoading(true);
      setAllMappings({});

      // Clean up old blob URL
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(null);

      Promise.all([fetchBookPdf(book.id), fetchModels()])
        .then(([pdfData, modelsData]) => {
          setPdfUrl(pdfData.pdfUrl);
          setModels(modelsData || []);
          setLoading(false);
        })
        .catch((err) => { console.error('Error loading book data:', err); setLoading(false); });
    }

    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [book]);

  // ...existing code... (rest stays the same)
  useEffect(() => {
    if (book?.id && pageNumber) {
      if (allMappings[pageNumber]) return;
      fetchMappings(book.id, pageNumber)
        .then((data) => {
          const result = Array.isArray(data) ? data : (data?.data || data || []);
          setAllMappings(prev => ({ ...prev, [pageNumber]: result }));
        })
        .catch((err) => console.error('fetchMappings error:', err));
    }
  }, [book, pageNumber]);

  const modelMap = useMemo(() => {
    const map = new Map();
    models.forEach((m) => map.set(m.id, m));
    return map;
  }, [models]);

  const pageMappings = useMemo(() => allMappings[pageNumber] || [], [allMappings, pageNumber]);

  const onDocumentLoadSuccess = useCallback((e) => { setNumPages(e.doc.numPages); }, []);

  function goToPage(page) {
    if (page < 1 || page > numPages || page === pageNumber) return;
    setPageNumber(page);
    setViewerKey(k => k + 1);
  }

  const renderPage = useCallback((props) => {
    const currentPageMappings = pageMappings.filter((m) => m.page_number === props.pageIndex + 1);
    return (
      <>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}
        {currentPageMappings.length > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {currentPageMappings.map((mapping) => {
              const model = modelMap.get(mapping.model_id);
              return (
                <div key={mapping.id} style={{ pointerEvents: 'auto' }}>
                  <InlineModelOverlay mapping={mapping} model={model} />
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }, [pageMappings, modelMap]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#fafafa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📖</div>
          <p style={{ color: '#888', fontSize: '14px' }}>Loading book...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#fafafa' }}>
      <div style={{
        padding: '10px 24px',
        background: '#2c3e50',
        borderBottom: '2px solid #34495e',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '500' }}>
          {book?.title || 'Book Viewer'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1}
            style={{ ...navBtnStyle, opacity: pageNumber <= 1 ? 0.4 : 1, cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer' }}>
            ← Previous
          </button>
          <input type="number" value={pageNumber}
            onChange={(e) => { const v = Number(e.target.value); if (v >= 1 && v <= (numPages || 1)) goToPage(v); }}
            min={1} max={numPages || 1}
            style={{ width: '50px', padding: '6px', fontSize: '13px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>of {numPages || '?'}</span>
          <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= numPages}
            style={{ ...navBtnStyle, opacity: pageNumber >= numPages ? 0.4 : 1, cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer' }}>
            Next →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', background: '#e8e8e8' }}>
          {pdfUrl ? (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                key={viewerKey}
                fileUrl={pdfUrl}
                defaultScale={SpecialZoomLevel.PageFit}
                initialPage={pageNumber - 1}
                scrollMode={ScrollMode.Page}
                onDocumentLoad={onDocumentLoadSuccess}
                renderPage={renderPage}
              />
            </Worker>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
              Loading PDF...
            </div>
          )}
        </div>

        <div style={{
          width: '280px', background: '#fff', borderLeft: '1px solid #e0e0e0',
          overflowY: 'auto', padding: '16px', flexShrink: 0,
        }}>
          <h3 style={{ marginTop: 0, fontSize: '15px', color: '#2c3e50', fontWeight: '600' }}>
            3D Models on Page {pageNumber}
          </h3>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '12px' }}>
            {pageMappings.length} annotation{pageMappings.length !== 1 ? 's' : ''}
          </div>

          {pageMappings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}>📄</div>
              <p style={{ color: '#aaa', fontSize: '12px', fontStyle: 'italic' }}>No 3D models on this page</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pageMappings.map((m) => {
                const model = modelMap.get(m.model_id);
                return (
                  <div key={m.id} style={{
                    padding: '10px', border: '1px solid #e8e8e8', borderRadius: '6px',
                    background: '#fafafa', transition: 'all 0.2s',
                  }}>
                    {model?.thumbnail && (
                      <img src={model.thumbnail} alt={model.name}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' }} />
                    )}
                    <div style={{ fontWeight: '600', marginBottom: '2px', fontSize: '13px', color: '#333' }}>
                      {model?.name || m.label || `Model ${m.model_id}`}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999' }}>
                      Position: ({(m.x * 100).toFixed(0)}%, {(m.y * 100).toFixed(0)}%) •
                      Size: {(m.width * 100).toFixed(0)}%×{(m.height * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  padding: '7px 14px',
  background: '#2ecc71',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600',
  transition: 'all 0.2s',
};