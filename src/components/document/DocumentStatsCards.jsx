import React from 'react';
import { Files, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function DocumentStatsCards({ stats = {}, isLoading = false }) {
  const cards = [
    {
      title: 'Total Documents',
      value: stats.total ?? 0,
      icon: Files,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 border-brand-100',
      description: 'Indexed in system',
    },
    {
      title: 'Completed',
      value: stats.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
      description: 'Available for RAG retrieval',
    },
    {
      title: 'Processing',
      value: stats.processing ?? 0,
      icon: RefreshCw,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-100',
      description: 'Currently embedding/chunking',
    },
    {
      title: 'Failed',
      value: stats.failed ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-100',
      description: 'Requires reprocessing',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3"
          >
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-8 w-16 bg-slate-300 rounded"></div>
            <div className="h-3 w-32 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${card.bgColor}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {card.value}
              </span>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
