import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Files, RefreshCw, UploadCloud } from 'lucide-react';
import DocumentTable from '../components/document/DocumentTable';
import AlertBanner from '../components/common/AlertBanner';
import { api } from '../services/api';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const navigate = useNavigate();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDocuments();
      const list = data?.documents || (Array.isArray(data) ? data : []);
      setDocuments(list);
    } catch (err) {
      setError(err.message || 'Unable to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await api.deleteDocument(id);
      setSuccessBanner('Document deleted successfully.');
      setDocuments((prev) => prev.filter((d) => (d.id || d._id) !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete document. Please try again.');
    }
  };

  // Handle Reprocess
  const handleReprocess = async (id) => {
    try {
      const res = await api.reprocessDocument(id);
      setSuccessBanner('Reprocess requested. Status updated to Processing.');
      // Update local state to Processing
      setDocuments((prev) =>
        prev.map((d) => {
          if ((d.id || d._id) === id) {
            return {
              ...d,
              status: 'Processing',
              errorMessage: null,
              processingStartTime: new Date().toISOString(),
              processingEndTime: null,
            };
          }
          return d;
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to request document reprocessing.');
    }
  };

  // Handle Refresh Status for a specific item
  const handleRefreshItem = async (id) => {
    try {
      const res = await api.refreshDocumentStatus(id);
      const updated = res.document || res;
      if (updated) {
        setDocuments((prev) =>
          prev.map((d) => ((d.id || d._id) === id ? { ...d, ...updated } : d))
        );
      }
      setSuccessBanner('Document status updated.');
    } catch (err) {
      setError(err.message || 'Unable to refresh document status.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Document Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View, search, monitor processing status, reprocess, and delete college knowledge files.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDocuments}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
            title="Refresh All"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/upload')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <AlertBanner
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {successBanner && (
        <AlertBanner
          type="success"
          message={successBanner}
          onClose={() => setSuccessBanner(null)}
        />
      )}

      {/* Document Table */}
      <DocumentTable
        documents={documents}
        isLoading={isLoading}
        onDelete={handleDelete}
        onReprocess={handleReprocess}
        onRefreshItem={handleRefreshItem}
        onOpenUpload={() => navigate('/admin/upload')}
      />
    </div>
  );
}
