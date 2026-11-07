import React, { useState } from 'react';
import {
  Car,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Check,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { User, UserRole } from '../types';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToLanding: () => void;
  onOpenForgotPassword: () => void;
  currentTheme: ColorTheme;
  users: User[];
  onSelectUser: (userId: string) => void;
  onLoginWithGoogle?: () => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToLanding,
  onOpenForgotPassword,
  currentTheme,
  users,
  onSelectUser,
  onLoginWithGoogle,
}) => {
  const [email, setEmail] = useState('owner@kigaliexecutive.rw');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<string>(users[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeColor = currentTheme.hex;
  const activeBtnText = currentTheme.btnText;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    const matchedUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (matchedUser) {
      onSelectUser(matchedUser.id);
      onLoginSuccess();
    } else {
      // In demo mode, log in as current selected demo user with custom email
      if (selectedDemoUser) {
        onSelectUser(selectedDemoUser);
        onLoginSuccess();
      } else {
        setErrorMessage('User not found. Use one of the pre-configured demo roles below.');
      }
    }
  };

  const handleQuickRoleSelect = (user: User) => {
    setSelectedDemoUser(user.id);
    setEmail(user.email);
    onSelectUser(user.id);
    onLoginSuccess();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return { label: 'Company Owner', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' };
      case 'manager':
        return { label: 'Operations Manager', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60' };
      case 'dispatcher':
        return { label: 'Booking Agent / Dispatcher', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60' };
      case 'driver':
        return { label: 'Chauffeur / Driver', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' };
      case 'superadmin':
        return { label: 'SaaS Super Admin', color: 'text-purple-400 bg-purple-950/40 border-purple-800/60' };
      default:
        return { label: role, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/80">
        <button
          onClick={onNavigateToLanding}
          className="flex items-center gap-2.5 text-left group transition-transform"
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold shadow-md ${activeBtnText}`}
            style={{ backgroundColor: activeColor }}
          >
            <Car className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white font-mono tracking-tight">
              Kigali<span style={{ color: activeColor }}>Fleet</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1">← Return to Homepage</span>
          </div>
        </button>

        <button
          onClick={onNavigateToRegister}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
        >
          <span>Register New Company</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign in to your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Access fleet schedules, Africa&apos;s Talking SMS dispatch, and booking controls.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Standard Login Form */}
          <form
            onSubmit={handleManualLogin}
            className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
          >
            {onLoginWithGoogle && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onLoginWithGoogle();
                    onLoginSuccess();
                  } catch (e) {
                    setErrorMessage('Google authentication could not be completed.');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google Account</span>
              </button>
            )}

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase font-mono">or email credentials</span>
              <div className="border-t border-slate-800 w-full" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.rw"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-amber-500" />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Rwanda SSL Encrypted
              </span>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all hover:brightness-110 active:scale-95 ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              Sign In to Workspace
            </button>
          </form>

          {/* Quick Demo Impersonation Selector (Crucial for Part 2 Testing) */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Demo Sign-In (Click any role to test):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">No password required</span>
            </div>

            <div className="space-y-2">
              {users.map((u) => {
                const badge = getRoleBadge(u.role);
                const isCurrent = selectedDemoUser === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickRoleSelect(u)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-slate-800 border-amber-500/60 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white font-mono">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        © 2026 KigaliFleet. All rights reserved. Multi-tenant Fleet Management & Dispatch for Rwanda.
      </footer>
    </div>
  );
};
