import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText, Bookmark } from 'lucide-react';

export default function ChatSources({ sources = [] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
          <span>Cited Sources ({sources.length})</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 space-y-2">
          {sources.map((src, index) => {
            const title = src.title || src.docName || src.name || `Source ${index + 1}`;
            const page = src.page || src.pageNumber;
            const snippet = src.snippet || src.text || src.content;

            return (
              <div
                key={index}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
              >
                <div className="flex items-center justify-between gap-2 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="truncate font-semibold text-slate-800" title={title}>
                      {title}
                    </span>
                  </div>
                  {page != null && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-200/70 text-[10px] font-semibold text-slate-700">
                      Page {page}
                    </span>
                  )}
                </div>

                {snippet && (
                  <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                    "{snippet}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
