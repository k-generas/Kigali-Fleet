import React, { useState, useMemo } from 'react';
import { Vehicle, Driver, Booking, Company, CompanySettings, SupportTicket } from '../types';
import {
  calculateDays,
  formatRwf,
  checkBookingCollision,
} from '../utils/collision';
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
  Star,
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
type Currency = 'RWF' | 'USD';
type Language = 'EN' | 'RW' | 'FR';

const USD_RATE = 1350;

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  vehicles,
  drivers,
  bookings,
  currentTheme,
  currentCompany,
  companySettings,
  onCompleteClientBooking,
  onSubmitSupportTicket,
}) => {
  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  const [currentView, setCurrentView] = useState<StorefrontViewMode>('home');
  const [currency, setCurrency] = useState<Currency>('RWF');
  const [language, setLanguage] = useState<Language>('EN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>('self-drive');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isSearchEditOpen, setIsSearchEditOpen] = useState(false);
  const [quickDetailVehicle, setQuickDetailVehicle] = useState<Vehicle | null>(null);

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

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0] || null);

  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [clientName, setClientName] = useState('Elizabeth Thorne');
  const [clientPhone, setClientPhone] = useState('+250 788 456 789');
  const [clientEmail, setClientEmail] = useState('e.thorne@awf-conservation.org');
  const [countryResidence, setCountryResidence] = useState('United Kingdom');
  const [organization, setOrganization] = useState('African Wildlife Foundation');
  const [tinNumber, setTinNumber] = useState('109823471');
  const [purchaseOrderRef, setPurchaseOrderRef] = useState('PO-AWF-2026-081');
  const [specialRequests, setSpecialRequests] = useState('Need English-speaking driver and 4x4 car for park roads.');

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
  const [quoteNotes, setQuoteNotes] = useState('Need 3 English-speaking drivers for a 4-day trip in Kigali and Musanze.');
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

  const formatMoney = (amountRwf: number) => {
    if (currency === 'USD') {
      const usd = Math.round(amountRwf / USD_RATE);
      return `$${usd.toLocaleString()} USD`;
    }
    return formatRwf(amountRwf);
  };

  const companyDisplayName = currentCompany?.name || 'Kigali Executive Rentals';
  const companyPhone = currentCompany?.phone || '+250 788 312 000';

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
  const safariKitCostRwf = addonSafariKit || (serviceType === 'safari' && safariPopUpRoof) ? days * 20000 : 0;

  const totalAddonsRwf = chauffeurCostRwf + childSeatCostRwf + wifiHotspotCostRwf + safariKitCostRwf;
  const subtotalBeforeVatRwf = baseRentalRwf + safariSurgeRwf + upcountrySurgeRwf + totalAddonsRwf;
  const vatRwf = Math.round(subtotalBeforeVatRwf * 0.18);
  const securityDepositRwf = 150000;
  const grandTotalRwf = subtotalBeforeVatRwf + vatRwf;

  const depositPercent = companySettings?.storefront_deposit_percent || 30;
  const depositToPayNowRwf =
    paymentOption === 'deposit' ? Math.round(grandTotalRwf * (depositPercent / 100)) : grandTotalRwf;

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: vehicles.length };
    vehicles.forEach((v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
    });
    return counts;
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles
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
    vehicles,
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
        collision.conflictReason || 'This car is already booked for those dates. Please pick another car or date.'
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

  const handleTrackBookingLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedBooking(null);

    const ref = trackRefInput.trim().toLowerCase();
    const phone = trackPhoneInput.trim().replace(/\s+/g, '');

    const found = bookings.find((b) => {
      const matchId = b.id.toLowerCase().includes(ref) || ref.includes(b.id.toLowerCase());
      const matchPhone = !phone || b.client_phone.replace(/\s+/g, '').includes(phone);
      return matchId && matchPhone;
    });

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

  const inputClass =
    'w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-[#0a2540] dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500';

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f6f9fc] dark:bg-slate-950 text-[#0a2540] dark:text-slate-100 antialiased flex flex-col">
      {/* Top Help & Currency Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 text-sm w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 text-[#425466] dark:text-slate-400 min-w-0">
            <div className="flex items-center gap-2 font-medium truncate">
              <Phone className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
              <span className="truncate">
                Call 24/7: <strong className="text-[#0a2540] dark:text-white font-mono">{companyPhone}</strong>
              </span>
            </div>
            <span aria-hidden="true" className="hidden lg:inline text-slate-300 dark:text-slate-700">
              ·
            </span>
            <div className="hidden lg:flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Kigali Airport & Remera Office</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-950 rounded-full p-0.5 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setCurrency('RWF')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                  currency === 'RWF'
                    ? `${activeBtnText}`
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
                style={currency === 'RWF' ? { backgroundColor: activeThemeColor } : undefined}
              >
                RWF
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                  currency === 'USD'
                    ? `${activeBtnText}`
                    : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                }`}
                style={currency === 'USD' ? { backgroundColor: activeThemeColor } : undefined}
              >
                USD ($)
              </button>
            </div>

            <div className="flex items-center bg-[#f6f9fc] dark:bg-slate-950 rounded-full p-0.5 border border-slate-200 dark:border-slate-800 text-sm font-semibold">
              {(['EN', 'RW', 'FR'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2.5 py-1 rounded-full transition-colors ${
                    language === lang
                      ? 'bg-white dark:bg-slate-800 text-[#0a2540] dark:text-white shadow-xs'
                      : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 w-full">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 text-left text-[#0a2540] dark:text-white min-w-0 shrink group"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              <Car className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight truncate max-w-[160px] sm:max-w-[260px]">
              {companyDisplayName}
            </span>
          </button>

          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-[#425466] dark:text-slate-300 min-w-0 shrink">
            <button
              onClick={() => setCurrentView('vehicles')}
              className={`hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap ${
                currentView === 'vehicles' ? 'text-[#0a2540] dark:text-white font-bold' : ''
              }`}
            >
              Cars & Prices
            </button>
            <button
              onClick={() => {
                setServiceType('airport');
                setCurrentView('home');
              }}
              className="hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Airport Pickup
            </button>
            <button
              onClick={() => {
                setServiceType('safari');
                setCurrentView('home');
              }}
              className="hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap"
            >
              Safari Trips
            </button>
            <button
              onClick={() => setCurrentView('track')}
              className={`hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap ${
                currentView === 'track' ? 'text-[#0a2540] dark:text-white font-bold' : ''
              }`}
            >
              Check Booking
            </button>
            <button
              onClick={() => setCurrentView('contact')}
              className={`hover:text-[#0a2540] dark:hover:text-white transition-colors whitespace-nowrap ${
                currentView === 'contact' ? 'text-[#0a2540] dark:text-white font-bold' : ''
              }`}
            >
              Help
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0 z-10">
            <a
              href={`https://wa.me/250788312000?text=${encodeURIComponent(
                `Muraho! I want to ask about renting a car from ${companyDisplayName}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-500/30 text-sm font-semibold transition-colors shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden 2xl:inline">WhatsApp</span>
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
              className={`px-5 py-2 rounded-full text-sm font-semibold shadow-xs whitespace-nowrap transition-transform active:scale-95 shrink-0 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              Book a Car
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white bg-slate-100 dark:bg-slate-800 xl:hidden transition-colors shrink-0"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 text-sm font-medium text-[#425466] dark:text-slate-300 pb-2">
            {[
              { label: 'Home', action: () => setCurrentView('home'), active: currentView === 'home' },
              {
                label: `Cars & Prices (${vehicles.length} Cars)`,
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
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className={`text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  item.active ? 'bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-white font-bold' : ''
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
          <div className="space-y-16 pb-20">
            <section className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-14 sm:py-20 px-4 sm:px-8">
              <div className="max-w-5xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-[#425466] dark:text-slate-400">
                  <span>Licensed Rwanda Car Rental</span>
                  <span aria-hidden="true">·</span>
                  <span>Kigali Airport Pickup</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0a2540] dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
                  Rent the Right Car in Rwanda.
                </h1>

                <p className="text-base sm:text-lg text-[#425466] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Book clean 4x4 safari cars, city SUVs, and airport rides. Pick your dates, see real open cars, and pay easily with MTN MoMo.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById('adaptive-search');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`px-6 py-3 rounded-full text-sm font-semibold shadow-xs transition-transform active:scale-95 ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Find an Open Car
                  </button>
                  <button
                    onClick={() => setCurrentView('vehicles')}
                    className="px-6 py-3 rounded-full text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    See All Cars & Prices
                  </button>
                </div>

                <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-[#425466] dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 max-w-4xl mx-auto mt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>No Double-Bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Safety Checked Cars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Official 18% Tax Receipt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>24/7 Road Help</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Adaptive Search Box */}
            <section id="adaptive-search" className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#f6f9fc] dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {(
                    [
                      { id: 'self-drive', label: 'Drive Yourself', icon: Car },
                      { id: 'chauffeur', label: 'With Driver', icon: Users },
                      { id: 'airport', label: 'Airport Pickup', icon: Plane },
                      { id: 'safari', label: 'Safari & Parks', icon: Compass },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = serviceType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setServiceType(tab.id)}
                        className={`p-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                          active
                            ? `${activeBtnText} shadow-xs`
                            : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                        }`}
                        style={active ? { backgroundColor: activeThemeColor } : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {serviceType === 'airport' ? (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                            className={`${inputClass} font-mono font-bold`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2.5 cursor-pointer text-[#0a2540] dark:text-slate-300 font-medium">
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
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                        <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                      <label className="flex items-center gap-2.5 cursor-pointer text-[#0a2540] dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={safariPopUpRoof}
                          onChange={(e) => setSafariPopUpRoof(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>Open-up safari roof for photos</span>
                      </label>
                      <span className="font-mono font-semibold text-[#0a2540] dark:text-amber-400">
                        {days} Days Trip
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                      <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                      <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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
                      <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1.5">
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

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-[#425466] dark:text-slate-400 font-mono">
                    <span>
                      Length: <strong className="text-[#0a2540] dark:text-white">{days} Days</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Trip: <strong className="text-[#0a2540] dark:text-amber-400">{serviceLabel(serviceType)}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentView('vehicles')}
                    className={`px-6 py-3 rounded-full text-sm font-semibold shadow-xs transition-transform active:scale-95 ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Show Open Cars ({vehicles.length}) →
                  </button>
                </div>
              </div>
            </section>

            {/* Popular Cars */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-semibold" style={{ color: activeThemeColor }}>
                    Ready to Drive
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                    Popular Cars for Rent
                  </h2>
                </div>

                <button
                  onClick={() => setCurrentView('vehicles')}
                  className="text-sm font-semibold flex items-center gap-1 hover:underline self-start sm:self-auto"
                  style={{ color: activeThemeColor }}
                >
                  <span>See all {vehicles.length} cars</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vehicles.slice(0, 3).map((vehicle) => {
                  const collision = checkBookingCollision(vehicle.id, startDate, endDate, bookings);
                  const isAvailable = !collision.hasCollision;

                  return (
                    <div
                      key={vehicle.id}
                      className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group"
                    >
                      <div>
                        <div className="h-44 bg-slate-900 flex flex-col justify-between p-4 relative overflow-hidden">
                          <div className="flex items-center justify-between z-10">
                            <span className="text-sm font-mono font-semibold text-white bg-slate-950/75 px-2.5 py-0.5 rounded-lg">
                              {vehicle.plate_number}
                            </span>
                            <span
                              className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                                isAvailable
                                  ? 'bg-emerald-950/85 text-emerald-300'
                                  : 'bg-rose-950/85 text-rose-300'
                              }`}
                            >
                              {isAvailable ? 'Open' : 'Booked'}
                            </span>
                          </div>

                          {vehicle.image_url ? (
                            <img
                              src={vehicle.image_url}
                              alt={vehicle.model_name}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90"
                            />
                          ) : (
                            <div className="flex items-center justify-center my-auto text-slate-600">
                              <Car className="w-20 h-20 stroke-[1.2]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                          <div className="flex items-center gap-2 text-sm text-slate-200 font-medium z-10">
                            <span>{vehicle.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{vehicle.year}</span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          <div>
                            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">{vehicle.model_name}</h3>
                            <div className="flex items-center gap-3 text-sm text-[#425466] dark:text-slate-400 mt-1">
                              <span>{vehicle.seating_capacity} Seats</span>
                              <span aria-hidden="true">·</span>
                              <span>{vehicle.transmission || 'Automatic'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{vehicle.fuel_type || 'Diesel'}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-sm text-[#425466] dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Start full tank, return full</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Unlimited distance in Rwanda</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-sm text-[#425466] dark:text-slate-400 block">Per day:</span>
                          <span className="font-mono font-extrabold text-[#0a2540] dark:text-white text-lg">
                            {formatMoney(vehicle.daily_rate_rwf)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewVehicleDetails(vehicle)}
                            className="px-4 py-2 rounded-full text-sm font-semibold text-[#0a2540] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleStartBookingVehicle(vehicle)}
                            disabled={!isAvailable}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                              isAvailable
                                ? `${activeBtnText} hover:brightness-105`
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
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

            {/* 4 Ways to Travel */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 pt-4">
              <div className="space-y-1">
                <span className="text-sm font-semibold" style={{ color: activeThemeColor }}>
                  Ways to Travel
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                  What We Offer
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <div
                      key={svc.title}
                      className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#f6f9fc] dark:bg-slate-800"
                        style={{ color: activeThemeColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-[#0a2540] dark:text-white">{svc.title}</h3>
                      <p className="text-sm text-[#425466] dark:text-slate-400 leading-relaxed">{svc.body}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Why Book Here */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8">
                <div className="max-w-2xl space-y-2">
                  <span className="text-sm font-semibold" style={{ color: activeThemeColor }}>
                    Safe & Clear
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                    Simple Rules, No Surprises
                  </h2>
                  <p className="text-base text-[#425466] dark:text-slate-400 leading-relaxed">
                    Every car listed is real and ready. You see the full price before paying.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-[#0a2540] dark:text-white font-bold text-base">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>No Double-Bookings</span>
                    </div>
                    <p className="text-sm text-[#425466] dark:text-slate-400 leading-relaxed">
                      Once you book a car, those dates lock right away so nobody else can take your car.
                    </p>
                  </div>

                  <div className="space-y-2 p-5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-[#0a2540] dark:text-white font-bold text-base">
                      <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Official Tax Receipt</span>
                    </div>
                    <p className="text-sm text-[#425466] dark:text-slate-400 leading-relaxed">
                      Every payment gives you an official Rwanda tax receipt for personal or work records.
                    </p>
                  </div>

                  <div className="space-y-2 p-5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-[#0a2540] dark:text-white font-bold text-base">
                      <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Easy MoMo & Card Pay</span>
                    </div>
                    <p className="text-sm text-[#425466] dark:text-slate-400 leading-relaxed">
                      Pay 30% now or all at once using MTN MoMo, Airtel Money, bank transfer, or Visa/Mastercard.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reviews */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6 pt-4">
              <div className="space-y-1">
                <span className="text-sm font-semibold" style={{ color: activeThemeColor }}>
                  Guest Stories
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                  What Travelers Say
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Dr. Arthur Mugabo',
                    tag: 'NGO Trip',
                    quote:
                      'Rented a Land Cruiser for a 4-day work trip in Musanze. The car was clean, driver Emmanuel was on time, and we got our tax receipt right away.',
                    org: 'UNDP Rwanda',
                  },
                  {
                    name: 'Sarah Jenkins',
                    tag: 'Visitor',
                    quote:
                      'Our flight from Amsterdam landed 2 hours late, and the driver still waited at Gate 1 with water and our name sign. Very easy!',
                    org: 'Visitor from Netherlands',
                  },
                  {
                    name: 'Patrick Habimana',
                    tag: 'Business',
                    quote:
                      'Booked two safari vans for event guests. Confirmed in minutes and paying with MTN MoMo was fast.',
                    org: 'Kigali Event Team',
                  },
                ].map((rev) => (
                  <div
                    key={rev.name}
                    className="stripe-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-[#0a2540] dark:text-white">{rev.name}</span>
                      <span className="text-[#425466] dark:text-slate-400">{rev.tag}</span>
                    </div>
                    <div className="text-amber-500 text-sm">★★★★★</div>
                    <p className="text-sm text-[#425466] dark:text-slate-300 leading-relaxed">"{rev.quote}"</p>
                    <div className="text-sm text-[#425466] dark:text-slate-500">{rev.org}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4 Easy Steps */}
            <section className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8 pt-4">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-sm font-semibold" style={{ color: activeThemeColor }}>
                  Easy Steps
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                  How Booking Works
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
                {[
                  { n: '01', title: 'Pick Trip Type', text: 'Choose self-drive, with a driver, airport pickup, or safari.' },
                  { n: '02', title: 'Pick a Car', text: 'Check photos, seats, full prices, and open dates.' },
                  { n: '03', title: 'Pay & Confirm', text: 'Pay 30% deposit or full total with MoMo, bank, or card.' },
                  { n: '04', title: 'Get Your Pass', text: 'Get your booking pass with pickup steps and driver phone.' },
                ].map((step) => (
                  <div
                    key={step.n}
                    className="stripe-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <span className="font-mono text-lg font-bold" style={{ color: activeThemeColor }}>
                      {step.n}
                    </span>
                    <h3 className="font-bold text-[#0a2540] dark:text-white text-base">{step.title}</h3>
                    <p className="text-[#425466] dark:text-slate-400 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Questions */}
            <section className="max-w-4xl mx-auto px-4 space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-2xl font-bold text-[#0a2540] dark:text-white">Common Questions</h2>
                <button
                  onClick={() => setCurrentView('faq')}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: activeThemeColor }}
                >
                  See all questions →
                </button>
              </div>

              <div className="space-y-3">
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
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-base font-semibold text-[#0a2540] dark:text-slate-100"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-4 text-sm text-[#425466] dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-3">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-[#425466] dark:text-slate-400 block text-sm font-medium">Pick-up & Return</span>
                  <span className="text-[#0a2540] dark:text-white font-semibold flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                    <span>{pickupLocation}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[#425466] dark:text-slate-400 block text-sm font-medium">Dates</span>
                  <span className="text-[#0a2540] dark:text-white font-semibold flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                    <span className="font-mono">
                      {startDate} to {endDate} ({days} days)
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[#425466] dark:text-slate-400 block text-sm font-medium">Trip Type</span>
                  <span className="font-semibold flex items-center gap-1.5 mt-0.5" style={{ color: activeThemeColor }}>
                    <Car className="w-4 h-4 shrink-0" />
                    <span>{serviceLabel(serviceType)}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsSearchEditOpen(!isSearchEditOpen)}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors self-start md:self-auto"
              >
                <SlidersHorizontal className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span>{isSearchEditOpen ? 'Close Edit' : 'Change Dates or Place'}</span>
              </button>
            </div>

            {isSearchEditOpen && (
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">Pick-up Place</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">Return Place</label>
                    <input
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">Pick-up Day</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block text-[#0a2540] dark:text-slate-300 font-semibold mb-1">Return Day</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-sm text-[#425466] dark:text-slate-400 font-mono">
                    Total Days: <strong className="text-[#0a2540] dark:text-white">{days} Days</strong>
                  </span>
                  <button
                    onClick={() => setIsSearchEditOpen(false)}
                    className={`px-5 py-2 rounded-full font-semibold text-sm ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Update Search
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Filter Button */}
            <div className="lg:hidden flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <button
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Filter className="w-4 h-4" />
                <span>Filter Cars ({filteredVehicles.length})</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCatalogViewMode('grid')}
                  className={`p-2 rounded-lg text-sm ${
                    catalogViewMode === 'grid'
                      ? `${activeBtnText}`
                      : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-400'
                  }`}
                  style={catalogViewMode === 'grid' ? { backgroundColor: activeThemeColor } : undefined}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCatalogViewMode('list')}
                  className={`p-2 rounded-lg text-sm ${
                    catalogViewMode === 'list'
                      ? `${activeBtnText}`
                      : 'bg-slate-100 dark:bg-slate-800 text-[#425466] dark:text-slate-400'
                  }`}
                  style={catalogViewMode === 'list' ? { backgroundColor: activeThemeColor } : undefined}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Filter Sidebar */}
              <aside className={`w-full lg:w-72 shrink-0 space-y-6 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
                <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-base font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                      <Filter className="w-4 h-4" style={{ color: activeThemeColor }} />
                      <span>Filter Cars</span>
                    </span>
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#0a2540] dark:text-white block">Automatic Only</span>
                      <span className="text-sm text-[#425466] dark:text-slate-400">Hide manual gears</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterAutomaticOnly(!filterAutomaticOnly)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        filterAutomaticOnly ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          filterAutomaticOnly ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#0a2540] dark:text-slate-300 block">Car Type</label>
                    <div className="space-y-1">
                      {[
                        { id: 'All', label: 'All Cars' },
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
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                              isSelected
                                ? 'bg-[#f6f9fc] dark:bg-slate-800 text-[#0a2540] dark:text-white font-bold border border-slate-300 dark:border-slate-700'
                                : 'text-[#425466] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <span>{cat.label}</span>
                            <span className="font-mono text-sm text-[#425466] dark:text-slate-400">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#0a2540] dark:text-slate-300 block">Seats Needed</label>
                    <div className="grid grid-cols-5 gap-1.5 text-sm">
                      {[
                        { label: 'Any', value: 0 },
                        { label: '2+', value: 2 },
                        { label: '4+', value: 4 },
                        { label: '5+', value: 5 },
                        { label: '7+', value: 7 },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setFilterMinPassengers(opt.value)}
                          className={`py-1.5 rounded-lg font-semibold text-center ${
                            filterMinPassengers === opt.value
                              ? `${activeBtnText}`
                              : 'bg-[#f6f9fc] dark:bg-slate-950 text-[#425466] dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                          }`}
                          style={filterMinPassengers === opt.value ? { backgroundColor: activeThemeColor } : undefined}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <label className="font-bold text-[#0a2540] dark:text-slate-300">Max Price / Day</label>
                      <span className="font-mono font-bold text-[#0a2540] dark:text-amber-400">
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

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#0a2540] dark:text-slate-300 block">Fuel</label>
                    <div className="grid grid-cols-3 gap-1.5 text-sm">
                      {['All', 'Diesel', 'Petrol'].map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setFilterFuel(fuel)}
                          className={`py-1.5 rounded-lg font-semibold ${
                            filterFuel === fuel
                              ? `${activeBtnText}`
                              : 'bg-[#f6f9fc] dark:bg-slate-950 text-[#425466] dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                          }`}
                          style={filterFuel === fuel ? { backgroundColor: activeThemeColor } : undefined}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1 min-w-0 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm text-[#425466] dark:text-slate-300">
                    Showing <strong className="text-[#0a2540] dark:text-white">{filteredVehicles.length}</strong> of{' '}
                    {vehicles.length} cars
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center bg-[#f6f9fc] dark:bg-slate-950 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setCatalogViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 ${
                          catalogViewMode === 'grid'
                            ? `${activeBtnText}`
                            : 'text-[#425466] dark:text-slate-400'
                        }`}
                        style={catalogViewMode === 'grid' ? { backgroundColor: activeThemeColor } : undefined}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Grid</span>
                      </button>
                      <button
                        onClick={() => setCatalogViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 ${
                          catalogViewMode === 'list'
                            ? `${activeBtnText}`
                            : 'text-[#425466] dark:text-slate-400'
                        }`}
                        style={catalogViewMode === 'list' ? { backgroundColor: activeThemeColor } : undefined}
                      >
                        <List className="w-4 h-4" />
                        <span>List</span>
                      </button>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm text-[#0a2540] dark:text-white font-medium outline-none"
                    >
                      <option value="price-asc">Lowest Price First</option>
                      <option value="price-desc">Highest Price First</option>
                      <option value="capacity">Most Seats</option>
                      <option value="rating">Newest Car</option>
                    </select>
                  </div>
                </div>

                {filteredVehicles.length > 0 ? (
                  catalogViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredVehicles.map((vehicle) => {
                        const collision = checkBookingCollision(vehicle.id, startDate, endDate, bookings);
                        const isAvailable = !collision.hasCollision;
                        const tripTotalRwf = vehicle.daily_rate_rwf * days;

                        return (
                          <div
                            key={vehicle.id}
                            className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group"
                          >
                            <div>
                              <div className="h-48 bg-slate-900 flex flex-col justify-between p-4 relative overflow-hidden">
                                <div className="flex items-center justify-between z-10">
                                  <span className="text-sm font-mono font-bold bg-slate-950/80 px-2.5 py-0.5 rounded-lg text-white">
                                    {vehicle.plate_number}
                                  </span>
                                  <span
                                    className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                                      isAvailable
                                        ? 'bg-emerald-950/85 text-emerald-300'
                                        : 'bg-rose-950/85 text-rose-300'
                                    }`}
                                  >
                                    {isAvailable ? 'Open' : 'Booked'}
                                  </span>
                                </div>

                                {vehicle.image_url ? (
                                  <img
                                    src={vehicle.image_url}
                                    alt={vehicle.model_name}
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-90"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center my-auto text-slate-600">
                                    <Car className="w-20 h-20 stroke-[1.2]" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                                <div className="flex items-center gap-2 text-sm text-slate-200 font-medium z-10">
                                  <span>{vehicle.category}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{vehicle.year}</span>
                                </div>
                              </div>

                              <div className="p-5 space-y-4">
                                <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">{vehicle.model_name}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-[#425466] dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                                    <span>{vehicle.seating_capacity} Seats</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Luggage className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                                    <span>{vehicle.seating_capacity >= 7 ? '4' : '3'} Bags</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                                    <span>{vehicle.transmission || 'Automatic'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Fuel className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                                    <span>{vehicle.fuel_type || 'Diesel'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-sm text-[#425466] dark:text-slate-400 block">Per day:</span>
                                  <span className="font-mono font-extrabold text-[#0a2540] dark:text-white text-lg">
                                    {formatMoney(vehicle.daily_rate_rwf)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-[#425466] dark:text-slate-400 block">{days} days:</span>
                                  <span className="font-mono font-bold text-sm" style={{ color: activeThemeColor }}>
                                    {formatMoney(tripTotalRwf)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => setQuickDetailVehicle(vehicle)}
                                  className="w-1/3 py-2 rounded-full text-sm font-semibold text-[#0a2540] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                  Info
                                </button>
                                <button
                                  onClick={() => handleStartBookingVehicle(vehicle)}
                                  disabled={!isAvailable}
                                  className={`w-2/3 py-2 rounded-full text-sm font-semibold transition-all ${
                                    isAvailable
                                      ? `${activeBtnText} hover:brightness-105`
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  }`}
                                  style={isAvailable ? { backgroundColor: activeThemeColor } : undefined}
                                >
                                  Pick & Book →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredVehicles.map((vehicle) => {
                        const collision = checkBookingCollision(vehicle.id, startDate, endDate, bookings);
                        const isAvailable = !collision.hasCollision;
                        const tripTotalRwf = vehicle.daily_rate_rwf * days;

                        return (
                          <div
                            key={vehicle.id}
                            className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row group"
                          >
                            <div className="md:w-80 h-52 md:h-auto relative shrink-0 bg-slate-900 overflow-hidden">
                              {vehicle.image_url ? (
                                <img
                                  src={vehicle.image_url}
                                  alt={vehicle.model_name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover object-center brightness-90"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <Car className="w-24 h-24 stroke-[1.2]" />
                                </div>
                              )}
                              <div className="absolute top-3 left-3 z-10">
                                <span className="text-sm font-mono font-bold bg-slate-950/90 px-2.5 py-0.5 rounded-lg text-white">
                                  {vehicle.plate_number}
                                </span>
                              </div>
                              <div className="absolute bottom-3 left-3 z-10">
                                <span
                                  className={`text-sm font-semibold px-3 py-0.5 rounded-full ${
                                    isAvailable
                                      ? 'bg-emerald-950/90 text-emerald-300'
                                      : 'bg-rose-950/90 text-rose-300'
                                  }`}
                                >
                                  {isAvailable ? 'Open for Dates' : 'Booked'}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                              <div>
                                <div className="text-sm text-[#425466] dark:text-slate-400 mb-1">
                                  {vehicle.category} · {vehicle.year}
                                </div>
                                <h3 className="text-xl font-bold text-[#0a2540] dark:text-white">{vehicle.model_name}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-[#425466] dark:text-slate-300 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                  <span>{vehicle.seating_capacity} Seats</span>
                                  <span>·</span>
                                  <span>{vehicle.transmission || 'Automatic'}</span>
                                  <span>·</span>
                                  <span>{vehicle.fuel_type || 'Diesel'}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#425466] dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Free cancel 3+ days before</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Safety checked car</span>
                                </div>
                              </div>
                            </div>

                            <div className="md:w-64 bg-[#f6f9fc] dark:bg-slate-950/60 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between text-right shrink-0 space-y-4">
                              <div className="space-y-1">
                                <span className="text-sm text-[#425466] dark:text-slate-400 block">Per day:</span>
                                <div className="font-mono font-extrabold text-[#0a2540] dark:text-white text-xl">
                                  {formatMoney(vehicle.daily_rate_rwf)}
                                </div>
                                <div className="text-sm font-mono font-semibold" style={{ color: activeThemeColor }}>
                                  {formatMoney(tripTotalRwf)} total ({days} days)
                                </div>
                              </div>

                              <div className="space-y-2">
                                <button
                                  onClick={() => handleStartBookingVehicle(vehicle)}
                                  disabled={!isAvailable}
                                  className={`w-full py-2.5 rounded-full font-semibold text-sm ${
                                    isAvailable
                                      ? `${activeBtnText}`
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  }`}
                                  style={isAvailable ? { backgroundColor: activeThemeColor } : undefined}
                                >
                                  Pick Car →
                                </button>
                                <button
                                  onClick={() => setQuickDetailVehicle(vehicle)}
                                  className="w-full py-1.5 rounded-full text-sm font-semibold text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white"
                                >
                                  More Info
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <AlertCircle className="w-12 h-12 mx-auto" style={{ color: activeThemeColor }} />
                    <h3 className="text-xl font-bold text-[#0a2540] dark:text-white">No cars match your filters</h3>
                    <p className="text-sm text-[#425466] dark:text-slate-400 max-w-md mx-auto">
                      Try clearing your filters or ask our Kigali help desk.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className={`px-5 py-2.5 rounded-full font-semibold text-sm ${activeBtnText}`}
                      style={{ backgroundColor: activeThemeColor }}
                    >
                      Show All Cars
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Vehicle Info Modal */}
            {quickDetailVehicle && (
              <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-sm font-semibold" style={{ color: activeThemeColor }}>
                        {quickDetailVehicle.category} · {quickDetailVehicle.year}
                      </span>
                      <h2 className="text-xl font-bold text-[#0a2540] dark:text-white">{quickDetailVehicle.model_name}</h2>
                    </div>
                    <button
                      onClick={() => setQuickDetailVehicle(null)}
                      className="p-2 rounded-full text-[#425466] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Seats</span>
                      <strong className="text-[#0a2540] dark:text-white">{quickDetailVehicle.seating_capacity}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Gears</span>
                      <strong className="text-[#0a2540] dark:text-white">
                        {quickDetailVehicle.transmission || 'Automatic'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Fuel</span>
                      <strong className="text-[#0a2540] dark:text-white">{quickDetailVehicle.fuel_type || 'Diesel'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Place</span>
                      <strong className="text-[#0a2540] dark:text-white truncate block">{quickDetailVehicle.location}</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#425466] dark:text-slate-400">Price per day:</span>
                      <span className="font-mono font-bold text-[#0a2540] dark:text-white">
                        {formatMoney(quickDetailVehicle.daily_rate_rwf)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#425466] dark:text-slate-400">Trip length:</span>
                      <span className="font-mono text-[#0a2540] dark:text-white">{days} Days</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-slate-200 dark:border-slate-800 text-base">
                      <span>Estimated Total:</span>
                      <span className="font-mono" style={{ color: activeThemeColor }}>
                        {formatMoney(quickDetailVehicle.daily_rate_rwf * days)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setQuickDetailVehicle(null)}
                      className="px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0a2540] dark:text-slate-300 text-sm font-semibold"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setQuickDetailVehicle(null);
                        handleStartBookingVehicle(quickDetailVehicle);
                      }}
                      className={`px-6 py-2 rounded-full text-sm font-semibold ${activeBtnText}`}
                      style={{ backgroundColor: activeThemeColor }}
                    >
                      Book This Car →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CAR DETAILS PAGE */}
        {currentView === 'vehicle-detail' && selectedVehicle && (
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8">
            <button
              onClick={() => setCurrentView('vehicles')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to all cars</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 text-center">
                  <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="font-mono font-bold" style={{ color: activeThemeColor }}>
                      {selectedVehicle.plate_number}
                    </span>
                    <span>
                      {selectedVehicle.category} · {selectedVehicle.year}
                    </span>
                  </div>

                  {selectedVehicle.image_url ? (
                    <img
                      src={selectedVehicle.image_url}
                      alt={selectedVehicle.model_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="py-6 flex items-center justify-center text-slate-400">
                      <Car className="w-32 h-32 stroke-[1.1]" />
                    </div>
                  )}

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">
                      {selectedVehicle.model_name}
                    </h1>
                    <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
                      Safety checked & ready for city or park roads
                    </p>
                  </div>
                </div>

                <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#0a2540] dark:text-white">Car Info</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Seats</span>
                      <strong className="text-[#0a2540] dark:text-white">{selectedVehicle.seating_capacity} Seats</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Gears</span>
                      <strong className="text-[#0a2540] dark:text-white">
                        {selectedVehicle.transmission || 'Automatic'}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Fuel</span>
                      <strong className="text-[#0a2540] dark:text-white">{selectedVehicle.fuel_type || 'Diesel'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[#425466] dark:text-slate-400 block">Drive</span>
                      <strong style={{ color: activeThemeColor }}>4x4 Ready</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 sticky top-24">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-sm text-[#425466] dark:text-slate-400 block">Price per day</span>
                    <span className="text-2xl font-extrabold text-[#0a2540] dark:text-white font-mono">
                      {formatMoney(selectedVehicle.daily_rate_rwf)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between text-[#425466] dark:text-slate-400">
                      <span>Days:</span>
                      <span className="text-[#0a2540] dark:text-white">{days} Days</span>
                    </div>
                    <div className="flex justify-between text-[#425466] dark:text-slate-400">
                      <span>Car rent:</span>
                      <span className="text-[#0a2540] dark:text-white">{formatMoney(baseRentalRwf)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>+ 18% VAT tax:</span>
                      <span>+{formatMoney(vatRwf)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span style={{ color: activeThemeColor }}>{formatMoney(grandTotalRwf)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartBookingVehicle(selectedVehicle)}
                    className={`w-full py-3 rounded-full font-semibold text-sm shadow-xs ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Book This Car →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: 5-STEP BOOKING */}
        {currentView === 'book' && selectedVehicle && (
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <button
                  onClick={() => setCurrentView('vehicles')}
                  className="text-sm text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white flex items-center gap-1 mb-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Pick another car</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a2540] dark:text-white">
                  Book {selectedVehicle.model_name}
                </h1>
              </div>

              <div className="w-full sm:w-auto py-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
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
                          bookingStep >= st.s ? 'font-bold text-[#0a2540] dark:text-amber-400' : 'text-slate-400'
                        }
                      >
                        {st.l}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {bookingStep === 1 && (
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Step 1: Trip Type & Dates</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#f6f9fc] dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {(['self-drive', 'chauffeur', 'airport', 'safari'] as ServiceType[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setServiceType(st)}
                      className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                        serviceType === st
                          ? `${activeBtnText}`
                          : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                      }`}
                      style={serviceType === st ? { backgroundColor: activeThemeColor } : undefined}
                    >
                      {serviceLabel(st)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-semibold mb-1.5">Pick-up Day</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Return Day</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Pick-up Place</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Return Place</label>
                    <input
                      type="text"
                      value={returnLocation}
                      onChange={(e) => setReturnLocation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setBookingStep(2)}
                    className={`px-6 py-2.5 rounded-full font-semibold text-sm ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Add Extras →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Step 2: Optional Extras</h2>

                <div className="space-y-3 text-sm">
                  <label className="flex items-start justify-between p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonChauffeur}
                        onChange={(e) => setAddonChauffeur(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-semibold text-[#0a2540] dark:text-white">Add a Driver</div>
                        <div className="text-sm text-[#425466] dark:text-slate-400">
                          Experienced local driver who speaks English & Kinyarwanda
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold">+{formatMoney(15000)}/day</span>
                  </label>

                  <label className="flex items-start justify-between p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonWifiHotspot}
                        onChange={(e) => setAddonWifiHotspot(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-semibold text-[#0a2540] dark:text-white">Car Wi-Fi Box</div>
                        <div className="text-sm text-[#425466] dark:text-slate-400">
                          Fast MTN internet inside the car for up to 5 phones
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-bold">+{formatMoney(7500)}/day</span>
                  </label>

                  <label className="flex items-start justify-between p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={addonChildSeat}
                        onChange={(e) => setAddonChildSeat(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded"
                      />
                      <div>
                        <div className="font-semibold text-[#0a2540] dark:text-white">Child Car Seat</div>
                        <div className="text-sm text-[#425466] dark:text-slate-400">Safe baby or child seat</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold">+{formatMoney(5000)}/day</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <button onClick={() => setBookingStep(1)} className="px-4 py-2 text-sm font-semibold text-[#425466]">
                    ← Back
                  </button>
                  <button
                    onClick={() => setBookingStep(3)}
                    className={`px-6 py-2.5 rounded-full font-semibold text-sm ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Your Details →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Step 3: Your Details</h2>
                  <div className="flex items-center gap-1 bg-[#f6f9fc] dark:bg-slate-950 p-1 rounded-full border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCorporateBooking(false)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        !isCorporateBooking ? `${activeBtnText}` : 'text-[#425466] dark:text-slate-400'
                      }`}
                      style={!isCorporateBooking ? { backgroundColor: activeThemeColor } : undefined}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCorporateBooking(true)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        isCorporateBooking ? `${activeBtnText}` : 'text-[#425466] dark:text-slate-400'
                      }`}
                      style={isCorporateBooking ? { backgroundColor: activeThemeColor } : undefined}
                    >
                      Company / NGO
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Phone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Email (for your receipt)</label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Country</label>
                    <input
                      type="text"
                      value={countryResidence}
                      onChange={(e) => setCountryResidence(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {isCorporateBooking && (
                  <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3">
                    <span className="font-bold text-sky-900 dark:text-sky-300 block">
                      Company Tax Receipt Info:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Company Name</label>
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">TIN Number</label>
                        <input
                          type="text"
                          value={tinNumber}
                          onChange={(e) => setTinNumber(e.target.value)}
                          className={`${inputClass} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Order Number</label>
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
                  <label className="block font-semibold mb-1.5">Any Notes for Us?</label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <button onClick={() => setBookingStep(2)} className="px-4 py-2 text-sm font-semibold text-[#425466]">
                    ← Back
                  </button>
                  <button
                    onClick={() => setBookingStep(4)}
                    className={`px-6 py-2.5 rounded-full font-semibold text-sm ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: ID Check →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 4 && (
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-sm">
                <div>
                  <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Step 4: License & ID</h2>
                  <p className="text-[#425466] dark:text-slate-400 mt-1">
                    {serviceType === 'self-drive'
                      ? 'Needed for driving insurance in Rwanda.'
                      : 'Needed so your driver can confirm it is you at pickup.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Driving License Number</label>
                    <input
                      type="text"
                      value={drivingLicenseNumber}
                      onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                      placeholder="DL-RWA-2022-881"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Passport or National ID</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="1198980012345678"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#0a2540] dark:text-white block">ID Status</span>
                    <span className="text-[#425466] dark:text-slate-400">Kept private and safe</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Checked</span>
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <button onClick={() => setBookingStep(3)} className="px-4 py-2 text-sm font-semibold text-[#425466]">
                    ← Back
                  </button>
                  <button
                    onClick={() => setBookingStep(5)}
                    className={`px-6 py-2.5 rounded-full font-semibold text-sm ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
                  >
                    Next: Review & Pay →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 5 && (
              <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-sm">
                <h2 className="text-lg font-bold text-[#0a2540] dark:text-white">Step 5: Check Price & Pay</h2>

                <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between text-[#425466] dark:text-slate-400">
                    <span>
                      Car rent ({days} days × {formatMoney(selectedVehicle.daily_rate_rwf)}):
                    </span>
                    <span className="text-[#0a2540] dark:text-white">{formatMoney(baseRentalRwf)}</span>
                  </div>

                  {isSafariPeak && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>+ Busy Season (+15%):</span>
                      <span>+{formatMoney(safariSurgeRwf)}</span>
                    </div>
                  )}

                  {isUpcountry && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>+ Outside Kigali Trip Fee:</span>
                      <span>+{formatMoney(upcountrySurgeRwf)}</span>
                    </div>
                  )}

                  {totalAddonsRwf > 0 && (
                    <div className="flex justify-between text-[#425466] dark:text-slate-300">
                      <span>+ Extras:</span>
                      <span>+{formatMoney(totalAddonsRwf)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>+ Tax (18% VAT):</span>
                    <span>+{formatMoney(vatRwf)}</span>
                  </div>

                  <div className="flex justify-between text-[#425466] dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Refundable Deposit (returned after trip):</span>
                    <span>{formatMoney(securityDepositRwf)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-[#0a2540] dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Price:</span>
                    <span style={{ color: activeThemeColor }}>{formatMoney(grandTotalRwf)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-4 rounded-xl border cursor-pointer ${
                      paymentOption === 'deposit'
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-[#f6f9fc] dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'deposit'}
                      onChange={() => setPaymentOption('deposit')}
                      className="sr-only"
                    />
                    <div className="font-bold">Pay 30% Now</div>
                    <div className="font-mono text-base font-bold mt-1" style={{ color: activeThemeColor }}>
                      {formatMoney(depositToPayNowRwf)}
                    </div>
                    <div className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">Pay the rest at pickup</div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border cursor-pointer ${
                      paymentOption === 'full'
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-[#f6f9fc] dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'full'}
                      onChange={() => setPaymentOption('full')}
                      className="sr-only"
                    />
                    <div className="font-bold">Pay Full Amount Now</div>
                    <div className="font-mono text-base text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      {formatMoney(grandTotalRwf)}
                    </div>
                    <div className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">All paid, nothing owed later</div>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5">How Will You Pay?</label>
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
                    <label className="block font-semibold mb-1.5">Your MTN MoMo Phone Number</label>
                    <input
                      type="text"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="+250 788 123 456"
                      className={`${inputClass} font-mono font-bold`}
                    />
                  </div>
                )}

                <label className="flex items-start gap-2.5 pt-1 text-sm text-[#425466] dark:text-slate-300 cursor-pointer">
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
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-600 dark:text-rose-300">
                    {submissionError}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <button onClick={() => setBookingStep(4)} className="px-4 py-2 text-sm font-semibold text-[#425466]">
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmReservation}
                    disabled={!termsAgreed || isSubmittingBooking}
                    className={`py-3 px-6 rounded-full font-semibold text-sm ${
                      termsAgreed && !isSubmittingBooking
                        ? `${activeBtnText}`
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                    style={termsAgreed && !isSubmittingBooking ? { backgroundColor: activeThemeColor } : undefined}
                  >
                    {isSubmittingBooking ? 'Saving Your Car...' : `Confirm & Pay ${formatMoney(depositToPayNowRwf)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: CONFIRMATION */}
        {currentView === 'confirmation' && confirmedBooking && (
          <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
            <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white">Your Car Is Booked!</h1>
              <div className="font-mono text-base font-bold" style={{ color: activeThemeColor }}>
                BOOKING CODE: #{bookingReferenceId || confirmedBooking.id}
              </div>
              <p className="text-sm text-[#425466] dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                We sent a text and email to <strong>{confirmedBooking.client_phone}</strong>. Your car is saved just for you.
              </p>
            </div>

            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-sm">
              <h3 className="font-bold text-[#0a2540] dark:text-white text-base">What Happens Next</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <strong>Car Prep:</strong> Car {selectedVehicle.plate_number} is cleaned and checked.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <strong>Driver Message:</strong> We text you your driver's phone number 4 hours before pickup.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <strong>Meet & Drive:</strong> Meet at Kigali Airport Gate 1 or your chosen pickup spot.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCurrentView('voucher')}
                className="w-full sm:w-1/2 py-3 rounded-full bg-white dark:bg-slate-800 text-[#0a2540] dark:text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Print Booking Pass</span>
              </button>
              <button
                onClick={() => {
                  setTrackRefInput(bookingReferenceId || confirmedBooking.id);
                  setTrackPhoneInput(confirmedBooking.client_phone);
                  setTrackedBooking(confirmedBooking);
                  setCurrentView('track');
                }}
                className={`w-full sm:w-1/2 py-3 rounded-full font-semibold text-sm ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                Check Booking Status →
              </button>
            </div>
          </div>
        )}

        {/* VIEW 8: PRINTABLE PASS */}
        {currentView === 'voucher' && (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('home')}
                className="text-sm font-semibold text-[#425466] dark:text-slate-400 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back Home</span>
              </button>
              <button
                onClick={() => window.print()}
                className={`px-5 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            <div className="p-8 sm:p-10 rounded-2xl bg-white text-slate-900 shadow-lg border border-slate-200 space-y-6">
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <h1 className="text-xl font-extrabold uppercase text-slate-900">{companyDisplayName}</h1>
                  <div className="text-sm text-slate-600 mt-0.5">Licensed Car Rental · Safety Checked</div>
                  <div className="text-sm text-slate-600">Kigali Airport & Remera Office, Rwanda</div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-sm font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    CONFIRMED
                  </span>
                  <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                    PASS #{bookingReferenceId || confirmedBooking?.id || 'KGF-2026-90412'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Guest Name:</span>
                  <strong className="text-slate-900">{confirmedBooking?.client_name || clientName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone / WhatsApp:</span>
                  <strong className="text-slate-900 font-mono">{confirmedBooking?.client_phone || clientPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Car:</span>
                  <strong className="text-slate-900">
                    {selectedVehicle.model_name} [{selectedVehicle.plate_number}]
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dates:</span>
                  <strong className="text-slate-900 font-mono">
                    {startDate} to {endDate} ({days} days)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Route:</span>
                  <strong className="text-slate-900">
                    {confirmedBooking?.destination || `${pickupLocation} -> ${returnLocation}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">24/7 Help Phone:</span>
                  <strong className="font-mono">{companyPhone}</strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-1.5 text-sm font-mono">
                <div className="flex justify-between font-bold text-slate-900 text-base">
                  <span>Total Paid / Agreed:</span>
                  <span>{formatRwf(confirmedBooking?.total_rwf || grandTotalRwf)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9: CHECK BOOKING */}
        {currentView === 'track' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5" style={{ color: activeThemeColor }} />
                  <span>Check Your Booking</span>
                </h1>
                <p className="text-sm text-[#425466] dark:text-slate-400 mt-1">
                  Enter your booking code (for example bk-2026-089) and phone number.
                </p>
              </div>

              <form onSubmit={handleTrackBookingLookup} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Booking Code</label>
                    <input
                      type="text"
                      required
                      placeholder="bk-2026-089"
                      value={trackRefInput}
                      onChange={(e) => setTrackRefInput(e.target.value)}
                      className={`${inputClass} font-mono font-bold`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Phone Number</label>
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
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-600 dark:text-rose-300">
                    {trackError}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full py-3 rounded-full font-semibold text-sm ${activeBtnText}`}
                  style={{ backgroundColor: activeThemeColor }}
                >
                  Find My Booking
                </button>
              </form>

              {trackedBooking && (
                <div className="mt-6 p-6 rounded-2xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-sm font-mono font-bold" style={{ color: activeThemeColor }}>
                        #{trackedBooking.id}
                      </span>
                      <h3 className="text-lg font-bold text-[#0a2540] dark:text-white mt-0.5">
                        {trackedBooking.client_name}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                      {trackedBooking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[#425466] dark:text-slate-400 block">Dates:</span>
                      <span className="font-mono font-semibold">
                        {trackedBooking.start_date} to {trackedBooking.end_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#425466] dark:text-slate-400 block">Where:</span>
                      <span className="font-semibold truncate block">{trackedBooking.destination}</span>
                    </div>
                    <div>
                      <span className="text-[#425466] dark:text-slate-400 block">Payment:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {trackedBooking.payment_status}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#425466] dark:text-slate-400 block">Total Price:</span>
                      <span className="font-mono font-bold" style={{ color: activeThemeColor }}>
                        {formatRwf(trackedBooking.total_rwf)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setConfirmedBooking(trackedBooking);
                        setCurrentView('voucher');
                      }}
                      className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 text-[#0a2540] dark:text-white font-semibold text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
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
          <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-sm">
              <div>
                <h1 className="text-2xl font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5" style={{ color: activeThemeColor }} />
                  <span>Ask for a Group Price</span>
                </h1>
                <p className="text-[#425466] dark:text-slate-400 mt-1">
                  For NGOs, embassies, offices, and large events needing more than one car.
                </p>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Group or Company Name</label>
                    <input
                      type="text"
                      required
                      value={quoteOrganization}
                      onChange={(e) => setQuoteOrganization(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={quoteContactName}
                      onChange={(e) => setQuoteContactName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={quoteEmail}
                      onChange={(e) => setQuoteEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5">Phone / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={quotePhone}
                      onChange={(e) => setQuotePhone(e.target.value)}
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-[#0a2540] dark:text-white block">Cars Needed:</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[#425466] dark:text-slate-400 font-semibold mb-1">4x4 Cars</label>
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
                      <label className="block text-[#425466] dark:text-slate-400 font-semibold mb-1">Coaster Buses</label>
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
                      <label className="block text-[#425466] dark:text-slate-400 font-semibold mb-1">Days</label>
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
                  <label className="block font-semibold mb-1.5">Trip Notes</label>
                  <textarea
                    rows={3}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {quoteSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    {quoteSuccessMsg}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('home')}
                    className="px-4 py-2 text-sm font-semibold text-[#425466]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`py-2.5 px-6 rounded-full font-semibold text-sm ${activeBtnText}`}
                    style={{ backgroundColor: activeThemeColor }}
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
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-sm">
                  <h3 className="text-base font-bold text-[#0a2540] dark:text-white">Call or Message Us</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 shrink-0 mt-1" style={{ color: activeThemeColor }} />
                      <div>
                        <span className="text-[#425466] dark:text-slate-400 block">Phone:</span>
                        <strong className="font-mono">{companyPhone}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
                      <div>
                        <span className="text-[#425466] dark:text-slate-400 block">WhatsApp:</span>
                        <a
                          href="https://wa.me/250788312000"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 font-mono font-bold hover:underline"
                        >
                          +250 788 312 000
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      <div>
                        <span className="text-[#425466] dark:text-slate-400 block">Office:</span>
                        <span>Kigali Airport Gate 1 & Remera</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                      <div>
                        <span className="text-[#425466] dark:text-slate-400 block">Hours:</span>
                        <span>Open 24 hours, every day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 text-sm">
                <div>
                  <h2 className="text-xl font-bold text-[#0a2540] dark:text-white">Send Us a Help Message</h2>
                  <p className="text-[#425466] dark:text-slate-400 mt-1">
                    Our team reads every message and replies quickly.
                  </p>
                </div>

                {ticketSubmittedId ? (
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Message #{ticketSubmittedId} Sent</h3>
                    <p className="text-[#425466] dark:text-slate-300">
                      We will reply by SMS or email within 30 minutes.
                    </p>
                    <button
                      onClick={() => setTicketSubmittedId(null)}
                      className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 text-[#0a2540] dark:text-white font-semibold text-sm border border-slate-200 dark:border-slate-700"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-1.5">Your Name</label>
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
                        <label className="block font-semibold mb-1.5">Phone / WhatsApp</label>
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
                        <label className="block font-semibold mb-1.5">Email</label>
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
                        <label className="block font-semibold mb-1.5">Booking Code (if you have one)</label>
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
                        <label className="block font-semibold mb-1.5">Topic</label>
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
                        <label className="block font-semibold mb-1.5">How Urgent?</label>
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
                      <label className="block font-semibold mb-1.5">How Can We Help?</label>
                      <textarea
                        rows={4}
                        required
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Write your question here..."
                        className={inputClass}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className={`py-2.5 px-6 rounded-full font-semibold text-sm ${activeBtnText}`}
                        style={{ backgroundColor: activeThemeColor }}
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
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-sm leading-relaxed">
            <button
              onClick={() => setCurrentView('home')}
              className="text-[#425466] dark:text-slate-400 font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </button>

            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
              <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white">Simple Rental Rules</h1>

              <div className="space-y-4 text-[#425466] dark:text-slate-300">
                <div>
                  <h3 className="text-[#0a2540] dark:text-white font-bold text-base">01. Driver License</h3>
                  <p>
                    Drivers must be 21 or older with a valid license held for at least 1 year. Visitors may use an English or French license for 90 days.
                  </p>
                </div>
                <div>
                  <h3 className="text-[#0a2540] dark:text-white font-bold text-base">02. Fuel</h3>
                  <p>We give you the car with a full tank. Please return it with a full tank.</p>
                </div>
                <div>
                  <h3 className="text-[#0a2540] dark:text-white font-bold text-base">03. Distance</h3>
                  <p>
                    Drive as many kilometers as you want inside Rwanda. Leaving Rwanda requires written permission first.
                  </p>
                </div>
                <div>
                  <h3 className="text-[#0a2540] dark:text-white font-bold text-base">04. Deposit</h3>
                  <p>
                    A 150,000 RWF ($110) deposit is held when you take the car and given back within 24 hours after return.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 13: CANCEL & REFUNDS */}
        {currentView === 'cancellation' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-sm leading-relaxed">
            <button
              onClick={() => setCurrentView('home')}
              className="text-[#425466] dark:text-slate-400 font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </button>

            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
              <h1 className="text-2xl font-extrabold text-[#0a2540] dark:text-white">Cancel & Refund Rules</h1>

              <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>7+ days before pickup:</span>
                  <span>100% refund</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>3 to 7 days before pickup:</span>
                  <span>50% refund</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Under 3 days before pickup:</span>
                  <span>No deposit refund</span>
                </div>
              </div>

              <form onSubmit={handleSubmitCancellation} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-[#0a2540] dark:text-white">Ask to Cancel a Booking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1.5">Booking Code</label>
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
                    <label className="block font-semibold mb-1.5">MoMo Phone for Refund</label>
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
                  <label className="block font-semibold mb-1.5">Why are you canceling?</label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {cancelSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                    {cancelSuccessMsg}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm"
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
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('home')}
                className="text-sm font-semibold text-[#425466] dark:text-slate-400 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back Home</span>
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2540] dark:text-white">Common Questions</h1>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Type a word (e.g. airport, deposit, park, MoMo)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="space-y-3">
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
                  a: 'After you return the car in good shape, we send back your 150,000 RWF ($110) deposit via MoMo or card within 24 hours.',
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
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between text-base font-semibold text-[#0a2540] dark:text-slate-100"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? (
                        <ChevronUp className="w-4 h-4 shrink-0" style={{ color: activeThemeColor }} />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="px-4 pb-4 text-sm text-[#425466] dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-4 sm:px-8 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${activeBtnText}`}
                style={{ backgroundColor: activeThemeColor }}
              >
                <Car className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-[#0a2540] dark:text-white text-base">{companyDisplayName}</span>
            </div>
            <p className="text-[#425466] dark:text-slate-400 leading-relaxed">
              Trusted car rental in Rwanda. Clean cars, clear prices, and official tax receipts.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-[#0a2540] dark:text-white block">Trips</span>
            <ul className="space-y-1.5 text-[#425466] dark:text-slate-400">
              <li>
                <button
                  onClick={() => {
                    setServiceType('self-drive');
                    setCurrentView('home');
                  }}
                  className="hover:text-[#0a2540] dark:hover:text-white"
                >
                  Drive Yourself 4x4
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setServiceType('chauffeur');
                    setCurrentView('home');
                  }}
                  className="hover:text-[#0a2540] dark:hover:text-white"
                >
                  With a Driver
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setServiceType('airport');
                    setCurrentView('home');
                  }}
                  className="hover:text-[#0a2540] dark:hover:text-white"
                >
                  Kigali Airport Pickup
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('quote')}
                  className="hover:text-[#0a2540] dark:hover:text-white"
                >
                  Group & Business Quote
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-[#0a2540] dark:text-white block">Rules & Help</span>
            <ul className="space-y-1.5 text-[#425466] dark:text-slate-400">
              <li>
                <button onClick={() => setCurrentView('terms')} className="hover:text-[#0a2540] dark:hover:text-white">
                  Rental Rules
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('cancellation')}
                  className="hover:text-[#0a2540] dark:hover:text-white"
                >
                  Cancel & Refunds
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('faq')} className="hover:text-[#0a2540] dark:hover:text-white">
                  Common Questions
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('contact')} className="hover:text-[#0a2540] dark:hover:text-white">
                  Contact Help Desk
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-[#0a2540] dark:text-white block">24/7 Phone Desk</span>
            <div className="space-y-1.5 text-[#425466] dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: activeThemeColor }} />
                <span className="font-mono">{companyPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp: +250 788 312 000</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Kigali Airport & Remera</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-200 dark:border-slate-800 text-center text-[#425466] dark:text-slate-500 text-sm">
          © 2026 {companyDisplayName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
