import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function AlertBanner({
  type = 'error',
  message,
  onClose,
  className = '',
}) {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
  };

  const current = styles[type] || styles.error;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all ${current.bg} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {current.icon}
        <span className="leading-snug break-words">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 -mr-1 rounded-md hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
