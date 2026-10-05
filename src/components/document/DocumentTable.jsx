import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import DocumentDetailsModal from './DocumentDetailsModal';
import { formatHumanDate } from '../../utils/date';
import { normalizeFileType } from '../../utils/formatters';
import { ButtonSpinner, Spinner } from '../common/LoadingState';

export default function DocumentTable({
  documents = [],
  isLoading = false,
  onDelete,
  onReprocess,
  onRefreshItem,
  onOpenUpload,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected document for Details Modal
  const [selectedDocForDetails, setSelectedDocForDetails] = useState(null);

  // Document marked for deletion
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Per-document action loading tracking
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionType, setActionType] = useState(null); // 'reprocess' | 'refresh'

  // Filter documents by search query (name or uploadedBy)
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase().trim();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(q) ||
        (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(q))
    );
  }, [documents, searchQuery]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  // Adjust current page if filter shrinks results
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!docToDelete || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(docToDelete.id || docToDelete._id);
      setDocToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Reprocess Action
  const handleReprocess = async (doc) => {
    if (!onReprocess) return;
    setActionLoadingId(doc.id || doc._id);
    setActionType('reprocess');
    try {
      await onReprocess(doc.id || doc._id);
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  // Handle Refresh Status Action
  const handleRefreshStatus = async (doc) => {
    if (!onRefreshItem) return;
    setActionLoadingId(doc.id || doc._id);
    setActionType('refresh');
    try {
      await onRefreshItem(doc.id || doc._id);
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Toolbar / Search Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 placeholder-slate-400 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-700">{filteredDocuments.length}</strong> of{' '}
            <strong className="text-slate-700">{documents.length}</strong> documents
          </span>
          {onOpenUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload New
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Spinner size="lg" className="text-brand-500" />
            <p className="text-sm font-medium text-slate-600">Loading document catalog...</p>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State: No Documents Uploaded Yet */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4 shadow-sm">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No documents uploaded yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              Upload course syllabi, campus guidelines, or academic rules to power the RAG knowledge base.
            </p>
            {onOpenUpload && (
              <button
                type="button"
                onClick={onOpenUpload}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload Your First Document
              </button>
            )}
          </div>
        ) : filteredDocuments.length === 0 ? (
          /* Empty State: Search Query Matched Nothing */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No documents found</h3>
            <p className="mt-1 text-xs text-slate-500">
              No documents matched your search query "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Document Name</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4">Processing Status</th>
                <th className="py-3.5 px-4">Chunks</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDocuments.map((doc) => {
                const docId = doc.id || doc._id;
                const isItemActionLoading = actionLoadingId === docId;

                return (
                  <tr
                    key={docId}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Document Name */}
                    <td className="py-4 px-4 sm:px-6 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5 max-w-xs sm:max-w-sm truncate">
                        <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="truncate" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                    </td>

                    {/* File Type */}
                    <td className="py-4 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {normalizeFileType(doc.type || doc.name?.split('.').pop())}
                      </span>
                    </td>

                    {/* Upload Date */}
                    <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatHumanDate(doc.uploadedAt || doc.createdAt)}
                    </td>

                    {/* Processing Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>

                    {/* Number of Chunks */}
                    <td className="py-4 px-4 text-xs font-semibold whitespace-nowrap">
                      {(doc.status || '').toLowerCase() === 'completed' && doc.chunkCount != null ? (
                        <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {doc.chunkCount} chunks
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Uploaded By */}
                    <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap truncate max-w-[140px]">
                      {doc.uploadedBy || 'Admin'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedDocForDetails(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Reprocess */}
                        <button
                          type="button"
                          onClick={() => handleReprocess(doc)}
                          disabled={isItemActionLoading}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                          title="Reprocess Document"
                          aria-label="Reprocess Document"
                        >
                          <RotateCcw
                            className={`w-4 h-4 ${
                              isItemActionLoading && actionType === 'reprocess'
                                ? 'animate-spin text-amber-600'
                                : ''
                            }`}
                          />
                        </button>

                        {/* Refresh Status */}
                        <button
                          type="button"
                          onClick={() => handleRefreshStatus(doc)}
                          disabled={isItemActionLoading}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                          title="Refresh Status"
                          aria-label="Refresh Status"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              isItemActionLoading && actionType === 'refresh'
                                ? 'animate-spin text-indigo-600'
                                : ''
                            }`}
                          />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDocToDelete(doc)}
                          disabled={isItemActionLoading}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                          title="Delete Document"
                          aria-label="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !isLoading && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Page <strong className="font-semibold text-slate-800">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg font-semibold transition-colors ${
                    currentPage === p
                      ? 'bg-brand-600 text-white'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <DocumentDetailsModal
        document={selectedDocForDetails}
        isOpen={Boolean(selectedDocForDetails)}
        onClose={() => setSelectedDocForDetails(null)}
      />

      {/* Explicit Confirmation Dialog Before Deletion */}
      <ConfirmDialog
        isOpen={Boolean(docToDelete)}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.name}"? This cannot be undone.`}
        confirmText="Yes, Delete Document"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
}
