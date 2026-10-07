import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Cpu,
  CheckCircle2,
  XCircle,
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
  const [llmStatus, setLlmStatus] = useState({
    checking: true,
    online: false,
    modelName: 'llama3.2:1b',
  });

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Check Ollama status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkModelHealth() {
      try {
        const status = await api.checkChatbotStatus();
        if (isMounted) {
          setLlmStatus({
            checking: false,
            online: status.online,
            modelName: status.modelName || 'llama3.2:1b',
            models: status.models || [],
          });
        }
      } catch {
        if (isMounted) {
          setLlmStatus({
            checking: false,
            online: false,
            modelName: 'llama3.2:1b',
          });
        }
      }
    }

    checkModelHealth();
    const interval = setInterval(checkModelHealth, 20000); // periodically refresh health

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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

    const currentQuestion = questionText.trim();
    const userMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: currentQuestion,
      timestamp: new Date().toISOString(),
    };

    const botMessageId = 'msg-' + (Date.now() + 1) + '-bot';
    const initialBotMessage = {
      id: botMessageId,
      sender: 'assistant',
      text: '',
      sources: [],
      model: llmStatus.modelName || 'llama3.2:1b',
      timestamp: new Date().toISOString(),
    };

    // Append user message and prepared streaming assistant placeholder
    setMessages((prev) => [...prev, userMessage, initialBotMessage]);
    setIsLoading(true);

    try {
      // Pass previous conversational messages so llama3.2:1b maintains conversation context
      const conversationHistory = [...messages, userMessage];

      const response = await api.askQuestion(
        currentQuestion,
        conversationHistory,
        (tokenChunk, accumulatedText) => {
          // Live token streaming update
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, text: accumulatedText }
                : msg
            )
          );
        }
      );

      // Finalize bot message with response and grounding sources
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: response.answer || msg.text || 'No response generated.',
                sources: response.sources || [],
                model: response.model || llmStatus.modelName || 'llama3.2:1b',
              }
            : msg
        )
      );
    } catch (err) {
      const errorMessage =
        err.message || 'Unable to connect to the local llama3.2:1b model.';
      setApiError(errorMessage);

      // Update bot message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: `Error connecting to local LLM: ${errorMessage}`,
                isError: true,
                sources: [],
              }
            : msg
        )
      );
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
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                DocuBot Assistant
              </h1>
              {/* Local LLM Engine Status Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                  llmStatus.checking
                    ? 'bg-slate-100 text-slate-600'
                    : llmStatus.online
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
                title={
                  llmStatus.online
                    ? `Local model ${llmStatus.modelName} active on Ollama`
                    : 'Ollama is offline or unreachable'
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    llmStatus.checking
                      ? 'bg-slate-400'
                      : llmStatus.online
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="font-mono">
                  {llmStatus.modelName}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {llmStatus.online ? '(Local)' : '(Offline)'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Live college intelligence powered by local llama3.2:1b and university documents
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

            {/* Assistant Retrieval & Thought Indicator */}
            {isLoading && messages[messages.length - 1]?.text === '' && (
              <div className="flex items-start gap-3 my-4 animate-in fade-in duration-200">
                <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="px-5 py-3.5 rounded-2xl rounded-tl-none bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
                  <Spinner size="sm" className="text-brand-600" />
                  <span className="text-xs font-semibold text-slate-600">
                    llama3.2:1b thinking & retrieving university context...
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
