import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Statistics & metrics',
    },
    {
      to: '/admin/documents',
      label: 'Document Library',
      icon: Files,
      description: 'Manage & monitor files',
    },
    {
      to: '/admin/upload',
      label: 'Upload Document',
      icon: UploadCloud,
      description: 'Add PDF, DOCX, TXT',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3">
            Admin Management
          </span>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="block leading-tight">{item.label}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3">
            Public Interface
          </span>
          <div className="mt-3">
            <NavLink
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Student Chatbot</span>
            </NavLink>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Admin Portal Secured</span>
        </div>
      </div>
    </aside>
  );
}
