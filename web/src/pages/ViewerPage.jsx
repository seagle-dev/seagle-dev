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
    return <div style={{ padding: '24px' }}>Loading books...</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: 'red' }}>Error: {error}</div>;
  }

  if (!selectedBook) {
    return <div style={{ padding: '24px' }}>No books available</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Book Selector */}
      {books.length > 1 && (
        <div style={{ padding: '12px 24px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
          <label style={{ marginRight: '12px', fontWeight: 'bold' }}>Select Book:</label>
          <select
            value={selectedBook.id}
            onChange={(e) => {
              const book = books.find((b) => b.id === Number(e.target.value));
              setSelectedBook(book);
            }}
            style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Book Viewer */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <BookViewer book={selectedBook} />
      </div>
    </div>
  );
}