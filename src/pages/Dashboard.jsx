import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Files,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';
import DocumentStatsCards from '../components/document/DocumentStatsCards';
import DocumentDetailsModal from '../components/document/DocumentDetailsModal';
import StatusBadge from '../components/common/StatusBadge';
import AlertBanner from '../components/common/AlertBanner';
import { api } from '../services/api';
import { formatHumanDate } from '../utils/date';
import { normalizeFileType } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, processing: 0, failed: 0 });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected document for details modal
  const [selectedDoc, setSelectedDoc] = useState(null);

  const navigate = useNavigate();

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch stats and documents concurrently
      const [statsData, docsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getDocuments({ limit: 5 }).catch(() => null),
      ]);

      const docs = docsData?.documents || (Array.isArray(docsData) ? docsData : []);
      setRecentDocuments(docs.slice(0, 5));

      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback calculation from docs list
        setStats({
          total: docs.length,
          completed: docs.filter((d) => (d.status || '').toLowerCase() === 'completed').length,
          processing: docs.filter((d) => (d.status || '').toLowerCase() === 'processing').length,
          failed: docs.filter((d) => (d.status || '').toLowerCase() === 'failed').length,
        });
      }
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              RAG Pipeline Ready
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
            Document Ingestion Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor vectorized documents, chunking progress, and system metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
            title="Refresh Dashboard"
            aria-label="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload New Document
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <AlertBanner
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Statistics Metric Cards */}
      <DocumentStatsCards stats={stats} isLoading={isLoading} />

      {/* Recently Uploaded Documents Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recently Uploaded Documents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest files processed for academic vector retrieval
            </p>
          </div>

          <Link
            to="/admin/documents"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all documents
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List / Empty State */}
        {recentDocuments.length === 0 && !isLoading ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mx-auto mb-3 shadow-sm">
              <Files className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No documents uploaded yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start by uploading your first syllabus, handbook, or fee schedule to build the college chatbot's knowledge base.
            </p>
            <Link
              to="/admin/upload"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload First Document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Document</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocuments.map((doc) => {
                  const docId = doc.id || doc._id;
                  return (
                    <tr key={docId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-medium text-slate-900 truncate max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {normalizeFileType(doc.type || doc.name?.split('.').pop())}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatHumanDate(doc.uploadedAt || doc.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                        {(doc.status || '').toLowerCase() === 'completed' && doc.chunkCount != null ? (
                          <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {doc.chunkCount} chunks
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <DocumentDetailsModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}
