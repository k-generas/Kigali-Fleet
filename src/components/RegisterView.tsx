import React, { useState } from 'react';
import {
  Car,
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Lock,
  Layers,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { ThemeAppearanceMenu } from './ThemeAppearanceMenu';
import { useI18n } from '../utils/i18n';
import { LocaleCurrencySwitcher } from './LocaleCurrencySwitcher';

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToLanding: () => void;
  currentTheme: ColorTheme;
  accentColorId?: string;
  onSelectAccentColor?: (themeId: string) => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  onRegisterCompany: (params: {
    companyName: string;
    businessType: 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport';
    tinNumber: string;
    city: string;
    ownerName: string;
    phone: string;
    email: string;
    password?: string;
    tierId: 'starter' | 'growth' | 'enterprise';
  }) => Promise<{ success: boolean; error?: string }> | void;
  onLoginWithGoogle?: () => Promise<any>;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateToLanding,
  currentTheme,
  accentColorId = 'amber',
  onSelectAccentColor,
  themeMode = 'dark',
  onToggleThemeMode,
  onRegisterCompany,
  onLoginWithGoogle,
}) => {
  const { formatMoney, tr } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState<
    'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport'
  >('Car Rental');
  const [tinNumber, setTinNumber] = useState('');
  const [city, setCity] = useState('Kigali');

  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('+250 788 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (step === 2 && password.trim().length < 6) {
      setErrorMessage(tr('Password must be at least 6 characters.'));
      return;
    }

    if (step < 3) {
      setStep((step + 1) as 2 | 3);
      return;
    }

    setIsLoading(true);
    try {
      const result = await onRegisterCompany({
        companyName: companyName.trim(),
        businessType,
        tinNumber: tinNumber.trim(),
        city: city.trim() || 'Kigali',
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        tierId: selectedTier,
      });

      if (result && !result.success) {
        setErrorMessage(result.error || tr('Could not register company. Please try again.'));
        setIsLoading(false);
        return;
      }

      onRegisterSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || tr('Could not register company. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      <header className="sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center justify-between gap-4 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800">
        <button type="button" onClick={onNavigateToLanding} className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center accent-bg">
            <Car className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">
            Kigali<span className="accent-text">Fleet</span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            onClick={onNavigateToLogin}
            className="text-sm font-semibold accent-text hover:underline flex items-center gap-1"
          >
            <span>{tr('Sign in')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="sm:hidden flex items-center justify-center py-2 px-4 bg-slate-100/80 dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800">
        <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {tr('Create Company Account')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tr('Simple car rental, driver, and booking management')}
            </p>
          </div>

          <div className="grid grid-cols-3 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-lg text-center text-sm">
            <div
              className={`py-2 rounded-md transition-all ${
                step === 1
                  ? 'bg-white dark:bg-[#111827] font-semibold text-slate-900 dark:text-white shadow-xs'
                  : step > 1
                  ? 'font-semibold accent-text'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              1. Company
            </div>
            <div
              className={`py-2 rounded-md transition-all ${
                step === 2
                  ? 'bg-white dark:bg-[#111827] font-semibold text-slate-900 dark:text-white shadow-xs'
                  : step > 2
                  ? 'font-semibold accent-text'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              2. Owner
            </div>
            <div
              className={`py-2 rounded-md transition-all ${
                step === 3
                  ? 'bg-white dark:bg-[#111827] font-semibold text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              3. Plan
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-sm space-y-2.5">
              <p>{errorMessage}</p>
              {onLoginWithGoogle && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMessage(null);
                    try {
                      await onLoginWithGoogle();
                      onRegisterSuccess();
                    } catch (err: any) {
                      setErrorMessage(err?.message || tr('Google sign in did not finish. Please try again.'));
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span>{tr('Continue with Google instead')}</span>
                </button>
              )}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-5"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Building2 className="w-4 h-4 accent-text" />
                  <span>About your company</span>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Volcanoes Expeditions Ltd"
                    className={`${inputClass} px-3`}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      What do you do?
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) =>
                        setBusinessType(
                          e.target.value as 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport'
                        )
                      }
                      className={`${inputClass} px-3`}
                    >
                      <option value="Car Rental">Car Rental</option>
                      <option value="Tour Operator">Safari &amp; Tours</option>
                      <option value="Airport Shuttle">Airport Transfers</option>
                      <option value="Corporate Transport">Company Transport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tax Number (TIN)
                    </label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      placeholder="109845920"
                      className={`${inputClass} px-3 font-mono`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`${inputClass} pl-9 pr-3`}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <User className="w-4 h-4 accent-text" />
                  <span>Owner details</span>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Your full name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={`${inputClass} px-3`}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`${inputClass} pl-9 pr-3 font-mono`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputClass} pl-9 pr-3`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pl-9 pr-3`}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Layers className="w-4 h-4 accent-text" />
                  <span>Choose a monthly plan</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('starter')}
                    className={`w-full text-left p-4 rounded-xl flex items-center justify-between gap-4 border transition-colors ${
                      selectedTier === 'starter'
                        ? 'accent-tint accent-border'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        Small Fleet (Up to 5 cars)
                      </div>
                      <div className="text-[13px] text-slate-500 dark:text-slate-400">
                        Booking calendar and driver SMS
                      </div>
                    </div>
                    <div className="text-right font-mono font-semibold text-sm text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatMoney(35000)}/mo
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('growth')}
                    className={`w-full text-left p-4 rounded-xl flex items-center justify-between gap-4 border transition-colors ${
                      selectedTier === 'growth'
                        ? 'accent-tint accent-border'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        Growing Fleet (Up to 20 cars) · Most Popular
                      </div>
                      <div className="text-[13px] text-slate-500 dark:text-slate-400">
                        Calendar, SMS, Online Booking Website &amp; Flight Alerts
                      </div>
                    </div>
                    <div className="text-right font-mono font-semibold text-sm text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatMoney(75000)}/mo
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('enterprise')}
                    className={`w-full text-left p-4 rounded-xl flex items-center justify-between gap-4 border transition-colors ${
                      selectedTier === 'enterprise'
                        ? 'accent-tint accent-border'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        Large Fleet (Unlimited cars)
                      </div>
                      <div className="text-[13px] text-slate-500 dark:text-slate-400">
                        Multiple offices and full tax reports
                      </div>
                    </div>
                    <div className="text-right font-mono font-semibold text-sm text-slate-900 dark:text-white tabular-nums shrink-0">
                      {formatMoney(150000)}/mo
                    </div>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Try free for 14 days. No bank card needed today.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                <span>{isLoading ? tr('Creating...') : step === 3 ? tr('Start Now') : tr('Next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827]">
        © 2026 KigaliFleet · Kigali, Rwanda
      </footer>
    </div>
  );
};
