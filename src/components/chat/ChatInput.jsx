import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Sparkles } from 'lucide-react';
import { ButtonSpinner } from '../common/LoadingState';

export default function ChatInput({ onSendMessage, isLoading, externalValue }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Sync external value if selected from suggested questions
  useEffect(() => {
    if (externalValue) {
      setInput(externalValue);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [externalValue]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-grow textarea up to max height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-slate-200/80 bg-white/95 backdrop-blur p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask a question about college regulations, syllabus, fees, courses..."
              className="w-full pl-4 pr-12 py-3.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800 placeholder-slate-400 transition-all resize-none max-h-32 disabled:opacity-60 disabled:cursor-not-allowed shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[48px] px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
            title="Send Question"
            aria-label="Send Question"
          >
            {isLoading ? (
              <ButtonSpinner className="text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        <p className="mt-2 text-[11px] text-center text-slate-400">
          College RAG queries official documents. Each response is generated independently with citations.
        </p>
      </div>
    </div>
  );
}
