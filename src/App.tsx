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
import { RotateCcw } from 'lucide-react';

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

  // Sync tab changes to URL search params so browser address bar can be copied/shared
  const handleSelectTab = useCallback((tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
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

  if (currentTab === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <LoginView
          onLoginSuccess={() => handleSelectTab('overview')}
          onNavigateToRegister={() => handleSelectTab('register')}
          onNavigateToLanding={() => handleSelectTab('landing')}
          onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
          currentTheme={store.currentTheme}
          users={store.users}
          onSelectUser={store.login}
          onLoginWithGoogle={store.loginWithGoogle}
        />

        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          currentTheme={store.currentTheme}
        />
      </div>
    );
  }

  if (currentTab === 'register') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <RegisterView
          onRegisterSuccess={() => handleSelectTab('overview')}
          onNavigateToLogin={() => handleSelectTab('login')}
          onNavigateToLanding={() => handleSelectTab('landing')}
          currentTheme={store.currentTheme}
          onRegisterCompany={store.registerCompany}
        />
      </div>
    );
  }

  if (currentTab === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
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
        />
      </div>
    );
  }

  if (currentTab === 'storefront') {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 font-sans antialiased">
        <PublicStorefrontView
          vehicles={store.vehicles}
          drivers={store.drivers}
          bookings={store.bookings}
          currentTheme={store.currentTheme}
          currentCompany={store.currentCompany}
          companySettings={store.settings}
          onCompleteClientBooking={store.addBooking}
          onReturnToManager={(newId) => handleSelectTab(newId ? 'bookings' : 'overview')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors antialiased">
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

      {/* 2. Main Workspace Layout (Offset on Desktop by Sidebar width) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
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
          isFirebaseConnected={store.isFirebaseConnected}
          onLoginWithGoogle={store.loginWithGoogle}
          onNavigateTab={handleSelectTab}
          onLogout={() => {
            store.logout();
            handleSelectTab('landing');
          }}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
              currentTheme={store.currentTheme}
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
            <SuperAdminView
              companies={store.companies}
              currentCompany={store.currentCompany}
              tiers={store.tiers}
              currentUser={store.currentUser}
              currentTheme={store.currentTheme}
              onUpdateCompanyStatus={store.updateCompanyStatus}
              onUpdateCompanyPlan={store.updateCompanyPlan}
              onSwitchCompanyContext={store.switchCompanyContext}
              onAddTenantCompany={store.addTenantCompany}
              onNavigateToTab={handleSelectTab}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 text-slate-500 text-xs py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">KigaliFleet SaaS</span>
              <span>·</span>
              <span>Kigali, Rwanda</span>
              <span>·</span>
              <span
                className="font-medium font-mono"
                style={{ color: store.currentTheme.hex }}
              >
                Africa's Talking & MoMo Ready
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={store.resetToDefaults}
                className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Reset all sample bookings, vehicles and drivers to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Seed Data</span>
              </button>
              <span>v1.0.0 Production Prototype</span>
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
      />

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        currentTheme={store.currentTheme}
      />
    </div>
  );
}
