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
import { CATEGORY_DEFAULT_IMAGES, getVehicleImageUrl } from '../utils/vehicleImages';
import { ThemeAppearanceMenu } from './ThemeAppearanceMenu';
import { useI18n } from '../utils/i18n';
import { LocaleCurrencySwitcher } from './LocaleCurrencySwitcher';

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
  const { formatMoney, tr, t, currency } = useI18n();

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
    if (count <= 5) return `${t({ EN: 'Small Fleet', RW: 'Imodoka Nke', FR: 'Petite Flotte' })} (${formatMoney(35000)})`;
    if (count <= 20) return `${t({ EN: 'Growing Fleet', RW: 'Ikigo Gikura', FR: 'Flotte Croissante' })} (${formatMoney(75000)})`;
    return `${t({ EN: 'Large Fleet', RW: 'Ibigo Binini', FR: 'Grande Flotte' })} (${formatMoney(150000)})`;
  };

  const faqs = [
    {
      q: tr('How does it stop double bookings?'),
      a: tr('Each car in your garage is tracked by its plate number. If a car is already booked from Nov 5 to Nov 8, nobody can book that same car on those days.'),
    },
    {
      q: tr('Do drivers need a smartphone or internet?'),
      a: tr('No. Your driver gets a normal text message (SMS) in Kinyarwanda or English on any simple phone. They can reply YES or ARRIVED without internet.'),
    },
    {
      q: tr('How do customers book a car online?'),
      a: tr('You get your own simple website link. Tourists and companies see which cars are free, pick their dates, and book in a few taps.'),
    },
    {
      q: tr('Can customers pay with Mobile Money?'),
      a: tr('Yes. It works with MTN MoMo, Airtel Money, Bank Transfer, and Card, with all prices clearly shown in RWF or USD.'),
    },
    {
      q: tr('What happens if a flight at Kigali Airport is late?'),
      a: tr('When you add a flight number, the app watches the plane time. If the flight is late, it alerts your office and updates your driver.'),
    },
  ];

  const inputClass =
    'w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 shrink-0 text-left"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center accent-bg">
              <Car className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Kigali<span className="accent-text">Fleet</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              {tr('How it works')}
            </a>
            <a href="#try-it" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              {tr('Try it')}
            </a>
            <a href="#prices" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              {tr('Prices')}
            </a>
            <a href="#help" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              {tr('Help')}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
            </div>

            <ThemeAppearanceMenu
              currentTheme={currentTheme}
              accentColorId={accentColorId}
              onSelectAccentColor={onSelectAccentColor}
              themeMode={themeMode}
              onToggleThemeMode={onToggleThemeMode}
            />

            <button
              type="button"
              onClick={() => onSelectTab('login')}
              className="hidden sm:inline-flex items-center text-sm font-semibold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              {tr('Sign in')}
            </button>

            <button
              type="button"
              onClick={onEnterApp}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              <span>{tr('Start now')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden transition-colors"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="sm:hidden flex items-center justify-center border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 bg-slate-50/80 dark:bg-[#0f172a]">
          <LocaleCurrencySwitcher currentTheme={currentTheme} compact />
        </div>

        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden grid grid-cols-4 gap-1 border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300"
        >
          <a href="#how-it-works" className="text-center py-1 truncate hover:text-slate-900 dark:hover:text-white">
            {tr('How it works')}
          </a>
          <a href="#try-it" className="text-center py-1 truncate hover:text-slate-900 dark:hover:text-white">
            {tr('Try it')}
          </a>
          <a href="#prices" className="text-center py-1 truncate hover:text-slate-900 dark:hover:text-white">
            {tr('Prices')}
          </a>
          <a href="#help" className="text-center py-1 truncate hover:text-slate-900 dark:hover:text-white">
            {tr('Help')}
          </a>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-4 space-y-2 text-sm font-medium text-slate-800 dark:text-slate-100">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-slate-100 dark:border-slate-800">
              {tr('How it works')}
            </a>
            <a href="#try-it" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-slate-100 dark:border-slate-800">
              {tr('Try it')}
            </a>
            <a href="#prices" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-slate-100 dark:border-slate-800">
              {tr('Prices')}
            </a>
            <a href="#help" onClick={() => setMobileMenuOpen(false)} className="block py-2">
              {tr('Help')}
            </a>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-center"
              >
                {tr('Sign in')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnterApp();
                  setMobileMenuOpen(false);
                }}
                className="py-2 rounded-lg font-semibold text-center accent-bg"
              >
                {tr('Start now')}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-sm font-semibold accent-text">
                {tr('Made for Car Rental Companies in Rwanda')}
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {tr('Run your car rental business without double bookings.')}
              </h1>

              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                {tr('One simple app for your cars, drivers, customer bookings, and Mobile Money payments. Easy to use on any phone or computer.')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 transition-opacity"
                >
                  <span>{tr('Open Dashboard')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenStorefront}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Globe className="w-4 h-4 accent-text" />
                  <span>{tr('Book a Car')}</span>
                </button>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{tr('No double bookings')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{tr('Works on basic driver phones')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{tr('MTN & Airtel MoMo ready')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{tr('Airport flight alerts')}</span>
                </div>
              </div>
            </div>

            {/* Right Fleet Summary Card */}
            <div className="lg:col-span-6">
              <div className="rounded-xl bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 kf-card overflow-hidden">
                <div className="px-5 py-3.5 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tr("Today's Cars & Trips")}
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {vehicles.length} {tr('Cars')} · {drivers.length} {tr('Drivers')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="text-sm font-semibold accent-text hover:underline flex items-center gap-1"
                  >
                    <span>{tr('See all')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="p-4 bg-white dark:bg-[#111827] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Toyota Land Cruiser · <span className="font-mono text-slate-500 dark:text-slate-400">RAD 789 C</span>
                      </div>
                      <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Volcanoes · 5 to 8 Nov · {tr('Driver')}: Jean-Paul</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatMoney(720000)}
                      </div>
                      <div className="text-[13px] text-emerald-600 dark:text-emerald-400">{tr('Paid')}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#111827] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        Toyota RAV4 · <span className="font-mono text-slate-500 dark:text-slate-400">RAC 452 B</span>
                      </div>
                      <div className="text-[13px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 shrink-0" />
                        <span>{tr('Airport Pickup')} · Flight WB 402 (+35m)</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(45000)}
                      </div>
                      <div className="text-[13px] text-amber-700 dark:text-amber-400">{tr('Driver alerted')}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-500/10 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {tr('Double bookings are blocked automatically')}
                      </div>
                      <div className="text-[13px] text-slate-600 dark:text-slate-300">
                        {tr('If a car is booked, no one else can book it on the same day.')}
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
      <section id="how-it-works" className="py-14 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {tr('Three simple tools in one place')}
            </h2>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              {tr('Everything your office, your drivers, and your customers need.')}
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-lg mb-6 gap-1">
            <button
              type="button"
              onClick={() => setActiveToolTab('calendar')}
              className={`px-3.5 py-2 rounded-md text-sm flex items-center gap-2 transition-all ${
                activeToolTab === 'calendar'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 accent-text" />
              <span>1. {tr('Trip Calendar')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveToolTab('sms')}
              className={`px-3.5 py-2 rounded-md text-sm flex items-center gap-2 transition-all ${
                activeToolTab === 'sms'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4 accent-text" />
              <span>2. {tr('Send SMS to drivers')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveToolTab('booking_page')}
              className={`px-3.5 py-2 rounded-md text-sm flex items-center gap-2 transition-all ${
                activeToolTab === 'booking_page'
                  ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 accent-text" />
              <span>3. {tr('Booking Website')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-6 sm:p-8">
            <div className="lg:col-span-5 space-y-4">
              {activeToolTab === 'calendar' && (
                <>
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                    {tr('See every car on one calendar')}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tr('Look at your whole week in seconds. Know right away which car is out on a trip, which car is in repair, and which car is ready.')}
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-800 dark:text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Blocks double bookings before they happen')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Hides cars that are in the garage for repair')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Calculates total price automatically')} ({currency})</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => onSelectTab('calendar')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold accent-bg hover:opacity-95"
                  >
                    <span>{tr('Open Calendar')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {activeToolTab === 'sms' && (
                <>
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                    {tr('Send trips to drivers by text message')}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tr('Your drivers do not need internet bundles or an app. One click sends the pickup place, time, and customer name by normal SMS.')}
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-800 dark:text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Messages in Kinyarwanda or English')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Drivers confirm by simple SMS reply')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Updates drivers when a flight is late')}</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => onSelectTab('simulator')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold accent-bg hover:opacity-95"
                  >
                    <span>{tr('Try SMS Sender')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {activeToolTab === 'booking_page' && (
                <>
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                    {tr('Let customers book online anytime')}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tr('Share your booking page link on WhatsApp or your website. Tourists and NGOs see free cars and pay with Mobile Money or Card.')}
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-800 dark:text-slate-200">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Shows only cars that are really free')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('Clear daily prices in RWF or USD')}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{tr('MTN MoMo, Airtel Money & Card')}</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={onOpenStorefront}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold accent-bg hover:opacity-95"
                  >
                    <span>{tr('Open Booking Website')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="lg:col-span-7">
              {activeToolTab === 'calendar' && (
                <div className="p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
                    <span>Weekly Car Schedule</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">4 to 10 Nov</span>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1.5 text-slate-600 dark:text-slate-300">
                        <span>Toyota Prado (<span className="font-mono">RAD 789 C</span>)</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free 9 Nov</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 h-8 text-[13px] font-semibold">
                        <div className="col-span-1 bg-slate-200/70 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono">
                          04
                        </div>
                        <div className="col-span-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/30 rounded-md flex items-center justify-center text-amber-700 dark:text-amber-400">
                          Safari Trip (Booked)
                        </div>
                        <div className="col-span-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 rounded-md flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                          Free
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 text-slate-600 dark:text-slate-300">
                        <span>Toyota RAV4 (<span className="font-mono">RAC 452 B</span>)</span>
                        <span className="accent-text font-semibold">Airport Transfer</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 h-8 text-[13px] font-semibold">
                        <div className="col-span-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 rounded-md flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                          Free
                        </div>
                        <div className="col-span-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/30 rounded-md flex items-center justify-center text-blue-700 dark:text-blue-400">
                          Hotel Pickup
                        </div>
                        <div className="col-span-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 rounded-md flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                          Free
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 text-slate-600 dark:text-slate-300">
                        <span>Toyota Coaster (<span className="font-mono">RAD 310 F</span>)</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">In Repair</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 h-8 text-[13px] font-semibold">
                        <div className="col-span-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 rounded-md flex items-center justify-center text-rose-700 dark:text-rose-400">
                          Brake Repair
                        </div>
                        <div className="col-span-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 rounded-md flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                          Ready to Book
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeToolTab === 'sms' && (
                <div className="p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Example text message sent to driver&apos;s phone:
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-sm leading-relaxed space-y-2">
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 font-mono">
                      To: Jean-Paul M. (+250 788 456 789)
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">
                      Muraho Jean-Paul, ufite urugendo rushya! Imodoka: Toyota Prado (RAD 789 C). Umukiriya: Dr. Sarah Jenkins. Aho guhagurukira: Kigali Airport (09:30 AM).
                    </p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      Reply &quot;YEGO 101&quot; to confirm
                    </p>
                  </div>
                </div>
              )}

              {activeToolTab === 'booking_page' && (
                <div className="p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    What your customers see online:
                  </div>
                  {[
                    {
                      model: vehicles[0]?.model_name || 'Toyota Land Cruiser Prado',
                      specs: `${vehicles[0]?.seating_capacity || 7} Seats · ${vehicles[0]?.fuel_type || 'Diesel'} · ${vehicles[0]?.transmission || 'Automatic'}`,
                      price: formatMoney(vehicles[0]?.daily_rate_rwf || 180000),
                      img: vehicles[0] ? getVehicleImageUrl(vehicles[0]) : CATEGORY_DEFAULT_IMAGES.LandCruiser,
                      fallback: vehicles[0] ? CATEGORY_DEFAULT_IMAGES[vehicles[0].category] : CATEGORY_DEFAULT_IMAGES.LandCruiser,
                    },
                    {
                      model: vehicles[2]?.model_name || 'Toyota RAV4',
                      specs: `${vehicles[2]?.seating_capacity || 5} Seats · ${vehicles[2]?.fuel_type || 'Petrol'} · ${vehicles[2]?.transmission || 'Automatic'}`,
                      price: formatMoney(vehicles[2]?.daily_rate_rwf || 60000),
                      img: vehicles[2] ? getVehicleImageUrl(vehicles[2]) : CATEGORY_DEFAULT_IMAGES.RAV4,
                      fallback: vehicles[2] ? CATEGORY_DEFAULT_IMAGES[vehicles[2].category] : CATEGORY_DEFAULT_IMAGES.RAV4,
                    },
                  ].map((item) => (
                    <div
                      key={item.model}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.img}
                          alt={item.model}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = item.fallback;
                          }}
                          className="w-16 h-12 rounded-lg object-cover border border-slate-200/80 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {item.model}
                          </div>
                          <div className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{item.specs}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                          {item.price}
                        </div>
                        <div className="text-[13px] text-slate-500 dark:text-slate-400">per day</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Try It Live — Instant Interactive Demo */}
      <section id="try-it" className="py-14 sm:py-20 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {tr('Try it right here')}
            </h2>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              {tr('Pick dates to test double-booking protection, or switch the driver SMS language.')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test 1: Check Car Availability */}
            <div className="p-6 rounded-xl bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 kf-card flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {tr('1. Check if a car is free')}
                </h3>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {tr('Pick a car')}
                    </label>
                    <select
                      value={demoVehicleCategory}
                      onChange={(e) => setDemoVehicleCategory(e.target.value)}
                      className={inputClass}
                    >
                      <option value="LandCruiser">Toyota Land Cruiser Prado</option>
                      <option value="RAV4">Toyota RAV4</option>
                      <option value="Coaster">Toyota Coaster Bus</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {tr('Start date')}
                      </label>
                      <input
                        type="date"
                        value={demoStartDate}
                        onChange={(e) => setDemoStartDate(e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {tr('End date')}
                      </label>
                      <input
                        type="date"
                        value={demoEndDate}
                        onChange={(e) => setDemoEndDate(e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                </div>

                {demoCollisionResult.hasCollision ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{tr('Already booked on these dates')}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {tr('Booked by')} {demoCollisionResult.conflictingBooking?.client_name} (
                      <span className="font-mono">{demoCollisionResult.conflictingBooking?.start_date}</span> →{' '}
                      <span className="font-mono">{demoCollisionResult.conflictingBooking?.end_date}</span>). {tr('Choose other dates.')}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{tr('Car is free — Ready to book')}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {tr('No other trip on these days. Safe to confirm.')}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{tr('Try Nov 05–08 to see a blocked date')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setDemoStartDate('2026-11-12');
                    setDemoEndDate('2026-11-15');
                  }}
                  className="font-semibold accent-text hover:underline"
                >
                  {tr('Pick free dates')}
                </button>
              </div>
            </div>

            {/* Test 2: Driver SMS Preview */}
            <div className="p-6 rounded-xl bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 kf-card flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tr('2. Driver text message (SMS)')}
                  </h3>
                  <div className="inline-flex items-center bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-lg text-sm">
                    <button
                      type="button"
                      onClick={() => setSmsLanguage('RW')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        smsLanguage === 'RW'
                          ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Kinyarwanda
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmsLanguage('EN')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        smsLanguage === 'EN'
                          ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-sm leading-relaxed space-y-2.5">
                  <div className="text-[13px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                    Message sent to driver&apos;s phone
                  </div>
                  {smsLanguage === 'RW' ? (
                    <div className="space-y-1.5 text-slate-900 dark:text-slate-100">
                      <p className="font-semibold">Muraho Jean-Paul, ufite urugendo rushya:</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        • Imodoka: Toyota Prado (RAD 789 C)<br />
                        • Umukiriya: Dr. Sarah Jenkins<br />
                        • Aho guhagurukira: Kigali Airport (09:30 AM)<br />
                        • Aho kwerekeza: Musanze (Volcanoes NP)
                      </p>
                      <p className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        Subiza &quot;YEGO 101&quot; kwemeza
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-slate-900 dark:text-slate-100">
                      <p className="font-semibold">Hello Jean-Paul, you have a new trip:</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        • Car: Toyota Prado (RAD 789 C)<br />
                        • Client: Dr. Sarah Jenkins<br />
                        • Pickup: Kigali Airport (09:30 AM)<br />
                        • Going to: Musanze (Volcanoes NP)
                      </p>
                      <p className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        Reply &quot;YES 101&quot; to confirm
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">No internet needed on driver&apos;s phone</span>
                <button
                  type="button"
                  onClick={() => onSelectTab('simulator')}
                  className="font-semibold accent-text hover:underline"
                >
                  Open full SMS tester
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Built for Rwanda — 3 Clear Benefits */}
      <section className="py-14 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {tr('Made for how transport works in Rwanda')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center accent-bg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tr('Mobile Money & Bank Pay')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {tr('Track MTN MoMo, Airtel Money, bank transfers, and cards cleanly in RWF or USD.')}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center accent-bg">
                <Plane className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tr('Airport flight alerts')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {tr('Know when a plane is late at Kigali Airport so drivers wait at the right time.')}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card space-y-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center accent-bg">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tr('City & Safari Trips')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {tr('Ready for Kigali city rides, Volcanoes, Akagera, Nyungwe, and Lake Kivu trips.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Simple Monthly Prices */}
      <section id="prices" className="py-14 sm:py-20 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {tr('Simple monthly plans')}
            </h2>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
              {tr('One flat monthly price. No extra booking fees.')}
            </p>
          </div>

          <div className="max-w-xl mx-auto mb-10 p-5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5 text-sm">
              <span className="font-semibold text-slate-600 dark:text-slate-300">{tr('How many cars do you own?')}</span>
              <span className="font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                {calculatorCars} {tr('Cars')}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={calculatorCars}
              onChange={(e) => setCalculatorCars(Number(e.target.value))}
              className="w-full h-2 cursor-pointer"
            />
            <div className="mt-2.5 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>1</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {tr('Recommended plan')}: {getRecommendedPlanName(calculatorCars)}
              </span>
              <span>40+</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* Plan 1 */}
            <div className="p-6 sm:p-7 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 kf-card flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-base font-semibold text-slate-600 dark:text-slate-300">{tr('Small Fleet')}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                    {formatMoney(35000)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">/ {tr('mo')}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{tr('For small owners with up to 5 cars.')}</p>
                <ul className="space-y-2 pt-2 text-sm text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Up to 5 cars')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('No double bookings')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Driver list & SMS alerts')}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {tr('Start now')}
              </button>
            </div>

            {/* Plan 2 */}
            <div className="p-6 sm:p-7 rounded-xl bg-white dark:bg-[#0f172a] border accent-border kf-card flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold accent-text">{tr('Growing Fleet')}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md accent-tint accent-text">
                    {tr('Most popular')}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                    {formatMoney(75000)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">/ {tr('mo')}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{tr('For rental companies with up to 20 cars.')}</p>
                <ul className="space-y-2 pt-2 text-sm text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Up to 20 cars')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Weekly trip calendar')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Driver SMS (Kinyarwanda & English)')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Online booking website')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Airport flight alerts')}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 transition-opacity"
              >
                {tr('Start now')}
              </button>
            </div>

            {/* Plan 3 */}
            <div className="p-6 sm:p-7 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 kf-card flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-base font-semibold text-slate-600 dark:text-slate-300">{tr('Large Fleet')}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                    {formatMoney(150000)}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">/ {tr('mo')}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{tr('For big safari & company fleets with unlimited cars.')}</p>
                <ul className="space-y-2 pt-2 text-sm text-slate-800 dark:text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Unlimited cars & drivers')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Multiple offices & towns')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Tax & payment reports')}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />{tr('Direct help in Kigali')}</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="mt-6 w-full py-2.5 rounded-lg text-sm font-semibold bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {tr('Start now')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Common Questions */}
      <section id="help" className="py-14 sm:py-20 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white text-center mb-8">
            {tr('Common questions')}
          </h2>

          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111827] kf-card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 accent-text shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Bottom Call to Action & Footer */}
      <section className="py-14 sm:py-16 bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {tr('Ready to try KigaliFleet?')}
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400">
            {tr('Open the app now or see how your customers book a car online.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={onEnterApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm accent-bg hover:opacity-95"
            >
              <span>{tr('Open App')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenStorefront}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe className="w-4 h-4 accent-text" />
              <span>{tr('Book a Car')}</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-50 dark:bg-[#090d16] py-8 text-sm text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center accent-bg">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">KigaliFleet</span>
              <span className="mx-2">·</span>
              <span>{tr('Kigali, Rwanda')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white">{tr('How it works')}</a>
            <a href="#try-it" className="hover:text-slate-900 dark:hover:text-white">{tr('Try it')}</a>
            <a href="#prices" className="hover:text-slate-900 dark:hover:text-white">{tr('Prices')}</a>
            <button type="button" onClick={onOpenStorefront} className="hover:text-slate-900 dark:hover:text-white">{tr('Book a Car')}</button>
            <button type="button" onClick={onEnterApp} className="accent-text hover:underline font-semibold">{tr('Open App')}</button>
          </div>

          <div className="text-sm">© 2026 KigaliFleet</div>
        </div>
      </footer>
    </div>
  );
};
