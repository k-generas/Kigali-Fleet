import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, Booking, VehicleCategory, Company, CompanySettings, SupportTicket } from '../types';
import {
  calculateDays,
  formatRwf,
  getAvailableVehiclesForClass,
  getCategoryAvailabilitySummary,
  checkBookingCollision,
} from '../utils/collision';
import {
  Calendar,
  Car,
  ShieldCheck,
  ShieldAlert,
  Plane,
  CheckCircle2,
  Users,
  Fuel,
  ArrowRight,
  ArrowLeft,
  Share2,
  ExternalLink,
  Phone,
  MessageSquare,
  Lock,
  Sparkles,
  Check,
  AlertTriangle,
  Copy,
  Printer,
  Download,
  Search,
  Compass,
  MapPin,
  Clock,
  Briefcase,
  HelpCircle,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Info,
  Award,
  Globe,
  Send,
  Building,
  Luggage,
  Navigation,
  Star,
  RefreshCw,
  Eye,
  UserCheck,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  Filter,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { ColorTheme } from '../theme';

interface PublicStorefrontViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  currentTheme?: ColorTheme;
  currentCompany?: Company;
  companySettings?: CompanySettings;
  onCompleteClientBooking: (
    booking: Omit<Booking, 'id' | 'created_at' | 'dispatch_status'>
  ) => { success: boolean; booking?: Booking; error?: string };
  onReturnToManager: (newBookingId?: string) => void;
}

export type StorefrontViewMode =
  | 'home'
  | 'vehicles'
  | 'vehicle-detail'
  | 'book'
  | 'verification'
  | 'checkout'
  | 'confirmation'
  | 'voucher'
  | 'track'
  | 'quote'
  | 'contact'
  | 'about'
  | 'terms'
  | 'cancellation'
  | 'faq'
  | 'account';

type ServiceType = 'self-drive' | 'chauffeur' | 'airport' | 'safari';
type Currency = 'RWF' | 'USD';
type Language = 'EN' | 'RW' | 'FR';

const USD_RATE = 1350; // 1 USD = 1,350 RWF

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  vehicles,
  drivers,
  bookings,
  currentTheme,
  currentCompany,
  companySettings,
  onCompleteClientBooking,
  onReturnToManager,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  // Primary Navigation Sub-View
  const [currentView, setCurrentView] = useState<StorefrontViewMode>('home');
  const [currency, setCurrency] = useState<Currency>('RWF');
  const [language, setLanguage] = useState<Language>('EN');
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Service in Search Widget
  const [serviceType, setServiceType] = useState<ServiceType>('self-drive');

  // Search & Filter Parameters
  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-18');
  const [pickupLocation, setPickupLocation] = useState('Kigali International Airport (KIA)');
  const [returnLocation, setReturnLocation] = useState('Kigali International Airport (KIA)');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterTransmission, setFilterTransmission] = useState<string>('All');
  const [filterFuel, setFilterFuel] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'capacity'>('price-asc');

  // Airport Transfer specific fields (Section 24)
  const [flightNumber, setFlightNumber] = useState('WB 402');
  const [flightAirline, setFlightAirline] = useState('RwandAir');
  const [airportTerminal, setAirportTerminal] = useState('Arrivals Hall Gate 1');
  const [hotelDestination, setHotelDestination] = useState('Kigali Marriott Hotel, KN 3 Ave');
  const [passengerCount, setPassengerCount] = useState(2);
  const [luggageCount, setLuggageCount] = useState(3);
  const [meetGreetSign, setMeetGreetSign] = useState(true);

  // Safari & Tour specific fields (Section 25)
  const [safariPark, setSafariPark] = useState('Akagera National Park (Big 5 Game Drive)');
  const [safariPopUpRoof, setSafariPopUpRoof] = useState(true);

  // Selected vehicle for details & booking
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0] || null);

  // Guided 5-Step Booking State (Section 7, 8, 9)
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [clientName, setClientName] = useState('Elizabeth Thorne');
  const [clientPhone, setClientPhone] = useState('+250 788 456 789');
  const [clientEmail, setClientEmail] = useState('e.thorne@awf-conservation.org');
  const [countryResidence, setCountryResidence] = useState('United Kingdom');
  const [organization, setOrganization] = useState('African Wildlife Foundation');
  const [tinNumber, setTinNumber] = useState('109823471');
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('PO-AWF-2026-081');
  const [driverLanguagePref, setDriverLanguagePref] = useState<'EN' | 'RW' | 'FR'>('EN');
  const [specialRequests, setSpecialRequests] = useState('Require bilingual driver and 4WD high-clearance for game drive.');

  // Document Verification State (Page 5, Section 8)
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('DL-UK-884920194');
  const [passportNumber, setPassportNumber] = useState('GB99201481');
  const [documentVerified, setDocumentVerified] = useState(true);

  // Add-on Extras (Section 6, 7)
  const [addonChauffeur, setAddonChauffeur] = useState(false);
  const [addonChildSeat, setAddonChildSeat] = useState(false);
  const [addonWifiHotspot, setAddonWifiHotspot] = useState(true);
  const [addonSafariKit, setAddonSafariKit] = useState(false);

  // Checkout Payment State (Section 9)
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'>('MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState('+250 788 456 789');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [bookingReferenceId, setBookingReferenceId] = useState<string>('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Live Booking Tracker State (Section 12)
  const [trackRefInput, setTrackRefInput] = useState('');
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<Booking | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Corporate Multi-Vehicle Quotation Form (Section 22 & 26)
  const [quoteLandCruisers, setQuoteLandCruisers] = useState(2);
  const [quoteCoasters, setQuoteCoasters] = useState(1);
  const [quoteSedans, setQuoteSedans] = useState(1);
  const [quoteDays, setQuoteDays] = useState(4);
  const [quoteOrganization, setQuoteOrganization] = useState('UNDP Regional Delegation');
  const [quoteContactName, setQuoteContactName] = useState('Marcus Vance');
  const [quoteEmail, setQuoteEmail] = useState('marcus.vance@undp.org');
  const [quotePhone, setQuotePhone] = useState('+250 788 901 234');
  const [quoteNotes, setQuoteNotes] = useState('Need 3 professional English-speaking drivers for a 4-day summit mission across Kigali and Musanze.');
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);

  // Customer Support Ticket Form (Section 14)
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketBookingRef, setTicketBookingRef] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Existing reservation inquiry');
  const [ticketPriority, setTicketPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string | null>(null);

  // Cancellation Request State (Section 17)
  const [cancelBookingRef, setCancelBookingRef] = useState('');
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelReason, setCancelReason] = useState('Flight itinerary rescheduled by airline');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // FAQ Search & Accordion State (Section 18)
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<'All' | 'Booking' | 'Airport' | 'Safari' | 'Payments'>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Rental duration in days
  const days = calculateDays(startDate, endDate);

  // Currency Converter helper
  const formatMoney = (amountRwf: number) => {
    if (currency === 'USD') {
      const usd = Math.round(amountRwf / USD_RATE);
      return `$${usd.toLocaleString()} USD`;
    }
    return formatRwf(amountRwf);
  };

  // Company Details (Selling the transport company, not KigaliFleet SaaS)
  const companyDisplayName = currentCompany?.name || 'Kigali Executive Rentals';
  const companyPhone = currentCompany?.phone || '+250 788 312 000';
  const companyEmail = currentCompany?.email || 'dispatch@kigaliexecutive.rw';
  const companySlug = currentCompany?.slug || 'kigali-executive';
  const companyBio =
    companySettings?.storefront_tagline ||
    'Premium 4x4 Safari Rentals, VIP Chauffeurs & Airport Transfers across Rwanda';

  // Live URL for sharing
  const liveUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?tab=storefront`
      : `https://kigalifleet.rw/booking/${companySlug}`;

  // Itemized Pricing Engine calculations (Section 28)
  const activeDailyRate = selectedVehicle?.daily_rate_rwf || 120000;
  const baseRentalRwf = days * activeDailyRate;

  // Safari peak season surge (+15% for June-Sept, Dec)
  const isSafariPeak = useMemo(() => {
    const month = parseInt(startDate.split('-')[1] || '11', 10);
    return [6, 7, 8, 9, 12].includes(month);
  }, [startDate]);

  // Upcountry distance allowance (+25,000 RWF/day for destinations outside Kigali)
  const isUpcountry = useMemo(() => {
    const text = `${pickupLocation} ${returnLocation} ${hotelDestination} ${safariPark}`.toLowerCase();
    return /musanze|akagera|volcanoes|rubavu|nyungwe|kivu|gisenyi|karongi/i.test(text);
  }, [pickupLocation, returnLocation, hotelDestination, safariPark]);

  const safariSurgeRwf = isSafariPeak ? Math.round(baseRentalRwf * 0.15) : 0;
  const upcountrySurgeRwf = isUpcountry ? days * 25000 : 0;

  // Add-ons cost
  const chauffeurCostRwf =
    addonChauffeur || serviceType === 'chauffeur' ? days * 15000 : 0;
  const childSeatCostRwf = addonChildSeat ? days * 5000 : 0;
  const wifiHotspotCostRwf = addonWifiHotspot ? days * 7500 : 0;
  const safariKitCostRwf =
    addonSafariKit || (serviceType === 'safari' && safariPopUpRoof) ? days * 20000 : 0;

  const totalAddonsRwf =
    chauffeurCostRwf + childSeatCostRwf + wifiHotspotCostRwf + safariKitCostRwf;
  const subtotalBeforeVatRwf =
    baseRentalRwf + safariSurgeRwf + upcountrySurgeRwf + totalAddonsRwf;
  const vatRwf = Math.round(subtotalBeforeVatRwf * 0.18);
  const securityDepositRwf = 150000; // 100% Refundable
  const grandTotalRwf = subtotalBeforeVatRwf + vatRwf;

  const depositPercent = companySettings?.storefront_deposit_percent || 30;
  const depositToPayNowRwf =
    paymentOption === 'deposit'
      ? Math.round(grandTotalRwf * (depositPercent / 100))
      : grandTotalRwf;

  // Vehicle inventory filtered by category, transmission, fuel, and published settings
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        if (selectedCategory !== 'All' && v.category !== selectedCategory) return false;
        if (filterTransmission !== 'All' && v.transmission !== filterTransmission) return false;
        if (filterFuel !== 'All' && v.fuel_type !== filterFuel) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.daily_rate_rwf - b.daily_rate_rwf;
        if (sortBy === 'price-desc') return b.daily_rate_rwf - a.daily_rate_rwf;
        if (sortBy === 'capacity') return b.seating_capacity - a.seating_capacity;
        return 0;
      });
  }, [vehicles, selectedCategory, filterTransmission, filterFuel, sortBy]);

  // Navigate to book vehicle
  const handleStartBookingVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setBookingStep(1);
    setCurrentView('book');
    setSubmissionError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View full details of vehicle
  const handleViewVehicleDetails = (v: Vehicle) => {
    setSelectedVehicle(v);
    setCurrentView('vehicle-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Complete client booking
  const handleConfirmReservation = () => {
    if (!selectedVehicle) return;
    setIsSubmittingBooking(true);
    setSubmissionError(null);

    // Collision check against current bookings
    const collision = checkBookingCollision(
      selectedVehicle.id,
      startDate,
      endDate,
      bookings
    );
    if (collision.hasCollision) {
      setIsSubmittingBooking(false);
      setSubmissionError(
        collision.conflictReason ||
          'This vehicle is no longer available for these selected dates. Please select another vehicle or modify dates.'
      );
      return;
    }

    const availableDriver =
      drivers.find((d) => d.status === 'Available') || drivers[0];
    const refCode = `KGF-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const effectiveDestination =
      serviceType === 'airport'
        ? `${pickupLocation} (${flightAirline} ${flightNumber}) -> ${hotelDestination}`
        : serviceType === 'safari'
        ? `Kigali -> ${safariPark}`
        : `${pickupLocation} -> ${returnLocation}`;

    const res = onCompleteClientBooking({
      client_name: isCorporateBooking
        ? `${clientName} (${organization})`
        : clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      vehicle_id: selectedVehicle.id,
      driver_id: availableDriver ? availableDriver.id : '',
      start_date: startDate,
      end_date: endDate,
      total_rwf: grandTotalRwf,
      destination: effectiveDestination,
      flight_number:
        serviceType === 'airport' ? `${flightAirline} ${flightNumber}` : undefined,
      flight_status: serviceType === 'airport' ? 'Scheduled' : undefined,
      status: 'Confirmed',
      payment_status:
        paymentOption === 'deposit'
          ? 'Deposit Paid (MoMo)'
          : 'Fully Paid',
      payment_method: paymentMethod,
      notes: `${serviceType.toUpperCase()} | Extras: ${
        addonWifiHotspot ? 'Wi-Fi ' : ''
      }${addonChildSeat ? 'ChildSeat ' : ''}${
        isSafariPeak ? 'PeakSafari ' : ''
      }| Ref: ${refCode} | ${specialRequests}`,
    });

    setTimeout(() => {
      setIsSubmittingBooking(false);
      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
        setBookingReferenceId(refCode);
        setCurrentView('confirmation');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmissionError(res.error || 'Failed to complete booking.');
      }
    }, 600);
  };

  // Live booking tracking lookup
  const handleTrackBookingLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedBooking(null);

    const ref = trackRefInput.trim().toLowerCase();
    const phone = trackPhoneInput.trim().replace(/\s+/g, '');

    const found = bookings.find((b) => {
      const matchId =
        b.id.toLowerCase().includes(ref) || ref.includes(b.id.toLowerCase());
      const matchPhone =
        !phone || b.client_phone.replace(/\s+/g, '').includes(phone);
      return matchId && matchPhone;
    });

    if (found) {
      setTrackedBooking(found);
    } else {
      setTrackError(
        'No active reservation found matching reference code and phone. Please check your confirmation SMS or contact our 24/7 dispatch desk.'
      );
    }
  };

  // Submit Corporate Quote Request
  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const rfqId = `RFQ-KGF-${Math.floor(1000 + Math.random() * 9000)}`;
    setQuoteSuccessMsg(
      `Quotation request #${rfqId} submitted for ${quoteOrganization}. Our corporate transport desk will email your official RRA-compliant pro-forma invoice within 2 business hours.`
    );
  };

  // Submit Customer Support Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const tckId = `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketSubmittedId(tckId);
  };

  // Submit Cancellation Request
  const handleSubmitCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    const canId = `CAN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setCancelSuccessMsg(
      `Cancellation request #${canId} logged for booking ${cancelBookingRef}. Per our 72-hour policy, our accounts team is processing your eligible deposit refund to ${cancelPhone}.`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* =========================================================================
          1. CUSTOMER-FACING HELPLINE & LOCALIZATION BAR
      ========================================================================= */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* 24/7 Operations Contact & Terminal Info */}
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>24/7 Dispatch: <strong className="text-white font-mono">{companyPhone}</strong></span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline text-slate-600">·</span>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Kigali International Airport (KIA) Hub & Remera HQ</span>
            </div>
          </div>

          {/* Currency Switcher, Language Switcher & Subtle Operator Exit */}
          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-950 rounded-md p-0.5 border border-slate-800">
              <button
                onClick={() => setCurrency('RWF')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                  currency === 'RWF'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                RWF
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                  currency === 'USD'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950 rounded-md p-0.5 border border-slate-800 text-[11px] font-bold">
              {(['EN', 'RW', 'FR'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    language === lang
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Subtle Operator Hub Backlink */}
            <button
              onClick={() => onReturnToManager(confirmedBooking?.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-medium border border-slate-700/60 transition-colors"
              title="Return to Management Dashboard"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden md:inline">Operator Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. STRICT TOP BAR CONTRACT (Zone 1: Wordmark — Zone 2: Links — Zone 3: Action)
      ========================================================================= */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left text-white whitespace-nowrap shrink-0 group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-950 shadow-sm"
              style={{ backgroundColor: activeThemeColor }}
            >
              <Car className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
              {companyDisplayName}
            </span>
          </button>

          {/* Zone 2: Navigation Links (4-5 single-line clean text links) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              onClick={() => setCurrentView('home')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'home' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('vehicles')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'vehicles' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Fleet & Rates
            </button>
            <button
              onClick={() => {
                setServiceType('airport');
                setCurrentView('home');
              }}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Airport Transfer (KIA)
            </button>
            <button
              onClick={() => {
                setServiceType('safari');
                setCurrentView('home');
              }}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              Safari Expeditions
            </button>
            <button
              onClick={() => setCurrentView('track')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'track' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Track Reservation
            </button>
            <button
              onClick={() => setCurrentView('quote')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'quote' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Corporate RFP
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'contact' ? 'text-amber-400 font-bold' : ''
              }`}
            >
              Support Desk
            </button>
          </nav>

          {/* Zone 3: Primary Action & WhatsApp Shortcut */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/250788312000?text=${encodeURIComponent(
                `Muraho! I would like to inquire about booking a vehicle with ${companyDisplayName}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => {
                if (currentView === 'home') {
                  const el = document.getElementById('adaptive-search');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setCurrentView('vehicles');
                }
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap transition-transform active:scale-95 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              Book a Vehicle
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2.5 text-xs font-semibold text-slate-300 pb-2">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentView('vehicles');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Fleet & Rates ({vehicles.length} Vehicles)
            </button>
            <button
              onClick={() => {
                setServiceType('airport');
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Airport Transfer (KIA Arrivals)
            </button>
            <button
              onClick={() => {
                setServiceType('safari');
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Safari Expeditions (Akagera & Volcanoes)
            </button>
            <button
              onClick={() => {
                setCurrentView('track');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Track Reservation Status
            </button>
            <button
              onClick={() => {
                setCurrentView('quote');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Corporate Multi-Vehicle RFP
            </button>
            <button
              onClick={() => {
                setCurrentView('contact');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Customer Support Desk
            </button>
            <button
              onClick={() => {
                setCurrentView('faq');
                setMobileMenuOpen(false);
              }}
              className="text-left py-1 hover:text-amber-400"
            >
              Frequently Asked Questions
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN BODY ROUTER: Renders the active sub-view
      ========================================================================= */}
      <main className="flex-1">
        {/* =====================================================================
            VIEW 1: STOREFRONT HOMEPAGE (/booking/:slug)
        ===================================================================== */}
        {currentView === 'home' && (
          <div className="space-y-16 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-14 sm:py-20 px-4 sm:px-8">
              <div className="max-w-5xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span>RDB Licensed Transport Operator #RW-2024-9841</span>
                  <span aria-hidden="true">·</span>
                  <span>Kigali International Airport Hub</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
                  Explore Rwanda With the Right Vehicle.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Book reliable 4x4 Safari Land Cruisers, executive town SUVs, and VIP airport shuttles. Direct Kigali booking with verified physical fleet, bilingual chauffeurs, and instant MTN MoMo checkout.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById('adaptive-search');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold shadow-md transition-transform active:scale-95 ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Check Live Availability
                  </button>
                  <button
                    onClick={() => setCurrentView('vehicles')}
                    className="px-5 py-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    View All Vehicles & Daily Rates
                  </button>
                </div>

                {/* Trust Markers Bar */}
                <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400 border-t border-slate-800/80 max-w-4xl mx-auto mt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero Double-Booking Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rwanda Contrôle Technique Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Official 18% RRA EBM Invoicing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>24/7 Roadside Assistance</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Adaptive 4-Service Search Widget */}
            <section id="adaptive-search" className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
                {/* 4 Service Tabs (Functional Segmented Control) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setServiceType('self-drive')}
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      serviceType === 'self-drive'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Self-Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('chauffeur')}
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      serviceType === 'chauffeur'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>With Chauffeur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('airport')}
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      serviceType === 'airport'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plane className="w-4 h-4" />
                    <span>Airport (KIA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('safari')}
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      serviceType === 'safari'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Safari & Tours</span>
                  </button>
                </div>

                {/* Adaptive Inputs Based on Service */}
                {serviceType === 'airport' ? (
                  /* Dedicated Airport Transfer Form (Section 24) */
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Arrival Airport
                        </label>
                        <input
                          type="text"
                          disabled
                          value="Kigali International Airport (KGL / KIA)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Flight Number & Airline
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={flightAirline}
                            onChange={(e) => setFlightAirline(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                          >
                            <option value="RwandAir">RwandAir</option>
                            <option value="Ethiopian">Ethiopian</option>
                            <option value="Qatar">Qatar Airways</option>
                            <option value="KLM">KLM</option>
                            <option value="Brussels">Brussels Airlines</option>
                            <option value="Kenya Airways">Kenya Airways</option>
                          </select>
                          <input
                            type="text"
                            value={flightNumber}
                            onChange={(e) => setFlightNumber(e.target.value)}
                            placeholder="e.g. WB 402"
                            className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Arrival Date & Flight Time
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setEndDate(e.target.value);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Kigali Hotel or Destination
                        </label>
                        <input
                          type="text"
                          value={hotelDestination}
                          onChange={(e) => setHotelDestination(e.target.value)}
                          placeholder="e.g. Kigali Marriott, Serena Hotel"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Passengers & Luggage
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={passengerCount}
                            onChange={(e) => setPassengerCount(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                              <option key={n} value={n}>
                                {n} Pax
                              </option>
                            ))}
                          </select>
                          <select
                            value={luggageCount}
                            onChange={(e) => setLuggageCount(Number(e.target.value))}
                            className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                              <option key={n} value={n}>
                                {n} Bags
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                          <input
                            type="checkbox"
                            checked={meetGreetSign}
                            onChange={(e) => setMeetGreetSign(e.target.checked)}
                            className="rounded text-amber-500 focus:ring-0"
                          />
                          <span>Chauffeur Name Board at Terminal Gate 1</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : serviceType === 'safari' ? (
                  /* Dedicated Safari & Tours Form (Section 25) */
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Destination National Park
                        </label>
                        <select
                          value={safariPark}
                          onChange={(e) => setSafariPark(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none font-semibold"
                        >
                          <option value="Akagera National Park (Big 5 Game Drive)">
                            Akagera National Park (Big 5 Safari)
                          </option>
                          <option value="Volcanoes National Park (Gorilla Trek Musanze)">
                            Volcanoes NP (Gorilla Trekking)
                          </option>
                          <option value="Nyungwe Forest National Park (Canopy Walk)">
                            Nyungwe National Park (Canopy Walk)
                          </option>
                          <option value="Rubavu / Lake Kivu Serena Resort">
                            Lake Kivu & Rubavu Getaway
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Safari Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Safari Return Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold">
                        <input
                          type="checkbox"
                          checked={safariPopUpRoof}
                          onChange={(e) => setSafariPopUpRoof(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span>Pop-up Photography Roof (Custom 4x4 Safari Edition)</span>
                      </label>
                      <span className="font-mono text-amber-400 font-semibold">
                        {days} Days Itinerary Calculated
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Standard Self-Drive or Chauffeur Form */
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Pickup Location
                        </label>
                        <input
                          type="text"
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Return Location
                        </label>
                        <input
                          type="text"
                          value={returnLocation}
                          onChange={(e) => setReturnLocation(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Return Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Duration: <strong className="text-white">{days} Days</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Service: <strong className="text-amber-400 capitalize">{serviceType}</strong></span>
                  </div>

                  <button
                    onClick={() => setCurrentView('vehicles')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-bold shadow-md transition-transform active:scale-95 ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Search Available Fleet ({vehicles.length}) →
                  </button>
                </div>
              </div>
            </section>

            {/* Section 4: Featured Vehicles Showcase */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-amber-400">
                    Physical Inventory & Rates
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">
                    Featured Transport Vehicles
                  </h2>
                </div>

                <button
                  onClick={() => setCurrentView('vehicles')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Explore full fleet catalog</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of 3 marquee vehicles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vehicles.slice(0, 3).map((vehicle) => {
                  const collision = checkBookingCollision(
                    vehicle.id,
                    startDate,
                    endDate,
                    bookings
                  );
                  const isAvailable = !collision.hasCollision;

                  return (
                    <div
                      key={vehicle.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-slate-700 shadow-md group"
                    >
                      <div>
                        {/* Vehicle Header & Photo Slot */}
                        <div className="h-44 bg-slate-950 flex flex-col justify-between p-4 relative overflow-hidden">
                          <div className="flex items-center justify-between z-10">
                            <span className="text-xs font-mono font-semibold text-slate-400">
                              {vehicle.plate_number}
                            </span>
                            <span
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                isAvailable ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              <span>{isAvailable ? 'Available' : 'Reserved'}</span>
                            </span>
                          </div>

                          {/* Graphical Asset Silhouette */}
                          <div className="flex items-center justify-center my-auto text-slate-700 group-hover:text-amber-400/30 transition-colors">
                            <Car className="w-20 h-20 stroke-[1.2]" />
                          </div>

                          {/* Category and Year Unboxed Metadata */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 z-10">
                            <span>{vehicle.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>Model {vehicle.year}</span>
                          </div>
                        </div>

                        {/* Vehicle Title & Specs */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                              {vehicle.model_name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span>{vehicle.seating_capacity} Seats</span>
                              <span aria-hidden="true">·</span>
                              <span>{vehicle.transmission || 'Automatic'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{vehicle.fuel_type || 'Diesel'}</span>
                            </div>
                          </div>

                          {/* Transparent Highlights */}
                          <div className="space-y-1 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Full-to-Full Fuel Policy</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Unlimited Mileage in Rwanda</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer with Price and Actions */}
                      <div className="p-5 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Daily Rate:</span>
                          <span className="font-mono font-extrabold text-white text-base">
                            {formatMoney(vehicle.daily_rate_rwf)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewVehicleDetails(vehicle)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStartBookingVehicle(vehicle)}
                            disabled={!isAvailable}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isAvailable
                                ? `${activeBtnText} hover:brightness-105 active:scale-95`
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                            style={isAvailable ? { backgroundColor: activeThemeColor } : undefined}
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 5: Services Showcase */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 pt-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-400">
                  Tailored Mobility
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Transport Services Offered
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">01. Self-Drive Rentals</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Freedom to navigate Rwanda's thousand hills independently. Foreign licenses in English or French accepted for 90 days.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">02. Chauffeur-Driven</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Vetted bilingual English and Kinyarwanda drivers. Rwanda Police Bon de Mission cleared for inter-district travel.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Plane className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">03. Airport Transfers (KIA)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Reliable meet and greet at Kigali International Airport. Automated flight arrival monitoring prevents wait charges.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">04. Safari Expeditions</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Custom 4x4 Land Cruisers with pop-up photography roofs for Akagera Big 5 game drives and Volcanoes gorilla trekking.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 & 19: Trust & Transparency Pillars */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
                <div className="max-w-2xl space-y-2">
                  <span className="text-xs font-semibold text-amber-400">
                    Why Book Directly With Us
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Built on Accountability & Rwandan Legal Compliance
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    We eliminate double-booking fraud and surprise fees through strict inventory locking and transparent policies.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Collision-Guarded Engine</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Every reservation atomically locks the physical vehicle's schedule down to the second. You are guaranteed the exact vehicle booked.
                    </p>
                  </div>

                  <div className="space-y-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>RRA EBM v2.0 Tax Receipts</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Every payment generates an official Rwanda Revenue Authority electronic receipt with verified TIN for institutional expense reconciliation.
                    </p>
                  </div>

                  <div className="space-y-2 p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>MTN MoMo & Card Gateways</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Instant *182# MTN Mobile Money prompts, Airtel Money, Bank of Kigali wire transfers, and Visa/Mastercard support with 30% deposit options.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Verified Customer Reviews */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6 pt-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-400">
                  Client Experiences
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Verified Reviews & Feedback
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Dr. Arthur Mugabo</span>
                    <span className="text-slate-500 font-mono">Verified NGO Booking</span>
                  </div>
                  <div className="text-amber-400 text-xs">★★★★★</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Rented a Land Cruiser Prado for a 4-day UNDP field mission in Musanze. The vehicle was spotless, chauffeur Emmanuel was prompt, and the EBM receipt was emailed instantly."
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">UNDP Rwanda Country Mission</div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Sarah Jenkins</span>
                    <span className="text-slate-500 font-mono">Verified Tourist</span>
                  </div>
                  <div className="text-amber-400 text-xs">★★★★★</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Our flight from Amsterdam was delayed by 2 hours, but dispatch adjusted our pickup automatically. Chauffeur Jean-Paul was waiting at Gate 1 with cold water and a clear name sign."
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">Visitor from Netherlands</div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Patrick Habimana</span>
                    <span className="text-slate-500 font-mono">Local Business Client</span>
                  </div>
                  <div className="text-amber-400 text-xs">★★★★★</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "We rented two HiAce safari vans for conference delegates. The reservation was confirmed in minutes, no schedule overlap occurred, and MoMo checkout was completely painless."
                  </p>
                  <div className="text-[11px] text-slate-500 font-mono">Kigali Tech Summit Organizer</div>
                </div>
              </div>
            </section>

            {/* Section 8: 4-Step How Booking Works */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 pt-4">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-semibold text-amber-400">
                  Seamless Workflow
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  How Direct Booking Works
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-mono text-base font-bold text-amber-400">01</span>
                  <h3 className="font-bold text-white text-sm">Choose Service</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Select self-drive, chauffeur-driven, airport shuttle, or a national park safari itinerary.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-mono text-base font-bold text-amber-400">02</span>
                  <h3 className="font-bold text-white text-sm">Select Vehicle</h3>
                  <p className="text-slate-400 leading-relaxed">
                    View real verified photos, specs, itemized prices, and live collision-checked availability.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-mono text-base font-bold text-amber-400">03</span>
                  <h3 className="font-bold text-white text-sm">Confirm & Pay</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Pay 30% deposit or 100% full via MTN MoMo (*182#), Airtel, Bank of Kigali, or Visa.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="font-mono text-base font-bold text-amber-400">04</span>
                  <h3 className="font-bold text-white text-sm">Receive Voucher</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Receive your official travel voucher with driver details, flight pickup gate instructions, and SMS.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9: FAQ Quick Preview */}
            <section className="max-w-4xl mx-auto px-4 space-y-6 pt-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
                <button
                  onClick={() => setCurrentView('faq')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  View full FAQ directory →
                </button>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: 'What documents are required to rent a self-drive vehicle in Rwanda?',
                    a: 'A valid National Driving License (or International Driving Permit for foreign visitors) and a Passport or National ID. For tourists, foreign driving licenses in English or French are legally accepted for up to 90 days in Rwanda.',
                  },
                  {
                    q: 'How does the Collision-Guarded booking system protect my reservation?',
                    a: 'Our platform performs real-time physical inventory checks across every vehicle and date. Once you submit your reservation, the vehicle is atomically locked down to the millisecond, completely preventing double-bookings or replacement substitutions.',
                  },
                  {
                    q: 'What happens if my flight to Kigali International Airport (KIA) is delayed?',
                    a: 'Our dispatch center tracks inbound flights (RwandAir, Ethiopian, Qatar, KLM, Brussels Airlines) in real-time. When a flight is delayed, our dispatch team auto-adjusts the chauffeur pickup time without any extra waiting fees.',
                  },
                ].map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            VIEW 2: VEHICLE LISTING / SEARCH RESULTS (/booking/:slug/vehicles)
        ===================================================================== */}
        {currentView === 'vehicles' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
            {/* Search Summary Strip with Modify Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-amber-400">
                  Search Parameters
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                  <span>Pickup: <strong>{pickupLocation}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Dates: <strong className="font-mono">{startDate} to {endDate} ({days} days)</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Service: <strong className="capitalize">{serviceType}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  Modify Dates & Location
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['All', 'SUV', 'Safari 4x4', 'Sedan', 'Minibus', 'Pickup'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sorting & Secondary Filters */}
              <div className="flex items-center gap-3 text-xs">
                <label className="text-slate-400 flex items-center gap-1.5">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-medium outline-none"
                  >
                    <option value="price-asc">Lowest Price First</option>
                    <option value="price-desc">Highest Price First</option>
                    <option value="capacity">Passenger Capacity</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Vehicle Grid */}
            {filteredVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => {
                  const collision = checkBookingCollision(
                    vehicle.id,
                    startDate,
                    endDate,
                    bookings
                  );
                  const isAvailable = !collision.hasCollision;

                  return (
                    <div
                      key={vehicle.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:border-slate-700 shadow-md group"
                    >
                      <div>
                        {/* Photo Slot */}
                        <div className="h-44 bg-slate-950 flex flex-col justify-between p-4 relative overflow-hidden">
                          <div className="flex items-center justify-between z-10">
                            <span className="text-xs font-mono font-semibold text-slate-400">
                              {vehicle.plate_number}
                            </span>
                            <span
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                isAvailable ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              <span>{isAvailable ? 'Available' : 'Conflict'}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-center my-auto text-slate-700 group-hover:text-amber-400/30 transition-colors">
                            <Car className="w-20 h-20 stroke-[1.2]" />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 z-10">
                            <span>{vehicle.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>Model {vehicle.year}</span>
                          </div>
                        </div>

                        {/* Title & Specs */}
                        <div className="p-5 space-y-4">
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                              {vehicle.model_name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span>{vehicle.seating_capacity} Seats</span>
                              <span aria-hidden="true">·</span>
                              <span>{vehicle.transmission || 'Automatic'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{vehicle.fuel_type || 'Diesel'}</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-slate-300">
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Full-to-Full Fuel Policy</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Contrôle Technique Safety Inspected</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="p-5 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Daily Rate:</span>
                          <span className="font-mono font-extrabold text-white text-base">
                            {formatMoney(vehicle.daily_rate_rwf)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewVehicleDetails(vehicle)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStartBookingVehicle(vehicle)}
                            disabled={!isAvailable}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isAvailable
                                ? `${activeBtnText} hover:brightness-105 active:scale-95`
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                            style={isAvailable ? { backgroundColor: activeThemeColor } : undefined}
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback when no vehicles match (Section 5) */
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">
                  No vehicles match your selected category or filters
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Try clearing your category filter, adjusting your rental dates, or contact our dispatch desk directly on WhatsApp.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setFilterTransmission('All');
                      setFilterFuel('All');
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setCurrentView('contact')}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs border border-slate-700"
                  >
                    Contact Dispatch Desk
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 3: VEHICLE DETAILS PAGE (/booking/:slug/vehicles/:id)
        ===================================================================== */}
        {currentView === 'vehicle-detail' && selectedVehicle && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
            <button
              onClick={() => setCurrentView('vehicles')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to fleet catalog</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Gallery & Specifications */}
              <div className="lg:col-span-2 space-y-6">
                {/* Big Visual Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-8 space-y-6 text-center">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                    <span className="font-mono font-bold text-amber-400">{selectedVehicle.plate_number}</span>
                    <span>{selectedVehicle.category} · Year {selectedVehicle.year}</span>
                  </div>

                  <div className="py-6 flex items-center justify-center text-slate-600">
                    <Car className="w-32 h-32 stroke-[1.1]" />
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {selectedVehicle.model_name}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Rwanda Police Bon de Mission & Contrôle Technique Safety Cleared
                    </p>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Verified Specifications</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Seating</span>
                      <strong className="text-white text-sm">{selectedVehicle.seating_capacity} Seats</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Transmission</span>
                      <strong className="text-white text-sm">{selectedVehicle.transmission || 'Automatic'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Fuel Type</span>
                      <strong className="text-white text-sm">{selectedVehicle.fuel_type || 'Diesel'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Drivetrain</span>
                      <strong className="text-amber-400 text-sm">4WD Full-Time</strong>
                    </div>
                  </div>
                </div>

                {/* Rental Conditions & Transparent Inclusions (Section 6, Part D) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-white">Rental Conditions & Inclusions</h3>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Fuel Policy:</strong> Full-to-Full (delivered full tank, return full tank)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Mileage Allowance:</strong> 100% Unlimited mileage across all 30 districts of Rwanda</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Safety Certificate:</strong> Rwanda Contrôle Technique inspection active</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Cancellation:</strong> 100% Free cancellation up to 72 hours before trip start</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Price Calculator & Booking Action */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                      Daily Rate
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {formatMoney(selectedVehicle.daily_rate_rwf)}
                    </span>
                  </div>

                  {/* Calculator Breakdown */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Duration:</span>
                      <span className="text-white">{days} Days</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Base Rental:</span>
                      <span className="text-white">{formatMoney(baseRentalRwf)}</span>
                    </div>

                    {isSafariPeak && (
                      <div className="flex justify-between text-amber-400">
                        <span>+ Safari Peak (15%):</span>
                        <span>+{formatMoney(safariSurgeRwf)}</span>
                      </div>
                    )}

                    {isUpcountry && (
                      <div className="flex justify-between text-amber-400">
                        <span>+ Upcountry Allowance:</span>
                        <span>+{formatMoney(upcountrySurgeRwf)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-emerald-400">
                      <span>+ RRA 18% VAT:</span>
                      <span>+{formatMoney(vatRwf)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400">
                      <span>Refundable Deposit:</span>
                      <span>{formatMoney(securityDepositRwf)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-white font-bold text-sm">
                      <span>Total Estimated:</span>
                      <span className="text-amber-400 text-base">{formatMoney(grandTotalRwf)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartBookingVehicle(selectedVehicle)}
                    className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Proceed to Book This Vehicle →
                  </button>

                  <div className="text-[11px] text-slate-400 text-center space-y-1">
                    <div>Direct booking with {companyDisplayName}</div>
                    <div className="text-emerald-400 font-semibold">Instant confirmation available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 4: GUIDED 5-STEP BOOKING FLOW (/booking/:slug/book/:id)
        ===================================================================== */}
        {currentView === 'book' && selectedVehicle && (
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <button
                  onClick={() => setCurrentView('vehicles')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Vehicle</span>
                </button>
                <h1 className="text-xl font-extrabold text-white">
                  Reserve {selectedVehicle.model_name}
                </h1>
              </div>

              {/* Steps Progress */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={bookingStep >= 1 ? 'text-amber-400' : 'text-slate-600'}>1. Service</span>
                <span className="text-slate-600">→</span>
                <span className={bookingStep >= 2 ? 'text-amber-400' : 'text-slate-600'}>2. Extras</span>
                <span className="text-slate-600">→</span>
                <span className={bookingStep >= 3 ? 'text-amber-400' : 'text-slate-600'}>3. Passenger</span>
                <span className="text-slate-600">→</span>
                <span className={bookingStep >= 4 ? 'text-amber-400' : 'text-slate-600'}>4. Verification</span>
                <span className="text-slate-600">→</span>
                <span className={bookingStep >= 5 ? 'text-amber-400' : 'text-slate-600'}>5. Review</span>
              </div>
            </div>

            {/* STEP 1: Service & Dates */}
            {bookingStep === 1 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <h2 className="text-sm font-bold text-white">Step 1: Service Selection & Dates</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['self-drive', 'chauffeur', 'airport', 'safari'] as ServiceType[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setServiceType(st)}
                      className={`py-2 rounded-lg text-xs font-bold capitalize transition-colors ${
                        serviceType === st ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pickup Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Return Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pickup Location</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Return Location</label>
                    <input
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setBookingStep(2)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Add Optional Extras →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Optional Extras & Add-ons */}
            {bookingStep === 2 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <h2 className="text-sm font-bold text-white">Step 2: Add-ons & Equipment</h2>

                <div className="space-y-3 text-xs">
                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonChauffeur}
                        onChange={(e) => setAddonChauffeur(e.target.checked)}
                        className="mt-0.5 rounded text-amber-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">Professional Bilingual Chauffeur</div>
                        <div className="text-[11px] text-slate-400">Driver per-diem and police-cleared Bon de Mission included</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-300">+{formatMoney(15000)}/day</span>
                  </label>

                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonWifiHotspot}
                        onChange={(e) => setAddonWifiHotspot(e.target.checked)}
                        className="mt-0.5 rounded text-amber-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">Portable 4G LTE Wi-Fi Hotspot</div>
                        <div className="text-[11px] text-slate-400">Unlimited high-speed MTN Rwanda data for up to 5 devices</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-300">+{formatMoney(7500)}/day</span>
                  </label>

                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonChildSeat}
                        onChange={(e) => setAddonChildSeat(e.target.checked)}
                        className="mt-0.5 rounded text-amber-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-semibold text-white">Child Safety Car Seat</div>
                        <div className="text-[11px] text-slate-400">ISOFIX certified infant or toddler safety booster</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-300">+{formatMoney(5000)}/day</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between">
                  <button
                    onClick={() => setBookingStep(1)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setBookingStep(3)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Passenger Details →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Customer Information (4 Personas Supported) */}
            {bookingStep === 3 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Step 3: Customer Information</h2>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCorporateBooking(false)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                        !isCorporateBooking ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Individual / Tourist
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCorporateBooking(true)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                        isCorporateBooking ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Corporate / NGO
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">WhatsApp / Phone Number</label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email (for travel voucher)</label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Country of Residence</label>
                    <input
                      type="text"
                      value={countryResidence}
                      onChange={(e) => setCountryResidence(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                {/* Corporate Specific Fields */}
                {isCorporateBooking && (
                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-3">
                    <span className="font-bold text-blue-300 block">Corporate Tax & Billing Data (RRA Invoicing):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Organization / Embassy</label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">RRA TIN Number</label>
                        <input
                          type="text"
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Purchase Order (PO) Ref</label>
                        <input
                          type="text"
                          value={purchaseOrderRef}
                          onChange={(e) => setPurchaseOrderRef(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Special Flight or Trip Instructions</label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setBookingStep(4)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Verification Details →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Document Verification (Section 8) */}
            {bookingStep === 4 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-xs">
                <div>
                  <h2 className="text-sm font-bold text-white">Step 4: Driver License & Document Verification</h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {serviceType === 'self-drive'
                      ? 'Required for self-drive insurance and Rwanda traffic police compliance.'
                      : 'For chauffeur and airport transfers, basic ID verification ensures seamless vehicle dispatch.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Driving License Number</label>
                    <input
                      type="text"
                      value={drivingLicenseNumber}
                      onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                      placeholder="e.g. DL-RWA-2022-881"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Passport or National ID</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="e.g. 1198980012345678"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">Digital Identity Verification Status</span>
                    <span className="text-slate-400 text-[11px]">Encrypted & accessible only to authorized dispatch personnel</span>
                  </div>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between">
                  <button
                    onClick={() => setBookingStep(3)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setBookingStep(5)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Review & Payment Checkout →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Final Review & Checkout (Section 9) */}
            {bookingStep === 5 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-xs">
                <h2 className="text-sm font-bold text-white">Step 5: Review & Confirm Reservation</h2>

                {/* Transparent Financial Itemization */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Rental ({days} days @ {formatMoney(selectedVehicle.daily_rate_rwf)}/day):</span>
                    <span className="text-white">{formatMoney(baseRentalRwf)}</span>
                  </div>

                  {isSafariPeak && (
                    <div className="flex justify-between text-amber-400">
                      <span>+ High Safari Season Peak (+15%):</span>
                      <span>+{formatMoney(safariSurgeRwf)}</span>
                    </div>
                  )}

                  {isUpcountry && (
                    <div className="flex justify-between text-amber-400">
                      <span>+ Upcountry Safari Distance Allowance:</span>
                      <span>+{formatMoney(upcountrySurgeRwf)}</span>
                    </div>
                  )}

                  {totalAddonsRwf > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>+ Selected Equipment & Add-ons:</span>
                      <span>+{formatMoney(totalAddonsRwf)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-400">
                    <span>+ Rwanda Revenue Authority VAT (18%):</span>
                    <span>+{formatMoney(vatRwf)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>Security Deposit (100% Refundable):</span>
                    <span className="text-slate-300">{formatMoney(securityDepositRwf)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-amber-400 text-base">{formatMoney(grandTotalRwf)}</span>
                  </div>
                </div>

                {/* Deposit Option Toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer ${
                      paymentOption === 'deposit'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'deposit'}
                      onChange={() => setPaymentOption('deposit')}
                      className="sr-only"
                    />
                    <div className="font-bold text-xs">Pay 30% Deposit Now</div>
                    <div className="font-mono text-sm text-amber-400 font-bold mt-1">
                      {formatMoney(depositToPayNowRwf)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Remaining balance on vehicle handover</div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer ${
                      paymentOption === 'full'
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'full'}
                      onChange={() => setPaymentOption('full')}
                      className="sr-only"
                    />
                    <div className="font-bold text-xs">Pay 100% Full Total</div>
                    <div className="font-mono text-sm text-emerald-400 font-bold mt-1">
                      {formatMoney(grandTotalRwf)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Includes full settlement and EBM receipt</div>
                  </label>
                </div>

                {/* Payment Gateway Selector */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Payment Gateway</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none font-medium"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (*182# Prompt Dispatch)</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank Transfer">Bank of Kigali / I&M Wire Transfer</option>
                    <option value="Credit Card">Visa / Mastercard / Amex</option>
                  </select>
                </div>

                {paymentMethod === 'MTN Mobile Money' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      MTN MoMo Number for Instant PIN Prompt
                    </label>
                    <input
                      type="text"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+250 788 123 456"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono font-bold"
                    />
                  </div>
                )}

                {/* Terms Acceptance */}
                <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-0"
                  />
                  <span>
                    I accept the rental terms, fuel full-to-full policy, and 72-hour cancellation rules of {companyDisplayName}.
                  </span>
                </label>

                {submissionError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                    {submissionError}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex justify-between">
                  <button
                    onClick={() => setBookingStep(4)}
                    className="px-4 py-2 text-slate-400 hover:text-white text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmReservation}
                    disabled={!termsAgreed || isSubmittingBooking}
                    className={`py-3 px-6 rounded-xl font-bold text-xs shadow-md transition-all ${
                      termsAgreed && !isSubmittingBooking
                        ? `${activeBtnText} hover:brightness-105 active:scale-95`
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    style={termsAgreed && !isSubmittingBooking ? { backgroundColor: activeThemeColor } : undefined}
                  >
                    {isSubmittingBooking
                      ? 'Locking Inventory & Dispatching...'
                      : `Confirm & Pay ${formatMoney(depositToPayNowRwf)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            VIEW 7: BOOKING CONFIRMATION (/booking/:slug/confirmation/:ref)
        ===================================================================== */}
        {currentView === 'confirmation' && confirmedBooking && (
          <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
            <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h1 className="text-xl font-extrabold text-white">Reservation Confirmed & Inventory Locked!</h1>
              <div className="font-mono text-base text-amber-400 font-bold">
                REFERENCE: #{bookingReferenceId || confirmedBooking.id}
              </div>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                An official confirmation SMS and email have been dispatched to <strong>{confirmedBooking.client_phone}</strong>. Your chauffeur and physical vehicle schedule are permanently locked.
              </p>
            </div>

            {/* Next Steps Timeline (Section 10) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="font-bold text-white text-sm">What Happens Next</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <strong className="text-white">Physical Vehicle Prep:</strong> Vehicle {selectedVehicle.plate_number} enters inspection and sanitization protocol.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <strong className="text-white">Chauffeur Contact:</strong> Your assigned driver details and live WhatsApp contact are sent 4 hours before pickup.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <strong className="text-white">Meet & Greet:</strong> At KIA Arrivals Gate 1 or your designated address, your driver will present an official company signboard.
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCurrentView('voucher')}
                className="w-full sm:w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>View Official Travel Voucher</span>
              </button>
              <button
                onClick={() => {
                  setTrackRefInput(bookingReferenceId || confirmedBooking.id);
                  setTrackPhoneInput(confirmedBooking.client_phone);
                  setTrackedBooking(confirmedBooking);
                  setCurrentView('track');
                }}
                className={`w-full sm:w-1/2 py-2.5 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                Track Live Booking Status →
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 8: OFFICIAL TRAVEL DOCUMENT / VOUCHER (Section 11, Printable PDF)
        ===================================================================== */}
        {currentView === 'voucher' && (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between no-print">
              <button
                onClick={() => setCurrentView('home')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Storefront</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            {/* Printable Letterhead Paper Document */}
            <div className="p-8 sm:p-10 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-300 space-y-6 font-sans">
              {/* Header Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                    {companyDisplayName}
                  </h1>
                  <div className="text-xs text-slate-600 mt-0.5">
                    RDB Registered Fleet Operator #RW-2024-9841 · Contrôle Technique Certified
                  </div>
                  <div className="text-xs text-slate-600">
                    Kigali International Airport Hub & Remera HQ, Kigali, Rwanda
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    CONFIRMED & GUARANTEED
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                    VOUCHER #{bookingReferenceId || confirmedBooking?.id || 'KGF-2026-90412'}
                  </div>
                </div>
              </div>

              {/* Barcode Mock & Verification Banner */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Service Type:</span>
                  <strong className="text-slate-900 capitalize">{serviceType} Service</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Booking Status:</span>
                  <strong className="text-emerald-700">Physical Inventory Locked</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">RRA EBM Receipt:</span>
                  <strong className="font-mono text-slate-900">EBM-2026-88491</strong>
                </div>
              </div>

              {/* Customer & Vehicle Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Lead Passenger:</span>
                  <strong className="text-slate-900 text-sm">{confirmedBooking?.client_name || clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Phone / WhatsApp:</span>
                  <strong className="text-slate-900 font-mono">{confirmedBooking?.client_phone || clientPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Vehicle:</span>
                  <strong className="text-slate-900 text-sm">
                    {selectedVehicle.model_name} [{selectedVehicle.plate_number}]
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Rental Period:</span>
                  <strong className="text-slate-900 font-mono">
                    {startDate} to {endDate} ({days} days)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pickup Gate & Destination:</span>
                  <strong className="text-slate-900">
                    {confirmedBooking?.destination || `${pickupLocation} -> ${returnLocation}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">24/7 Dispatch Desk Hotline:</span>
                  <strong className="text-amber-800 font-mono">{companyPhone}</strong>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Base Rental Rate ({days} days):</span>
                  <span>{formatRwf(baseRentalRwf)}</span>
                </div>
                {safariSurgeRwf > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Safari Season Surcharge:</span>
                    <span>{formatRwf(safariSurgeRwf)}</span>
                  </div>
                )}
                {totalAddonsRwf > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Equipment & Add-ons:</span>
                    <span>{formatRwf(totalAddonsRwf)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Rwanda 18% VAT (RRA Invoiced):</span>
                  <span>{formatRwf(vatRwf)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-300 text-sm">
                  <span>Total Amount Paid / Authorized:</span>
                  <span>{formatRwf(confirmedBooking?.total_rwf || grandTotalRwf)}</span>
                </div>
              </div>

              {/* Pickup Instructions */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-1.5 text-amber-950">
                <strong className="block font-bold">Important Pickup Instructions:</strong>
                <p>
                  • For Airport Pickups: Proceed through Customs to Arrivals Gate 1. Your chauffeur will be holding an official signboard with your name.
                </p>
                <p>
                  • For Self-Drive Handover: Present your original driving license and passport. Vehicle will be inspected and delivered with a 100% full fuel tank.
                </p>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-200 font-mono">
                Official travel document issued by {companyDisplayName}. Powered by KigaliFleet Platform.
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 9: LIVE BOOKING TRACKING (/booking/:slug/track)
        ===================================================================== */}
        {currentView === 'track' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-400" />
                  <span>Track Your Reservation Status</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your Booking Reference (e.g. KGF-2026-00128 or #bk-2026-089) and phone number.
                </p>
              </div>

              <form onSubmit={handleTrackBookingLookup} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Booking Reference</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KGF-2026-00128 or bk-2026-089"
                      value={trackRefInput}
                      onChange={(e) => setTrackRefInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Customer Phone Number</label>
                    <input
                      type="text"
                      placeholder="+250 788 123 456"
                      value={trackPhoneInput}
                      onChange={(e) => setTrackPhoneInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                {trackError && (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                    {trackError}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Search Live Status
                </button>
              </form>

              {/* Tracked Booking Result */}
              {trackedBooking && (
                <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                        Reservation #{trackedBooking.id}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {trackedBooking.client_name}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {trackedBooking.status}
                    </span>
                  </div>

                  {/* 4-Stage Mission Timeline */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold">
                      ✓ 1. Confirmed
                    </div>
                    <div className={`p-2.5 rounded-lg border ${
                      trackedBooking.driver_id
                        ? 'bg-slate-900 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      {trackedBooking.driver_id ? '✓ 2. Chauffeur Assigned' : '2. Assigning Chauffeur'}
                    </div>
                    <div className={`p-2.5 rounded-lg border ${
                      trackedBooking.dispatch_status === 'Client Onboard' || trackedBooking.dispatch_status === 'Driver at Terminal'
                        ? 'bg-slate-900 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      3. {trackedBooking.dispatch_status}
                    </div>
                    <div className={`p-2.5 rounded-lg border ${
                      trackedBooking.status === 'Completed'
                        ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      4. Completed
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-4 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Rental Period:</span>
                      <span className="text-white font-mono font-semibold">
                        {trackedBooking.start_date} to {trackedBooking.end_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pickup Destination:</span>
                      <span className="text-white font-semibold truncate block">
                        {trackedBooking.destination}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Payment Status:</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {trackedBooking.payment_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Booking Value:</span>
                      <span className="text-amber-400 font-mono font-bold">
                        {formatRwf(trackedBooking.total_rwf)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setConfirmedBooking(trackedBooking);
                        setCurrentView('voucher');
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View Official Voucher</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 10: CORPORATE MULTI-VEHICLE RFP QUOTATION (/booking/:slug/quote)
        ===================================================================== */}
        {currentView === 'quote' && (
          <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-400" />
                  <span>Request Corporate Multi-Vehicle Quotation (RFP)</span>
                </h1>
                <p className="text-slate-400 mt-1">
                  For NGOs, diplomatic embassies, governmental delegations, and multi-day international summits in Rwanda.
                </p>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Organization / Embassy Name</label>
                    <input
                      type="text"
                      required
                      value={quoteOrganization}
                      onChange={(e) => setQuoteOrganization(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Lead Contact Person</label>
                    <input
                      type="text"
                      required
                      value={quoteContactName}
                      onChange={(e) => setQuoteContactName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                    <input
                      type="email"
                      required
                      value={quoteEmail}
                      onChange={(e) => setQuoteEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Telephone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="font-bold text-white block">Requested Fleet Allocation:</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">4x4 Land Cruisers</label>
                      <select
                        value={quoteLandCruisers}
                        onChange={(e) => setQuoteLandCruisers(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        {[0, 1, 2, 3, 5, 8, 10].map((n) => (
                          <option key={n} value={n}>{n} Vehicles</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">30-Seat Coasters</label>
                      <select
                        value={quoteCoasters}
                        onChange={(e) => setQuoteCoasters(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      >
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n} Buses</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Mission Duration</label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={quoteDays}
                        onChange={(e) => setQuoteDays(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Itinerary / Security Notes</label>
                  <textarea
                    rows={3}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>

                {quoteSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                    {quoteSuccessMsg}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('home')}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`py-2.5 px-6 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Submit RFP Quotation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 11: CUSTOMER SUPPORT & CONTACT (/booking/:slug/contact)
        ===================================================================== */}
        {currentView === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Direct Contacts */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-white">Operations Desk</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Direct Phone:</span>
                        <strong className="text-white font-mono">{companyPhone}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">WhatsApp Hotline:</span>
                        <a
                          href="https://wa.me/250788312000"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 font-mono font-bold hover:underline"
                        >
                          +250 788 312 000
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Airport Hub:</span>
                        <span className="text-slate-300">
                          Kigali International Airport Terminal Gate 1 & Remera HQ
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Operating Hours:</span>
                        <span className="text-slate-300">24/7 Flight Dispatch & Airport Standby</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-5 text-xs space-y-2 text-amber-200">
                  <strong className="block text-white font-bold">24/7 Roadside Assistance:</strong>
                  <p className="text-[11px] leading-relaxed">
                    Should you experience any tire puncture, battery drain, or mechanical alert while traveling upcountry, call our emergency hotline for immediate replacement vehicle deployment.
                  </p>
                </div>
              </div>

              {/* Right Column: Support Ticket Form */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-xs">
                <div>
                  <h2 className="text-base font-bold text-white">Submit a Customer Support Ticket</h2>
                  <p className="text-slate-400 mt-1">
                    Every inquiry receives an official ticket reference and is reviewed by our lead dispatcher.
                  </p>
                </div>

                {ticketSubmittedId ? (
                  <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-800 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">Ticket #{ticketSubmittedId} Submitted</h3>
                    <p className="text-slate-300">
                      Our dispatch team has received your inquiry. A response will be dispatched via SMS and email within 30 minutes.
                    </p>
                    <button
                      onClick={() => setTicketSubmittedId(null)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs border border-slate-700"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={ticketName}
                          onChange={(e) => setTicketName(e.target.value)}
                          placeholder="e.g. David Henderson"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Telephone / WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={ticketPhone}
                          onChange={(e) => setTicketPhone(e.target.value)}
                          placeholder="+250 788 000 000"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={ticketEmail}
                          onChange={(e) => setTicketEmail(e.target.value)}
                          placeholder="your.name@example.com"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Booking Reference (Optional)</label>
                        <input
                          type="text"
                          value={ticketBookingRef}
                          onChange={(e) => setTicketBookingRef(e.target.value)}
                          placeholder="e.g. KGF-2026-00128"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Inquiry Category</label>
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                        >
                          <option value="New booking inquiry">New booking inquiry</option>
                          <option value="Existing reservation inquiry">Existing reservation inquiry</option>
                          <option value="Flight delay adjustment">Flight delay adjustment</option>
                          <option value="Payment / EBM receipt issue">Payment / EBM receipt issue</option>
                          <option value="Vehicle handover question">Vehicle handover question</option>
                          <option value="Cancellation / refund request">Cancellation / refund request</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                        <select
                          value={ticketPriority}
                          onChange={(e) => setTicketPriority(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent (Flight Landing Soon)</option>
                          <option value="Emergency">Emergency Roadside</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Message</label>
                      <textarea
                        rows={4}
                        required
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Please describe your question or requirement..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className={`py-2.5 px-6 rounded-xl font-bold text-xs shadow-md ${activeBtnText}`}
                        style={{ backgroundColor: activeThemeColor }}
                      >
                        Submit Support Ticket
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 12: RENTAL TERMS & CONDITIONS (/booking/:slug/terms)
        ===================================================================== */}
        {currentView === 'terms' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
            <button
              onClick={() => setCurrentView('home')}
              className="text-slate-400 hover:text-white flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <h1 className="text-2xl font-extrabold text-white">Rental Terms and Conditions</h1>
              <p className="text-slate-400">
                Official contractual rental policies governing bookings made with {companyDisplayName}.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-bold text-sm">01. Driver Eligibility & Licensing</h3>
                  <p>
                    Hirers must be at least 21 years old and possess a valid driving license held for at least one year. Foreign visitors may legally drive in Rwanda for up to 90 days with their original driving license in English or French, or an International Driving Permit.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-bold text-sm">02. Fuel Policy: Full-to-Full</h3>
                  <p>
                    All vehicles are handed over with a 100% full fuel tank and must be returned with a 100% full tank. If returned below full, refueling is billed at standard pump price plus a 5,000 RWF service convenience charge.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-bold text-sm">03. Unlimited Mileage in Rwanda</h3>
                  <p>
                    Rentals include unlimited kilometers within all 30 administrative districts of Rwanda. Travel outside Rwanda (e.g., Uganda, DRC, Burundi, Tanzania) requires prior written authorization, a COMESA Yellow Card endorsement, and cross-border customs bond papers.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-bold text-sm">04. Security Deposit & Handover</h3>
                  <p>
                    A refundable security deposit of 150,000 RWF ($110 USD) is pre-authorized prior to vehicle handover. Upon return and physical condition check, the deposit is refunded immediately to your MTN MoMo or credit card within 24 hours.
                  </p>
                </div>

                <div>
                  <h3 className="text-white font-bold text-sm">05. RRA Tax Invoicing (EBM v2.0)</h3>
                  <p>
                    In accordance with Rwanda Revenue Authority law, an 18% VAT electronic invoice is generated for every reservation with valid customer TIN.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 13: CANCELLATION & REFUND POLICY (/booking/:slug/cancellation-policy)
        ===================================================================== */}
        {currentView === 'cancellation' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-xs text-slate-300 leading-relaxed">
            <button
              onClick={() => setCurrentView('home')}
              className="text-slate-400 hover:text-white flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <h1 className="text-2xl font-extrabold text-white">Cancellation & Refund Policy</h1>
              <p className="text-slate-400">
                Transparent cancellation windows and automated refund schedules.
              </p>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white">Notice Period Prior to Trip</span>
                  <span className="font-bold text-white">Eligible Refund</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>More than 7 days before pickup:</span>
                  <span>100% Full Deposit Refund</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>3 to 7 days before pickup:</span>
                  <span>50% Deposit Refund</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Less than 72 hours before pickup:</span>
                  <span>Deposit Retained (Scheduling Lock)</span>
                </div>
              </div>

              {/* Submit Cancellation Request Form */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Submit a Cancellation Request</h3>
                <form onSubmit={handleSubmitCancellation} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Booking Reference</label>
                      <input
                        type="text"
                        required
                        value={cancelBookingRef}
                        onChange={(e) => setCancelBookingRef(e.target.value)}
                        placeholder="e.g. KGF-2026-00128"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Telephone for MoMo Refund</label>
                      <input
                        type="text"
                        required
                        value={cancelPhone}
                        onChange={(e) => setCancelPhone(e.target.value)}
                        placeholder="+250 788 123 456"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reason for Cancellation</label>
                    <textarea
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  {cancelSuccessMsg && (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                      {cancelSuccessMsg}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                    >
                      Submit Official Cancellation Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            VIEW 14: SEARCHABLE FAQ (/booking/:slug/faq)
        ===================================================================== */}
        {currentView === 'faq' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('home')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Storefront</span>
              </button>
              <h1 className="text-2xl font-extrabold text-white">Frequently Asked Questions</h1>
              <p className="text-xs text-slate-400">
                Detailed answers regarding licenses, airport meeting gates, national parks, and payments.
              </p>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search questions (e.g. airport delay, deposit, gorillas, MoMo)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Accordion Items */}
            <div className="space-y-3">
              {[
                {
                  q: 'What documents do I need to rent a self-drive vehicle in Rwanda?',
                  a: 'A valid National Driving License (or International Driving Permit for foreign visitors) and a Passport or National ID. For tourists, foreign driving licenses in English or French are legally accepted for up to 90 days in Rwanda.',
                },
                {
                  q: 'How does the Collision-Guarded booking system protect my reservation?',
                  a: 'Our platform performs real-time physical inventory checks across every vehicle and date. Once you submit your reservation, the vehicle is atomically locked down to the millisecond, completely preventing double-bookings or replacement substitutions.',
                },
                {
                  q: 'What happens if my flight to Kigali International Airport (KIA) is delayed?',
                  a: 'Our dispatch center tracks inbound flights (RwandAir, Ethiopian, Qatar, KLM, Brussels Airlines) in real-time. When a flight is delayed, our dispatch team auto-adjusts the chauffeur pickup time without any extra waiting fees.',
                },
                {
                  q: 'Can I travel to Akagera National Park, Nyungwe, or Volcanoes Gorilla Trek?',
                  a: 'Yes! All our 4x4 SUVs and safari vans are authorized for travel across all 30 districts of Rwanda. When traveling upcountry, we ensure the vehicle is equipped with high ground clearance, emergency spare tire, and full police clearance documentation.',
                },
                {
                  q: 'How are security deposits and refunds processed?',
                  a: 'A refundable security deposit (RWF 150,000 / $110 USD) is authorized at vehicle handover. Upon return and vehicle inspection, the deposit is refunded immediately to your MTN Mobile Money or bank card within 24 hours.',
                },
                {
                  q: 'Can I request multiple vehicles for an NGO delegation or conference?',
                  a: 'Yes, our corporate quotation RFP tool allows you to select combinations of 4x4 Land Cruisers, 30-seat Coaster buses, and executive town sedans under a single consolidated pro-forma invoice.',
                },
              ]
                .filter(
                  (f) =>
                    !faqSearch ||
                    f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                    f.a.toLowerCase().includes(faqSearch.toLowerCase())
                )
                .map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          FOOTER (Section 10 & 12: Business Identity & Legal Mirrors)
      ========================================================================= */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900/95 py-12 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-950"
                style={{ backgroundColor: activeThemeColor }}
              >
                <Car className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-white text-sm">
                {companyDisplayName}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Official fleet operator in Rwanda. Direct customer reservations with guaranteed physical inventory and RRA EBM invoicing.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              RDB Reg: 109823471 · Contrôle Technique Certified
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
              Mobility Services
            </span>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={() => { setServiceType('self-drive'); setCurrentView('home'); }} className="hover:text-white">
                  Self-Drive Safari 4x4
                </button>
              </li>
              <li>
                <button onClick={() => { setServiceType('chauffeur'); setCurrentView('home'); }} className="hover:text-white">
                  Chauffeur-Driven VIP Shuttles
                </button>
              </li>
              <li>
                <button onClick={() => { setServiceType('airport'); setCurrentView('home'); }} className="hover:text-white">
                  Kigali Airport (KIA) Transfers
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('quote')} className="hover:text-white">
                  Corporate & NGO Multi-Vehicle RFP
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
              Policies & Support
            </span>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={() => setCurrentView('terms')} className="hover:text-white">
                  Rental Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('cancellation')} className="hover:text-white">
                  72-Hour Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('faq')} className="hover:text-white">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('contact')} className="hover:text-white">
                  Submit Support Ticket
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
              24/7 Dispatch Desk
            </span>
            <div className="space-y-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{companyPhone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: +250 788 312 000</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>KIA Terminal Hub & Remera HQ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-800 text-center text-slate-500 text-[11px]">
          © 2026 {companyDisplayName}. All rights reserved. Powered by KigaliFleet SaaS platform.
        </div>
      </footer>
    </div>
  );
};
