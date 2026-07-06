import React, { useEffect, useState, useRef } from 'react';
import {
  fetchAdminBooks, fetchModels, setToken, autoLogin,
  uploadBook, deleteBook, uploadModel, deleteModel, uploadModelThumbnail,
} from '../services/api';
import PdfAnnotator from '../component/PdfAnnotator';
import ModelThumbnailCapture from '../component/ModelThumbnailCapture';
import ConfirmationModal from '../component/ConfirmationModal';
import { useToast } from '../component/Toast';

setToken(localStorage.getItem('token') || '');

export default function AdminPage() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState('annotate');

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Upload states
  const [uploadingBook, setUploadingBook] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', description: '', category: '' });
  const [modelForm, setModelForm] = useState({ name: '', category: '' });
  const [pendingThumbnail, setPendingThumbnail] = useState(null);

  const pdfInputRef = useRef(null);
  const modelInputRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await autoLogin();
        const token = res?.token;
        if (token) { localStorage.setItem('token', token); setToken(token); }
        await refreshData();
      } catch (err) {
        console.error('AdminPage init error', err);
      }
    }
    init();

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function refreshData() {
    const [r1, r2] = await Promise.all([fetchAdminBooks(), fetchModels()]);
    setBooks(r1 || []);
    setModels(r2 || []);
  }

  // ===== Book Upload =====
  async function handleBookUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.warning('Please select a PDF file');
      return;
    }
    setUploadingBook(true);
    try {
      await uploadBook(file, {
        title: bookForm.title || file.name.replace(/\.pdf$/i, ''),
        description: bookForm.description,
        category: bookForm.category,
      });
      setBookForm({ title: '', description: '', category: '' });
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      await refreshData();
      toast.success('Book uploaded successfully! Cover was auto-generated from page 1.');
    } catch (err) {
      console.error('Book upload error:', err);
      toast.error('Failed to upload book: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingBook(false);
    }
  }

  async function handleDeleteBook(id) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Book',
      message: 'Are you sure you want to delete this book and all its annotations? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteBook(id);
          if (selectedBook?.id === id) setSelectedBook(null);
          await refreshData();
          toast.success('Book deleted successfully');
        } catch (err) {
          console.error('Failed to delete book:', err);
          toast.error('Failed to delete book');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  }

  // ===== Model Upload =====
  async function handleModelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['glb', 'gltf'].includes(ext)) {
      toast.warning('Please select a .glb or .gltf file');
      return;
    }
    setUploadingModel(true);
    try {
      const result = await uploadModel(file, {
        name: modelForm.name || file.name.replace(/\.(glb|gltf)$/i, ''),
        category: modelForm.category,
      });
      setModelForm({ name: '', category: '' });
      if (modelInputRef.current) modelInputRef.current.value = '';
      await refreshData();
      toast.success('Model uploaded successfully! Please capture a thumbnail.');
      // Show thumbnail capture dialog
      setPendingThumbnail({ modelId: result.id, file_url: result.file_url, name: result.name });
    } catch (err) {
      console.error('Model upload error:', err);
      toast.error('Failed to upload model: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingModel(false);
    }
  }

  async function handleThumbnailCaptured({ blob, viewState }) {
    if (!pendingThumbnail) { setPendingThumbnail(null); return; }
    if (blob) {
      try {
        await uploadModelThumbnail(pendingThumbnail.modelId, blob, viewState);
        await refreshData();
        toast.success('Model thumbnail captured successfully');
      } catch (err) {
        console.error('Thumbnail upload error:', err);
        toast.error('Failed to upload thumbnail');
      }
    }
    setPendingThumbnail(null);
  }

  async function handleDeleteModel(id) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Model',
      message: 'Are you sure you want to delete this 3D model? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteModel(id);
          await refreshData();
          toast.success('Model deleted successfully');
        } catch (err) {
          console.error('Failed to delete model:', err);
          toast.error('Failed to delete model');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  }

  const tabStyle = (key) => ({
    flex: 1,
    padding: '14px 8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    fontFamily: 'var(--font-sans)',
    transition: 'all var(--transition-fast)',
    background: activeTab === key ? 'var(--color-bg-white)' : 'var(--color-bg-primary)',
    color: activeTab === key ? 'var(--color-navy)' : 'var(--color-text-secondary)',
    borderBottom: activeTab === key ? '3.5px solid var(--color-orange)' : '3.5px solid transparent',
  });

  const renderSidebar = () => (
    <aside 
      className={isMobile ? 'mobile-drawer-left' : ''}
      style={isMobile ? {} : { width: 340, background: 'var(--color-bg-white)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}
    >
      {isMobile && (
        <button onClick={() => setIsSidebarOpen(false)} className="drawer-close-btn" aria-label="Close sidebar">
          ✕
        </button>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0, paddingRight: isMobile ? '40px' : '0' }}>
        <button onClick={() => setActiveTab('annotate')} style={tabStyle('annotate')}>✏️ Annotate</button>
        <button onClick={() => setActiveTab('books')} style={tabStyle('books')}>📚 Books</button>
        <button onClick={() => setActiveTab('models')} style={tabStyle('models')}>🧊 Models</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* ===== ANNOTATE TAB ===== */}
        {activeTab === 'annotate' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 'bold', color: 'var(--color-navy)' }}>Select Book to Annotate</h3>
            {books.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0', fontSize: '13px' }}>
                No books yet. Upload one in the Books tab.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {books.map(b => (
                  <div key={b.id} onClick={() => { setSelectedBook(b); if (isMobile) setIsSidebarOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      background: selectedBook?.id === b.id ? 'var(--color-orange-bg)' : 'var(--color-bg-white)',
                      border: selectedBook?.id === b.id ? '1px solid var(--color-orange)' : '1px solid var(--color-border)',
                      boxShadow: selectedBook?.id === b.id ? 'var(--shadow-sm)' : 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseOver={(e) => {
                      if (selectedBook?.id !== b.id) {
                        e.currentTarget.style.borderColor = 'var(--color-text-muted)';
                        e.currentTarget.style.background = 'var(--color-border-light)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedBook?.id !== b.id) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.background = 'var(--color-bg-white)';
                      }
                    }}
                    >
                    {b.cover_image ? (
                      <img src={b.cover_image} alt="" style={{ width: 42, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0, background: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }} />
                    ) : (
                      <div style={{ width: 42, height: 56, background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📄</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                      {b.category && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{b.category}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== BOOKS TAB ===== */}
        {activeTab === 'books' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 'bold', color: 'var(--color-navy)' }}>📚 Manage Books</h3>

            {/* Upload Form */}
            <div style={{ background: 'var(--color-orange-bg)', border: '1px solid var(--color-orange-light)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--color-navy)', fontWeight: 'bold' }}>Upload New Book</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
                PDF will be stored. Cover is auto-generated.
              </p>
              <input type="text" placeholder="Book title" value={bookForm.title}
                onChange={(e) => setBookForm(f => ({ ...f, title: e.target.value }))}
                style={inputStyle} />
              <input type="text" placeholder="Description (optional)" value={bookForm.description}
                onChange={(e) => setBookForm(f => ({ ...f, description: e.target.value }))}
                style={inputStyle} />
              <input type="text" placeholder="Category (optional)" value={bookForm.category}
                onChange={(e) => setBookForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, marginBottom: '14px' }} />
              <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handleBookUpload} disabled={uploadingBook} style={{ display: 'none' }} />
              
              <button 
                onClick={() => pdfInputRef.current?.click()} 
                disabled={uploadingBook}
                className="btn-accent"
                style={{ width: '100%', padding: '11px' }}
              >
                {uploadingBook ? '⏳ Uploading & processing...' : '📁 Select PDF & Upload'}
              </button>
            </div>

            {/* Book List */}
            <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Uploaded Books ({books.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {books.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-bg-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                  {b.cover_image ? (
                    <img src={b.cover_image} alt="" style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0, background: 'var(--color-bg-primary)' }} />
                  ) : (
                    <div style={{ width: 44, height: 58, background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📄</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                    {b.description && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{b.description}</div>}
                    {b.category && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>📁 {b.category}</div>}
                  </div>
                  <button 
                    onClick={() => handleDeleteBook(b.id)}
                    className="btn-danger"
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 'var(--radius-md)' }}
                  >
                    🗑
                  </button>
                </div>
              ))}
              {books.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '12px 0', fontSize: '12px' }}>No books uploaded yet</p>}
            </div>
          </>
        )}

        {/* ===== MODELS TAB ===== */}
        {activeTab === 'models' && (
          <>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 'bold', color: 'var(--color-navy)' }}>🧊 Manage 3D Models</h3>

            {/* Upload Form */}
            <div style={{ background: 'var(--color-bg-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--color-navy-deep)', fontWeight: 'bold' }}>Upload New Model</h4>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
                GLB/GLTF models. Thumbnail is generated from 3D view.
              </p>
              <input type="text" placeholder="Model name" value={modelForm.name}
                onChange={(e) => setModelForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle} />
              <input type="text" placeholder="Category (optional)" value={modelForm.category}
                onChange={(e) => setModelForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, marginBottom: '14px' }} />
              <input ref={modelInputRef} type="file" accept=".glb,.gltf" onChange={handleModelUpload} disabled={uploadingModel} style={{ display: 'none' }} />
              
              <button 
                onClick={() => modelInputRef.current?.click()} 
                disabled={uploadingModel}
                className="btn-primary"
                style={{ width: '100%', padding: '11px' }}
              >
                {uploadingModel ? '⏳ Uploading model...' : '📁 Select GLB/GLTF & Upload'}
              </button>
            </div>

            {/* Model List */}
            <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Uploaded Models ({models.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {models.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--color-bg-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                  {m.thumbnail ? (
                    <img src={m.thumbnail} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0, background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }} />
                  ) : (
                    <div style={{ width: 44, height: 44, background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '1px solid var(--color-border)' }}>🧊</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    {m.category && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>📁 {m.category}</div>}
                    {!m.thumbnail && (
                      <button onClick={() => setPendingThumbnail({ modelId: m.id, file_url: m.file_url, name: m.name })}
                        style={{ fontSize: '11px', color: 'var(--color-orange)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', marginTop: '4px', fontWeight: 'bold' }}>
                        📸 Generate thumbnail
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteModel(m.id)}
                    className="btn-danger"
                    style={{ padding: '6px 10px', fontSize: '12px', borderRadius: 'var(--radius-md)' }}
                  >
                    🗑
                  </button>
                </div>
              ))}
              {models.length === 0 && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '12px 0', fontSize: '12px' }}>No models uploaded yet</p>}
            </div>
          </>
        )}
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--color-bg-primary)', position: 'relative' }}>
      {/* Sidebar responsive toggle */}
      {isMobile ? (
        isSidebarOpen && (
          <>
            <div className="mobile-drawer-overlay" onClick={() => setIsSidebarOpen(false)} />
            {renderSidebar()}
          </>
        )
      ) : (
        renderSidebar()
      )}

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedBook ? (
          <PdfAnnotator book={selectedBook} models={models} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-muted)', padding: '24px' }}>
            <div style={{ textAlign: 'center', maxWidth: '380px' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.8 }}>✏️</div>
              <h2 style={{ fontSize: '20px', color: 'var(--color-navy)', fontWeight: 'bold', marginBottom: '8px' }}>Start Annotating</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                Select a textbook from the list on the left to start placing 3D model hotspots.
              </p>
              {isMobile ? (
                <p style={{ fontSize: '13px', color: 'var(--color-orange)', fontWeight: 'bold', marginTop: '16px' }}>
                  Tap the 📚 button below to open the textbook list.
                </p>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  Or upload new books and GLB/GLTF models using the management tabs.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sidebar Floating Button */}
      {isMobile && (
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="btn-accent"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 999,
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '22px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
          }}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? '✕' : '📚'}
        </button>
      )}

      {/* Thumbnail Capture Modal */}
      {pendingThumbnail && (
        <ModelThumbnailCapture
          modelUrl={pendingThumbnail.file_url}
          modelName={pendingThumbnail.name}
          onCapture={handleThumbnailCaptured}
          onCancel={() => setPendingThumbnail(null)}
        />
      )}

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

const inputStyle = {
  marginBottom: '8px',
};