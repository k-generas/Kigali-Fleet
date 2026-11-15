import React, { useState } from 'react';
import {
  Car,
  ShieldCheck,
  Calendar,
  Radio,
  Globe,
  ArrowRight,
  Check,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Menu,
  X,
} from 'lucide-react';
import { ColorTheme } from '../theme';
import { Vehicle, Driver, Booking } from '../types';
import { checkBookingCollision } from '../utils/collision';
import { ThemeAppearanceMenu } from './ThemeAppearanceMenu';

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

  const [activeToolTab, setActiveToolTab] = useState<'calendar' | 'sms' | 'booking_page'>('calendar');
  const [demoVehicleCategory, setDemoVehicleCategory] = useState<string>('LandCruiser');
  const [demoStartDate, setDemoStartDate] = useState<string>('2026-11-05');
  const [demoEndDate, setDemoEndDate] = useState<string>('2026-11-08');
  const [smsLanguage, setSmsLanguage] = useState<'RW' | 'EN'>('RW');
  const [calculatorCars, setCalculatorCars] = useState<number>(12);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sampleVehicle = vehicles.find((v) => v.category === demoVehicleCategory) || vehicles[0];
  const demoCollisionResult = sampleVehicle
    ? checkBookingCollision(sampleVehicle.id, demoStartDate, demoEndDate, bookings)
    : { hasCollision: false };

  const getRecommendedPlanName = (count: number) => {
    if (count <= 5) return 'Small Fleet (35,000 RWF)';
    if (count <= 20) return 'Growing Fleet (75,000 RWF)';
    return 'Large Fleet (150,000 RWF)';
  };

  const faqs = [
    {
      q: 'How does it stop double bookings?',
      a: 'Each car in your garage is tracked by its plate number. If a car is already booked from Nov 5 to Nov 8, nobody can book that same car on those days.',
    },
    {
      q: 'Do drivers need a smartphone or internet?',
      a: 'No. Your driver gets a normal text message (SMS) in Kinyarwanda or English on any simple phone. They can reply YES or ARRIVED without internet.',
    },
    {
      q: 'How do customers book a car online?',
      a: 'You get your own simple website link. Tourists and companies see which cars are free, pick their dates, and book in a few taps.',
    },
    {
      q: 'Can customers pay with Mobile Money?',
      a: 'Yes. It works with MTN MoMo, Airtel Money, Bank Transfer, and Card, with all prices clearly shown in RWF.',
    },
    {
      q: 'What happens if a flight at Kigali Airport is late?',
      a: 'When you add a flight number, the app watches the plane time. If the flight is late, it alerts your office and updates your driver.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fc] dark:bg-[#0a0f1c] text-[#0a2540] dark:text-slate-100 transition-colors">
      {/* 1. Clean Stripe-Style 3-Zone Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#0a0f1c]/90 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-18 flex items-center justify-between gap-6">
          {/* Zone 1: Brand */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 shrink-0 text-left"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shadow-xs ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <Car className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#0a2540] dark:text-white whitespace-nowrap">
              Kigali<span style={{ color: activeColor }}>Fleet</span>
            </span>
          </button>

          {/* Zone 2: 4 Short Everyday Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[#425466] dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap">
              How it works
            </a>
            <a href="#try-it" className="hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap">
              Try it
            </a>
            <a href="#prices" className="hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap">
              Prices
            </a>
            <a href="#help" className="hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap">
              Help
            </a>
          </nav>

          {/* Zone 3: Theme Picker + Sign in + Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeAppearanceMenu
              currentTheme={currentTheme}
              accentColorId={accentColorId}
              onSelectAccentColor={onSelectAccentColor}
              themeMode={themeMode}
              onToggleThemeMode={onToggleThemeMode}
            />

            <button
              onClick={() => onSelectTab('login')}
              className="hidden sm:inline-flex items-center text-[15px] font-semibold text-[#425466] dark:text-slate-200 hover:text-[#0a2540] dark:hover:text-white px-3 py-2 transition-colors whitespace-nowrap"
            >
              Sign in
            </button>

            <button
              onClick={onEnterApp}
              className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-[15px] font-bold shadow-xs transition-all hover:brightness-105 active:scale-[0.98] whitespace-nowrap ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <span>Start now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1c] px-5 py-4 space-y-2 text-base font-semibold text-[#0a2540] dark:text-slate-200">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2">
              How it works
            </a>
            <a href="#try-it" onClick={() => setMobileMenuOpen(false)} className="block py-2">
              Try it
            </a>
            <a href="#prices" onClick={() => setMobileMenuOpen(false)} className="block py-2">
              Prices
            </a>
            <a href="#help" onClick={() => setMobileMenuOpen(false)} className="block py-2">
              Help
            </a>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onSelectTab('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-center"
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  onEnterApp();
                  setMobileMenuOpen(false);
                }}
                className={`py-2.5 rounded-full font-bold text-center ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                Start now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section — Stripe-Inspired Split Layout (Understood in 5 seconds) */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0d1424] border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Subtle Stripe-style angled soft color wash */}
        <div
          className="absolute -top-36 -right-36 w-[620px] h-[620px] rounded-full blur-[130px] pointer-events-none opacity-15"
          style={{ backgroundColor: activeColor }}
        />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 lg:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 space-y-6">
              <p className="text-sm sm:text-base font-bold tracking-wide" style={{ color: activeColor }}>
                Made for car rentals &amp; tour companies in Rwanda
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#0a2540] dark:text-white leading-[1.08] tracking-tight">
                Run your car rental business in one simple place.
              </h1>

              <p className="text-lg sm:text-xl text-[#425466] dark:text-slate-300 leading-relaxed max-w-xl">
                See which cars are free, stop double bookings, send trip messages to drivers by SMS, and accept Mobile Money.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  onClick={onEnterApp}
                  className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-bold shadow-sm transition-all hover:brightness-105 active:scale-[0.98] ${activeBtnText}`}
                  style={{ backgroundColor: activeColor }}
                >
                  <span>Open App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenStorefront}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-base font-bold text-[#0a2540] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Globe className="w-4 h-4" style={{ color: activeColor }} />
                  <span>Book a Car</span>
                </button>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[15px] font-medium text-[#425466] dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>No double bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Works on basic driver phones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>MTN &amp; Airtel MoMo ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Airport flight alerts</span>
                </div>
              </div>
            </div>

            {/* Right Stripe-Style Live Preview Card Stack */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#f6f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 stripe-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="text-sm font-bold text-[#0a2540] dark:text-white">Today&apos;s Cars &amp; Trips</div>
                    <div className="text-sm text-[#425466] dark:text-slate-400">
                      {vehicles.length} cars · {drivers.length} drivers
                    </div>
                  </div>
                  <button
                    onClick={onEnterApp}
                    className="text-sm font-bold hover:underline flex items-center gap-1"
                    style={{ color: activeColor }}
                  >
                    <span>See all</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Card 1 */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base font-bold text-[#0a2540] dark:text-white truncate">
                        Toyota Land Cruiser · RAD 789 C
                      </div>
                      <div className="text-sm text-[#425466] dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>Volcanoes Trip · Nov 05 – Nov 08 · Driver: Jean-Paul</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        720,000 RWF
                      </div>
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Paid</div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base font-bold text-[#0a2540] dark:text-white truncate">
                        Toyota RAV4 · RAC 452 B
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-2 font-medium">
                        <Plane className="w-4 h-4 shrink-0" />
                        <span>Airport Pickup · Flight WB 402 is 35 min late</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-mono text-[#0a2540] dark:text-white">
                        45,000 RWF
                      </div>
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Driver alerted</div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                        Double bookings are blocked automatically
                      </div>
                      <div className="text-sm text-emerald-800 dark:text-emerald-300">
                        If a car is booked, no one else can book it on the same day.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works — 3 Simple Tools */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] dark:text-white">
              Three simple tools in one place
            </h2>
            <p className="mt-3 text-lg text-[#425466] dark:text-slate-300">
              Everything your office, your drivers, and your customers need.
            </p>
          </div>

          {/* Interactive Tool Tabs */}
          <div className="inline-flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-8 stripe-card">
            <button
              onClick={() => setActiveToolTab('calendar')}
              className={`px-4 py-2.5 rounded-lg text-[15px] font-bold transition-colors flex items-center gap-2 ${
                activeToolTab === 'calendar'
                  ? `${activeBtnText}`
                  : 'text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeToolTab === 'calendar' ? { backgroundColor: activeColor } : undefined}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Trip Calendar</span>
            </button>
            <button
              onClick={() => setActiveToolTab('sms')}
              className={`px-4 py-2.5 rounded-lg text-[15px] font-bold transition-colors flex items-center gap-2 ${
                activeToolTab === 'sms'
                  ? `${activeBtnText}`
                  : 'text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeToolTab === 'sms' ? { backgroundColor: activeColor } : undefined}
            >
              <Radio className="w-4 h-4" />
              <span>2. Driver SMS</span>
            </button>
            <button
              onClick={() => setActiveToolTab('booking_page')}
              className={`px-4 py-2.5 rounded-lg text-[15px] font-bold transition-colors flex items-center gap-2 ${
                activeToolTab === 'booking_page'
                  ? `${activeBtnText}`
                  : 'text-[#425466] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeToolTab === 'booking_page' ? { backgroundColor: activeColor } : undefined}
            >
              <Globe className="w-4 h-4" />
              <span>3. Booking Website</span>
            </button>
          </div>

          {/* Tool Showcase Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 stripe-card">
            <div className="lg:col-span-5 space-y-5">
              {activeToolTab === 'calendar' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                    See every car on one calendar
                  </h3>
                  <p className="text-base sm:text-lg text-[#425466] dark:text-slate-300 leading-relaxed">
                    Look at your whole week in seconds. Know right away which car is out on a trip, which car is in repair, and which car is ready.
                  </p>
                  <ul className="space-y-3 text-base text-[#0a2540] dark:text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Blocks double bookings before they happen</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Hides cars that are in the garage for repair</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Calculates total price in RWF automatically</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => onSelectTab('calendar')}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-bold ${activeBtnText}`}
                    style={{ backgroundColor: activeColor }}
                  >
                    <span>Open Calendar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {activeToolTab === 'sms' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                    Send trips to drivers by text message
                  </h3>
                  <p className="text-base sm:text-lg text-[#425466] dark:text-slate-300 leading-relaxed">
                    Your drivers do not need internet bundles or an app. One click sends the pickup place, time, and customer name by normal SMS.
                  </p>
                  <ul className="space-y-3 text-base text-[#0a2540] dark:text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Messages in Kinyarwanda or English</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Drivers confirm by simple SMS reply</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Updates drivers when a flight is late</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => onSelectTab('simulator')}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-bold ${activeBtnText}`}
                    style={{ backgroundColor: activeColor }}
                  >
                    <span>Try SMS Sender</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {activeToolTab === 'booking_page' && (
                <>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                    Let customers book online anytime
                  </h3>
                  <p className="text-base sm:text-lg text-[#425466] dark:text-slate-300 leading-relaxed">
                    Share your booking page link on WhatsApp or your website. Tourists and NGOs see free cars and pay with Mobile Money or Card.
                  </p>
                  <ul className="space-y-3 text-base text-[#0a2540] dark:text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Shows only cars that are really free</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>Clear daily prices in RWF or USD</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>MTN MoMo, Airtel Money &amp; Card</span>
                    </li>
                  </ul>
                  <button
                    onClick={onOpenStorefront}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-bold ${activeBtnText}`}
                    style={{ backgroundColor: activeColor }}
                  >
                    <span>Open Booking Website</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="lg:col-span-7">
              {activeToolTab === 'calendar' && (
                <div className="p-5 sm:p-6 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-[#0a2540] dark:text-white">
                    <span>Weekly Car Schedule</span>
                    <span className="text-[#425466] dark:text-slate-400 font-normal">Nov 04 – Nov 10</span>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1.5 font-medium text-[#425466] dark:text-slate-300">
                        <span>Toyota Prado (RAD 789 C)</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free Nov 09</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 h-9 text-xs font-bold">
                        <div className="col-span-1 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-[#425466] dark:text-slate-400">
                          04
                        </div>
                        <div className="col-span-4 bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 rounded flex items-center justify-center text-amber-900 dark:text-amber-300">
                          Safari Trip (Booked)
                        </div>
                        <div className="col-span-2 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 rounded flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                          Free
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 font-medium text-[#425466] dark:text-slate-300">
                        <span>Toyota RAV4 (RAC 452 B)</span>
                        <span className="text-sky-600 dark:text-sky-400 font-semibold">Airport Transfer</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 h-9 text-xs font-bold">
                        <div className="col-span-2 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 rounded flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                          Free
                        </div>
                        <div className="col-span-3 bg-sky-100 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-500/40 rounded flex items-center justify-center text-sky-900 dark:text-sky-300">
                          Hotel Pickup
                        </div>
                        <div className="col-span-2 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 rounded flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                          Free
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 font-medium text-[#425466] dark:text-slate-300">
                        <span>Toyota Coaster (RAD 310 F)</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">In Repair</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 h-9 text-xs font-bold">
                        <div className="col-span-3 bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 rounded flex items-center justify-center text-rose-800 dark:text-rose-300">
                          Brake Repair
                        </div>
                        <div className="col-span-4 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 rounded flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                          Ready to Book
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeToolTab === 'sms' && (
                <div className="p-5 sm:p-6 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="text-sm font-bold text-[#0a2540] dark:text-white">
                    Example text message sent to driver&apos;s phone:
                  </div>
                  <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base leading-relaxed space-y-3">
                    <div className="text-sm text-[#425466] dark:text-slate-400">
                      To: Jean-Paul M. (+250 788 456 789)
                    </div>
                    <p className="font-medium text-[#0a2540] dark:text-slate-100">
                      Muraho Jean-Paul, ufite urugendo rushya! Imodoka: Toyota Prado (RAD 789 C). Umukiriya: Dr. Sarah Jenkins. Aho guhagurukira: Kigali Airport (09:30 AM).
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Reply &quot;YEGO 101&quot; to confirm
                    </p>
                  </div>
                </div>
              )}

              {activeToolTab === 'booking_page' && (
                <div className="p-5 sm:p-6 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-sm font-bold text-[#0a2540] dark:text-white mb-2">
                    What your customers see online:
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-[#0a2540] dark:text-white">Toyota Land Cruiser Prado</div>
                      <div className="text-sm text-[#425466] dark:text-slate-400">7 Seats · Diesel · Automatic</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold font-mono text-[#0a2540] dark:text-white">180,000 RWF</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400">per day</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-[#0a2540] dark:text-white">Toyota RAV4</div>
                      <div className="text-sm text-[#425466] dark:text-slate-400">5 Seats · Petrol · Automatic</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold font-mono text-[#0a2540] dark:text-white">60,000 RWF</div>
                      <div className="text-xs text-[#425466] dark:text-slate-400">per day</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Try It Live — Plain, Instant Demo */}
      <section id="try-it" className="py-16 sm:py-24 bg-white dark:bg-[#0d1424] border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] dark:text-white">
              Try it right here
            </h2>
            <p className="mt-3 text-lg text-[#425466] dark:text-slate-300">
              Pick dates to test double-booking protection, or switch the driver SMS language.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test 1: Check Car Availability */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#f6f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <h3 className="text-xl font-extrabold text-[#0a2540] dark:text-white">
                  1. Check if a car is free
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">
                      Pick a car
                    </label>
                    <select
                      value={demoVehicleCategory}
                      onChange={(e) => setDemoVehicleCategory(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-[#0a2540] dark:text-white outline-none"
                    >
                      <option value="LandCruiser">Toyota Land Cruiser Prado</option>
                      <option value="RAV4">Toyota RAV4</option>
                      <option value="Coaster">Toyota Coaster Bus</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">
                        Start date
                      </label>
                      <input
                        type="date"
                        value={demoStartDate}
                        onChange={(e) => setDemoStartDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-[#0a2540] dark:text-white outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-200 mb-1.5">
                        End date
                      </label>
                      <input
                        type="date"
                        value={demoEndDate}
                        onChange={(e) => setDemoEndDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base text-[#0a2540] dark:text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {demoCollisionResult.hasCollision ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 space-y-1.5">
                    <div className="flex items-center gap-2 text-base font-bold text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>Already booked on these dates</span>
                    </div>
                    <p className="text-sm text-rose-800 dark:text-rose-200">
                      Booked by {demoCollisionResult.conflictingBooking?.client_name} (
                      {demoCollisionResult.conflictingBooking?.start_date} to{' '}
                      {demoCollisionResult.conflictingBooking?.end_date}). Choose other dates.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-1.5">
                    <div className="flex items-center gap-2 text-base font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>Car is free — Ready to book</span>
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      No other trip on these days. Safe to confirm.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="text-[#425466] dark:text-slate-400">Try Nov 05–08 to see a blocked date</span>
                <button
                  onClick={() => {
                    setDemoStartDate('2026-11-12');
                    setDemoEndDate('2026-11-15');
                  }}
                  className="font-bold hover:underline"
                  style={{ color: activeColor }}
                >
                  Pick free dates
                </button>
              </div>
            </div>

            {/* Test 2: Driver SMS Preview */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#f6f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-extrabold text-[#0a2540] dark:text-white">
                    2. Driver text message (SMS)
                  </h3>
                  <div className="inline-flex p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold">
                    <button
                      onClick={() => setSmsLanguage('RW')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        smsLanguage === 'RW' ? `${activeBtnText}` : 'text-[#425466] dark:text-slate-400'
                      }`}
                      style={smsLanguage === 'RW' ? { backgroundColor: activeColor } : undefined}
                    >
                      Kinyarwanda
                    </button>
                    <button
                      onClick={() => setSmsLanguage('EN')}
                      className={`px-3 py-1.5 rounded-md transition-colors ${
                        smsLanguage === 'EN' ? `${activeBtnText}` : 'text-[#425466] dark:text-slate-400'
                      }`}
                      style={smsLanguage === 'EN' ? { backgroundColor: activeColor } : undefined}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base leading-relaxed space-y-3">
                  <div className="text-sm font-medium text-[#425466] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                    Message sent to driver&apos;s phone
                  </div>
                  {smsLanguage === 'RW' ? (
                    <div className="space-y-2 text-[#0a2540] dark:text-slate-100">
                      <p className="font-bold">Muraho Jean-Paul, ufite urugendo rushya:</p>
                      <p className="text-[15px] text-[#425466] dark:text-slate-300">
                        • Imodoka: Toyota Prado (RAD 789 C)<br />
                        • Umukiriya: Dr. Sarah Jenkins<br />
                        • Aho guhagurukira: Kigali Airport (09:30 AM)<br />
                        • Aho kwerekeza: Musanze (Volcanoes NP)
                      </p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Subiza &quot;YEGO 101&quot; kwemeza
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[#0a2540] dark:text-slate-100">
                      <p className="font-bold">Hello Jean-Paul, you have a new trip:</p>
                      <p className="text-[15px] text-[#425466] dark:text-slate-300">
                        • Car: Toyota Prado (RAD 789 C)<br />
                        • Client: Dr. Sarah Jenkins<br />
                        • Pickup: Kigali Airport (09:30 AM)<br />
                        • Going to: Musanze (Volcanoes NP)
                      </p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Reply &quot;YES 101&quot; to confirm
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="text-[#425466] dark:text-slate-400">No internet needed on driver&apos;s phone</span>
                <button
                  onClick={() => onSelectTab('simulator')}
                  className="font-bold hover:underline"
                  style={{ color: activeColor }}
                >
                  Open full SMS tester
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Built for Rwanda — 3 Clear Benefits */}
      <section className="py-16 sm:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] dark:text-white">
              Made for how transport works in Rwanda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 stripe-card space-y-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] dark:text-white">Mobile Money &amp; Bank Pay</h3>
              <p className="text-base text-[#425466] dark:text-slate-300 leading-relaxed">
                Track MTN MoMo, Airtel Money, bank transfers, and cards cleanly in RWF.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 stripe-card space-y-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] dark:text-white">Airport Flight Alerts</h3>
              <p className="text-base text-[#425466] dark:text-slate-300 leading-relaxed">
                Know when a plane is late at Kigali Airport so drivers wait at the right time.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 stripe-card space-y-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0a2540] dark:text-white">City &amp; Safari Trips</h3>
              <p className="text-base text-[#425466] dark:text-slate-300 leading-relaxed">
                Ready for Kigali city rides, Volcanoes, Akagera, Nyungwe, and Lake Kivu trips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Simple Monthly Prices */}
      <section id="prices" className="py-16 sm:py-24 bg-white dark:bg-[#0d1424] border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] dark:text-white">
              Simple monthly prices
            </h2>
            <p className="mt-3 text-lg text-[#425466] dark:text-slate-300">
              One flat monthly price in RWF. No extra booking fees.
            </p>
          </div>

          {/* Car Count Slider */}
          <div className="max-w-xl mx-auto mb-14 p-6 rounded-2xl bg-[#f6f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-[#425466] dark:text-slate-300">How many cars do you have?</span>
              <span className="text-lg font-extrabold font-mono text-[#0a2540] dark:text-white">{calculatorCars} cars</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={calculatorCars}
              onChange={(e) => setCalculatorCars(Number(e.target.value))}
              className="w-full accent-amber-500 h-2.5 rounded-lg cursor-pointer"
            />
            <div className="mt-3 flex items-center justify-between text-sm font-medium text-[#425466] dark:text-slate-400">
              <span>1 car</span>
              <span className="font-bold text-[#0a2540] dark:text-white">Best for you: {getRecommendedPlanName(calculatorCars)}</span>
              <span>40+ cars</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan 1 */}
            <div className="p-8 rounded-2xl bg-[#f6f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-base font-bold text-[#425466] dark:text-slate-300">Small Fleet</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#0a2540] dark:text-white font-mono">35,000</span>
                  <span className="text-base text-[#425466] dark:text-slate-400 font-mono">RWF / mo</span>
                </div>
                <p className="text-base text-[#425466] dark:text-slate-300">For small owners with up to 5 cars.</p>
                <ul className="space-y-3 pt-2 text-[15px] text-[#0a2540] dark:text-slate-200">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Up to 5 cars</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />No double bookings</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Driver list &amp; SMS alerts</li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-3 rounded-full text-base font-bold bg-white dark:bg-slate-800 text-[#0a2540] dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Choose Small
              </button>
            </div>

            {/* Plan 2 */}
            <div
              className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 stripe-card flex flex-col justify-between relative"
              style={{ borderColor: activeColor }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: activeColor }}>Growing Fleet</span>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: activeColor }}>
                    Most popular
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#0a2540] dark:text-white font-mono">75,000</span>
                  <span className="text-base text-[#425466] dark:text-slate-400 font-mono">RWF / mo</span>
                </div>
                <p className="text-base text-[#425466] dark:text-slate-300">For rental companies with up to 20 cars.</p>
                <ul className="space-y-3 pt-2 text-[15px] text-[#0a2540] dark:text-slate-200">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Up to 20 cars</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Weekly trip calendar</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Driver SMS (Kinyarwanda &amp; English)</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Online booking website</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Airport flight alerts</li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className={`mt-8 w-full py-3 rounded-full text-base font-bold shadow-sm transition-all hover:brightness-105 ${activeBtnText}`}
                style={{ backgroundColor: activeColor }}
              >
                Start with Growing
              </button>
            </div>

            {/* Plan 3 */}
            <div className="p-8 rounded-2xl bg-[#f6f9fc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-base font-bold text-[#425466] dark:text-slate-300">Large Fleet</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#0a2540] dark:text-white font-mono">150,000</span>
                  <span className="text-base text-[#425466] dark:text-slate-400 font-mono">RWF / mo</span>
                </div>
                <p className="text-base text-[#425466] dark:text-slate-300">For big safari &amp; company fleets with unlimited cars.</p>
                <ul className="space-y-3 pt-2 text-[15px] text-[#0a2540] dark:text-slate-200">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Unlimited cars &amp; drivers</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Multiple offices &amp; towns</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Tax &amp; payment reports</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Direct help in Kigali</li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-3 rounded-full text-base font-bold bg-white dark:bg-slate-800 text-[#0a2540] dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Choose Large
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Common Questions */}
      <section id="help" className="py-16 sm:py-24 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] dark:text-white text-center mb-10">
            Common questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 text-base sm:text-lg font-bold text-[#0a2540] dark:text-white"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-base text-[#425466] dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Bottom Call to Action & Quiet Footer */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#0d1424]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a2540] dark:text-white">
            Ready to try KigaliFleet?
          </h2>
          <p className="text-lg text-[#425466] dark:text-slate-300">
            Open the app now or see how your customers book a car online.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onEnterApp}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base shadow-sm ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <span>Open App</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenStorefront}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-base text-[#0a2540] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Globe className="w-5 h-5" style={{ color: activeColor }} />
              <span>Book a Car</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-[#f6f9fc] dark:bg-[#0a0f1c] border-t border-slate-200 dark:border-slate-800 py-10 text-sm text-[#425466] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${activeBtnText}`}
              style={{ backgroundColor: activeColor }}
            >
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#0a2540] dark:text-white text-base">KigaliFleet</span>
              <p className="text-sm text-[#425466] dark:text-slate-400">Kigali, Rwanda</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <a href="#how-it-works" className="hover:text-[#0a2540] dark:hover:text-white">How it works</a>
            <a href="#try-it" className="hover:text-[#0a2540] dark:hover:text-white">Try it</a>
            <a href="#prices" className="hover:text-[#0a2540] dark:hover:text-white">Prices</a>
            <button onClick={onOpenStorefront} className="hover:text-[#0a2540] dark:hover:text-white">Book a Car</button>
            <button onClick={onEnterApp} className="font-bold" style={{ color: activeColor }}>Open App</button>
          </div>

          <div className="text-sm">© 2026 KigaliFleet</div>
        </div>
      </footer>
    </div>
  );
};
