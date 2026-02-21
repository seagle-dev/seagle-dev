import React, { useEffect, useState, useRef } from 'react';
import {
  fetchAdminBooks, fetchModels, setToken, autoLogin,
  uploadBook, deleteBook, uploadModel, deleteModel, uploadModelThumbnail,
} from '../services/api';
import PdfAnnotator from '../component/PdfAnnotator';
import ModelThumbnailCapture from '../component/ModelThumbnailCapture';

setToken(localStorage.getItem('token') || '');

export default function AdminPage() {
  const [books, setBooks] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab, setActiveTab] = useState('annotate');

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
      alert('Please select a PDF file');
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
      alert('✅ Book uploaded successfully! Cover was auto-generated from page 1.');
    } catch (err) {
      console.error('Book upload error:', err);
      alert('Failed to upload book: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingBook(false);
    }
  }

  async function handleDeleteBook(id) {
    if (!confirm('Delete this book and all its annotations?')) return;
    try {
      await deleteBook(id);
      if (selectedBook?.id === id) setSelectedBook(null);
      await refreshData();
    } catch (err) {
      alert('Failed to delete book');
    }
  }

  // ===== Model Upload =====
  async function handleModelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['glb', 'gltf'].includes(ext)) {
      alert('Please select a .glb or .gltf file');
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
      // Show thumbnail capture dialog
      setPendingThumbnail({ modelId: result.id, file_url: result.file_url, name: result.name });
    } catch (err) {
      console.error('Model upload error:', err);
      alert('Failed to upload model: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingModel(false);
    }
  }

  async function handleThumbnailCaptured(blob) {
    if (!pendingThumbnail) { setPendingThumbnail(null); return; }
    if (blob) {
      try {
        await uploadModelThumbnail(pendingThumbnail.modelId, blob);
        await refreshData();
      } catch (err) {
        console.error('Thumbnail upload error:', err);
      }
    }
    setPendingThumbnail(null);
  }

  async function handleDeleteModel(id) {
    if (!confirm('Delete this 3D model?')) return;
    try {
      await deleteModel(id);
      await refreshData();
    } catch (err) {
      alert('Failed to delete model');
    }
  }

  const tabStyle = (key) => ({
    flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s',
    background: activeTab === key ? '#fff' : '#f5f5f5',
    color: activeTab === key ? '#333' : '#888',
    borderBottom: activeTab === key ? '2px solid #3498db' : '2px solid transparent',
  });

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <aside style={{ width: 340, background: '#fff', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <button onClick={() => setActiveTab('annotate')} style={tabStyle('annotate')}>✏️ Annotate</button>
          <button onClick={() => setActiveTab('books')} style={tabStyle('books')}>📚 Books</button>
          <button onClick={() => setActiveTab('models')} style={tabStyle('models')}>🧊 Models</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {/* ===== ANNOTATE TAB ===== */}
          {activeTab === 'annotate' && (
            <>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#2c3e50' }}>Select Book to Annotate</h3>
              {books.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  No books yet. Upload one in the Books tab.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {books.map(b => (
                    <div key={b.id} onClick={() => setSelectedBook(b)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                        background: selectedBook?.id === b.id ? '#e3f2fd' : '#fafafa',
                        border: selectedBook?.id === b.id ? '1px solid #90caf9' : '1px solid #eee',
                        transition: 'all 0.15s',
                      }}>
                      {b.cover_image ? (
                        <img src={b.cover_image} alt="" style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: '3px', flexShrink: 0, background: '#eee' }} />
                      ) : (
                        <div style={{ width: 40, height: 52, background: '#e0e0e0', borderRadius: '3px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📄</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                        {b.category && <div style={{ fontSize: '10px', color: '#999' }}>{b.category}</div>}
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
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#2c3e50' }}>📚 Manage Books</h3>

              {/* Upload Form */}
              <div style={{ background: '#f0f8ff', border: '1px solid #b3d9ff', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1565c0' }}>Upload New Book</h4>
                <p style={{ fontSize: '10px', color: '#888', margin: '0 0 8px' }}>
                  📄 PDF → Firebase Storage &nbsp;|&nbsp; 🖼️ Cover auto-generated from page 1
                </p>
                <input type="text" placeholder="Book title" value={bookForm.title}
                  onChange={(e) => setBookForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle} />
                <input type="text" placeholder="Description (optional)" value={bookForm.description}
                  onChange={(e) => setBookForm(f => ({ ...f, description: e.target.value }))}
                  style={inputStyle} />
                <input type="text" placeholder="Category (optional)" value={bookForm.category}
                  onChange={(e) => setBookForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, marginBottom: '10px' }} />
                <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handleBookUpload} disabled={uploadingBook} style={{ display: 'none' }} />
                <button onClick={() => pdfInputRef.current?.click()} disabled={uploadingBook}
                  style={{ ...uploadBtnStyle, background: uploadingBook ? '#ccc' : '#1976d2', cursor: uploadingBook ? 'not-allowed' : 'pointer' }}>
                  {uploadingBook ? '⏳ Uploading & generating cover...' : '📁 Select PDF & Upload'}
                </button>
              </div>

              {/* Book List */}
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#555' }}>Uploaded Books ({books.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {books.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '6px' }}>
                    {b.cover_image ? (
                      <img src={b.cover_image} alt="" style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: '4px', flexShrink: 0, background: '#f0f0f0' }} />
                    ) : (
                      <div style={{ width: 44, height: 58, background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📄</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                      {b.description && <div style={{ fontSize: '10px', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description}</div>}
                      {b.category && <div style={{ fontSize: '10px', color: '#999' }}>📁 {b.category}</div>}
                      <div style={{ fontSize: '9px', color: '#bbb' }}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</div>
                    </div>
                    <button onClick={() => handleDeleteBook(b.id)}
                      style={{ padding: '4px 8px', background: '#ef5350', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                      🗑
                    </button>
                  </div>
                ))}
                {books.length === 0 && <p style={{ color: '#999', textAlign: 'center', fontStyle: 'italic' }}>No books uploaded yet</p>}
              </div>
            </>
          )}

          {/* ===== MODELS TAB ===== */}
          {activeTab === 'models' && (
            <>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#2c3e50' }}>🧊 Manage 3D Models</h3>

              {/* Upload Form */}
              <div style={{ background: '#f0fff0', border: '1px solid #b3e6b3', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#2e7d32' }}>Upload New Model</h4>
                <p style={{ fontSize: '10px', color: '#888', margin: '0 0 8px' }}>
                  🧊 GLB/GLTF → Firebase Storage &nbsp;|&nbsp; 📸 Thumbnail captured from 3D preview
                </p>
                <input type="text" placeholder="Model name" value={modelForm.name}
                  onChange={(e) => setModelForm(f => ({ ...f, name: e.target.value }))}
                  style={inputStyle} />
                <input type="text" placeholder="Category (optional)" value={modelForm.category}
                  onChange={(e) => setModelForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, marginBottom: '10px' }} />
                <input ref={modelInputRef} type="file" accept=".glb,.gltf" onChange={handleModelUpload} disabled={uploadingModel} style={{ display: 'none' }} />
                <button onClick={() => modelInputRef.current?.click()} disabled={uploadingModel}
                  style={{ ...uploadBtnStyle, background: uploadingModel ? '#ccc' : '#388e3c', cursor: uploadingModel ? 'not-allowed' : 'pointer' }}>
                  {uploadingModel ? '⏳ Uploading model...' : '📁 Select GLB/GLTF & Upload'}
                </button>
              </div>

              {/* Model List */}
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#555' }}>Uploaded Models ({models.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {models.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '6px' }}>
                    {m.thumbnail ? (
                      <img src={m.thumbnail} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '4px', flexShrink: 0, background: '#f0f0f0' }} />
                    ) : (
                      <div style={{ width: 50, height: 50, background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🧊</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      {m.category && <div style={{ fontSize: '10px', color: '#999' }}>📁 {m.category}</div>}
                      {!m.thumbnail && (
                        <button onClick={() => setPendingThumbnail({ modelId: m.id, file_url: m.file_url, name: m.name })}
                          style={{ fontSize: '10px', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', marginTop: '2px' }}>
                          📸 Generate thumbnail
                        </button>
                      )}
                    </div>
                    <button onClick={() => handleDeleteModel(m.id)}
                      style={{ padding: '4px 8px', background: '#ef5350', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>
                      🗑
                    </button>
                  </div>
                ))}
                {models.length === 0 && <p style={{ color: '#999', textAlign: 'center', fontStyle: 'italic' }}>No models uploaded yet</p>}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {selectedBook ? (
          <PdfAnnotator book={selectedBook} models={models} />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>✏️</div>
              <p style={{ fontSize: '16px' }}>Select a book from the Annotate tab to start</p>
              <p style={{ fontSize: '12px', color: '#bbb', marginTop: '8px' }}>
                Or upload books and models using the tabs on the left
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Thumbnail Capture Modal */}
      {pendingThumbnail && (
        <ModelThumbnailCapture
          modelUrl={pendingThumbnail.file_url}
          modelName={pendingThumbnail.name}
          onCapture={handleThumbnailCaptured}
          onCancel={() => setPendingThumbnail(null)}
        />
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: '4px',
  border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box',
  marginBottom: '6px',
};

const uploadBtnStyle = {
  width: '100%', padding: '10px', border: 'none', borderRadius: '6px',
  color: '#fff', fontWeight: 'bold', fontSize: '13px',
};