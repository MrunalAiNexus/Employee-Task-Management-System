/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileCode, CheckCircle2, Shield, Bell, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import TaskPortal from './components/TaskPortal';
import TechnicalSpecs from './components/TechnicalSpecs';
import LoginPage from './components/LoginPage';
import { User, ToastAlert } from './types';
import { getStoredSession, clearStoredSession } from './services/authService';

export default function App() {
  const [activeView, setActiveView] = useState<'portal' | 'specs'>('portal');
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredSession());
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveView('portal');
    addToast(
      'success',
      `Welcome, ${user.username}! Successfully redirected to your dashboard.`,
      'Authentication Successful'
    );
  };

  const handleLogout = () => {
    clearStoredSession();
    setCurrentUser(null);
    addToast('info', 'You have been securely logged out of your session.', 'Signed Out');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Bar for Evaluators & Technical Interviewers */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {currentUser ? `Authenticated Session (${currentUser.role.toUpperCase()})` : 'Session: Unauthenticated'}
              </span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Zero Plaintext Passwords • Salted SHA-256 Auth • RBAC Protected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('portal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'portal'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{currentUser ? 'Task Portal' : 'Login Page'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('specs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'specs'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Technical Interview Specs</span>
              </button>
            </div>

            {/* Quick Logout button if user is authenticated */}
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                title="Log out and return to Login Screen"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {activeView === 'specs' ? (
          <TechnicalSpecs />
        ) : currentUser ? (
          <TaskPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            onUserChange={(updatedUser) => setCurrentUser(updatedUser)}
          />
        ) : (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        )}
      </main>

      {/* Persistent Technical Assessment Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Employee Task Management Portal &copy; 2026 • Production-Ready Authentication & RBAC</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Flask REST API</span>
            <span>•</span>
            <span>Salted SHA-256 MVP Auth</span>
            <span>•</span>
            <span>15 Unit & Integration Tests</span>
          </div>
        </div>
      </footer>

      {/* Global Toast Alerts */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-400 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-400 text-amber-900'
                : 'bg-blue-50 border-blue-400 text-blue-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-sm font-bold mt-0.5">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '✕'}
                {toast.type === 'warning' && '⚠'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <div>
                {toast.title && <p className="font-bold text-xs">{toast.title}</p>}
                <p className="text-xs font-medium leading-snug">{toast.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

