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
  UserPlus,
  Phone,
  User as UserIcon,
  Briefcase,
  Radio,
  FileText,
  Wrench,
  KeyRound,
  Shield,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { User, UserRole } from '../types';
import { isSuperAdminEmail, isSuperAdminUser } from '../utils/auth';

interface LoginViewProps {
  onLoginSuccess: (isSuperAdmin?: boolean) => void;
  onNavigateToRegister: () => void;
  onNavigateToLanding: () => void;
  onOpenForgotPassword: () => void;
  currentTheme: ColorTheme;
  users: User[];
  onSelectUser: (userId: string) => void;
  onLoginWithGoogle?: () => Promise<any>;
  onLoginWithCredentials?: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  onCreateUserAccount?: (data: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    password?: string;
    companyId?: string;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
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
  onLoginWithCredentials,
  onCreateUserAccount,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [email, setEmail] = useState('owner@kigaliexecutive.rw');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('+250 788 ');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('dispatcher');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeColor = currentTheme.hex;
  const activeBtnText = currentTheme.btnText;

  // Strict Row-Level Security: Never display Super Admin in public demo roster
  const publicDemoUsers = users.filter((u) => u.role !== 'superadmin' && !isSuperAdminEmail(u.email));
  const [selectedDemoUser, setSelectedDemoUser] = useState<string>(publicDemoUsers[0]?.id || '');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      if (onLoginWithCredentials) {
        const result = await onLoginWithCredentials(email.trim(), password.trim());
        if (result.success && result.user) {
          const isSuper = isSuperAdminUser(result.user);
          onLoginSuccess(isSuper);
          return;
        } else {
          setErrorMessage(result.error || 'Invalid credentials.');
          setIsLoading(false);
          return;
        }
      }

      // Fallback in-memory matching
      const normalizedEmail = email.trim().toLowerCase();
      const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (matchedUser) {
        onSelectUser(matchedUser.id);
        const isSuper = isSuperAdminUser(matchedUser);
        onLoginSuccess(isSuper);
      } else {
        setErrorMessage('User not found. Use one of the pre-configured demo staff roles below or create a new account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Please provide full name, email, and a secure password.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (onCreateUserAccount) {
        const result = await onCreateUserAccount({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          role: signupRole,
          password: signupPassword,
        });

        if (result.success && result.user) {
          const isSuper = isSuperAdminUser(result.user);
          setSuccessMessage(`Account created successfully for ${result.user.name}.`);
          setTimeout(() => {
            onLoginSuccess(isSuper);
          }, 400);
          return;
        } else {
          setErrorMessage(result.error || 'Failed to create account.');
          setIsLoading(false);
          return;
        }
      }

      // Fallback local registration
      onLoginSuccess(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Account registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRoleSelect = (user: User) => {
    setSelectedDemoUser(user.id);
    setEmail(user.email);
    onSelectUser(user.id);
    onLoginSuccess(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return { label: 'Company Owner', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' };
      case 'manager':
        return { label: 'Operations Manager', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60' };
      case 'dispatcher':
        return { label: 'Booking / Dispatcher', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60' };
      case 'driver':
        return { label: 'VIP Chauffeur', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60' };
      case 'accountant':
        return { label: 'Finance Accountant', color: 'text-purple-400 bg-purple-950/40 border-purple-800/60' };
      case 'mechanic':
        return { label: 'Workshop Mechanic', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60' };
      case 'receptionist':
        return { label: 'Front Desk Officer', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60' };
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
          <span>Register New Transport Company</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {authMode === 'signin' ? 'Sign in to Workspace' : 'Create User Account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {authMode === 'signin'
                ? 'Role-based access control for fleet dispatch, drivers & managers.'
                : 'Choose your system role: Owner, Manager, Dispatcher, Chauffeur or Client.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'signin'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs animate-in fade-in flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {authMode === 'signin' && (
            <form
              onSubmit={handleManualLogin}
              className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              {onLoginWithGoogle && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await onLoginWithGoogle();
                      const isSuper = isSuperAdminEmail(res?.user?.email);
                      onLoginSuccess(isSuper);
                    } catch (e: any) {
                      setErrorMessage('Google authentication could not be completed.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business or Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.rw or admin email"
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
                  <span>Remember this device</span>
                </label>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Row-Level Security
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>
            </form>
          )}

          {/* MODE 2: CREATE ACCOUNT FOR ANY USER TYPE */}
          {authMode === 'signup' && (
            <form
              onSubmit={handleManualSignUp}
              className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              {onLoginWithGoogle && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const res = await onLoginWithGoogle();
                      const isSuper = isSuperAdminEmail(res?.user?.email);
                      onLoginSuccess(isSuper);
                    } catch (e: any) {
                      setErrorMessage('Google registration could not be completed.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-2.5 hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign up with Google Account</span>
                </button>
              )}

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase font-mono">or manual details</span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Jean-Luc Habimana"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telephone / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">System Role & Access Tier</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="owner">Transport Company Owner (Director)</option>
                  <option value="manager">Operations Manager (Fleet Oversight)</option>
                  <option value="dispatcher">Booking Agent & Dispatcher</option>
                  <option value="driver">VIP Chauffeur & Field Driver</option>
                  <option value="accountant">Financial Accountant</option>
                  <option value="mechanic">Workshop & Garage Mechanic</option>
                  <option value="receptionist">Front Desk Receptionist</option>
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Row-level access rules will restrict data to your assigned role.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Set Account Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account & Enter Platform'}
              </button>
            </form>
          )}

          {/* Quick Staff Demo Selector (Strict RLS: Only company staff, NO super admin announced) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Operational Staff Demo Profiles:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">One-click test</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {publicDemoUsers.map((u) => {
                const badge = getRoleBadge(u.role);
                const isCurrent = selectedDemoUser === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickRoleSelect(u)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-slate-800 border-amber-500/60 shadow-xs'
                        : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white font-mono">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">{u.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
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
        © 2026 KigaliFleet. All rights reserved. Enterprise Row-Level Security & Multi-Tenant Dispatch.
      </footer>
    </div>
  );
};
