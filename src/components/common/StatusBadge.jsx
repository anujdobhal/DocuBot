import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  if (norm === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Completed</span>
      </span>
    );
  }

  if (norm === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
        <span>Processing</span>
      </span>
    );
  }

  if (norm === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Failed</span>
      </span>
    );
  }

  // Pending / default
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span>{status || 'Pending'}</span>
    </span>
  );
}
