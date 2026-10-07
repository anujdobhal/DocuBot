import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  User,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatHumanDate, formatDuration } from '../../utils/date';
import { formatBytes, normalizeFileType } from '../../utils/formatters';
import { api } from '../../services/api';

export default function DocumentDetailsModal({ document, isOpen, onClose }) {
  const [chunks, setChunks] = useState([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [showChunks, setShowChunks] = useState(false);

  useEffect(() => {
    if (isOpen && document?.id) {
      setIsLoadingChunks(true);
      api
        .getDocumentChunks(document.id)
        .then((res) => {
          setChunks(res?.chunks || []);
        })
        .catch(() => {
          setChunks([]);
        })
        .finally(() => {
          setIsLoadingChunks(false);
        });
    } else {
      setChunks([]);
      setShowChunks(false);
    }
  }, [isOpen, document?.id]);

  if (!isOpen || !document) return null;

  // Calculate duration if start and end exist
  let processingDuration = null;
  if (document.processingStartTime && document.processingEndTime) {
    const start = new Date(document.processingStartTime).getTime();
    const end = new Date(document.processingEndTime).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      processingDuration = formatDuration(end - start);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-details-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 id="doc-details-title" className="text-lg font-bold text-slate-900 truncate">
                {document.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ID: {document.id || document._id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 my-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                File Type & Size
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {normalizeFileType(document.type || document.name?.split('.').pop())} •{' '}
                {formatBytes(document.fileSize || document.size)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Processing Status
              </span>
              <div>
                <StatusBadge status={document.status} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Upload Date
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {formatHumanDate(document.uploadedAt || document.createdAt)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Uploaded By
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {document.uploadedBy || 'Administrator'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Vector Chunks Created
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {document.chunkCount != null ? (
                  <span className="text-brand-700 font-bold">{document.chunkCount} chunks</span>
                ) : (
                  <span className="text-slate-400">Not generated yet</span>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Processing Duration
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {processingDuration || '—'}
              </p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Processing Started:</span>
              <span className="text-slate-800 font-medium">
                {formatHumanDate(document.processingStartTime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Processing Completed:</span>
              <span className="text-slate-800 font-medium">
                {formatHumanDate(document.processingEndTime)}
              </span>
            </div>
          </div>

          {/* Failure reason if any */}
          {document.errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-rose-800 block">
                    Processing Failure Reason:
                  </span>
                  <p className="mt-1 text-xs text-rose-700 font-mono break-words bg-rose-100/50 p-2 rounded-lg">
                    {document.errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stored Chunks Inspector */}
          {chunks.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowChunks(!showChunks)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left text-xs font-semibold text-slate-800"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-600" />
                  View Indexed Vector Chunks ({chunks.length})
                </span>
                {showChunks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showChunks && (
                <div className="p-3 space-y-2.5 max-h-60 overflow-y-auto bg-slate-50/50">
                  {chunks.map((c, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span className="text-brand-700 font-bold">Chunk #{c.chunk_index + 1}</span>
                        <span>{c.text.length} chars</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
