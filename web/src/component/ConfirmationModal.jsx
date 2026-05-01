import React from 'react';

/**
 * ConfirmationModal
 * A clean, modern confirmation modal to replace browser alerts/confirms.
 * 
 * Props:
 *   isOpen: boolean
 *   title: string
 *   message: string
 *   onConfirm: () => void
 *   onCancel: () => void
 *   confirmText: string (default: 'Delete')
 *   cancelText: string (default: 'Cancel')
 *   isDanger: boolean (default: true)
 */
export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)',
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90%',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'modalAppear 0.2s ease-out',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a1a1a',
        }}>
          {title}
        </h3>
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: '#4b5563',
          lineHeight: '1.5',
        }}>
          {message}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isDanger ? '#ef4444' : '#3b82f6',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
