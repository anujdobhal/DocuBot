import React from 'react';
import { Sparkles, HelpCircle, BookOpen, GraduationCap } from 'lucide-react';

export default function ChatEmptyState({ onSelectPrompt }) {
  const examplePrompts = [
    'What is the minimum attendance criteria for semester examinations?',
    'What is the hostel fee structure and payment deadline for Fall 2026?',
    'What are the core subjects in Computer Science Semester 5?',
    'What is the procedure for obtaining a medical leave exemption?',
  ];

  return (
    <div className="flex flex-col items-center justify-center my-auto py-12 px-4 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 mb-5">
        <GraduationCap className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Local AI Engine: llama3.2:1b
      </div>

      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        Ask me anything about our college.
      </h2>

      <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md">
        Powered directly by your local <span className="font-semibold text-slate-700">llama3.2:1b</span> model and grounded in official Graphic Era Hill University documents. Private, fast, and completely dynamic.
      </p>

      {/* Suggested Questions */}
      <div className="mt-8 w-full">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Suggested Questions
        </p>

        <div className="grid grid-cols-1 gap-2.5 text-left">
          {examplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt && onSelectPrompt(prompt)}
              className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/40 text-xs font-medium text-slate-700 hover:text-brand-900 text-left transition-all shadow-sm flex items-center justify-between group"
            >
              <span className="truncate pr-2">{prompt}</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
