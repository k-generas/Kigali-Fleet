import React, { useState } from 'react';
import {
  Car,
  ShieldCheck,
  Calendar,
  Radio,
  Globe,
  Layers,
  ArrowRight,
  Check,
  Zap,
  Phone,
  MapPin,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Building2,
  Plane,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  DollarSign,
  Palette,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import { Vehicle, Driver, Booking } from '../types';
import { formatRwf, checkBookingCollision, generateDriverSMS } from '../utils/collision';

interface LandingPageViewProps {
  onEnterApp: () => void;
  onOpenStorefront: () => void;
  onSelectTab: (tab: string) => void;
  currentTheme: ColorTheme;
  accentColorId: string;
  onSelectAccentColor: (themeId: string) => void;
  themeMode: 'dark' | 'light';
  onToggleThemeMode: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterApp,
  onOpenStorefront,
  onSelectTab,
  currentTheme,
  accentColorId,
  onSelectAccentColor,
  themeMode,
  onToggleThemeMode,
  vehicles,
  drivers,
  bookings,
}) => {
  const activeColor = currentTheme.hex;
  const activeBtnText = currentTheme.btnText;

  // State for interactive platform tabs
  const [activePlatformTab, setActivePlatformTab] = useState<'operator' | 'dispatch' | 'storefront'>('operator');

  // Interactive playground state
  const [demoVehicleCategory, setDemoVehicleCategory] = useState<string>('LandCruiser');
  const [demoStartDate, setDemoStartDate] = useState<string>('2026-11-05');
  const [demoEndDate, setDemoEndDate] = useState<string>('2026-11-08');
  const [demoCollisionChecked, setDemoCollisionChecked] = useState<boolean>(true);

  // SMS preview state
  const [smsLanguage, setSmsLanguage] = useState<'RW' | 'EN'>('RW');

  // Pricing calculator state
  const [calculatorCars, setCalculatorCars] = useState<number>(12);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Check collision for demo
  const sampleVehicle = vehicles.find((v) => v.category === demoVehicleCategory) || vehicles[0];
  const demoCollisionResult = sampleVehicle
    ? checkBookingCollision(sampleVehicle.id, demoStartDate, demoEndDate, bookings)
    : { hasCollision: false };

  // Calculate pricing based on slider
  const getCalculatedTier = (count: number) => {
    if (count <= 5) {
      return {
        name: 'Starter Plan',
        priceRwf: 35000,
        desc: 'Ideal for boutique rental desks and owner-operators with up to 5 cars.',
        features: ['Up to 5 vehicles', 'Collision-guarded calendar', 'Africa’s Talking SMS alerts', 'Standard email support'],
      };
    } else if (count <= 20) {
      return {
        name: 'Growth Plan',
        priceRwf: 75000,
        desc: 'Best for growing Kigali car rentals and tour agencies managing up to 20 cars.',
        features: [
          'Up to 20 vehicles',
          'Live 7-Day fleet scheduling grid',
          'Dual-language SMS dispatch (RW/EN)',
          'Public branded B2B storefront link',
          'Automated KIA flight delay tracking',
          'Priority phone & WhatsApp support',
        ],
      };
    } else {
      return {
        name: 'Enterprise Plan',
        priceRwf: 150000,
        desc: 'Built for large safari fleets, corporate transport providers, and multi-branch operators.',
        features: [
          'Unlimited vehicles & drivers',
          'Multi-depot & upcountry branch support',
          'Custom RRA EBM tax invoice exports',
          'Dedicated account manager in Kigali',
          'Custom telematics & GPS webhooks',
          '99.9% uptime SLA',
        ],
      };
    }
  };

  const calculatedTier = getCalculatedTier(calculatorCars);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'How does KigaliFleet prevent double bookings on the same car?',
      a: 'Unlike generic spreadsheets or shared calendars, KigaliFleet enforces a physical-inventory collision engine. Every vehicle (e.g., Toyota Land Cruiser Prado TXL with plate RAD 789 C) is tracked as a physical asset. If a booking already locks November 5–8, any new attempt to schedule the same vehicle or category within that window is flagged in red and blocked before confirmation.',
    },
    {
      q: 'Do drivers need smartphones or internet to receive dispatches?',
      a: 'No! KigaliFleet integrates natively with Africa’s Talking SMS gateways. Drivers receive concise, structured SMS instructions directly on basic feature phones or smartphones in both Kinyarwanda and English. They can acknowledge assignments and report arrival at Kigali International Airport using zero-data SMS reply codes (e.g., YES 101 or ARRIVED).',
    },
    {
      q: 'How do customers and corporate clients book online?',
      a: 'Every operator gets a dedicated public storefront link (e.g. kigalifleet.app/rent or custom slug). Tourists, NGOs, and corporate event planners can view live category availability, select dates, choose chauffeur or self-drive, and reserve immediately. The reservation immediately syncs to your operator dashboard.',
    },
    {
      q: 'Can we accept MTN Mobile Money and Airtel Money payments?',
      a: 'Yes. KigaliFleet is tailored specifically for the Rwandan financial ecosystem. Bookings support MTN MoMo (*182#), Airtel Money, Bank Transfers (Bank of Kigali, I&M Bank), and Credit Cards, with automated deposit and balance tracking in Rwandan Francs (RWF).',
    },
    {
      q: 'How does Kigali International Airport (KIA) flight delay tracking work?',
      a: 'When an airport pickup booking includes a flight number (such as RwandAir WB 402 or Kenya Airways KQ 448), KigaliFleet monitors schedule changes. If a flight is delayed, the system alerts the operations team and can automatically dispatch an updated SMS to the assigned chauffeur so they arrive right on time without waiting in the terminal parking lot.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Global Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/85 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-lg transition-transform hover:scale-105 ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                  Kigali<span style={{ color: activeColor }}>Fleet</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  SaaS Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                Fleet Management & Dispatch for Rwanda
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#platforms" className="hover:text-white transition-colors">
              Connected Platforms
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Core Capabilities
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing (RWF)
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Theme & Accent Switcher */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              {COLOR_THEMES.slice(0, 4).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onSelectAccentColor(theme.id)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    accentColorId === theme.id ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: theme.hex }}
                  title={theme.name}
                />
              ))}
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                onClick={onToggleThemeMode}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title={`Toggle theme mode`}
              >
                {themeMode === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Direct Storefront Link */}
            <button
              onClick={onOpenStorefront}
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Storefront</span>
            </button>

            {/* Sign in button */}
            <button
              onClick={() => onSelectTab('login')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 transition-colors"
            >
              Sign In
            </button>

            {/* Launch Operator Workspace */}
            <button
              onClick={onEnterApp}
              className={`inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-all hover:brightness-110 active:scale-95 ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden border-b border-slate-800/80">
        {/* Subtle background glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: activeColor }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 mb-6 shadow-inner">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeColor }} />
              <span className="font-mono uppercase tracking-wider text-[11px]">
                Built for Rwandan Car Rentals & Safari Operators
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Manage Your Fleet.{' '}
              <span className="block mt-1 sm:mt-2" style={{ color: activeColor }}>
                Control Your Bookings.
              </span>{' '}
              Never Lose Track.
            </h1>

            {/* Supporting paragraph */}
            <p className="mt-6 text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
              The centralized operating system for Kigali car rental companies, tour agencies, and airport transfer
              chauffeurs. Stop double-bookings with physical collision guards, dispatch drivers instantly via Africa’s
              Talking SMS, and share branded live booking storefronts.
            </p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onEnterApp}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-base shadow-xl transition-all hover:brightness-110 active:scale-95 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <Laptop className="w-5 h-5" />
                <span>Open Operator Workspace</span>
              </button>

              <button
                onClick={() => onSelectTab('register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-base text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors shadow-sm"
              >
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>Register Company</span>
              </button>

              <button
                onClick={onOpenStorefront}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Guest Storefront</span>
              </button>
            </div>

            {/* Unboxed Metadata badges (Clean Typography as per Constitution) */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Zero Double-Bookings Guard</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Africa’s Talking SMS in Kinyarwanda</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>MTN Mobile Money Ready</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Kigali Airport (KIA) Flight Delay Sync</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Teaser Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-6 overflow-hidden">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-[11px] text-slate-500">
                  kigalifleet.app/dispatch-console (Live Kigali Fleet Instance)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Fleet Connected: {vehicles.length} Vehicles · {drivers.length} Chauffeurs
                </span>
                <button
                  onClick={onEnterApp}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <span>Enter</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Teaser Grid Preview */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Snapshot 1: Real Fleet Asset */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono text-amber-400 font-semibold">Toyota Land Cruiser</span>
                  <span className="text-[11px] font-mono">RAD 789 C</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">Volcanoes NP Safari Trip</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Nov 05 – Nov 08 (4 Days)</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Chauffeur: Jean-Paul M.</span>
                  <span className="text-emerald-400 font-mono font-bold">720,000 RWF</span>
                </div>
              </div>

              {/* Snapshot 2: Airport Transfer with Flight Status */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono text-cyan-400 font-semibold">Toyota RAV4 AWD</span>
                  <span className="text-[11px] font-mono">RAC 452 B</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">KIA Airport Pickup → Kiyovu</div>
                <div className="text-xs text-amber-400 flex items-center gap-1.5 mb-3">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Flight WB 402 (Delayed +35m)</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Chauffeur: Emmanuel K.</span>
                  <span className="text-emerald-400 font-mono font-bold">45,000 RWF</span>
                </div>
              </div>

              {/* Snapshot 3: Physical Collision Guard Shield */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Active Collision Guard</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug mt-1">
                    Physical inventory is locked across dates. Double-bookings are impossible at the database layer.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Dispatch Status</span>
                  <span className="text-amber-400 font-medium">Africa’s Talking Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Three Connected Platforms Section (As requested: "adding landingpage as add platiforms") */}
      <section id="platforms" className="py-20 lg:py-28 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-900 border border-slate-800"
              style={{ color: activeColor }}
            >
              Unified Architecture
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Three Connected Platforms in One Software Business
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              KigaliFleet bridges the gap between the agency back-office, on-the-ground drivers in Kigali, and international
              tourists booking online.
            </p>
          </div>

          {/* Platform Tab Switcher */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl max-w-3xl mx-auto mb-10">
            <button
              onClick={() => setActivePlatformTab('operator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activePlatformTab === 'operator'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>1. Operator Command Center</span>
            </button>
            <button
              onClick={() => setActivePlatformTab('dispatch')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activePlatformTab === 'dispatch'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4 text-amber-500" />
              <span>2. Driver Dispatch & SMS Hub</span>
            </button>
            <button
              onClick={() => setActivePlatformTab('storefront')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activePlatformTab === 'storefront'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>3. Public Customer Storefront</span>
            </button>
          </div>

          {/* Platform Content Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-10">
            {/* Left Description Column */}
            <div className="lg:col-span-5 space-y-6">
              {activePlatformTab === 'operator' && (
                <>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <Laptop className="w-4 h-4" />
                    <span>Back-Office Operations</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Operator Command Center & Live Fleet Timeline
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Designed for rental desk managers and dispatchers. View your entire fleet across a 7-day timeline
                    grid, drag to allocate, track vehicle maintenance, and lock reservations with mathematical collision
                    safety.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Live 7-Day interactive timeline grid for every car</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Physical inventory collision detection avoids double bookings</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Maintenance locking for routine 5,000 km oil & brake service</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>One-click chauffeur assignment and trip rate calculator in RWF</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={() => onSelectTab('calendar')}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all ${activeBtnText}`}
                      style={{ backgroundColor: activeColor }}
                    >
                      <span>Explore Timeline Demo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              {activePlatformTab === 'dispatch' && (
                <>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    <Radio className="w-4 h-4" />
                    <span>Zero-Data Driver Operations</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Africa’s Talking SMS Hub & Kigali Airport Sync
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Solve the driver communication gap without forcing expensive data bundles. Send automated SMS trip
                    vouchers in Kinyarwanda or English, track driver arrival at KIA, and auto-adjust for delayed flights.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Localized SMS templates in Kinyarwanda (`Muraho Jean-Paul...`)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero-data driver check-in via simple SMS reply codes</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Live flight delay alerts for RwandAir, Kenya Airways & Ethiopian</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Full dispatch audit trail with delivery timestamps</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={() => onSelectTab('simulator')}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-all ${activeBtnText}`}
                      style={{ backgroundColor: activeColor }}
                    >
                      <span>Open Dispatch Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              {activePlatformTab === 'storefront' && (
                <>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <Globe className="w-4 h-4" />
                    <span>Client-Facing Commerce</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Instant B2B & Tourist Storefront Portal
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    Give your car rental agency a modern public booking storefront. Share direct links with tourists,
                    embassies, NGOs, and conference attendees. Customers check real-time availability and book with MTN
                    MoMo or card.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instant public link: `kigalifleet.app/rent` or your company slug</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Live inventory checks: Only shows vehicles physically available</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Transparent daily pricing in Rwandan Francs (RWF)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>MTN Mobile Money (*182#), Airtel Money & Card capture</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <button
                      onClick={onOpenStorefront}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md transition-all"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Live Storefront</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Interactive Mockup Column */}
            <div className="lg:col-span-7">
              {activePlatformTab === 'operator' && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-2 font-mono">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white">7-Day Fleet Availability Matrix</span>
                    </div>
                    <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Week of Nov 04 – Nov 10
                    </span>
                  </div>

                  {/* Micro timeline bars */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Toyota Prado (RAD 789 C)</span>
                        <span className="text-emerald-400">Available Nov 09</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 h-6">
                        <div className="col-span-1 bg-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500">
                          04
                        </div>
                        <div className="col-span-4 bg-amber-500/20 border border-amber-500/40 rounded flex items-center justify-center text-[10px] text-amber-300 font-bold">
                          UNHCR Safari (Locked)
                        </div>
                        <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center text-[10px] text-emerald-400">
                          Free
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Toyota RAV4 (RAC 452 B)</span>
                        <span className="text-cyan-400">KIA Airport Run</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 h-6">
                        <div className="col-span-2 bg-slate-800 rounded flex items-center justify-center text-[10px] text-slate-500">
                          Free
                        </div>
                        <div className="col-span-3 bg-cyan-500/20 border border-cyan-500/40 rounded flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                          Kiyovu Hotel Transfer
                        </div>
                        <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center text-[10px] text-emerald-400">
                          Free
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Toyota Coaster Bus (RAD 310 F)</span>
                        <span className="text-rose-400">Maintenance</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 h-6">
                        <div className="col-span-3 bg-rose-500/20 border border-rose-500/40 rounded flex items-center justify-center text-[10px] text-rose-300 font-bold">
                          Brake Inspection
                        </div>
                        <div className="col-span-4 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center text-[10px] text-emerald-400">
                          Available for Booking
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Double-Booking Collision Engine:</span>
                    <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      100% Guaranteed Physical Safety
                    </span>
                  </div>
                </div>
              )}

              {activePlatformTab === 'dispatch' && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-2 font-mono">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white">Africa’s Talking SMS Dispatch Gateway</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">Gateway: LIVE (KGL-AT-01)</span>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs leading-relaxed text-slate-200">
                    <div className="text-[11px] text-slate-500 mb-2">To: +250 788 456 789 (Jean-Paul M.)</div>
                    <p className="text-amber-300">
                      Muraho Jean-Paul, ufite urugendo rushya rwemejwe! Imodoka: Toyota Prado (RAD 789 C). Umukiriya:
                      Dr. Sarah Jenkins. Aho guhagurukira: Kigali International Airport (KIA). Igihe: 09:30 AM.
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Zero-Data Reply Code:</span>
                      <span className="text-emerald-400 font-bold">Subiza &quot;YEGO 101&quot; kwemeza</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Kigali Flight Status</div>
                      <div className="font-bold text-amber-400 mt-0.5">WB 402 · Delayed +35m</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[11px]">Chauffeur Check-In</div>
                      <div className="font-bold text-emerald-400 mt-0.5">Acknowledged via SMS</div>
                    </div>
                  </div>
                </div>
              )}

              {activePlatformTab === 'storefront' && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-2 font-mono">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">Public Guest Storefront Demo</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">kigalifleet.app/rent</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Toyota Land Cruiser Prado TXL</div>
                        <div className="text-[11px] text-slate-400">7 Seats · Diesel · Automatic · Safari Roof Rack</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-amber-400 font-mono">180,000 RWF</div>
                        <div className="text-[10px] text-slate-500">per day</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Toyota RAV4 AWD</div>
                        <div className="text-[11px] text-slate-400">5 Seats · Petrol · Automatic · Kigali City & Upcountry</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-amber-400 font-mono">60,000 RWF</div>
                        <div className="text-[10px] text-slate-500">per day</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Payment Methods: MTN MoMo, Airtel, Visa/Mastercard</span>
                    <button
                      onClick={onOpenStorefront}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      <span>Open Customer Wizard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Live Playground Section */}
      <section id="demo" className="py-20 lg:py-28 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-900 border border-slate-800"
              style={{ color: activeColor }}
            >
              Live Engine Test
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Test Drive the Collision & Dispatch Engines
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Interact directly with the algorithms that protect Rwandan operators from double bookings and missed airport
              pickups.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Playground 1: Live Collision Test */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-lg">Physical Collision Detector</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Algorithm: O(1) Physical Lock</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  Select vehicle category and test date ranges against active bookings to see how the engine instantly detects
                  conflicts.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle Category</label>
                    <select
                      value={demoVehicleCategory}
                      onChange={(e) => setDemoVehicleCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                    >
                      <option value="LandCruiser">Toyota Land Cruiser Prado TXL (180,000 RWF/day)</option>
                      <option value="RAV4">Toyota RAV4 AWD (60,000 RWF/day)</option>
                      <option value="Coaster">Toyota Coaster Safari 30-Seater (250,000 RWF/day)</option>
                      <option value="Safari Van">Toyota HiAce Custom Safari Van (120,000 RWF/day)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rental Start Date</label>
                      <input
                        type="date"
                        value={demoStartDate}
                        onChange={(e) => setDemoStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rental End Date</label>
                      <input
                        type="date"
                        value={demoEndDate}
                        onChange={(e) => setDemoEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Collision Result Display */}
                <div className="mt-6 p-4 rounded-xl border transition-all">
                  {demoCollisionResult.hasCollision ? (
                    <div className="space-y-2 border-rose-500/30 bg-rose-950/20 text-rose-200">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>COLLISION DETECTED — BOOKING BLOCKED</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {demoCollisionResult.conflictReason ||
                          'Vehicle is already booked on overlapping dates. System prevents confirmation.'}
                      </p>
                      <div className="text-[11px] font-mono text-rose-300">
                        Conflicting Client:{' '}
                        <span className="font-bold">{demoCollisionResult.conflictingBooking?.client_name}</span> (
                        {demoCollisionResult.conflictingBooking?.start_date} →{' '}
                        {demoCollisionResult.conflictingBooking?.end_date})
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 border-emerald-500/30 bg-emerald-950/20 text-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>100% AVAILABLE — SAFE TO LOCK INVENTORY</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Zero conflicts found across all active company bookings. Vehicle is cleared for instant dispatch.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Try Nov 05–08 to see collision detection in action</span>
                <button
                  onClick={() => {
                    setDemoStartDate('2026-11-12');
                    setDemoEndDate('2026-11-15');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Set Free Dates
                </button>
              </div>
            </div>

            {/* Playground 2: Dual-Language Africa’s Talking SMS Generator */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-lg">Africa’s Talking SMS Dispatch Generator</h3>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                    <button
                      onClick={() => setSmsLanguage('RW')}
                      className={`px-2 py-0.5 rounded ${
                        smsLanguage === 'RW' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Kinyarwanda
                    </button>
                    <button
                      onClick={() => setSmsLanguage('EN')}
                      className={`px-2 py-0.5 rounded ${
                        smsLanguage === 'EN' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Preview how drivers in Kigali receive automated trip dispatches on their standard phones with zero internet
                  needed.
                </p>

                {/* Simulated SMS Bubble */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 shadow-inner space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-800">
                    <span>Sender: KIGALIFLEET (Shortcode 4040)</span>
                    <span>Direct Chauffeur SMS</span>
                  </div>

                  {smsLanguage === 'RW' ? (
                    <div className="space-y-2 text-slate-200 leading-relaxed">
                      <p className="text-amber-300 font-semibold">
                        Muraho Jean-Paul, ufite urugendo rushya rwa KigaliFleet:
                      </p>
                      <p>
                        • Imodoka: Toyota Prado (RAD 789 C)
                        <br />
                        • Umukiriya: Dr. Sarah Jenkins (UNHCR)
                        <br />
                        • Aho guhagurukira: Kigali International Airport (KIA)
                        <br />
                        • Aho kwerekeza: Musanze (Volcanoes NP)
                        <br />• Igihe cyo guhaguruka: 09:30 AM
                      </p>
                      <p className="text-emerald-400 text-[11px] pt-1">
                        Subiza &quot;YEGO 101&quot; kwemeza cyangwa &quot;AGEZE&quot; ukimara kugera ku kibuga cy&apos;indege.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-200 leading-relaxed">
                      <p className="text-amber-300 font-semibold">Hello Jean-Paul, you have a new KigaliFleet dispatch:</p>
                      <p>
                        • Vehicle: Toyota Prado (RAD 789 C)
                        <br />
                        • Client: Dr. Sarah Jenkins (UNHCR)
                        <br />
                        • Pickup Location: Kigali International Airport (KIA)
                        <br />
                        • Destination: Musanze (Volcanoes NP)
                        <br />• Departure Time: 09:30 AM
                      </p>
                      <p className="text-emerald-400 text-[11px] pt-1">
                        Reply &quot;YES 101&quot; to acknowledge or &quot;ARRIVED&quot; upon reaching terminal.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Flight Delay Auto-Alert Hook:</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">WB 402 Monitored</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Integrated with Africa’s Talking Rwanda Telco Rails</span>
                <button
                  onClick={() => onSelectTab('simulator')}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Open Simulator
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Rwandan Operating Realities: Built specifically for Kigali */}
      <section className="py-20 lg:py-28 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-900 border border-slate-800"
              style={{ color: activeColor }}
            >
              Domestic Market Focus
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tailored for Rwanda’s Transport Realities
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Generic global software fails in Kigali because it ignores local phone infrastructure, cash/MoMo payment
              mechanisms, and upcountry safari road dynamics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-5 shadow-lg ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">MTN MoMo & Local Payment Rails</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Accept deposits and balance settlements via MTN Mobile Money (*182#), Airtel Money, Bank of Kigali (BK),
                and I&M Bank transfers with auditable reconciliation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-5 shadow-lg ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kigali Airport (KIA / HRYR) Sync</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Automatic tracking of RwandAir (WB), Kenya Airways (KQ), Ethiopian Airlines (ET), and Qatar Airways arrivals
                so chauffeurs never get stranded at Kanombe.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold mb-5 shadow-lg ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Safari Routes & Upcountry Fleets</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pre-configured for popular routes: Musanze Volcanoes National Park, Akagera Game Reserve, Nyungwe Canopy
                Walk, and Rubavu/Lake Kivu expeditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section (In Rwandan Francs - RWF) */}
      <section id="pricing" className="py-20 lg:py-28 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-900 border border-slate-800"
              style={{ color: activeColor }}
            >
              Transparent Pricing in RWF
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Predictable Plans for Any Fleet Size
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              No hidden percentage fees on your car rentals. Pay a simple flat monthly subscription in Rwandan Francs.
            </p>
          </div>

          {/* Interactive Fleet Size Slider */}
          <div className="max-w-xl mx-auto mb-16 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg text-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Calculate for your fleet size:</span>
              <span className="text-sm font-bold text-white font-mono">{calculatorCars} Vehicles</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={calculatorCars}
              onChange={(e) => setCalculatorCars(Number(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>1 Car</span>
              <span>Recommended: {calculatedTier.name}</span>
              <span>40+ Cars</span>
            </div>
          </div>

          {/* 3 Pricing Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Tier 1: Starter */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Starter Plan</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-white font-mono">35,000</span>
                  <span className="text-sm text-slate-400 font-mono">RWF / mo</span>
                </div>
                <p className="text-xs text-slate-300 mb-6">
                  Up to 5 cars. Ideal for boutique rental desks and independent owners.
                </p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 5 physical vehicles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Collision-guarded schedule</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard driver directory</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Basic SMS notifications</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-2.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Choose Starter
              </button>
            </div>

            {/* Tier 2: Growth (Featured) */}
            <div
              className="p-8 rounded-2xl bg-slate-900 border-2 shadow-2xl relative flex flex-col justify-between scale-105"
              style={{ borderColor: activeColor }}
            >
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-md ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                Most Popular in Kigali
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Growth Plan</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-white font-mono">75,000</span>
                  <span className="text-sm text-slate-400 font-mono">RWF / mo</span>
                </div>
                <p className="text-xs text-slate-300 mb-6">
                  Up to 20 cars. Best for expanding rental businesses and tour operators.
                </p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 20 physical vehicles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live 7-Day fleet scheduling grid</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dual-language SMS dispatch (RW/EN)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Public branded storefront link</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Kigali Airport (KIA) delay monitoring</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className={`mt-8 w-full py-2.5 rounded-lg text-xs font-bold shadow-md transition-all hover:brightness-110 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                Launch with Growth
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Enterprise Plan</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-white font-mono">150,000</span>
                  <span className="text-sm text-slate-400 font-mono">RWF / mo</span>
                </div>
                <p className="text-xs text-slate-300 mb-6">
                  Unlimited fleet. Large safari expeditions, corporate fleets, and airport limousines.
                </p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited vehicles & drivers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-depot & upcountry branches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom RRA EBM tax invoice exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated account manager in Kigali</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-2.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Choose Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Operator Testimonials from Rwanda */}
      <section className="py-20 lg:py-28 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-900 border border-slate-800"
              style={{ color: activeColor }}
            >
              Client Stories
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Trusted by Kigali’s Top Transport Operators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6">
                &quot;We used to manage 18 Land Cruisers with a whiteboard and WhatsApp. Double bookings were a weekly nightmare
                during high safari season. KigaliFleet’s collision engine completely eliminated the problem.&quot;
              </p>
              <div>
                <div className="font-bold text-white text-sm">Jean-Damascene K.</div>
                <div className="text-xs text-amber-400">Managing Director, Kigali Executive Tours (Remera)</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6">
                &quot;The Africa’s Talking SMS in Kinyarwanda is brilliant. Our older drivers don’t use WhatsApp data on the road,
                but they instantly receive their client details and pickup times right on their phones.&quot;
              </p>
              <div>
                <div className="font-bold text-white text-sm">Claire M.</div>
                <div className="text-xs text-cyan-400">Operations Head, Volcanoes Safari Fleet (Musanze)</div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6">
                &quot;The live flight delay monitoring for Kigali International Airport saved us dozens of wasted parking fees.
                Our drivers are dispatched only when the plane actually touches down.&quot;
              </p>
              <div>
                <div className="font-bold text-white text-sm">Patrick U.</div>
                <div className="text-xs text-emerald-400">Chauffeur Dispatch Lead, Great Lakes VIP (Kanombe)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded bg-slate-900 border border-slate-800"
              style={{ color: activeColor }}
            >
              Frequently Asked Questions
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="py-20 lg:py-28 bg-slate-950 relative overflow-hidden">
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full blur-[160px] pointer-events-none opacity-20"
          style={{ backgroundColor: activeColor }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Ready to Streamline Your Kigali Transport Fleet?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Join Rwandan car rentals and safari operators running 100% collision-free bookings and automated driver
            dispatch.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterApp}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base shadow-xl transition-all hover:brightness-110 active:scale-95 ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <span>Launch Platform Workspace</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenStorefront}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-base text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors shadow-sm"
            >
              <Globe className="w-5 h-5 text-emerald-400" />
              <span>Customer Storefront</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-950`}
              style={{ backgroundColor: activeColor }}
            >
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white font-mono text-sm">KigaliFleet SaaS</span>
              <p className="text-[11px] text-slate-500">KN 3 Rd, Remera & Kigali International Airport, Rwanda</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <a href="#platforms" className="hover:text-white transition-colors">
              Platforms
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-white transition-colors">
              Collision Demo
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing in RWF
            </a>
            <button onClick={onOpenStorefront} className="hover:text-white transition-colors">
              Public Storefront
            </button>
            <button onClick={onEnterApp} className="text-amber-400 hover:text-amber-300 font-bold">
              Operator Workspace →
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            © 2026 KigaliFleet. All rights reserved. Built for Rwandan Transport Operations.
          </div>
        </div>
      </footer>
    </div>
  );
};
