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

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToLanding: () => void;
  currentTheme: ColorTheme;
  onRegisterCompany: (params: {
    companyName: string;
    businessType: 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport';
    tinNumber: string;
    city: string;
    ownerName: string;
    phone: string;
    email: string;
    tierId: 'starter' | 'growth' | 'enterprise';
  }) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateToLanding,
  currentTheme,
  onRegisterCompany,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [companyName, setCompanyName] = useState('Volcanoes Expeditions Ltd');
  const [businessType, setBusinessType] = useState<
    'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport'
  >('Tour Operator');
  const [tinNumber, setTinNumber] = useState('109845920');
  const [city, setCity] = useState('Musanze / Kigali');

  const [ownerName, setOwnerName] = useState('Claire Mukamana');
  const [phone, setPhone] = useState('+250 788 555 777');
  const [email, setEmail] = useState('claire@volcanoesexpeditions.rw');
  const [password, setPassword] = useState('SecurePass2026!');

  const [selectedTier, setSelectedTier] = useState<'starter' | 'growth' | 'enterprise'>('growth');

  const activeColor = currentTheme.hex;
  const activeBtnText = currentTheme.btnText;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep((step + 1) as 2 | 3);
      return;
    }

    onRegisterCompany({
      companyName,
      businessType,
      tinNumber,
      city,
      ownerName,
      phone,
      email,
      tierId: selectedTier,
    });

    onRegisterSuccess();
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] dark:bg-[#0a0f1c] text-[#0a2540] dark:text-slate-100 flex flex-col justify-between transition-colors">
      <header className="px-5 sm:px-8 py-4 flex items-center justify-between bg-white dark:bg-[#0d1424] border-b border-slate-200 dark:border-slate-800">
        <button onClick={onNavigateToLanding} className="flex items-center gap-2.5 text-left">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${activeBtnText}`}
            style={{ backgroundColor: activeColor }}
          >
            <Car className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl text-[#0a2540] dark:text-white tracking-tight">
            Kigali<span style={{ color: activeColor }}>Fleet</span>
          </span>
        </button>

        <button
          onClick={onNavigateToLogin}
          className="text-sm sm:text-[15px] font-bold flex items-center gap-1.5"
          style={{ color: activeColor }}
        >
          <span>Sign in</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-[#0a2540] dark:text-white">
              Add your car rental company
            </h1>
            <p className="text-base text-[#425466] dark:text-slate-300">
              Takes 1 minute. Start managing your cars and drivers right away.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-sm font-bold">
            <div
              className={`p-3 rounded-xl border ${
                step >= 1
                  ? 'bg-white dark:bg-slate-900 border-amber-500 text-[#0a2540] dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              1. Company
            </div>
            <div
              className={`p-3 rounded-xl border ${
                step >= 2
                  ? 'bg-white dark:bg-slate-900 border-amber-500 text-[#0a2540] dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              2. Owner
            </div>
            <div
              className={`p-3 rounded-xl border ${
                step === 3
                  ? 'bg-white dark:bg-slate-900 border-amber-500 text-[#0a2540] dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              3. Plan
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 stripe-card space-y-5"
          >
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-base font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5" style={{ color: activeColor }} />
                  <span>About your company</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">Company name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">What do you do?</label>
                    <select
                      value={businessType}
                      onChange={(e) =>
                        setBusinessType(
                          e.target.value as 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport'
                        )
                      }
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none"
                    >
                      <option value="Car Rental">Car Rental</option>
                      <option value="Tour Operator">Safari &amp; Tours</option>
                      <option value="Airport Shuttle">Airport Transfers</option>
                      <option value="Corporate Transport">Company Transport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">Tax Number (TIN)</label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-base font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: activeColor }} />
                  <span>Owner details</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">Your full name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">Phone number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-[15px] text-[#0a2540] dark:text-white outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-base font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5" style={{ color: activeColor }} />
                  <span>Choose a monthly plan</span>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('starter')}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedTier === 'starter'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-base font-bold text-[#0a2540] dark:text-white">Small Fleet (Up to 5 cars)</div>
                      <div className="text-sm text-[#425466] dark:text-slate-400">Booking calendar and driver SMS</div>
                    </div>
                    <div className="text-right font-mono font-bold text-base text-[#0a2540] dark:text-white">
                      35,000 RWF/mo
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('growth')}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedTier === 'growth'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-base font-bold text-[#0a2540] dark:text-white">
                        Growing Fleet (Up to 20 cars) · Most Popular
                      </div>
                      <div className="text-sm text-[#425466] dark:text-slate-400">
                        Calendar, SMS, Online Booking Website &amp; Flight Alerts
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-base text-[#0a2540] dark:text-white">
                      75,000 RWF/mo
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('enterprise')}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedTier === 'enterprise'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-base font-bold text-[#0a2540] dark:text-white">Large Fleet (Unlimited cars)</div>
                      <div className="text-sm text-[#425466] dark:text-slate-400">Multiple offices and full tax reports</div>
                    </div>
                    <div className="text-right font-mono font-bold text-base text-[#0a2540] dark:text-white">
                      150,000 RWF/mo
                    </div>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-[#425466] dark:text-slate-300 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Try free for 14 days. No bank card needed today.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2)}
                  className="px-4 py-2.5 rounded-full text-sm font-bold text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold shadow-sm transition-all hover:brightness-105 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <span>{step === 3 ? 'Start Now' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="p-5 text-center text-sm text-[#425466] dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        © 2026 KigaliFleet · Kigali, Rwanda
      </footer>
    </div>
  );
};
