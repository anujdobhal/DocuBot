import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Files, ArrowLeft, CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import DocumentUpload from '../components/document/DocumentUpload';

export default function Upload() {
  const [lastUploadedDoc, setLastUploadedDoc] = useState(null);
  const navigate = useNavigate();

  const handleUploadSuccess = (doc) => {
    setLastUploadedDoc(doc);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Document Library
        </Link>

        {lastUploadedDoc && (
          <button
            type="button"
            onClick={() => navigate('/admin/documents')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors"
          >
            <Files className="w-3.5 h-3.5" />
            View in Document Library
          </button>
        )}
      </div>

      {/* Main Upload Box */}
      <DocumentUpload onUploadSuccess={handleUploadSuccess} />

      {/* Guidelines & Ingestion Flow Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-brand-600" />
          Ingestion & Pipeline Guidelines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="font-semibold text-slate-800 block">1. Supported Formats</span>
            <p className="leading-relaxed text-slate-500">
              Only standard <strong className="text-slate-700">.pdf</strong>,{' '}
              <strong className="text-slate-700">.docx</strong>, and{' '}
              <strong className="text-slate-700">.txt</strong> files up to 25MB are accepted.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="font-semibold text-slate-800 block">2. Text Extraction & Chunking</span>
            <p className="leading-relaxed text-slate-500">
              Once uploaded, the backend extracts the textual content and splits it into semantic chunks for vectorization.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="font-semibold text-slate-800 block">3. Ready for Chatbot</span>
            <p className="leading-relaxed text-slate-500">
              When status transitions to <strong className="text-emerald-700">Completed</strong>, the document is immediately queryable by students in the chatbot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
