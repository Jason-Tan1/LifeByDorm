import { useEffect } from 'react';

interface ToastProps {
  open: boolean;
  message: string;
  severity?: 'error' | 'success' | 'info' | 'warning';
  autoHideDuration?: number;
  onClose: () => void;
}

export default function Toast({ open, message, severity = 'error', autoHideDuration = 6000, onClose }: ToastProps) {
  useEffect(() => {
    if (open && autoHideDuration > 0) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  const colors: Record<string, { bg: string; border: string; text: string }> = {
    error:   { bg: '#fdeded', border: '#f5c6cb', text: '#5f2120' },
    success: { bg: '#edf7ed', border: '#c3e6c3', text: '#1e4620' },
    info:    { bg: '#e5f6fd', border: '#b8daff', text: '#014361' },
    warning: { bg: '#fff4e5', border: '#ffe0b2', text: '#663c00' },
  };

  const c = colors[severity] || colors.error;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: '300px',
        maxWidth: '500px',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'toast-slide-in 0.3s ease-out',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: c.text,
          fontSize: '18px',
          cursor: 'pointer',
          marginLeft: '12px',
          padding: '0 4px',
          lineHeight: 1,
        }}
        aria-label="Close"
      >
        ×
      </button>
      <style>{`@keyframes toast-slide-in { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
