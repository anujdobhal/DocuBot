import React from 'react';
import { Bot, User, AlertCircle } from 'lucide-react';
import ChatSources from './ChatSources';
import { formatHumanDate } from '../../utils/date';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const isError = message.isError;

  return (
    <div
      className={`flex items-start gap-3 my-4 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isUser
            ? 'bg-slate-900 text-white'
            : isError
            ? 'bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-brand-600 text-white shadow-brand-500/20'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-rose-600" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 sm:px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
              : isError
              ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
              : 'bg-white text-slate-800 border border-slate-200/90 shadow-sm rounded-tl-none'
          }`}
        >
          {/* Main message text */}
          <div className="whitespace-pre-wrap break-words">
            {message.text}
          </div>

          {/* Sources if present (Assistant only) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <ChatSources sources={message.sources} />
          )}
        </div>

        {/* Timestamp and Model Badge */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] text-slate-400 font-medium">
            {formatHumanDate(message.timestamp)}
          </span>
          {!isUser && !isError && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {message.model || 'llama3.2:1b'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
