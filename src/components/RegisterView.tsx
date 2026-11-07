import React, { useState } from 'react';
import {
  Car,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Lock,
  Layers,
  Sparkles,
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

  // Form State
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">Already registered?</span>
          <button
            onClick={onNavigateToLogin}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Register Your Transport Company
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Set up your fleet in Kigali with collision-free scheduling and automated SMS dispatch.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <div
              className={`p-2 rounded-lg border transition-all ${
                step >= 1 ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-slate-800 text-slate-600'
              }`}
            >
              1. Business Details
            </div>
            <div
              className={`p-2 rounded-lg border transition-all ${
                step >= 2 ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-slate-800 text-slate-600'
              }`}
            >
              2. Owner Account
            </div>
            <div
              className={`p-2 rounded-lg border transition-all ${
                step === 3 ? 'border-amber-400 bg-amber-500/10 text-amber-300' : 'border-slate-800 text-slate-600'
              }`}
            >
              3. Fleet Plan
            </div>
          </div>

          {/* Stepper Card */}
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5"
          >
            {/* Step 1: Company Profile */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>Company Profile & Licensing</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Akagera Car Rentals & Tours Ltd"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Category</label>
                    <select
                      value={businessType}
                      onChange={(e) =>
                        setBusinessType(
                          e.target.value as 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport'
                        )
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    >
                      <option value="Car Rental">Car Rental Agency (Self-Drive & Chauffeur)</option>
                      <option value="Tour Operator">Safari & Tour Operator</option>
                      <option value="Airport Shuttle">Airport Transfer & Executive VIP</option>
                      <option value="Corporate Transport">Corporate & NGO Transport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rwanda Tax ID (TIN / RRA)</label>
                    <input
                      type="text"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      placeholder="9-digit TIN Number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Base Station / City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kigali (Remera) / Musanze"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Administrator Profile */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>Company Owner / Executive Administrator</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Owner Full Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Jean-Damascene Karemera"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rwanda Telephone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+250 78..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@company.rw"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Create Secure Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Subscription Tier Selection */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Select Subscription Package (RWF / Month)</span>
                </div>

                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedTier('starter')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTier === 'starter'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Starter Plan (Up to 5 Cars)</div>
                      <div className="text-[11px] text-slate-400">Collision engine, standard driver directory</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400 font-mono">35,000 RWF</div>
                      <div className="text-[10px] text-slate-500">monthly</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedTier('growth')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTier === 'growth'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Growth Plan (Up to 20 Cars)</span>
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">
                          Recommended
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        7-Day timeline, Africa&apos;s Talking SMS, KIA flight tracker
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400 font-mono">75,000 RWF</div>
                      <div className="text-[10px] text-slate-500">monthly</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedTier('enterprise')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTier === 'enterprise'
                        ? 'border-amber-400 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Enterprise Plan (Unlimited Fleet)</div>
                      <div className="text-[11px] text-slate-400">Multi-branch, RRA EBM tax invoicing, dedicated SLA</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400 font-mono">150,000 RWF</div>
                      <div className="text-[10px] text-slate-500">monthly</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>14-day free trial included. No credit card required to start onboarding.</span>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 1 | 2)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all hover:brightness-110 active:scale-95 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <span>{step === 3 ? 'Launch Company Workspace' : 'Continue to Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        © 2026 KigaliFleet. All rights reserved. Multi-tenant Fleet Management & Dispatch for Rwanda.
      </footer>
    </div>
  );
};
