import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`inline-block rounded-full border-current border-t-transparent animate-spin ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      role="status"
      aria-label="loading"
    />
  );
}

export function ButtonSpinner({ className = 'mr-2' }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 text-current ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

export function TableSkeleton({ rows = 5, cols = 7 }) {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-slate-100">
          <div className="col-span-4 h-4 bg-slate-200 rounded"></div>
          <div className="col-span-1 h-4 bg-slate-200 rounded"></div>
          <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
          <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
          <div className="col-span-1 h-4 bg-slate-200 rounded"></div>
          <div className="col-span-2 h-4 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-7 w-16 bg-slate-300 rounded"></div>
          <div className="h-3 w-32 bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}
