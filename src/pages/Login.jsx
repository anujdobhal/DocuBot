import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateLoginInput } from '../utils/validators';
import { ButtonSpinner } from '../components/common/LoadingState';
import AlertBanner from '../components/common/AlertBanner';

export default function Login() {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState(null);
  const [apiError, setApiError] = useState(null);

  const { login, isLoading, sessionExpiredMessage, clearSessionExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setApiError(null);
    clearSessionExpiredNotice();

    // Client-side validation
    const validation = validateLoginInput(emailOrUser, password);
    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }

    try {
      await login(emailOrUser, password);
      // Redirect to target or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(
        err.message || 'Login failed. Please check your credentials and try again.'
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 via-brand-50/20 to-slate-100">
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 text-white items-center justify-center shadow-lg shadow-brand-500/25 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Portal Access
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Sign in to manage college documents, chunking, and RAG knowledge base.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-7 sm:p-8">
          {/* Session Expired Notice if redirected */}
          {sessionExpiredMessage && (
            <div className="mb-5">
              <AlertBanner
                type="warning"
                message={sessionExpiredMessage}
                onClose={clearSessionExpiredNotice}
              />
            </div>
          )}

          {/* Client Form Validation Error */}
          {formError && (
            <div className="mb-5">
              <AlertBanner
                type="error"
                message={formError}
                onClose={() => setFormError(null)}
              />
            </div>
          )}

          {/* API / Auth Failure Banner */}
          {apiError && (
            <div className="mb-5">
              <AlertBanner
                type="error"
                message={apiError}
                onClose={() => setApiError(null)}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  disabled={isLoading}
                  placeholder="admin@college.edu or admin"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 placeholder-slate-400 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 placeholder-slate-400 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <ButtonSpinner />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Note & Link to Public Chatbot */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              ← Return to Student Chatbot
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Administrative access only. All actions are logged and authenticated.
          </p>
        </div>
      </div>
    </div>
  );
}
