import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  File,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { validateUploadFile, MAX_FILE_SIZE_MB } from '../../utils/validators';
import { formatBytes } from '../../utils/formatters';
import { ButtonSpinner } from '../common/LoadingState';

export default function DocumentUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    // Reset previous feedback states
    setValidationError(null);
    setUploadSuccess(null);
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Run client-side validation
    const validation = validateUploadFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidationError(null);
    setUploadSuccess(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const response = await api.uploadDocument(selectedFile);
      setUploadSuccess(
        response?.message || `Successfully uploaded "${selectedFile.name}". It is queued for ingestion.`
      );
      // Reset selected file on success
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) {
        onUploadSuccess(response?.document);
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please check the backend connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Upload Document for RAG Ingestion
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select or drag academic regulations, course syllabi, fee circulars, or policies.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-brand-500 bg-brand-50/60 scale-[1.01]'
              : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or drag and drop document here
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supported formats: <strong className="text-slate-700">PDF, DOCX, TXT</strong> (Max {MAX_FILE_SIZE_MB}MB)
            </p>
          </div>
        </div>

        {/* Client Validation Error */}
        {validationError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Selected File Card */}
        {selectedFile && !validationError && (
          <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {formatBytes(selectedFile.size)} • {selectedFile.name.split('.').pop()?.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              disabled={isUploading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Progress / Loading Bar */}
        {isUploading && (
          <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100 text-brand-900">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
                Sending file to backend server...
              </span>
              <span>Processing</span>
            </div>
            <div className="w-full bg-brand-200/60 rounded-full h-2 overflow-hidden">
              <div className="bg-brand-600 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-[11px] text-brand-700/80 mt-2">
              The backend will extract text, generate chunks, and index vectors asynchronously.
            </p>
          </div>
        )}

        {/* Success Banner */}
        {uploadSuccess && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-emerald-800">{uploadSuccess}</p>
              <p className="mt-0.5 text-emerald-700">
                You can view its real-time processing status in the Document Management table.
              </p>
            </div>
            <button
              onClick={() => setUploadSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {uploadError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-rose-800">{uploadError}</p>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-rose-700 hover:text-rose-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Actions Button Row */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          {selectedFile && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isUploading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Clear / Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isUploading ? (
              <>
                <ButtonSpinner />
                Uploading Document...
              </>
            ) : (
              <>
                Upload to System
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
