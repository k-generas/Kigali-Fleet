import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, Booking, Company, CompanySettings, SupportTicket } from '../types';
import { calculateDays, checkBookingCollision } from '../utils/collision';
import { formatHumanDate, formatHumanDateRange } from '../utils/dates';
import {
  Calendar,
  Car,
  ShieldCheck,
  Plane,
  CheckCircle2,
  Users,
  Fuel,
  ArrowLeft,
  Phone,
  MessageSquare,
  Check,
  Printer,
  Search,
  Compass,
  MapPin,
  Clock,
  Building,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  Filter,
  ChevronRight,
  Menu,
  LayoutGrid,
  List,
  RotateCcw,
  Luggage,
} from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import {
  CATEGORY_DEFAULT_IMAGES,
  getVehicleImageUrl,
  getVehicleCustomerSummary,
} from '../utils/vehicleImages';
import { VehiclePhotoGallery } from './VehiclePhotoGallery';
import { ThemeAppearanceMenu } from './ThemeAppearanceMenu';
import { useI18n } from '../utils/i18n';
import { LocaleCurrencySwitcher } from './LocaleCurrencySwitcher';

interface PublicStorefrontViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  currentTheme?: ColorTheme;
  accentColorId?: string;
  onSelectAccentColor?: (themeId: string) => void;
  themeMode?: 'dark' | 'light';
  onToggleThemeMode?: () => void;
  currentCompany?: Company;
  companySettings?: CompanySettings;
  onCompleteClientBooking: (
    booking: Omit<Booking, 'id' | 'created_at' | 'dispatch_status'>
  ) => { success: boolean; booking?: Booking; error?: string };
  onSubmitSupportTicket?: (
    ticketData: Omit<SupportTicket, 'id' | 'ticket_ref' | 'status' | 'created_at'>
  ) => SupportTicket | void;
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

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  vehicles,
  drivers,
  bookings,
  currentTheme,
  accentColorId,
  onSelectAccentColor,
  themeMode = 'dark',
  onToggleThemeMode,
  currentCompany,
  companySettings,
  onCompleteClientBooking,
  onSubmitSupportTicket,
  onReturnToManager,
}) => {
  const { formatMoney, tr, t } = useI18n();
  const resolvedTheme = currentTheme || COLOR_THEMES[0];
  const resolvedAccentId = accentColorId || resolvedTheme.id;
  const activeThemeColor =
    themeMode === 'dark' ? resolvedTheme.darkHex : resolvedTheme.hex;

  const [currentView, setCurrentView] = useState<StorefrontViewMode>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>('self-drive');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'list'>('list');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isSearchEditOpen, setIsSearchEditOpen] = useState(false);
  const [quickDetailVehicleState, setQuickDetailVehicle] = useState<Vehicle | null>(null);
  const quickDetailVehicle = useMemo(
    () =>
      quickDetailVehicleState
        ? vehicles.find((v) => v.id === quickDetailVehicleState.id) || quickDetailVehicleState
        : null,
    [vehicles, quickDetailVehicleState]
  );

  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-18');
  const [pickupLocation, setPickupLocation] = useState('Kigali International Airport (KIA)');
  const [returnLocation, setReturnLocation] = useState('Kigali International Airport (KIA)');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterTransmission, setFilterTransmission] = useState<string>('All');
  const [filterFuel, setFilterFuel] = useState<string>('All');
  const [filterAutomaticOnly, setFilterAutomaticOnly] = useState<boolean>(false);
  const [filterMinPassengers, setFilterMinPassengers] = useState<number>(0);
  const [filterMinLuggage, setFilterMinLuggage] = useState<number>(0);
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(300000);
  const [filter4WDOnly, setFilter4WDOnly] = useState<boolean>(false);
  const [filterPopUpRoofOnly, setFilterPopUpRoofOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'capacity' | 'rating'>('price-asc');

  const [flightNumber, setFlightNumber] = useState('WB 402');
  const [flightAirline, setFlightAirline] = useState('RwandAir');
  const [hotelDestination, setHotelDestination] = useState('Kigali Marriott Hotel, KN 3 Ave');
  const [passengerCount, setPassengerCount] = useState(2);
  const [luggageCount, setLuggageCount] = useState(3);
  const [meetGreetSign, setMeetGreetSign] = useState(true);

  const [safariPark, setSafariPark] = useState('Akagera National Park (Big 5 Safari)');
  const [safariPopUpRoof, setSafariPopUpRoof] = useState(true);

  const hiddenVehicleIds = companySettings?.storefront_published_vehicles || [];
  const visibleVehicles = useMemo(() => {
    const published = vehicles.filter((v) => !hiddenVehicleIds.includes(v.id));
    return published.length > 0 ? published : vehicles;
  }, [vehicles, hiddenVehicleIds]);

  const [selectedVehicleState, setSelectedVehicle] = useState<Vehicle>(
    visibleVehicles[0] || vehicles[0] || null
  );
  const selectedVehicle = useMemo(
    () =>
      selectedVehicleState
        ? vehicles.find((v) => v.id === selectedVehicleState.id) || selectedVehicleState
        : visibleVehicles[0] || vehicles[0] || null,
    [vehicles, visibleVehicles, selectedVehicleState]
  );

  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [clientName, setClientName] = useState('Elizabeth Thorne');
  const [clientPhone, setClientPhone] = useState('+250 788 456 789');
  const [clientEmail, setClientEmail] = useState('e.thorne@awf-conservation.org');
  const [countryResidence, setCountryResidence] = useState('United Kingdom');
  const [organization, setOrganization] = useState('African Wildlife Foundation');
  const [tinNumber, setTinNumber] = useState('109823471');
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('PO-AWF-2026-081');
  const [specialRequests, setSpecialRequests] = useState(
    'Need English-speaking driver and 4x4 car for park roads.'
  );

  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('DL-UK-884920194');
  const [passportNumber, setPassportNumber] = useState('GB99201481');

  const [addonChauffeur, setAddonChauffeur] = useState(false);
  const [addonChildSeat, setAddonChildSeat] = useState(false);
  const [addonWifiHotspot, setAddonWifiHotspot] = useState(true);
  const [addonSafariKit] = useState(false);

  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentMethod, setPaymentMethod] = useState<
    'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer' | 'Credit Card'
  >('MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState('+250 788 456 789');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [bookingReferenceId, setBookingReferenceId] = useState<string>('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [trackRefInput, setTrackRefInput] = useState('');
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<Booking | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const [quoteLandCruisers, setQuoteLandCruisers] = useState(2);
  const [quoteCoasters, setQuoteCoasters] = useState(1);
  const [quoteDays, setQuoteDays] = useState(4);
  const [quoteOrganization, setQuoteOrganization] = useState('UNDP Regional Delegation');
  const [quoteContactName, setQuoteContactName] = useState('Marcus Vance');
  const [quoteEmail, setQuoteEmail] = useState('marcus.vance@undp.org');
  const [quotePhone, setQuotePhone] = useState('+250 788 901 234');
  const [quoteNotes, setQuoteNotes] = useState(
    'Need 3 English-speaking drivers for a 4-day trip in Kigali and Musanze.'
  );
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);

  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketBookingRef, setTicketBookingRef] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Question about a booking I already have');
  const [ticketPriority, setTicketPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string | null>(null);

  const [cancelBookingRef, setCancelBookingRef] = useState('');
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelReason, setCancelReason] = useState('My flight date changed');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const days = calculateDays(startDate, endDate);

  const companyDisplayName = currentCompany?.name || 'Kigali Executive Rentals';
  const companyPhone = currentCompany?.phone || '+250 788 312 000';
  const whatsappDisplay = companySettings?.storefront_whatsapp || companyPhone;
  const whatsappDigits = whatsappDisplay.replace(/[^0-9]/g, '') || '250788312000';
  const heroTagline =
    companySettings?.storefront_tagline ||
    'Book clean 4x4 safari cars, city SUVs, and airport rides. Pick your dates, see real open cars, and pay easily with MTN MoMo.';

  const activeDailyRate = selectedVehicle?.daily_rate_rwf || 120000;
  const baseRentalRwf = days * activeDailyRate;

  const isSafariPeak = useMemo(() => {
    const month = parseInt(startDate.split('-')[1] || '11', 10);
    return [6, 7, 8, 9, 12].includes(month);
  }, [startDate]);

  const isUpcountry = useMemo(() => {
    const text = `${pickupLocation} ${returnLocation} ${hotelDestination} ${safariPark}`.toLowerCase();
    return /musanze|akagera|volcanoes|rubavu|nyungwe|kivu|gisenyi|karongi/i.test(text);
  }, [pickupLocation, returnLocation, hotelDestination, safariPark]);

  const safariSurgeRwf = isSafariPeak ? Math.round(baseRentalRwf * 0.15) : 0;
  const upcountrySurgeRwf = isUpcountry ? days * 25000 : 0;

  const chauffeurCostRwf = addonChauffeur || serviceType === 'chauffeur' ? days * 15000 : 0;
  const childSeatCostRwf = addonChildSeat ? days * 5000 : 0;
  const wifiHotspotCostRwf = addonWifiHotspot ? days * 7500 : 0;
  const safariKitCostRwf =
    addonSafariKit || (serviceType === 'safari' && safariPopUpRoof) ? days * 20000 : 0;

  const totalAddonsRwf = chauffeurCostRwf + childSeatCostRwf + wifiHotspotCostRwf + safariKitCostRwf;
  const subtotalBeforeVatRwf = baseRentalRwf + safariSurgeRwf + upcountrySurgeRwf + totalAddonsRwf;
  const vatRwf = Math.round(subtotalBeforeVatRwf * 0.18);
  const securityDepositRwf = 150000;
  const grandTotalRwf = subtotalBeforeVatRwf + vatRwf;

  const depositPercent = companySettings?.storefront_deposit_percent || 30;
  const depositToPayNowRwf =
    paymentOption === 'deposit' ? Math.round(grandTotalRwf * (depositPercent / 100)) : grandTotalRwf;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: visibleVehicles.length };
    visibleVehicles.forEach((v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return counts;
  }, [visibleVehicles]);

  const filteredVehicles = useMemo(() => {
    return visibleVehicles
      .filter((v) => {
        if (selectedCategory !== 'All' && v.category !== selectedCategory) return false;
        if (filterAutomaticOnly && v.transmission !== 'Automatic') return false;
        if (filterTransmission !== 'All' && v.transmission !== filterTransmission) return false;
        if (filterFuel !== 'All' && v.fuel_type !== filterFuel) return false;
        if (filterMinPassengers > 0 && v.seating_capacity < filterMinPassengers) return false;
        if (filterMinLuggage > 0) {
          const estimatedLuggage = v.seating_capacity >= 7 ? 4 : v.seating_capacity >= 5 ? 3 : 2;
          if (estimatedLuggage < filterMinLuggage) return false;
        }
        if (filterMaxPrice && v.daily_rate_rwf > filterMaxPrice) return false;
        if (filter4WDOnly && !/4x4|awd|4wd|prado|land cruiser/i.test(v.model_name)) return false;
        if (filterPopUpRoofOnly && !/safari|pop-top|photographic/i.test(v.model_name)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.daily_rate_rwf - b.daily_rate_rwf;
        if (sortBy === 'price-desc') return b.daily_rate_rwf - a.daily_rate_rwf;
        if (sortBy === 'capacity') return b.seating_capacity - a.seating_capacity;
        if (sortBy === 'rating') return (b.year || 2022) - (a.year || 2022);
        return 0;
      });
  }, [
    visibleVehicles,
    selectedCategory,
    filterAutomaticOnly,
    filterTransmission,
    filterFuel,
    filterMinPassengers,
    filterMinLuggage,
    filterMaxPrice,
    filter4WDOnly,
    filterPopUpRoofOnly,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setFilterAutomaticOnly(false);
    setFilterTransmission('All');
    setFilterFuel('All');
    setFilterMinPassengers(0);
    setFilterMinLuggage(0);
    setFilterMaxPrice(300000);
    setFilter4WDOnly(false);
    setFilterPopUpRoofOnly(false);
    setSortBy('price-asc');
  };

  const handleStartBookingVehicle = (v: Vehicle) => {
    setSelectedVehicle(v);
    setBookingStep(1);
    setCurrentView('book');
    setSubmissionError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewVehicleDetails = (v: Vehicle) => {
    setSelectedVehicle(v);
    setCurrentView('vehicle-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmReservation = () => {
    if (!selectedVehicle) return;
    setIsSubmittingBooking(true);
    setSubmissionError(null);

    const collision = checkBookingCollision(selectedVehicle.id, startDate, endDate, bookings);
    if (collision.hasCollision) {
      setIsSubmittingBooking(false);
      setSubmissionError(
        collision.conflictReason ||
          'This car is already booked for those dates. Please pick another car or date.'
      );
      return;
    }

    const availableDriver = drivers.find((d) => d.status === 'Available') || drivers[0];
    const refCode = `KGF-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const effectiveDestination =
      serviceType === 'airport'
        ? `${pickupLocation} (${flightAirline} ${flightNumber}) -> ${hotelDestination}`
        : serviceType === 'safari'
        ? `Kigali -> ${safariPark}`
        : `${pickupLocation} -> ${returnLocation}`;

    const res = onCompleteClientBooking({
      client_name: isCorporateBooking ? `${clientName} (${organization})` : clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      vehicle_id: selectedVehicle.id,
      driver_id: availableDriver ? availableDriver.id : '',
      start_date: startDate,
      end_date: endDate,
      total_rwf: grandTotalRwf,
      destination: effectiveDestination,
      flight_number: serviceType === 'airport' ? `${flightAirline} ${flightNumber}` : undefined,
      flight_status: serviceType === 'airport' ? 'Scheduled' : undefined,
      status: 'Confirmed',
      payment_status: paymentOption === 'deposit' ? 'Deposit Paid (MoMo)' : 'Fully Paid',
      payment_method: paymentMethod,
      notes: `${serviceType.toUpperCase()} | Extras: ${addonWifiHotspot ? 'Wi-Fi ' : ''}${
        addonChildSeat ? 'ChildSeat ' : ''
      }${isSafariPeak ? 'PeakSafari ' : ''}| Ref: ${refCode} | ${specialRequests}`,
    });

    setTimeout(() => {
      setIsSubmittingBooking(false);
      if (res.success && res.booking) {
        setConfirmedBooking(res.booking);
        setBookingReferenceId(refCode);
        setCurrentView('confirmation');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmissionError(res.error || 'Could not finish booking. Please try again.');
      }
    }, 600);
  };

  const lookupBookingByRefAndPhone = (refInput: string, phoneInput: string) => {
    const ref = refInput.trim().toLowerCase();
    const phone = phoneInput.trim().replace(/\s+/g, '');
    return bookings.find((b) => {
      const matchId = b.id.toLowerCase().includes(ref) || ref.includes(b.id.toLowerCase());
      const matchPhone = !phone || b.client_phone.replace(/\s+/g, '').includes(phone);
      return matchId && matchPhone;
    });
  };

  const handleTrackBookingLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedBooking(null);

    const found = lookupBookingByRefAndPhone(trackRefInput, trackPhoneInput);
    if (found) {
      setTrackedBooking(found);
    } else {
      setTrackError(
        'We could not find a booking with that code and phone number. Check your text message or call our help desk.'
      );
    }
  };

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const rfqId = `RFQ-KGF-${Math.floor(1000 + Math.random() * 9000)}`;
    setQuoteSuccessMsg(
      `Request #${rfqId} sent for ${quoteOrganization}. We will email your price sheet within 2 business hours.`
    );
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitSupportTicket) {
      const created = onSubmitSupportTicket({
        requester_type: 'Storefront Customer',
        company_id: currentCompany?.id,
        company_name: currentCompany?.name,
        customer_name: ticketName || 'Guest',
        customer_email: ticketEmail || 'guest@kigalifleet.rw',
        customer_phone: ticketPhone || '+250 788 000 000',
        booking_ref: ticketBookingRef || undefined,
        issue_category: ticketCategory,
        priority: ticketPriority,
        message: ticketMessage,
      });
      setTicketSubmittedId(
        created && 'ticket_ref' in created
          ? created.ticket_ref
          : `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`
      );
      return;
    }
    const tckId = `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketSubmittedId(tckId);
  };

  const handleSubmitCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    const canId = `CAN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setCancelSuccessMsg(
      `Cancel request #${canId} saved for booking ${cancelBookingRef}. Our team will check and refund your money to ${cancelPhone}.`
    );
  };

  const serviceLabel = (st: ServiceType) => {
    if (st === 'self-drive') return 'Drive Yourself';
    if (st === 'chauffeur') return 'With Driver';
    if (st === 'airport') return 'Airport Pickup';
    return 'Safari & Parks';
  };

  const navigateStorefrontView = (view: StorefrontViewMode, nextService?: ServiceType) => {
    if (nextService) setServiceType(nextService);
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const inputClass =
    'w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors';
  const cardClass =
    'bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card';
  const subBoxClass =
    'bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl';

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Top Dark Trust & Locale Utility Bar */}
      <div className="bg-slate-900 dark:bg-[#070a11] text-slate-200 border-b border-slate-800 px-4 sm:px-6 py-2 text-[13px] w-full print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 truncate">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{tr('Call 24/7:')}</span>
              <strong className="font-mono font-semibold text-white">{companyPhone}</strong>
            </span>
            <a
              href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                `Muraho! I want to ask about renting a car from ${companyDisplayName}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-200 hover:underline truncate"
            >
              <span>WhatsApp:</span>
              <strong className="font-mono font-semibold text-white">{whatsappDisplay}</strong>
            </a>
            <span className="hidden lg:inline-flex items-center gap-1 text-slate-400 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{tr('Kigali Airport & Remera Office')}</span>
            </span>
          </div>

          <LocaleCurrencySwitcher currentTheme={resolvedTheme} compact />
        </div>
      </div>

      {/* Main Navigation Header (Pinned at top while scrolling) */}
      <header className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3 w-full print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 w-full">
          <button
            type="button"
            onClick={() => navigateStorefrontView('home')}
            className="flex items-center gap-2.5 text-left text-slate-900 dark:text-white min-w-0 shrink"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center accent-bg shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold tracking-tight truncate max-w-[170px] sm:max-w-[260px]">
              {companyDisplayName}
            </span>
          </button>

          <nav
            aria-label="Storefront navigation"
            className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 min-w-0 shrink"
          >
            <button
              type="button"
              onClick={() => navigateStorefrontView('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'home'
                  ? 'accent-tint accent-text font-semibold'
                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Home')}
            </button>
            <button
              type="button"
              onClick={() => navigateStorefrontView('vehicles')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'vehicles'
                  ? 'accent-tint accent-text font-semibold'
                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Cars & Prices')}
            </button>
            <button
              type="button"
              onClick={() => navigateStorefrontView('home', 'airport')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              {tr('Airport Pickup')}
            </button>
            <button
              type="button"
              onClick={() => navigateStorefrontView('home', 'safari')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
            >
              {tr('Safari Trips')}
            </button>
            <button
              type="button"
              onClick={() => navigateStorefrontView('track')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'track'
                  ? 'accent-tint accent-text font-semibold'
                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Check Booking')}
            </button>
            <button
              type="button"
              onClick={() => navigateStorefrontView('contact')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                currentView === 'contact'
                  ? 'accent-tint accent-text font-semibold'
                  : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tr('Help')}
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0 z-10">
            {onSelectAccentColor && onToggleThemeMode && (
              <ThemeAppearanceMenu
                currentTheme={resolvedTheme}
                accentColorId={resolvedAccentId}
                onSelectAccentColor={onSelectAccentColor}
                themeMode={themeMode}
                onToggleThemeMode={onToggleThemeMode}
              />
            )}

            <a
              href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                `Muraho! I want to ask about renting a car from ${companyDisplayName}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/20 text-sm font-semibold transition-colors shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden 2xl:inline">WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (currentView === 'home') {
                  const el = document.getElementById('adaptive-search');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigateStorefrontView('vehicles');
                }
              }}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 whitespace-nowrap transition-opacity shrink-0"
            >
              {tr('Book a Car')}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 lg:hidden transition-colors shrink-0"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sticky Quick Navigation Strip for Phone & Small Tablet */}
        <nav
          aria-label="Quick storefront navigation"
          className="lg:hidden grid grid-cols-5 gap-1 border-t border-slate-100 dark:border-slate-800 mt-2.5 pt-1.5"
        >
          {[
            { id: 'home' as StorefrontViewMode, label: tr('Home') },
            { id: 'vehicles' as StorefrontViewMode, label: tr('Cars') },
            { id: 'track' as StorefrontViewMode, label: tr('Trips') },
            { id: 'quote' as StorefrontViewMode, label: tr('Plans') },
            { id: 'contact' as StorefrontViewMode, label: tr('Help') },
          ].map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateStorefrontView(tab.id)}
                className={`py-1.5 px-1 rounded-md text-[13px] text-center truncate transition-colors ${
                  isActive
                    ? 'font-semibold accent-tint accent-text'
                    : 'font-normal text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 pb-2">
            {[
              { label: 'Home', action: () => setCurrentView('home'), active: currentView === 'home' },
              {
                label: `Cars & Prices (${visibleVehicles.length} Cars)`,
                action: () => setCurrentView('vehicles'),
                active: currentView === 'vehicles',
              },
              {
                label: 'Airport Pickup (Kigali Airport)',
                action: () => {
                  setServiceType('airport');
                  setCurrentView('home');
                },
              },
              {
                label: 'Safari Trips (Akagera & Volcanoes)',
                action: () => {
                  setServiceType('safari');
                  setCurrentView('home');
                },
              },
              { label: 'Check My Booking', action: () => setCurrentView('track'), active: currentView === 'track' },
              { label: 'Group & Business Quote', action: () => setCurrentView('quote'), active: currentView === 'quote' },
              { label: 'Help & Support', action: () => setCurrentView('contact'), active: currentView === 'contact' },
              { label: 'Common Questions (FAQ)', action: () => setCurrentView('faq'), active: currentView === 'faq' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-3 rounded-lg transition-colors ${
                  item.active
                    ? 'accent-tint accent-text font-semibold'
                    : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* VIEW 1: HOMEPAGE */}
        {currentView === 'home' && (
          <div className="space-y-12 pb-16">
            <section className="bg-white dark:bg-[#111827] border-b border-slate-200/80 dark:border-slate-800 py-12 sm:py-16 px-4 sm:px-6">
              <div className="max-w-5xl mx-auto text-center space-y-5">
                <div className="inline-flex items-center gap-2 text-sm font-semibold accent-text">
                  <span>
                    {t({
                      EN: 'Licensed Rwanda Car Rental',
                      RW: 'Ikigo Cyemewe mu Rwanda',
                      FR: 'Location agréée au Rwanda',
                    })}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{tr('Airport Pickup')}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight max-w-3xl mx-auto">
                  {t({
                    EN: 'Rent the Right Car in Rwanda.',
                    RW: 'Kodesha Imodoka Ikubereye mu Rwanda.',
                    FR: 'Louez la voiture idéale au Rwanda.',
                  })}
                </h1>

                <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {heroTagline}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('adaptive-search');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 transition-opacity"
                  >
                    {t({
                      EN: 'Find an Open Car',
                      RW: 'Shaka Imodoka Iboneka',
                      FR: 'Trouver une voiture libre',
                    })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('vehicles')}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {tr('Cars & Prices')}
                  </button>
                </div>

                <div className="pt-5 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 max-w-4xl mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{tr('Zero Double Bookings')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {t({
                        EN: 'Safety Checked Cars',
                        RW: 'Imodoka Zisuzumwe',
                        FR: 'Voitures contrôlées',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {t({
                        EN: 'Official 18% Tax Receipt',
                        RW: 'Inyemezabuguzi ya RRA (18%)',
                        FR: 'Reçu fiscal officiel 18%',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {t({
                        EN: '24/7 Road Help',
                        RW: 'Ubufasha mu Muhanda 24/7',
                        FR: 'Assistance 24h/7',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Adaptive Search Box */}
            <section id="adaptive-search" className="max-w-5xl mx-auto px-4">
              <div className={`${cardClass} p-5 sm:p-6 space-y-5`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-1">
                  {(
                    [
                      { id: 'self-drive', label: tr('Self-Drive'), icon: Car },
                      { id: 'chauffeur', label: tr('With Driver'), icon: Users },
                      { id: 'airport', label: tr('Airport Pickup'), icon: Plane },
                      { id: 'safari', label: tr('Safari Trips'), icon: Compass },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = serviceType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setServiceType(tab.id)}
                        className={`p-2.5 rounded-md text-sm flex items-center justify-center gap-2 transition-all ${
                          active
                            ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 accent-text shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {serviceType === 'airport' ? (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Airport
                        </label>
                        <input
                          type="text"
                          disabled
                          value="Kigali International Airport (KIA)"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Airline & Flight Number
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={flightAirline}
                            onChange={(e) => setFlightAirline(e.target.value)}
                            className={inputClass}
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
                            placeholder="WB 402"
                            className={`${inputClass} font-mono font-semibold`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Arrival Day
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setEndDate(e.target.value);
                          }}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Hotel or Drop-off Place
                        </label>
                        <input
                          type="text"
                          value={hotelDestination}
                          onChange={(e) => setHotelDestination(e.target.value)}
                          placeholder="e.g. Kigali Marriott Hotel"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          People & Bags
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={passengerCount}
                            onChange={(e) => setPassengerCount(Number(e.target.value))}
                            className={inputClass}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                              <option key={n} value={n}>
                                {n} People
                              </option>
                            ))}
                          </select>
                          <select
                            value={luggageCount}
                            onChange={(e) => setLuggageCount(Number(e.target.value))}
                            className={inputClass}
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
                        <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={meetGreetSign}
                            onChange={(e) => setMeetGreetSign(e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          <span>Driver holds your name sign at Gate 1</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : serviceType === 'safari' ? (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Which Park?
                        </label>
                        <select
                          value={safariPark}
                          onChange={(e) => setSafariPark(e.target.value)}
                          className={inputClass}
                        >
                          <option value="Akagera National Park (Big 5 Safari)">
                            Akagera National Park (Big 5 Safari)
                          </option>
                          <option value="Volcanoes National Park (Gorilla Trekking)">
                            Volcanoes National Park (Gorillas)
                          </option>
                          <option value="Nyungwe National Park (Canopy Walk)">
                            Nyungwe Forest Park (Canopy Walk)
                          </option>
                          <option value="Lake Kivu & Rubavu">Lake Kivu & Rubavu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Start Day
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Return Day
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={safariPopUpRoof}
                          onChange={(e) => setSafariPopUpRoof(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>Open-up safari roof for photos</span>
                      </label>
                      <span className="font-mono font-semibold accent-text">{days} Days Trip</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Pick-up Place
                      </label>
                      <input
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Return Place
                      </label>
                      <input
                        type="text"
                        value={returnLocation}
                        onChange={(e) => setReturnLocation(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Pick-up Day
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Return Day
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span>
                      {formatHumanDateRange(startDate, endDate, { includeYear: true })} (
                      <strong className="font-semibold text-slate-900 dark:text-white font-mono">
                        {days} {tr('days')}
                      </strong>
                      )
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Trip: <strong className="font-semibold accent-text">{serviceLabel(serviceType)}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentView('vehicles')}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 transition-opacity"
                  >
                    Show Open Cars ({visibleVehicles.length}) →
                  </button>
                </div>
              </div>
            </section>

            {/* Popular Cars */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2">
                <div>
                  <span className="text-sm font-semibold accent-text">Ready to Drive</span>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    Popular Cars for Rent
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('vehicles')}
                  className="text-sm font-semibold accent-text flex items-center gap-1 hover:underline self-start sm:self-auto"
                >
                  <span>See all {visibleVehicles.length} cars</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {visibleVehicles.slice(0, 3).map((vehicle) => {
                  const collision = checkBookingCollision(vehicle.id, startDate, endDate, bookings);
                  const isAvailable = !collision.hasCollision;
                  const topFeatures = (vehicle.features || []).slice(0, 3);

                  return (
                    <div
                      key={vehicle.id}
                      className={`${cardClass} overflow-hidden flex flex-col justify-between`}
                    >
                      <div>
                        <VehiclePhotoGallery
                          vehicle={vehicle}
                          aspectClass="h-44"
                          showThumbnails={false}
                          accentColor={activeThemeColor}
                          onImageClick={() => handleViewVehicleDetails(vehicle)}
                          topLeftSlot={
                            <span className="text-[12px] font-mono font-semibold text-white bg-slate-900/80 px-2 py-0.5 rounded-md">
                              {vehicle.plate_number}
                            </span>
                          }
                          topRightSlot={
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/80 text-white">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isAvailable ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              <span>{isAvailable ? tr('Open') : tr('Booked')}</span>
                            </span>
                          }
                          bottomLeftSlot={
                            <span className="text-[12px] text-slate-100 font-normal">
                              {vehicle.category} · {vehicle.year || 2023}
                            </span>
                          }
                        />

                        <div className="p-4 space-y-3">
                          <div>
                            <h3
                              onClick={() => handleViewVehicleDetails(vehicle)}
                              className="text-base font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline"
                            >
                              {vehicle.model_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>
                                {vehicle.seating_capacity} {tr('Seats')}
                              </span>
                              <span>·</span>
                              <span>{tr(vehicle.transmission || 'Automatic')}</span>
                              <span>·</span>
                              <span>{tr(vehicle.fuel_type || 'Diesel')}</span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {getVehicleCustomerSummary(vehicle)}
                          </p>

                          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {(topFeatures.length > 0
                              ? topFeatures
                              : ['Start full tank, return full', 'Unlimited Rwanda km']
                            ).map((feat) => (
                              <div key={feat} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">{tr(feat)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[13px] text-slate-500 dark:text-slate-400 block">
                            {tr('Per day:')}
                          </span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white text-base tabular-nums">
                            {formatMoney(vehicle.daily_rate_rwf)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewVehicleDetails(vehicle)}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {tr('Details')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartBookingVehicle(vehicle)}
                            disabled={!isAvailable}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold ${
                              isAvailable
                                ? 'accent-bg hover:opacity-95'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {tr('Book')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4 Ways to Travel */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
              <div>
                <span className="text-sm font-semibold accent-text">Ways to Travel</span>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">What We Offer</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: Car,
                    title: '01. Drive Yourself',
                    body: 'Pick up a car and drive anywhere in Rwanda. Foreign licenses in English or French work for 90 days.',
                  },
                  {
                    icon: Users,
                    title: '02. With a Driver',
                    body: 'Friendly local drivers who speak English and Kinyarwanda and know every road across Rwanda.',
                  },
                  {
                    icon: Plane,
                    title: '03. Airport Pickup',
                    body: 'Your driver meets you right at Kigali Airport arrivals. Even if your plane is late, we wait at no extra cost.',
                  },
                  {
                    icon: Compass,
                    title: '04. Safari & Parks',
                    body: 'Strong 4x4 cars with open roofs for Akagera game drives and Volcanoes gorilla trips.',
                  },
                ].map((svc) => {
                  const Icon = svc.icon;
                  return (
                    <div key={svc.title} className={`${cardClass} p-5 space-y-2.5`}>
                      <Icon className="w-5 h-5 accent-text" />
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{svc.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{svc.body}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Why Book Here + Testimonials + 4 Steps + Quick Check Booking */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
              <div className={`${cardClass} overflow-hidden`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>No Double-Bookings</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Once you book a car, those dates lock right away so nobody else can take your car.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
                      <FileText className="w-4 h-4 accent-text shrink-0" />
                      <span>Official Tax Receipt</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Every payment gives you an official Rwanda tax receipt for personal or work records.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-base">
                      <CreditCard className="w-4 h-4 accent-text shrink-0" />
                      <span>Easy MoMo & Card Pay</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Pay {depositPercent}% now or all at once using MTN MoMo, Airtel Money, bank transfer, or Visa/Mastercard.
                    </p>
                  </div>
                </div>

                {/* 3 Traveler Quotes */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800">
                  {[
                    {
                      name: 'Dr. Arthur Mugabo',
                      org: 'UNDP Rwanda',
                      quote:
                        'Rented a Land Cruiser for a 4-day work trip in Musanze. The car was clean, driver Emmanuel was on time, and we got our tax receipt right away.',
                    },
                    {
                      name: 'Sarah Jenkins',
                      org: 'Visitor from Netherlands',
                      quote:
                        'Our flight from Amsterdam landed 2 hours late, and the driver still waited at Gate 1 with water and our name sign. Very easy!',
                    },
                    {
                      name: 'Patrick Habimana',
                      org: 'Kigali Event Team',
                      quote:
                        'Booked two safari vans for event guests. Confirmed in minutes and paying with MTN MoMo was fast.',
                    },
                  ].map((rev) => (
                    <div
                      key={rev.name}
                      className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 text-sm space-y-2"
                    >
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">&ldquo;{rev.quote}&rdquo;</p>
                      <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                        {rev.name}, {rev.org}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4 Numbered Steps */}
                <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-100 dark:border-slate-800">
                  {[
                    { n: '1', title: 'Pick trip type', text: 'Self-drive, driver, airport pickup, or safari.' },
                    { n: '2', title: 'Pick a car', text: 'Check photos, seats, and open dates.' },
                    { n: '3', title: 'Pay & confirm', text: `Pay ${depositPercent}% or full with MoMo or card.` },
                    { n: '4', title: 'Get your pass', text: 'Receive pickup steps and driver phone.' },
                  ].map((step) => (
                    <div key={step.n} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 text-sm">
                      <span className="font-mono text-xl font-semibold block accent-text">{step.n}</span>
                      <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                        {step.title}
                      </span>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400">{step.text}</span>
                    </div>
                  ))}
                </div>

                {/* Inline Check Booking Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const found = lookupBookingByRefAndPhone(trackRefInput, trackPhoneInput);
                    setTrackedBooking(found || null);
                    setTrackError(
                      found
                        ? null
                        : 'We could not find a booking with that code and phone number. Check your text message or call our help desk.'
                    );
                    setCurrentView('track');
                  }}
                  className="p-5 bg-slate-50/80 dark:bg-[#0f172a] flex flex-col sm:flex-row sm:items-end gap-3"
                >
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Booking code
                    </label>
                    <input
                      type="text"
                      value={trackRefInput}
                      onChange={(e) => setTrackRefInput(e.target.value)}
                      placeholder="bk-2026-089"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Phone number
                    </label>
                    <input
                      type="text"
                      value={trackPhoneInput}
                      onChange={(e) => setTrackPhoneInput(e.target.value)}
                      placeholder="+250 788 123 456"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-sm font-semibold accent-bg hover:opacity-95 shrink-0"
                  >
                    Find my booking
                  </button>
                </form>
              </div>
            </section>

            {/* Quick Questions */}
            <section className="max-w-4xl mx-auto px-4 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Common Questions</h2>
                <button
                  type="button"
                  onClick={() => setCurrentView('faq')}
                  className="text-sm font-semibold accent-text hover:underline"
                >
                  See all questions →
                </button>
              </div>

              <div className={`${cardClass} divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden`}>
                {[
                  {
                    q: 'What papers do I need to drive myself in Rwanda?',
                    a: 'You need a valid driving license and a passport or national ID. Foreign licenses in English or French are accepted for up to 90 days.',
                  },
                  {
                    q: 'How do I know my car will really be there?',
                    a: 'Every car shown here is checked against all live bookings. As soon as you book, that car is saved only for you.',
                  },
                  {
                    q: 'What if my flight to Kigali is late?',
                    a: 'Share your flight number when booking. We track your plane and move your driver pickup time for free if it arrives late.',
                  },
                ].map((faq, idx) => (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 accent-text shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: CARS LIST */}
        {currentView === 'vehicles' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 w-full">
            <div className={`${cardClass} p-4 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Pick-up & Return</span>
                  <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 accent-text shrink-0" />
                    <span>{pickupLocation}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Dates</span>
                  <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 accent-text shrink-0" />
                    <span>
                      {formatHumanDateRange(startDate, endDate, { includeYear: true })} ({days} {tr('days')})
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Trip Type</span>
                  <span className="font-semibold accent-text flex items-center gap-1.5 mt-0.5">
                    <Car className="w-4 h-4 shrink-0" />
                    <span>{serviceLabel(serviceType)}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSearchEditOpen(!isSearchEditOpen)}
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold flex items-center gap-2 self-start md:self-auto"
              >
                <SlidersHorizontal className="w-4 h-4 accent-text" />
                <span>{isSearchEditOpen ? 'Close Edit' : 'Change Dates or Place'}</span>
              </button>
            </div>

            {isSearchEditOpen && (
              <div className={`${cardClass} p-5 space-y-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Pick-up Place
                    </label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Return Place
                    </label>
                    <input
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Pick-up Day
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Return Day
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    Total Days: <strong className="text-slate-900 dark:text-white">{days} Days</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearchEditOpen(false)}
                    className="px-4 py-2 rounded-lg font-semibold text-sm accent-bg"
                  >
                    Update Search
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Filter Trigger */}
            <div className={`lg:hidden flex items-center justify-between gap-3 ${cardClass} p-3`}>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm accent-bg"
              >
                <Filter className="w-4 h-4" />
                <span>Filter Cars ({filteredVehicles.length})</span>
              </button>

              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCatalogViewMode('list')}
                  className={`p-1.5 rounded-md text-sm ${
                    catalogViewMode === 'list' ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogViewMode('grid')}
                  className={`p-1.5 rounded-md text-sm ${
                    catalogViewMode === 'grid' ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Unified Two-Column Catalog Frame */}
            <div className={`${cardClass} flex flex-col lg:flex-row items-stretch overflow-hidden`}>
              {/* Filter Sidebar */}
              <aside
                className={`w-full lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-5 ${
                  mobileFiltersOpen ? 'block' : 'hidden lg:block'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Filter className="w-4 h-4 accent-text" />
                    <span>{tr('Filters')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{tr('Reset')}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-800 dark:text-slate-200">{tr('Automatic Only')}</span>
                  <button
                    type="button"
                    onClick={() => setFilterAutomaticOnly(!filterAutomaticOnly)}
                    className={`px-2.5 py-1 rounded-md text-[13px] font-semibold border ${
                      filterAutomaticOnly
                        ? 'accent-bg border-transparent'
                        : 'bg-slate-50 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {filterAutomaticOnly ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white block">
                    {tr('Car Type')}
                  </label>
                  <div className="space-y-1 text-sm">
                    {[
                      { id: 'All', label: tr('All Cars') },
                      { id: 'LandCruiser', label: 'Land Cruiser 4x4' },
                      { id: 'RAV4', label: 'Toyota RAV4' },
                      { id: 'Safari Van', label: 'Safari Van' },
                      { id: 'Coaster', label: 'Coaster Bus' },
                      { id: 'Luxury Sedan', label: 'VIP Sedan' },
                    ].map((cat) => {
                      const count = categoryCounts[cat.id] ?? 0;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'accent-tint accent-text font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <span className="font-mono text-[13px] tabular-nums">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white block">
                    {tr('Seats Needed')}
                  </label>
                  <div className="grid grid-cols-5 bg-slate-100 dark:bg-slate-800/70 p-0.5 rounded-lg text-[13px]">
                    {[
                      { label: tr('All'), value: 0 },
                      { label: '2+', value: 2 },
                      { label: '4+', value: 4 },
                      { label: '5+', value: 5 },
                      { label: '7+', value: 7 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilterMinPassengers(opt.value)}
                        className={`py-1.5 text-center font-mono rounded-md transition-all ${
                          filterMinPassengers === opt.value
                            ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <label className="font-semibold text-slate-900 dark:text-white">
                      {tr('Max Price / Day')}
                    </label>
                    <span className="font-mono font-semibold accent-text tabular-nums">
                      {formatMoney(filterMaxPrice)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={300000}
                    step={10000}
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white block">
                    {tr('Fuel')}
                  </label>
                  <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/70 p-0.5 rounded-lg text-[13px]">
                    {['All', 'Diesel', 'Petrol'].map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => setFilterFuel(fuel)}
                        className={`py-1.5 rounded-md transition-all ${
                          filterFuel === fuel
                            ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {tr(fuel)}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Results Column */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#0f172a]">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <strong className="font-semibold text-slate-900 dark:text-white">{filteredVehicles.length}</strong> of{' '}
                    {visibleVehicles.length} cars · Prices for{' '}
                    <strong className="font-semibold text-slate-900 dark:text-white">
                      {days} {tr('days')}
                    </strong>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCatalogViewMode('list')}
                        className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-all ${
                          catalogViewMode === 'list' ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span>List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogViewMode('grid')}
                        className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-all ${
                          catalogViewMode === 'grid' ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Grid</span>
                      </button>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none"
                    >
                      <option value="price-asc">Lowest Price First</option>
                      <option value="price-desc">Highest Price First</option>
                      <option value="capacity">Most Seats</option>
                      <option value="rating">Newest Car</option>
                    </select>
                  </div>
                </div>

                {filteredVehicles.length > 0 ? (
                  catalogViewMode === 'list' ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredVehicles.map((vehicle) => {
                        const collision = checkBookingCollision(vehicle.id, startDate, endDate, bookings);
                        const isAvailable = !collision.hasCollision;
                        const tripTotalRwf = vehicle.daily_rate_rwf * days;
                        const bagCount = vehicle.seating_capacity >= 7 ? 4 : vehicle.seating_capacity >= 5 ? 3 : 2;

                        return (
                          <div
                            key={vehicle.id}
                            className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="w-full md:w-44 shrink-0">
                              <VehiclePhotoGallery
                                vehicle={vehicle}
                                aspectClass="h-40 md:h-28"
                                showThumbnails={false}
                                accentColor={activeThemeColor}
                                onImageClick={() => setQuickDetailVehicle(vehicle)}
                              />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <h3
                                  onClick={() => setQuickDetailVehicle(vehicle)}
                                  className="text-base font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline"
                                >
                                  {vehicle.model_name}
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                                    isAvailable
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                  />
                                  <span>{isAvailable ? tr('Open') : tr('Booked')}</span>
                                </span>
                              </div>

                              <div className="text-[13px] font-mono text-slate-500 dark:text-slate-400">
                                {vehicle.plate_number} · {vehicle.year || 2023} · {vehicle.category} · {vehicle.location}
                              </div>

                              <div className="text-sm text-slate-800 dark:text-slate-200">
                                {vehicle.seating_capacity} {tr('Seats')}, {bagCount} {tr('Bags')},{' '}
                                {tr(vehicle.transmission || 'Automatic')}, {tr(vehicle.fuel_type || 'Diesel')}
                              </div>

                              <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                {getVehicleCustomerSummary(vehicle)}
                              </p>
                            </div>

                            <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                              <div className="md:text-right">
                                <div className="font-mono font-semibold text-xl text-slate-900 dark:text-white tabular-nums">
                                  {formatMoney(tripTotalRwf)}
                                </div>
                                <div className="text-[13px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                  {formatMoney(vehicle.daily_rate_rwf)} {tr('Per day:').replace(':', '').toLowerCase()}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartBookingVehicle(vehicle)}
                                  disabled={!isAvailable}
                                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                                    isAvailable
                                      ? 'accent-bg hover:opacity-95'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  {tr('Pick & Book')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuickDetailVehicle(vehicle)}
                                  className="text-[13px] font-semibold accent-text hover:underline"
                                >
                                  {tr('Photos & Full Info')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredVehicles.map((vehicle) => {
                        const collision = checkBookingCollision(vehicle.id, startDate, endDate, bookings);
                        const isAvailable = !collision.hasCollision;
                        const tripTotalRwf = vehicle.daily_rate_rwf * days;

                        return (
                          <div
                            key={vehicle.id}
                            className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0f172a] overflow-hidden flex flex-col justify-between kf-card"
                          >
                            <div>
                              <VehiclePhotoGallery
                                vehicle={vehicle}
                                aspectClass="h-44"
                                showThumbnails={false}
                                accentColor={activeThemeColor}
                                onImageClick={() => setQuickDetailVehicle(vehicle)}
                                topLeftSlot={
                                  <span className="text-[12px] font-mono font-semibold bg-slate-900/80 px-2 py-0.5 rounded-md text-white">
                                    {vehicle.plate_number}
                                  </span>
                                }
                                topRightSlot={
                                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/80 text-white">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        isAvailable ? 'bg-emerald-400' : 'bg-rose-400'
                                      }`}
                                    />
                                    <span>{isAvailable ? tr('Open') : tr('Booked')}</span>
                                  </span>
                                }
                              />

                              <div className="p-4 space-y-2.5">
                                <h3
                                  onClick={() => setQuickDetailVehicle(vehicle)}
                                  className="text-base font-semibold text-slate-900 dark:text-white cursor-pointer hover:underline"
                                >
                                  {vehicle.model_name}
                                </h3>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {getVehicleCustomerSummary(vehicle)}
                                </p>

                                <div className="grid grid-cols-2 gap-2 text-[13px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 accent-text shrink-0" />
                                    <span>
                                      {vehicle.seating_capacity} {tr('Seats')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Luggage className="w-3.5 h-3.5 accent-text shrink-0" />
                                    <span>
                                      {vehicle.seating_capacity >= 7 ? '4' : '3'} {tr('Bags')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 accent-text shrink-0" />
                                    <span>{tr(vehicle.transmission || 'Automatic')}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Fuel className="w-3.5 h-3.5 accent-text shrink-0" />
                                    <span>{tr(vehicle.fuel_type || 'Diesel')}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-[13px] text-slate-500 dark:text-slate-400 block">
                                    {tr('Per day:')}
                                  </span>
                                  <span className="font-mono font-semibold text-slate-900 dark:text-white text-base tabular-nums">
                                    {formatMoney(vehicle.daily_rate_rwf)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[13px] text-slate-500 dark:text-slate-400 block">
                                    {days} {tr('days')}:
                                  </span>
                                  <span className="font-mono font-semibold text-sm accent-text tabular-nums">
                                    {formatMoney(tripTotalRwf)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setQuickDetailVehicle(vehicle)}
                                  className="w-2/5 py-2 rounded-lg text-[13px] font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                                >
                                  {tr('Photos & Info')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartBookingVehicle(vehicle)}
                                  disabled={!isAvailable}
                                  className={`w-3/5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
                                    isAvailable
                                      ? 'accent-bg hover:opacity-95'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  {tr('Pick & Book')} →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="p-12 text-center space-y-4">
                    <AlertCircle className="w-10 h-10 mx-auto accent-text" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {tr('No cars match your filters')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      {tr('Try clearing your filters or ask our Kigali help desk.')}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-lg font-semibold text-sm accent-bg"
                    >
                      {tr('Show All Cars')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Vehicle Info & Multi-Photo Explorer Modal */}
            {quickDetailVehicle && (
              <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-modal max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5">
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold accent-text">
                          {quickDetailVehicle.category} · {quickDetailVehicle.year || 2023}
                        </span>
                        <span className="text-[13px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                          {quickDetailVehicle.plate_number}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
                        {quickDetailVehicle.model_name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickDetailVehicle(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={tr('Close')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <VehiclePhotoGallery
                    vehicle={quickDetailVehicle}
                    aspectClass="h-56 sm:h-64"
                    showThumbnails={true}
                    accentColor={activeThemeColor}
                  />

                  <div className={`${subBoxClass} p-4 space-y-1.5`}>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tr('About This Car')}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {getVehicleCustomerSummary(quickDetailVehicle)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Seats')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {quickDetailVehicle.seating_capacity} {tr('Seats')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Gears')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {tr(quickDetailVehicle.transmission || 'Automatic')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Fuel')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {tr(quickDetailVehicle.fuel_type || 'Diesel')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Pickup Hub')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white truncate block">
                        {quickDetailVehicle.location}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tr('Included Features & Comfort')}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[13px]">
                      {(quickDetailVehicle.features && quickDetailVehicle.features.length > 0
                        ? quickDetailVehicle.features
                        : ['Air Conditioning', 'Unlimited Rwanda km', 'Safety Checked & Insured']
                      ).map((feat) => (
                        <div
                          key={feat}
                          className={`flex items-center gap-2 p-2.5 ${subBoxClass} text-slate-800 dark:text-slate-200`}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{tr(feat)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`${subBoxClass} p-4 space-y-2 text-sm`}>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{tr('Price per day:')}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(quickDetailVehicle.daily_rate_rwf)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{tr('Trip length:')}</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {days} {tr('Days')}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-slate-200/70 dark:border-slate-700 text-base">
                      <span>{tr('Estimated Total:')}</span>
                      <span className="font-mono accent-text tabular-nums">
                        {formatMoney(quickDetailVehicle.daily_rate_rwf * days)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const target = quickDetailVehicle;
                        setQuickDetailVehicle(null);
                        handleViewVehicleDetails(target);
                      }}
                      className="text-sm font-semibold accent-text hover:underline"
                    >
                      {tr('Open Full Car Page')} →
                    </button>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setQuickDetailVehicle(null)}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {tr('Close')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = quickDetailVehicle;
                          setQuickDetailVehicle(null);
                          handleStartBookingVehicle(target);
                        }}
                        className="px-5 py-2 rounded-lg text-sm font-semibold accent-bg"
                      >
                        {tr('Book This Car')} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CAR DETAILS PAGE */}
        {currentView === 'vehicle-detail' && selectedVehicle && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <button
              type="button"
              onClick={() => setCurrentView('vehicles')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tr('Back to all cars')}</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className={`${cardClass} p-5 sm:p-6 space-y-5`}>
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="font-mono font-semibold accent-text">{selectedVehicle.plate_number}</span>
                    <span>
                      {selectedVehicle.category} · {selectedVehicle.year || 2023}
                    </span>
                  </div>

                  <VehiclePhotoGallery
                    vehicle={selectedVehicle}
                    aspectClass="h-64 sm:h-80"
                    showThumbnails={true}
                    accentColor={activeThemeColor}
                  />

                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {selectedVehicle.model_name}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {getVehicleCustomerSummary(selectedVehicle)}
                    </p>
                  </div>
                </div>

                <div className={`${cardClass} p-5 sm:p-6 space-y-4`}>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {tr('Car Info & Specs')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Seats')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {selectedVehicle.seating_capacity} {tr('Seats')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Bags')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {selectedVehicle.seating_capacity >= 7 ? '4' : '3'} {tr('Suitcases')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Gears')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {tr(selectedVehicle.transmission || 'Automatic')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Fuel')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {tr(selectedVehicle.fuel_type || 'Diesel')}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Pickup Hub')}</span>
                      <strong className="font-semibold text-slate-900 dark:text-white truncate block">
                        {selectedVehicle.location}
                      </strong>
                    </div>
                    <div className={`${subBoxClass} p-3`}>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400 block">{tr('Safety Papers')}</span>
                      <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedVehicle.controle_technique_expiry
                          ? `${tr('Valid to')} ${formatHumanDate(selectedVehicle.controle_technique_expiry)}`
                          : tr('Verified Ready')}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {tr('What This Car Has')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {(selectedVehicle.features && selectedVehicle.features.length > 0
                        ? selectedVehicle.features
                        : [
                            'Air Conditioning',
                            'Unlimited Rwanda km',
                            'First-Aid & Spare Tire',
                            'Comprehensive Rwanda Insurance',
                          ]
                      ).map((feat) => (
                        <div
                          key={feat}
                          className={`flex items-center gap-2 p-2.5 ${subBoxClass} text-slate-800 dark:text-slate-200`}
                        >
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{tr(feat)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className={`${cardClass} p-5 space-y-4 sticky top-20`}>
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[13px] text-slate-500 dark:text-slate-400 block">
                      {tr('Price per day')}
                    </span>
                    <span className="text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">
                      {formatMoney(selectedVehicle.daily_rate_rwf)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm font-mono tabular-nums">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>{tr('Days:')}</span>
                      <span className="text-slate-900 dark:text-white">
                        {days} {tr('Days')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>{tr('Car rent:')}</span>
                      <span className="text-slate-900 dark:text-white">{formatMoney(baseRentalRwf)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>+ 18% {tr('VAT tax:')}</span>
                      <span>+{formatMoney(vatRwf)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between font-semibold text-base">
                      <span>{tr('Total:')}</span>
                      <span className="accent-text">{formatMoney(grandTotalRwf)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartBookingVehicle(selectedVehicle)}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm accent-bg hover:opacity-95"
                  >
                    {tr('Book This Car')} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: 5-STEP BOOKING */}
        {currentView === 'book' && selectedVehicle && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={getVehicleImageUrl(selectedVehicle)}
                  alt={selectedVehicle.model_name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[selectedVehicle.category];
                  }}
                  className="w-20 h-14 rounded-lg object-cover border border-slate-200/80 dark:border-slate-700 shrink-0"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('vehicles')}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-0.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Pick another car</span>
                  </button>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Book {selectedVehicle.model_name}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                {[
                  { s: 1, l: '1. Dates' },
                  { s: 2, l: '2. Extras' },
                  { s: 3, l: '3. Your Info' },
                  { s: 4, l: '4. ID' },
                  { s: 5, l: '5. Pay' },
                ].map((st, idx) => (
                  <React.Fragment key={st.s}>
                    {idx > 0 && <span className="text-slate-400">→</span>}
                    <span
                      className={
                        bookingStep >= st.s ? 'font-semibold accent-text' : 'text-slate-500 dark:text-slate-400'
                      }
                    >
                      {st.l}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {bookingStep === 1 && (
              <div className={`${cardClass} p-6 space-y-5`}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Step 1: Trip Type & Dates
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-1">
                  {(['self-drive', 'chauffeur', 'airport', 'safari'] as ServiceType[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setServiceType(st)}
                      className={`py-2 rounded-md text-sm transition-all ${
                        serviceType === st
                          ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {serviceLabel(st)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Pick-up Day</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Return Day</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Pick-up Place</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Return Place</label>
                    <input
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="px-5 py-2 rounded-lg font-semibold text-sm accent-bg"
                  >
                    Next: Add Extras →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className={`${cardClass} p-6 space-y-5`}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Step 2: Optional Extras
                </h2>

                <div className="space-y-2.5 text-sm">
                  <label className="flex items-start justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonChauffeur}
                        onChange={(e) => setAddonChauffeur(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Add a Driver</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          Experienced local driver who speaks English & Kinyarwanda
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold tabular-nums">+{formatMoney(15000)}/day</span>
                  </label>

                  <label className="flex items-start justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonWifiHotspot}
                        onChange={(e) => setAddonWifiHotspot(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Car Wi-Fi Box</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          Fast MTN internet inside the car for up to 5 phones
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold tabular-nums">+{formatMoney(7500)}/day</span>
                  </label>

                  <label className="flex items-start justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonChildSeat}
                        onChange={(e) => setAddonChildSeat(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">Child Car Seat</div>
                        <div className="text-slate-500 dark:text-slate-400">Safe baby or child seat</div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold tabular-nums">+{formatMoney(5000)}/day</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingStep(3)}
                    className="px-5 py-2 rounded-lg font-semibold text-sm accent-bg"
                  >
                    Next: Your Details →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className={`${cardClass} p-6 space-y-5 text-sm`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Step 3: Your Details
                  </h2>
                  <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsCorporateBooking(false)}
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        !isCorporateBooking ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCorporateBooking(true)}
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        isCorporateBooking ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white font-semibold shadow-xs' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Company / NGO
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Email (for your receipt)</label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Country</label>
                    <input
                      type="text"
                      value={countryResidence}
                      onChange={(e) => setCountryResidence(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {isCorporateBooking && (
                  <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/30 space-y-3">
                    <span className="font-semibold text-blue-700 dark:text-blue-400 block">
                      Company Tax Receipt Info:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Company Name</label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">TIN Number</label>
                        <input
                          type="text"
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Order Number</label>
                        <input
                          type="text"
                          value={purchaseOrderRef}
                          onChange={(e) => setPurchaseOrderRef(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-medium mb-1">Any Notes for Us?</label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingStep(4)}
                    className="px-5 py-2 rounded-lg font-semibold text-sm accent-bg"
                  >
                    Next: ID Check →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 4 && (
              <div className={`${cardClass} p-6 space-y-5 text-sm`}>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Step 4: License & ID
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {serviceType === 'self-drive'
                      ? 'Needed for driving insurance in Rwanda.'
                      : 'Needed so your driver can confirm it is you at pickup.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Driving License Number</label>
                    <input
                      type="text"
                      value={drivingLicenseNumber}
                      onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                      placeholder="DL-RWA-2022-881"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Passport or National ID</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="1198980012345678"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div className={`${subBoxClass} p-4 flex items-center justify-between`}>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">ID Status</span>
                    <span className="text-slate-500 dark:text-slate-400">Kept private and safe</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Checked</span>
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBookingStep(3)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingStep(5)}
                    className="px-5 py-2 rounded-lg font-semibold text-sm accent-bg"
                  >
                    Next: Review & Pay →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 5 && (
              <div className={`${cardClass} p-6 space-y-5 text-sm`}>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Step 5: Check Price & Pay
                </h2>

                <div className={`${subBoxClass} p-4 space-y-2 font-mono tabular-nums`}>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>
                      Car rent ({days} days × {formatMoney(selectedVehicle.daily_rate_rwf)}):
                    </span>
                    <span className="text-slate-900 dark:text-white">{formatMoney(baseRentalRwf)}</span>
                  </div>

                  {isSafariPeak && (
                    <div className="flex justify-between accent-text">
                      <span>+ Busy Season (+15%):</span>
                      <span>+{formatMoney(safariSurgeRwf)}</span>
                    </div>
                  )}

                  {isUpcountry && (
                    <div className="flex justify-between accent-text">
                      <span>+ Outside Kigali Trip Fee:</span>
                      <span>+{formatMoney(upcountrySurgeRwf)}</span>
                    </div>
                  )}

                  {totalAddonsRwf > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>+ Extras:</span>
                      <span>+{formatMoney(totalAddonsRwf)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>+ Tax (18% VAT):</span>
                    <span>+{formatMoney(vatRwf)}</span>
                  </div>

                  <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                    <span>Refundable Deposit (returned after trip):</span>
                    <span>{formatMoney(securityDepositRwf)}</span>
                  </div>

                  <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-white pt-2 border-t border-slate-200/80 dark:border-slate-700">
                    <span>Total Price:</span>
                    <span className="accent-text">{formatMoney(grandTotalRwf)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentOption === 'deposit'
                        ? 'accent-tint accent-border'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'deposit'}
                      onChange={() => setPaymentOption('deposit')}
                      className="sr-only"
                    />
                    <div className="font-semibold text-slate-900 dark:text-white">Pay {depositPercent}% Now</div>
                    <div className="font-mono text-base font-semibold mt-1 accent-text tabular-nums">
                      {formatMoney(depositToPayNowRwf)}
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pay the rest at pickup
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentOption === 'full'
                        ? 'accent-tint accent-border'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'full'}
                      onChange={() => setPaymentOption('full')}
                      className="sr-only"
                    />
                    <div className="font-semibold text-slate-900 dark:text-white">Pay Full Amount Now</div>
                    <div className="font-mono text-base text-emerald-600 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
                      {formatMoney(grandTotalRwf)}
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                      All paid, nothing owed later
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1">How Will You Pay?</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (*182#)</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Visa / Mastercard</option>
                  </select>
                </div>

                {paymentMethod === 'MTN Mobile Money' && (
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Your MTN MoMo Phone Number</label>
                    <input
                      type="text"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+250 788 123 456"
                      className={`${inputClass} font-mono font-semibold`}
                    />
                  </div>
                )}

                <label className="flex items-start gap-2.5 pt-1 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded"
                  />
                  <span>
                    I agree to the rental rules (return full fuel tank, free cancel 3+ days before) of{' '}
                    {companyDisplayName}.
                  </span>
                </label>

                {submissionError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 text-sm text-rose-700 dark:text-rose-400">
                    {submissionError}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBookingStep(4)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReservation}
                    disabled={!termsAgreed || isSubmittingBooking}
                    className={`py-2.5 px-5 rounded-lg font-semibold text-sm ${
                      termsAgreed && !isSubmittingBooking
                        ? 'accent-bg hover:opacity-95'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmittingBooking
                      ? 'Saving Your Car...'
                      : `Confirm & Pay ${formatMoney(depositToPayNowRwf)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: CONFIRMATION */}
        {currentView === 'confirmation' && confirmedBooking && (
          <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 text-center space-y-2.5">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Your Car Is Booked!</h1>
              <div className="font-mono text-sm font-semibold accent-text">
                Booking code: #{bookingReferenceId || confirmedBooking.id}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                We sent a text and email to <strong className="font-mono">{confirmedBooking.client_phone}</strong>. Your
                car is saved just for you.
              </p>
            </div>

            <div className={`${cardClass} p-5 space-y-3 text-sm`}>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">What Happens Next</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <span className="font-mono font-semibold accent-text">1.</span>
                  <div>
                    <strong className="font-semibold">Car Prep:</strong> Car {selectedVehicle.plate_number} is cleaned
                    and checked.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono font-semibold accent-text">2.</span>
                  <div>
                    <strong className="font-semibold">Driver Message:</strong> We text you your driver&apos;s phone
                    number 4 hours before pickup.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="font-mono font-semibold accent-text">3.</span>
                  <div>
                    <strong className="font-semibold">Meet & Drive:</strong> Meet at Kigali Airport Gate 1 or your
                    chosen pickup spot.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView('voucher')}
                className="w-full sm:w-1/2 py-2.5 rounded-lg bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" />
                <span>Print Booking Pass</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrackRefInput(bookingReferenceId || confirmedBooking.id);
                  setTrackPhoneInput(confirmedBooking.client_phone);
                  setTrackedBooking(confirmedBooking);
                  setCurrentView('track');
                }}
                className="w-full sm:w-1/2 py-2.5 rounded-lg font-semibold text-sm accent-bg"
              >
                Check Booking Status →
              </button>
            </div>
          </div>
        )}

        {/* VIEW 8: PRINTABLE PASS */}
        {currentView === 'voucher' && (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
            <div className="flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back Home</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 accent-bg"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            <div className="p-6 sm:p-8 rounded-xl bg-white text-slate-900 border border-slate-200 kf-card space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">{companyDisplayName}</h1>
                  <div className="text-sm text-slate-500 mt-0.5">Licensed Car Rental · Safety Checked</div>
                  <div className="text-sm text-slate-500">Kigali Airport & Remera Office, Rwanda</div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[13px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Confirmed
                  </span>
                  <div className="text-sm font-mono font-semibold text-slate-900 mt-1">
                    Pass #{bookingReferenceId || confirmedBooking?.id || 'KGF-2026-90412'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-[13px]">Guest Name</span>
                  <strong className="font-semibold text-slate-900">
                    {confirmedBooking?.client_name || clientName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[13px]">Phone / WhatsApp</span>
                  <strong className="font-semibold text-slate-900 font-mono">
                    {confirmedBooking?.client_phone || clientPhone}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[13px]">Car</span>
                  <strong className="font-semibold text-slate-900">
                    {selectedVehicle.model_name} [<span className="font-mono">{selectedVehicle.plate_number}</span>]
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[13px]">Dates</span>
                  <strong className="font-semibold text-slate-900">
                    {formatHumanDateRange(startDate, endDate, { includeYear: true })} ({days} days)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[13px]">Route</span>
                  <strong className="font-semibold text-slate-900">
                    {confirmedBooking?.destination || `${pickupLocation} -> ${returnLocation}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[13px]">24/7 Help Phone</span>
                  <strong className="font-semibold font-mono">{companyPhone}</strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 text-sm font-mono tabular-nums">
                <div className="flex justify-between font-semibold text-slate-900 text-base">
                  <span>{tr('Total')}:</span>
                  <span>{formatMoney(confirmedBooking?.total_rwf || grandTotalRwf)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9: CHECK BOOKING */}
        {currentView === 'track' && (
          <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
            <div className={`${cardClass} p-6 space-y-5`}>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 accent-text" />
                  <span>Check Your Booking</span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter your booking code (for example bk-2026-089) and phone number.
                </p>
              </div>

              <form onSubmit={handleTrackBookingLookup} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Booking Code</label>
                    <input
                      type="text"
                      required
                      placeholder="bk-2026-089"
                      value={trackRefInput}
                      onChange={(e) => setTrackRefInput(e.target.value)}
                      className={`${inputClass} font-mono font-semibold`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+250 788 123 456"
                      value={trackPhoneInput}
                      onChange={(e) => setTrackPhoneInput(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                {trackError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/30 text-sm text-rose-700 dark:text-rose-400">
                    {trackError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg font-semibold text-sm accent-bg"
                >
                  Find My Booking
                </button>
              </form>

              {trackedBooking && (
                <div className={`${subBoxClass} p-5 space-y-4`}>
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-3">
                    <div>
                      <span className="text-sm font-mono font-semibold accent-text">#{trackedBooking.id}</span>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-0.5">
                        {trackedBooking.client_name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{trackedBooking.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Dates:</span>
                      <span className="font-semibold">
                        {formatHumanDateRange(trackedBooking.start_date, trackedBooking.end_date, {
                          includeYear: true,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Where:</span>
                      <span className="font-semibold truncate block">{trackedBooking.destination}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Payment:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {trackedBooking.payment_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[13px]">{tr('Total')}:</span>
                      <span className="font-mono font-semibold accent-text tabular-nums">
                        {formatMoney(trackedBooking.total_rwf)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedBooking(trackedBooking);
                        setCurrentView('voucher');
                      }}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Open Booking Pass</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 10: GROUP QUOTE */}
        {currentView === 'quote' && (
          <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
            <div className={`${cardClass} p-6 space-y-5 text-sm`}>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 accent-text" />
                  <span>Ask for a Group Price</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  For NGOs, embassies, offices, and large events needing more than one car.
                </p>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Group or Company Name</label>
                    <input
                      type="text"
                      required
                      value={quoteOrganization}
                      onChange={(e) => setQuoteOrganization(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={quoteContactName}
                      onChange={(e) => setQuoteContactName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={quoteEmail}
                      onChange={(e) => setQuoteEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div className={`${subBoxClass} p-4 space-y-3`}>
                  <span className="font-semibold text-slate-900 dark:text-white block">Cars Needed:</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                        4x4 Cars
                      </label>
                      <select
                        value={quoteLandCruisers}
                        onChange={(e) => setQuoteLandCruisers(Number(e.target.value))}
                        className={inputClass}
                      >
                        {[0, 1, 2, 3, 5, 8, 10].map((n) => (
                          <option key={n} value={n}>
                            {n} Cars
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                        Coaster Buses
                      </label>
                      <select
                        value={quoteCoasters}
                        onChange={(e) => setQuoteCoasters(Number(e.target.value))}
                        className={inputClass}
                      >
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n} Buses
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-1">
                        Days
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={quoteDays}
                        onChange={(e) => setQuoteDays(Number(e.target.value))}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium mb-1">Trip Notes</label>
                  <textarea
                    rows={3}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {quoteSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                    {quoteSuccessMsg}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('home')}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-lg font-semibold text-sm accent-bg"
                  >
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 11: HELP & CONTACT */}
        {currentView === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className={`${cardClass} p-5 space-y-4 text-sm`}>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Call or Message Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 accent-text shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Phone:</span>
                        <strong className="font-mono font-semibold">{companyPhone}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[13px]">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${whatsappDigits}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold hover:underline"
                        >
                          {whatsappDisplay}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Office:</span>
                        <span>Kigali Airport Gate 1 & Remera</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[13px]">Hours:</span>
                        <span>Open 24 hours, every day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`md:col-span-2 ${cardClass} p-6 space-y-5 text-sm`}>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Send Us a Help Message
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Our team reads every message and replies quickly.
                  </p>
                </div>

                {ticketSubmittedId ? (
                  <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 text-center space-y-3">
                    <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Message #{ticketSubmittedId} Sent
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      We will reply by SMS or email within 30 minutes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTicketSubmittedId(null)}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={ticketName}
                          onChange={(e) => setTicketName(e.target.value)}
                          placeholder="David Henderson"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Phone / WhatsApp</label>
                        <input
                          type="text"
                          required
                          value={ticketPhone}
                          onChange={(e) => setTicketPhone(e.target.value)}
                          placeholder="+250 788 000 000"
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Email</label>
                        <input
                          type="email"
                          required
                          value={ticketEmail}
                          onChange={(e) => setTicketEmail(e.target.value)}
                          placeholder="name@example.com"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Booking Code (optional)</label>
                        <input
                          type="text"
                          value={ticketBookingRef}
                          onChange={(e) => setTicketBookingRef(e.target.value)}
                          placeholder="bk-2026-089"
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Topic</label>
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className={inputClass}
                        >
                          <option value="New booking question">New booking question</option>
                          <option value="Question about a booking I already have">About my booking</option>
                          <option value="Flight time changed">Flight time changed</option>
                          <option value="Payment or tax receipt">Payment or tax receipt</option>
                          <option value="Cancel or refund request">Cancel or refund</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">How Urgent?</label>
                        <select
                          value={ticketPriority}
                          onChange={(e) => setTicketPriority(e.target.value as any)}
                          className={inputClass}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent (Flight soon)</option>
                          <option value="Emergency">Emergency on the road</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium mb-1">How Can We Help?</label>
                      <textarea
                        rows={4}
                        required
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Write your question here..."
                        className={inputClass}
                      />
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        type="submit"
                        className="py-2 px-5 rounded-lg font-semibold text-sm accent-bg"
                      >
                        Send Help Message
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 12: RENTAL RULES */}
        {currentView === 'terms' && (
          <div className="max-w-4xl mx-auto px-4 py-10 space-y-5 text-sm leading-relaxed">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </button>

            <div className={`${cardClass} p-6 sm:p-8 space-y-5`}>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Simple Rental Rules</h1>

              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-base">01. Driver License</h3>
                  <p>
                    Drivers must be 21 or older with a valid license held for at least 1 year. Visitors may use an
                    English or French license for 90 days.
                  </p>
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-base">02. Fuel</h3>
                  <p>We give you the car with a full tank. Please return it with a full tank.</p>
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-base">03. Distance</h3>
                  <p>
                    Drive as many kilometers as you want inside Rwanda. Leaving Rwanda requires written permission
                    first.
                  </p>
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-base">04. Deposit</h3>
                  <p>
                    {t({
                      EN: `A ${formatMoney(150000)} deposit is held when you take the car and given back within 24 hours after return.`,
                      RW: `Ingwate ya ${formatMoney(150000)} ifatwa igihe ufata imodoka ikasubizwa mu masaha 24 nyuma yo kuyisubiza.`,
                      FR: `Une caution de ${formatMoney(150000)} est retenue au départ et remboursée sous 24 heures après le retour.`,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 13: CANCEL & REFUNDS */}
        {currentView === 'cancellation' && (
          <div className="max-w-4xl mx-auto px-4 py-10 space-y-5 text-sm leading-relaxed">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </button>

            <div className={`${cardClass} p-6 sm:p-8 space-y-5`}>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Cancel & Refund Rules</h1>

              <div className={`${subBoxClass} p-4 space-y-2.5 font-mono`}>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>7+ days before pickup:</span>
                  <span>100% refund</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>3 to 7 days before pickup:</span>
                  <span>50% refund</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Under 3 days before pickup:</span>
                  <span>No deposit refund</span>
                </div>
              </div>

              <form
                onSubmit={handleSubmitCancellation}
                className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Ask to Cancel a Booking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Booking Code</label>
                    <input
                      type="text"
                      required
                      value={cancelBookingRef}
                      onChange={(e) => setCancelBookingRef(e.target.value)}
                      placeholder="bk-2026-089"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">MoMo Phone for Refund</label>
                    <input
                      type="text"
                      required
                      value={cancelPhone}
                      onChange={(e) => setCancelPhone(e.target.value)}
                      placeholder="+250 788 123 456"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1">Why are you canceling?</label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {cancelSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                    {cancelSuccessMsg}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors"
                  >
                    Send Cancel Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 14: FAQ */}
        {currentView === 'faq' && (
          <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back Home</span>
              </button>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Common Questions</h1>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type a word (e.g. airport, deposit, park, MoMo)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>

            <div className={`${cardClass} divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden`}>
              {[
                {
                  q: 'What papers do I need to drive myself in Rwanda?',
                  a: 'A valid driving license and your passport or national ID. Foreign licenses in English or French work for up to 90 days.',
                },
                {
                  q: 'How do I know nobody else took my car?',
                  a: 'When you book, the car dates lock right away so no one else can book the same car.',
                },
                {
                  q: 'What if my flight to Kigali is late?',
                  a: 'We watch your flight time and hold your driver at no extra waiting fee.',
                },
                {
                  q: 'Can I drive to Akagera, Nyungwe, or Volcanoes Park?',
                  a: 'Yes! Our 4x4 cars and safari vans can travel to every park and district in Rwanda.',
                },
                {
                  q: 'How do I get my deposit back?',
                  a: `After you return the car in good shape, we send back your ${formatMoney(150000)} deposit via MoMo or card within 24 hours.`,
                },
                {
                  q: 'Can my office book several cars together?',
                  a: 'Yes, use the "Group & Business Quote" page to ask for a price on multiple 4x4s, buses, or sedans.',
                },
              ]
                .filter(
                  (f) =>
                    !faqSearch ||
                    f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                    f.a.toLowerCase().includes(faqSearch.toLowerCase())
                )
                .map((faq, idx) => (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 accent-text shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] py-10 px-4 sm:px-6 text-sm print:hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center accent-bg">
                <Car className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-base">
                {companyDisplayName}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Trusted car rental in Rwanda. Clean cars, clear prices, and official tax receipts.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-slate-900 dark:text-white block">Trips</span>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('self-drive');
                    setCurrentView('home');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Drive Yourself 4x4
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('chauffeur');
                    setCurrentView('home');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  With a Driver
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('airport');
                    setCurrentView('home');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Kigali Airport Pickup
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentView('quote')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Group & Business Quote
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-slate-900 dark:text-white block">Rules & Help</span>
            <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentView('terms')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Rental Rules
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentView('cancellation')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel & Refunds
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentView('faq')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Common Questions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentView('contact')}
                  className="hover:text-slate-900 dark:hover:text-white"
                >
                  Contact Help Desk
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-slate-900 dark:text-white block">24/7 Phone Desk</span>
            <div className="space-y-1.5 text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 accent-text" />
                <span className="font-mono">{companyPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  WhatsApp: <span className="font-mono">{whatsappDisplay}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Kigali Airport & Remera</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-400">
          <span>© 2026 {companyDisplayName}. All rights reserved.</span>
          <button
            type="button"
            onClick={() => onReturnToManager()}
            className="text-sm font-semibold accent-text hover:underline"
          >
            Company Office Login →
          </button>
        </div>
      </footer>
    </div>
  );
};
