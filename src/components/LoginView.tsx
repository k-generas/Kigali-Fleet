import React, { useState } from 'react';
import {
  Car,
  Lock,
  Mail,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { User, UserRole } from '../types';
import { isSuperAdminEmail, isSuperAdminUser } from '../utils/auth';
import { ThemeAppearanceMenu } from './ThemeAppearanceMenu';
import { useI18n } from '../utils/i18n';
import { LocaleCurrencySwitcher } from './LocaleCurrencySwitcher';

interface LoginViewProps {
  onLoginSuccess: (isSuperAdmin?: boolean) => void;
  onNavigateToRegister: () => void;
  onNavigateToLanding: () => void;
  onOpenForgotPassword: () => void;
  currentTheme: ColorTheme;
  accentColorId?: string;
  onSelectAccentColor?: (themeId: string) => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
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
  onLogFailedLogin?: (emailAttempt: string, details: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToLanding,
  onOpenForgotPassword,
  currentTheme,
  accentColorId = 'amber',
  onSelectAccentColor,
  themeMode = 'dark',
  onToggleThemeMode,
  users,
  onSelectUser,
  onLoginWithGoogle,
  onLoginWithCredentials,
  onCreateUserAccount,
  onLogFailedLogin,
}) => {
  const { tr } = useI18n();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('+250 788 ');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('dispatcher');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Strict privacy: never list super admin accounts in public sample user list
  const publicDemoUsers = users.filter((u) => u.role !== 'superadmin' && !isSuperAdminEmail(u.email));
  const [selectedDemoUser, setSelectedDemoUser] = useState<string>(publicDemoUsers[0]?.id || '');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (onLoginWithCredentials) {
        const result = await onLoginWithCredentials(email.trim(), password.trim());
        if (result.success && result.user) {
          onLoginSuccess(isSuperAdminUser(result.user));
          return;
        } else {
          onLogFailedLogin?.(email.trim(), result.error || 'Failed login attempt');
          setErrorMessage(result.error || 'Email or password is not correct.');
          setIsLoading(false);
          return;
        }
      }

      const normalizedEmail = email.trim().toLowerCase();
      const matchedUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (matchedUser) {
        onSelectUser(matchedUser.id);
        onLoginSuccess(isSuperAdminUser(matchedUser));
      } else {
        setErrorMessage('Account not found. Try a sample account below or create a new one.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not sign in. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Please enter your name, email, and password.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
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
          setSuccessMessage(`Welcome, ${result.user.name}. Your account is ready.`);
          setTimeout(() => {
            onLoginSuccess(isSuperAdminUser(result.user));
          }, 400);
          return;
        } else {
          setErrorMessage(result.error || 'Could not create account.');
          setIsLoading(false);
          return;
        }
      }
      onLoginSuccess(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not create account.');
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

  const getPlainRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'manager':
        return 'Manager';
      case 'dispatcher':
        return 'Booking Staff';
      case 'driver':
        return 'Driver';
      case 'accountant':
        return 'Accountant';
      case 'mechanic':
        return 'Mechanic';
      case 'receptionist':
        return 'Front Desk';
      default:
        return role;
    }
  };

  const inputClass =
    'w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800">
        <button type="button" onClick={onNavigateToLanding} className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center accent-bg">
            <Car className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">
            Kigali<span className="accent-text">Fleet</span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap justify-end">
          <div className="hidden sm:block">
            <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
          </div>

          {onSelectAccentColor && onToggleThemeMode && (
            <ThemeAppearanceMenu
              currentTheme={currentTheme}
              accentColorId={accentColorId}
              onSelectAccentColor={onSelectAccentColor}
              themeMode={themeMode}
              onToggleThemeMode={onToggleThemeMode}
            />
          )}

          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-sm font-semibold accent-text hover:underline flex items-center gap-1"
          >
            <span>{tr('Register Company')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="sm:hidden flex items-center justify-center py-2 px-4 bg-slate-100/80 dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800">
        <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
      </div>

      {/* Main Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {tr(authMode === 'signin' ? 'Sign in to Live Account' : 'Create Live Account')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr(
                authMode === 'signin'
                  ? 'Sign in with Google or email to manage your real company garage.'
                  : 'Create your own isolated company workspace in seconds.'
              )}
            </p>
          </div>

          {/* Segmented Auth Mode Tabs */}
          <div className="grid grid-cols-2 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 text-sm rounded-md transition-all ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 text-sm rounded-md transition-all ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create account
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {authMode === 'signin' && (
            <form
              onSubmit={handleManualLogin}
              className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-4"
            >
              {onLoginWithGoogle && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMessage(null);
                    try {
                      const res = await onLoginWithGoogle();
                      onLoginSuccess(isSuperAdminEmail(res?.user?.email));
                    } catch (err: any) {
                      setErrorMessage(err?.message || 'Google sign in did not finish. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-[#111827] px-3 text-[13px] text-slate-400">or</span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.rw"
                    className={`${inputClass} pl-9 pr-3`}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={onOpenForgotPassword}
                    className="text-[13px] font-semibold accent-text hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pl-9 pr-9`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm accent-bg hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {authMode === 'signup' && (
            <form
              onSubmit={handleManualSignUp}
              className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-4"
            >
              {onLoginWithGoogle && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMessage(null);
                    try {
                      const res = await onLoginWithGoogle();
                      onLoginSuccess(isSuperAdminEmail(res?.user?.email));
                    } catch (err: any) {
                      setErrorMessage(err?.message || 'Google sign up did not finish. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </button>
              )}

              <div>
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">Full name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Jean-Luc Habimana"
                    className={`${inputClass} pl-9 pr-3`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`${inputClass} pl-9 pr-3`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">Phone number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+250 788 000 000"
                    className={`${inputClass} pl-9 pr-3 font-mono`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">Your job</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as UserRole)}
                  className={`${inputClass} px-3`}
                >
                  <option value="owner">Company Owner</option>
                  <option value="manager">Manager</option>
                  <option value="dispatcher">Booking Staff</option>
                  <option value="driver">Driver</option>
                  <option value="accountant">Accountant</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="receptionist">Front Desk</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 6 letters or numbers"
                    className={`${inputClass} pl-9 pr-3`}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm accent-bg hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create account'}
              </button>
            </form>
          )}

          {/* Free Demo Sandbox Explorer */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">{tr('Explore Free Demo Sandbox')}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                {tr('No Account Needed')}
              </span>
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              {tr('Try KigaliFleet with sample Kigali cars, drivers, and bookings before creating your real company.')}
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {publicDemoUsers.map((u) => {
                const isCurrent = selectedDemoUser === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickRoleSelect(u)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'accent-tint border accent-border'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{u.name}</div>
                      <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate">
                        {getPlainRoleLabel(u.role)} · {tr('Demo Sandbox')}
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 shrink-0 ${isCurrent ? 'accent-text' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827]">
        © 2026 KigaliFleet · Kigali, Rwanda
      </footer>
    </div>
  );
};
