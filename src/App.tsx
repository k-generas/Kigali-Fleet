/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFleetStore } from './store/useFleetStore';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './components/OverviewView';
import { CalendarTimelineView } from './components/CalendarTimelineView';
import { VehiclesView } from './components/VehiclesView';
import { DriversView } from './components/DriversView';
import { BookingsView } from './components/BookingsView';
import { TiersView } from './components/TiersView';
import { PublicStorefrontView } from './components/PublicStorefrontView';
import { AfricasTalkingSimulator } from './components/AfricasTalkingSimulator';
import { NewBookingModal } from './components/NewBookingModal';
import { SMSDispatchModal } from './components/SMSDispatchModal';
import { LandingPageView } from './components/LandingPageView';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { StorefrontModal } from './components/StorefrontModal';
import { DispatchView } from './components/DispatchView';
import { CustomersView } from './components/CustomersView';
import { PaymentsView } from './components/PaymentsView';
import { ReportsView } from './components/ReportsView';
import { MaintenanceView } from './components/MaintenanceView';
import { SuperAdminView } from './components/SuperAdminView';
import { SettingsView } from './components/SettingsView';
import { HandoversView } from './components/HandoversView';
import { ExpensesView } from './components/ExpensesView';
import { TasksView } from './components/TasksView';
import { RentalAgreementModal } from './components/RentalAgreementModal';
import { Booking, SuperAdminModuleId, Vehicle } from './types';
import { RotateCcw, ShieldAlert, Sparkles, Car } from 'lucide-react';
import { isSuperAdminUser } from './utils/auth';
import { I18nProvider, translateText } from './utils/i18n';

const VALID_TABS = [
  'landing',
  'login',
  'register',
  'overview',
  'calendar',
  'vehicles',
  'maintenance',
  'drivers',
  'bookings',
  'dispatch',
  'handovers',
  'expenses',
  'tasks',
  'customers',
  'payments',
  'reports',
  'simulator',
  'storefront',
  'pricing',
  'settings',
  'super-admin',
];

function getTabFromLocation(): string {
  if (typeof window === 'undefined') return 'landing';
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && VALID_TABS.includes(tabParam)) {
      return tabParam;
    }
    const hash = window.location.hash.replace('#', '');
    if (hash && VALID_TABS.includes(hash)) {
      return hash;
    }
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/login') || path.includes('/signin')) {
      return 'login';
    }
    if (path.includes('/register') || path.includes('/signup')) {
      return 'register';
    }
    if (path.includes('/rent') || path.includes('/storefront') || path.includes('/book')) {
      return 'storefront';
    }
    if (path.includes('/reports')) {
      return 'reports';
    }
    if (path.includes('/maintenance') || path.includes('/workshop') || path.includes('/repairs')) {
      return 'maintenance';
    }
    if (path.includes('/settings') || path.includes('/employees') || path.includes('/team')) {
      return 'settings';
    }
    if (path.includes('/super-admin') || path.includes('/superadmin') || path.includes('/admin')) {
      return 'super-admin';
    }
    if (path.includes('/app') || path.includes('/dashboard') || path.includes('/overview')) {
      return 'overview';
    }
  } catch (err) {
    console.error('Error reading location tab:', err);
  }
  return 'landing';
}

export default function App() {
  const store = useFleetStore();

  const [currentTab, setCurrentTab] = useState<string>(() => getTabFromLocation());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<string | undefined>();
  const [selectedDateForBooking, setSelectedDateForBooking] = useState<string | undefined>();
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [smsDispatchBookingId, setSmsDispatchBookingId] = useState<string | null>(null);
  const [isRentalAgreementOpen, setIsRentalAgreementOpen] = useState(false);
  const [agreementBooking, setAgreementBooking] = useState<Booking | null>(null);
  const [agreementVehicle, setAgreementVehicle] = useState<Vehicle | null>(null);
  const [requestedAdminModule, setRequestedAdminModule] = useState<SuperAdminModuleId | null>(null);

  const handleOpenRentalAgreement = (booking: Booking, vehicle: Vehicle) => {
    setAgreementBooking(booking);
    setAgreementVehicle(vehicle);
    setIsRentalAgreementOpen(true);
  };

  // Sync tab changes to URL search params so browser address bar can be copied/shared
  const handleSelectTab = useCallback((tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({ tab }, '', url.toString());
      } catch (e) {
        // Safe fallback
      }
    }
  }, []);

  // Listen to browser Back / Forward buttons and deep-link navigation
  useEffect(() => {
    const onLocationChange = () => {
      const activeTab = getTabFromLocation();
      setCurrentTab(activeTab);
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);

    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const handleOpenBooking = (vehicleId?: string, date?: string) => {
    setSelectedVehicleForBooking(vehicleId);
    setSelectedDateForBooking(date);
    setIsNewBookingOpen(true);
  };

  const handleSelectDispatch = (bookingId: string) => {
    setSmsDispatchBookingId(bookingId);
  };

  const activeDispatchBooking = store.bookings.find((b) => b.id === smsDispatchBookingId) || null;
  const activeDispatchDriver = activeDispatchBooking
    ? store.drivers.find((d) => d.id === activeDispatchBooking.driver_id) || null
    : null;
  const activeDispatchVehicle = activeDispatchBooking
    ? store.vehicles.find((v) => v.id === activeDispatchBooking.vehicle_id) || null
    : null;

  const renderView = () => {
    if (currentTab === 'login') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans antialiased">
        <LoginView
          onLoginSuccess={(isSuper) => handleSelectTab(isSuper ? 'super-admin' : 'overview')}
          onNavigateToRegister={() => handleSelectTab('register')}
          onNavigateToLanding={() => handleSelectTab('landing')}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
          currentTheme={store.currentTheme}
          accentColorId={store.accentColorId}
          onSelectAccentColor={store.setAccentColor}
          themeMode={store.theme}
          onToggleThemeMode={store.toggleTheme}
          users={store.users}
          onSelectUser={store.enterDemoMode}
          onLoginWithGoogle={store.loginWithGoogle}
          onLoginWithCredentials={store.loginWithCredentials}
          onCreateUserAccount={store.createUserAccount}
          onLogFailedLogin={store.logFailedLoginAttempt}
        />

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          currentTheme={store.currentTheme}
          onSendResetEmail={store.sendPasswordReset}
        />
      </div>
    );
  }

  if (currentTab === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans antialiased">
        <RegisterView
          onRegisterSuccess={() => handleSelectTab('overview')}
          onNavigateToLogin={() => handleSelectTab('login')}
          onNavigateToLanding={() => handleSelectTab('landing')}
          currentTheme={store.currentTheme}
          accentColorId={store.accentColorId}
          onSelectAccentColor={store.setAccentColor}
          themeMode={store.theme}
          onToggleThemeMode={store.toggleTheme}
          onRegisterCompany={store.registerCompany}
          onLoginWithGoogle={store.loginWithGoogle}
        />
      </div>
    );
  }

  if (currentTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans antialiased">
        <LandingPageView
          onEnterApp={() => handleSelectTab('overview')}
          onOpenStorefront={() => handleSelectTab('storefront')}
          onSelectTab={handleSelectTab}
          currentTheme={store.currentTheme}
          accentColorId={store.accentColorId}
          onSelectAccentColor={store.setAccentColor}
          themeMode={store.theme}
          onToggleThemeMode={store.toggleTheme}
          vehicles={store.vehicles}
          drivers={store.drivers}
          bookings={store.bookings}
        />

        {/* Booking Modal */}
        <NewBookingModal
          isOpen={isNewBookingOpen}
          onClose={() => {
            setIsNewBookingOpen(false);
            setSelectedVehicleForBooking(undefined);
            setSelectedDateForBooking(undefined);
          }}
          vehicles={store.vehicles}
          drivers={store.drivers}
          existingBookings={store.bookings}
          maintenance={store.maintenance}
          onSubmitBooking={store.addBooking}
          initialVehicleId={selectedVehicleForBooking}
          initialDate={selectedDateForBooking}
          currentTheme={store.currentTheme}
        />

        {/* Driver SMS Modal */}
        <SMSDispatchModal
          isOpen={!!smsDispatchBookingId}
          onClose={() => setSmsDispatchBookingId(null)}
          booking={activeDispatchBooking}
          driver={activeDispatchDriver}
          vehicle={activeDispatchVehicle}
          onConfirmDispatch={(bkId, lang) => {
            store.dispatchDriverSMS(bkId, lang);
          }}
          currentTheme={store.currentTheme}
        />

        {/* Share Booking Link Modal */}
        <StorefrontModal
          isOpen={isStorefrontOpen}
          onClose={() => setIsStorefrontOpen(false)}
          onNavigateToStorefront={() => handleSelectTab('storefront')}
          currentTheme={store.currentTheme}
          currentCompany={store.currentCompany}
        />
      </div>
    );
  }

  if (currentTab === 'storefront') {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans antialiased">
        {store.isDemoMode && store.currentCompany.id === 'comp-kigali-exec' && (
          <div className="bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>
                <strong className="font-semibold text-slate-900 dark:text-white">{translateText('Free Demo Storefront Preview', store.language)}</strong> —{' '}
                {translateText('Sample Kigali cars shown so visitors can test online booking.', store.language)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectTab('register')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap accent-bg hover:opacity-95 transition-opacity"
              >
                {translateText('Create Real Company', store.language)}
              </button>
              <button
                type="button"
                onClick={() => handleSelectTab('login')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
              >
                {translateText('Sign in', store.language)}
              </button>
            </div>
          </div>
        )}
        <PublicStorefrontView
          vehicles={store.vehicles}
          drivers={store.drivers}
          bookings={store.bookings}
          currentTheme={store.currentTheme}
          accentColorId={store.accentColorId}
          onSelectAccentColor={store.setAccentColor}
          themeMode={store.theme}
          onToggleThemeMode={store.toggleTheme}
          currentCompany={store.currentCompany}
          companySettings={store.settings}
          onCompleteClientBooking={store.addBooking}
          onSubmitSupportTicket={store.addSupportTicket}
          onReturnToManager={(newId) => handleSelectTab(newId ? 'bookings' : 'overview')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex font-sans antialiased">
      {/* 1. Left Sidebar Navigation Menu */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenNewBooking={() => handleOpenBooking()}
        onOpenStorefront={() => setIsStorefrontOpen(true)}
        currentTheme={store.currentTheme}
        accentColorId={store.accentColorId}
        onSelectAccentColor={store.setAccentColor}
        themeMode={store.theme}
        onToggleThemeMode={store.toggleTheme}
        onResetDemoData={store.resetToDefaults}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        vehicles={store.vehicles}
        drivers={store.drivers}
        bookings={store.bookings}
        customers={store.customers}
        currentUser={store.currentUser}
        currentCompany={store.currentCompany}
      />

      {/* 2. Main Workspace Layout (Full width across phone, tablet, and PC; menu opens on click) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Breadcrumb, Quick Actions, Theme Dropdown & Light/Dark */}
        <TopHeader
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewBooking={() => handleOpenBooking()}
          onOpenStorefront={() => setIsStorefrontOpen(true)}
          currentTheme={store.currentTheme}
          accentColorId={store.accentColorId}
          onSelectAccentColor={store.setAccentColor}
          themeMode={store.theme}
          onToggleThemeMode={store.toggleTheme}
          activeTierName={store.activeTier.name}
          currentUser={store.currentUser}
          currentCompany={store.currentCompany}
          onSwitchRole={store.switchRole}
          isDemoMode={store.isDemoMode}
          isFirebaseConnected={store.isFirebaseConnected}
          onLoginWithGoogle={store.loginWithGoogle}
          onNavigateTab={handleSelectTab}
          onOpenSuperAdminModule={(mod) => {
            if (!isSuperAdminUser(store.currentUser)) {
              handleSelectTab('login');
              return;
            }
            setRequestedAdminModule(mod);
            handleSelectTab('super-admin');
          }}
          onLogout={() => {
            store.logout();
            handleSelectTab('landing');
          }}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 min-w-0 space-y-6">
          {store.isDemoMode && (
            <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 sm:mt-0" />
                <span>
                  <strong className="font-semibold text-slate-900 dark:text-white">{translateText('Free Demo Sandbox', store.language)}:</strong>{' '}
                  {translateText('You are testing sample Kigali cars & bookings locally. Create a real company when ready to go live.', store.language)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectTab('register')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap accent-bg hover:opacity-95 transition-opacity"
                >
                  {translateText('Create Real Company', store.language)}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTab('login')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
                >
                  {translateText('Sign in', store.language)}
                </button>
              </div>
            </div>
          )}

          {!store.isDemoMode &&
            store.vehicles.length === 0 &&
            (currentTab === 'overview' || currentTab === 'vehicles') && (
              <div className="rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 accent-bg">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      {translateText('Your Live Garage is Ready', store.language)}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {translateText('Add your real rental cars with photos, or load 4 editable sample Kigali cars to start fast.', store.language)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={store.seedSampleFleetForCompany}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors"
                  >
                    {translateText('Load Starter Sample Cars', store.language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTab('vehicles')}
                    className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap accent-bg hover:opacity-95 transition-opacity"
                  >
                    {translateText('Add Real Cars', store.language)}
                  </button>
                </div>
              </div>
            )}
          {currentTab === 'overview' && (
            <OverviewView
              vehicles={store.vehicles}
              drivers={store.drivers}
              bookings={store.bookings}
              logs={store.logs}
              currentTheme={store.currentTheme}
              currentUser={store.currentUser}
              currentCompany={store.currentCompany}
              onOpenNewBooking={() => handleOpenBooking()}
              onOpenStorefront={() => setIsStorefrontOpen(true)}
              onSelectBookingForDispatch={handleSelectDispatch}
              onAcknowledgeCheckin={store.acknowledgeDriverCheckin}
              onNavigateTab={handleSelectTab}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarTimelineView
              vehicles={store.vehicles}
              drivers={store.drivers}
              bookings={store.bookings}
              maintenance={store.maintenance}
              currentTheme={store.currentTheme}
              onOpenBookingForVehicle={(vehId, dt) => handleOpenBooking(vehId, dt)}
              onAssignDriver={store.assignDriverToBooking}
              onToggleMaintenance={store.toggleVehicleMaintenance}
              onUpdateBookingStatus={store.updateBookingStatus}
              onSelectBookingForDispatch={(booking) => handleSelectDispatch(booking.id)}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesView
              vehicles={store.vehicles}
              bookings={store.bookings}
              drivers={store.drivers}
              expenses={store.expenses}
              maintenance={store.maintenance}
              currentTheme={store.currentTheme}
              companyId={store.currentCompany.id}
              isDemoMode={store.isDemoMode}
              onAddVehicle={store.addVehicle}
              onUpdateStatus={store.updateVehicleStatus}
              onUpdateRate={store.updateVehicleRate}
              onToggleMaintenance={store.toggleVehicleMaintenance}
              onOpenBookingForVehicle={(vehId) => handleOpenBooking(vehId)}
              onUpdateVehicle={store.updateVehicle}
              onDeleteVehicle={store.deleteVehicle}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView
              maintenance={store.maintenance}
              vehicles={store.vehicles}
              currentTheme={store.currentTheme}
              onAddMaintenance={store.addMaintenanceRecord}
              onUpdateMaintenance={store.updateMaintenanceRecord}
              onCompleteMaintenance={store.completeMaintenanceRecord}
              onDeleteMaintenance={store.deleteMaintenanceRecord}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {currentTab === 'drivers' && (
            <DriversView
              drivers={store.drivers}
              vehicles={store.vehicles}
              bookings={store.bookings}
              currentUser={store.currentUser}
              currentTheme={store.currentTheme}
              onAddDriver={store.addDriver}
              onUpdateStatus={store.updateDriverStatus}
              onAssignDriver={store.assignDriverToBooking}
              onUpdateDriver={store.updateDriver}
              onDeleteDriver={store.deleteDriver}
              onAcknowledgeCheckin={store.acknowledgeDriverCheckin}
              onCompleteTrip={store.completeDriverTrip}
              onDispatchSMS={store.dispatchDriverSMS}
            />
          )}

          {currentTab === 'bookings' && (
            <BookingsView
              bookings={store.bookings}
              vehicles={store.vehicles}
              drivers={store.drivers}
              currentTheme={store.currentTheme}
              onOpenNewBooking={() => handleOpenBooking()}
              onSelectBookingForDispatch={handleSelectDispatch}
              onAcknowledgeCheckin={store.acknowledgeDriverCheckin}
              onUpdateBookingStatus={store.updateBookingStatus}
              onUpdateFlightStatus={store.updateFlightStatus}
              onUpdateBooking={store.updateBooking}
              onDeleteBooking={store.deleteBooking}
              onAssignDriver={store.assignDriverToBooking}
            />
          )}

          {currentTab === 'dispatch' && (
            <DispatchView
              bookings={store.bookings}
              drivers={store.drivers}
              vehicles={store.vehicles}
              currentTheme={store.currentTheme}
              currentUser={store.currentUser}
              currentCompany={store.currentCompany}
              onDispatchSMS={(bkId, lang) => store.dispatchDriverSMS(bkId, lang)}
              onAdvanceCheckin={store.acknowledgeDriverCheckin}
              onUpdateFlightStatus={store.updateFlightStatus}
              onAssignDriver={store.assignDriverToBooking}
              onCompleteTrip={store.completeDriverTrip}
              onUpdateBookingStatus={store.updateBookingStatus}
            />
          )}

          {currentTab === 'handovers' && (
            <HandoversView
              handovers={store.handovers}
              bookings={store.bookings}
              vehicles={store.vehicles}
              currentUser={store.currentUser}
              currentTheme={store.currentTheme}
              onAddHandover={store.addHandoverInspection}
              onOpenAgreement={handleOpenRentalAgreement}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={store.tasks}
              users={store.users}
              vehicles={store.vehicles}
              bookings={store.bookings}
              currentUser={store.currentUser}
              currentTheme={store.currentTheme}
              onAddTask={store.addOperationalTask}
              onUpdateStatus={store.updateTaskStatus}
              onDeleteTask={store.deleteOperationalTask}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={store.customers}
              bookings={store.bookings}
              vehicles={store.vehicles}
              currentTheme={store.currentTheme}
              onAddCustomer={store.addCustomer}
              onUpdateCustomer={store.updateCustomer}
              onDeleteCustomer={store.deleteCustomer}
              onRecordPayment={store.recordCustomerPayment}
              onOpenNewBookingForCustomer={(name, phone, email) => {
                handleOpenBooking();
              }}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView
              payments={store.payments}
              bookings={store.bookings}
              customers={store.customers}
              currentTheme={store.currentTheme}
              currentCompany={store.currentCompany}
              currentUser={store.currentUser}
              onAddPayment={store.addPaymentRecord}
              onUpdatePaymentStatus={store.updatePaymentStatus}
              onGenerateEBM={store.generateEBMReceipt}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              expenses={store.expenses}
              vehicles={store.vehicles}
              bookings={store.bookings}
              payments={store.payments}
              currentUser={store.currentUser}
              currentTheme={store.currentTheme}
              onAddExpense={store.addExpenseRecord}
              onUpdateExpenseStatus={store.updateExpenseStatus}
              onDeleteExpense={store.deleteExpenseRecord}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              vehicles={store.vehicles}
              drivers={store.drivers}
              bookings={store.bookings}
              payments={store.payments}
              customers={store.customers}
              currentTheme={store.currentTheme}
              onNavigateToTab={handleSelectTab}
            />
          )}

          {currentTab === 'simulator' && (
            <AfricasTalkingSimulator
              bookings={store.bookings}
              drivers={store.drivers}
              vehicles={store.vehicles}
              currentTheme={store.currentTheme}
              onDispatchSMS={(bkId, lang) => store.dispatchDriverSMS(bkId, lang)}
              onAdvanceCheckin={store.acknowledgeDriverCheckin}
              onUpdateFlightStatus={store.updateFlightStatus}
            />
          )}

          {currentTab === 'pricing' && (
            <TiersView
              tiers={store.tiers}
              activeTierId={store.state.activeTierId}
              vehiclesCount={store.vehicles.length}
              currentTheme={store.currentTheme}
              onSelectTier={store.setTier}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              currentCompany={store.currentCompany}
              settings={store.settings}
              users={store.users}
              currentUser={store.currentUser}
              tiers={store.tiers}
              currentTheme={store.currentTheme}
              vehicles={store.vehicles}
              onOpenStorefront={() => handleSelectTab('storefront')}
              onUpdateCompanyProfile={store.updateCompanyProfile}
              onUpdateCompanySettings={store.updateCompanySettings}
              onInviteStaffMember={store.inviteStaffMember}
              onUpdateStaffRole={store.updateStaffRole}
              onUpdateStaffStatus={store.updateStaffStatus}
              onDeleteStaffMember={store.deleteStaffMember}
              onSelectTier={store.setTier}
            />
          )}

          {currentTab === 'super-admin' && (
            isSuperAdminUser(store.currentUser) ? (
              <SuperAdminView
                companies={store.companies}
                currentCompany={store.currentCompany}
                tiers={store.tiers}
                currentUser={store.currentUser}
                users={store.users}
                vehicles={store.vehicles}
                bookings={store.bookings}
                maintenance={store.maintenance}
                platformAdmins={store.platformAdmins}
                platformPlans={store.platformPlans}
                companySubscriptions={store.companySubscriptions}
                saasPayments={store.saasPayments}
                supportTickets={store.supportTickets}
                platformAuditLogs={store.platformAuditLogs}
                notificationTemplates={store.notificationTemplates}
                notificationDeliveryLogs={store.notificationDeliveryLogs}
                platformIntegrations={store.platformIntegrations}
                backgroundJobs={store.backgroundJobs}
                systemErrorLogs={store.systemErrorLogs}
                securityIncidents={store.securityIncidents}
                platformContent={store.platformContent}
                platformSettings={store.platformSettings}
                isFirebaseConnected={store.isFirebaseConnected}
                currentTheme={store.currentTheme}
                onUpdateCompanyStatus={store.updateCompanyStatus}
                onUpdateCompanyPlan={store.updateCompanyPlan}
                onSwitchCompanyContext={store.switchCompanyContext}
                onAddTenantCompany={store.addTenantCompany}
                onUpdateUserStatusByAdmin={store.updateUserStatusByAdmin}
                onRevokeUserSessions={store.revokeUserSessions}
                onTriggerUserRecovery={store.triggerUserRecovery}
                onSavePlatformPlan={store.savePlatformPlan}
                onExtendCompanySubscription={store.extendCompanySubscription}
                onGrantCompanyTrial={store.grantCompanyTrial}
                onReconcileSaasPayment={store.reconcileSaasPayment}
                onRefundSaasPayment={store.refundSaasPayment}
                onInspectBooking={store.logAuditedBookingInspection}
                onUpdateSupportTicket={store.updateSupportTicket}
                onSaveNotificationTemplate={store.saveNotificationTemplate}
                onSendPlatformNotification={store.sendPlatformNotification}
                onToggleIntegration={store.toggleIntegration}
                onTestIntegrationConnection={store.testIntegrationConnection}
                onRetryBackgroundJob={store.retryBackgroundJob}
                onResolveSystemError={store.resolveSystemError}
                onResolveSecurityIncident={store.resolveSecurityIncident}
                onSavePlatformContent={store.savePlatformContent}
                onUpdatePlatformSettings={store.updatePlatformSettings}
                onCreatePlatformAdmin={store.createPlatformAdmin}
                onUpdatePlatformAdmin={store.updatePlatformAdmin}
                onNavigateToTab={handleSelectTab}
                requestedModule={requestedAdminModule}
                onClearRequestedModule={() => setRequestedAdminModule(null)}
              />
            ) : (
              <div className="max-w-xl mx-auto my-12 p-7 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 kf-card text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200/70 dark:border-red-500/30 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {translateText('Private Admin Area', store.language)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {translateText('This page is only for platform admins.', store.language)} (
                    <code className="font-mono font-semibold text-slate-900 dark:text-white">
                      {store.currentUser.email}
                    </code>
                    )
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleSelectTab('overview')}
                    className="w-full sm:w-auto px-5 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {translateText('Return Home', store.language)}
                  </button>
                  <button
                    onClick={() => handleSelectTab('login')}
                    className="w-full sm:w-auto px-5 py-2 rounded-lg font-medium text-sm accent-bg"
                  >
                    {translateText('Sign in as Admin', store.language)}
                  </button>
                </div>
              </div>
            )
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 text-sm py-4 px-6">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">KigaliFleet</span>
              <span>·</span>
              <span>{translateText('Kigali, Rwanda', store.language)}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={store.resetToDefaults}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
                title="Restore sample cars, drivers, and bookings"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{translateText('Start Over', store.language)}</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Collision-Guarded New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setSelectedVehicleForBooking(undefined);
          setSelectedDateForBooking(undefined);
        }}
        vehicles={store.vehicles}
        drivers={store.drivers}
        existingBookings={store.bookings}
        maintenance={store.maintenance}
        onSubmitBooking={store.addBooking}
        initialVehicleId={selectedVehicleForBooking}
        initialDate={selectedDateForBooking}
        currentTheme={store.currentTheme}
      />

      {/* Africa's Talking SMS Dispatch Modal */}
      <SMSDispatchModal
        isOpen={!!smsDispatchBookingId}
        onClose={() => setSmsDispatchBookingId(null)}
        booking={activeDispatchBooking}
        driver={activeDispatchDriver}
        vehicle={activeDispatchVehicle}
        onConfirmDispatch={(bkId, lang) => {
          store.dispatchDriverSMS(bkId, lang);
        }}
        currentTheme={store.currentTheme}
      />

      {/* Instant B2B / Tourist Storefront Modal */}
      <StorefrontModal
        isOpen={isStorefrontOpen}
        onClose={() => setIsStorefrontOpen(false)}
        onNavigateToStorefront={() => handleSelectTab('storefront')}
        currentTheme={store.currentTheme}
        currentCompany={store.currentCompany}
      />

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        currentTheme={store.currentTheme}
        onSendResetEmail={store.sendPasswordReset}
      />

      {/* Official Legal Rental Agreement Contract Modal */}
      <RentalAgreementModal
        isOpen={isRentalAgreementOpen}
        onClose={() => {
          setIsRentalAgreementOpen(false);
          setAgreementBooking(null);
          setAgreementVehicle(null);
        }}
        booking={agreementBooking}
        vehicle={agreementVehicle}
        currentCompany={store.currentCompany}
        currentUser={store.currentUser}
        currentTheme={store.currentTheme}
      />
      </div>
    );
  };

  return (
    <I18nProvider
      currency={store.currency}
      setCurrency={store.setCurrency}
      language={store.language}
      setLanguage={store.setLanguage}
    >
      <AppTranslatedFooterWrapper>{renderView()}</AppTranslatedFooterWrapper>
    </I18nProvider>
  );
}

const AppTranslatedFooterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

