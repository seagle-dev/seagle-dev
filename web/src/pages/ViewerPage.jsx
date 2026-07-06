import React, { useEffect, useState } from 'react';
import { fetchAdminBooks, setToken, autoLogin } from '../services/api';
import BookViewer from '../component/BookViewer';

export default function ViewerPage() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Auto-login to get token
        const res = await autoLogin();
        const token = res?.token;
        if (token) {
          localStorage.setItem('token', token);
          setToken(token);
        }

        // Fetch books
        const data = await fetchAdminBooks();
        setBooks(data || []);
        if (data && data.length > 0) {
          setSelectedBook(data[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize viewer:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '15px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
          <div>Loading books...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-error)', fontFamily: 'var(--font-sans)', padding: '24px' }}>
        <div style={{ textAlign: 'center', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error Loading Viewer</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!selectedBook) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
          <div>No books available to view.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Book Selector Header */}
      {books.length > 1 && (
        <div style={{ 
          padding: '12px 24px', 
          background: 'var(--color-bg-white)', 
          borderBottom: '1px solid var(--color-border)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10
        }}>
          <label style={{ color: 'var(--color-navy)', fontWeight: 'bold', fontSize: '14px' }}>Active Book:</label>
          <select
            value={selectedBook.id}
            onChange={(e) => {
              const book = books.find((b) => b.id === Number(e.target.value));
              setSelectedBook(book);
            }}
            style={{ 
              width: 'auto', 
              minWidth: '240px', 
              padding: '6px 12px', 
              fontSize: '13.5px', 
              fontWeight: '600',
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-orange-bg)',
              color: 'var(--color-navy)',
              cursor: 'pointer'
            }}
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Book Viewer Container */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <BookViewer book={selectedBook} />
      </div>
    </div>
  );
}