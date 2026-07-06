import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Add toast to list
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }]);

    // Trigger exit animation before removing
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, 3700);

    // Remove toast from DOM
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  const value = { success, error, warning, info };

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return { bg: 'var(--color-success)', icon: '✓' };
      case 'error':
        return { bg: 'var(--color-error)', icon: '✕' };
      case 'warning':
        return { bg: 'var(--color-warning)', icon: '⚠' };
      case 'info':
      default:
        return { bg: 'var(--color-info)', icon: 'ℹ' };
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast container in bottom right */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '350px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => {
          const config = getToastConfig(toast.type);
          return (
            <div
              key={toast.id}
              className={toast.isExiting ? 'animate-toast-out' : 'animate-toast-in'}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-white)',
                borderLeft: `5px solid ${config.bg}`,
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: '600',
                minWidth: '280px',
                borderTop: '1px solid var(--color-border-light)',
                borderRight: '1px solid var(--color-border-light)',
                borderBottom: '1px solid var(--color-border-light)'
              }}
            >
              {/* Icon */}
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: config.bg,
                color: 'var(--color-white)',
                fontSize: '11px',
                flexShrink: 0
              }}>
                {config.icon}
              </span>
              
              {/* Message */}
              <span style={{ flex: 1, wordBreak: 'break-word', fontFamily: 'var(--font-sans)' }}>
                {toast.message}
              </span>
              
              {/* Close Button */}
              <button 
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  borderRadius: '0'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
