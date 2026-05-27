import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import type { Toast as ToastData, ToastType } from '../contexts/ToastContext';
import '../styles/Toast.css';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger exit animation shortly before auto-removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration - 400);

    return () => clearTimeout(exitTimer);
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`toast-item toast-${toast.type}${isExiting ? ' toast-exit' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={handleDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
