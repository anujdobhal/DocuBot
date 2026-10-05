import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import ChatEmptyState from '../components/chat/ChatEmptyState';
import AlertBanner from '../components/common/AlertBanner';
import { Spinner } from '../components/common/LoadingState';
import { api } from '../services/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (questionText) => {
    if (!questionText || !questionText.trim() || isLoading) return;

    setApiError(null);
    setSelectedPrompt('');

    const userMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: questionText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Visually stack question immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Per instructions: each question is submitted independently to the backend
      const response = await api.askQuestion(questionText.trim());

      const botMessage = {
        id: 'msg-' + Date.now() + '-bot',
        sender: 'assistant',
        text: response.answer || response.response || response.message || 'No answer returned.',
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage =
        err.message || 'Unable to connect to the chatbot service. Please try again.';
      setApiError(errorMessage);

      // Render error message bubble in the stream
      const errorMsgObj = {
        id: 'msg-' + Date.now() + '-err',
        sender: 'assistant',
        text: `Error: ${errorMessage}`,
        isError: true,
        sources: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsgObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = () => {
    setMessages([]);
    setApiError(null);
    setSelectedPrompt('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto bg-white sm:rounded-2xl sm:my-4 sm:border sm:border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Chat Interface Header */}
      <div className="p-4 sm:px-6 border-b border-slate-200/90 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              College Knowledge Assistant
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Verified answers grounded in official college documents
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearSession}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            title="Reset current conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Error Banner if API error occurs */}
      {apiError && (
        <div className="px-4 py-2 border-b border-rose-100 bg-rose-50">
          <AlertBanner
            type="error"
            message={apiError}
            onClose={() => setApiError(null)}
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 flex flex-col"
      >
        {messages.length === 0 ? (
          <ChatEmptyState
            onSelectPrompt={(prompt) => {
              setSelectedPrompt(prompt);
            }}
          />
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Assistant Typing / Retrieval Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 my-4 animate-in fade-in duration-200">
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="px-5 py-3.5 rounded-2xl rounded-tl-none bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
                  <Spinner size="sm" className="text-brand-600" />
                  <span className="text-xs font-semibold text-slate-600">
                    Retrieving document chunks & synthesizing answer...
                  </span>
                </div>
              </div>
            )}

            {/* Invisible anchor for natural auto-scroll */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Input Field Form */}
      <div className="shrink-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          externalValue={selectedPrompt}
        />
      </div>
    </div>
  );
}
