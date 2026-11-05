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
import { StorefrontModal } from './components/StorefrontModal';
import { RotateCcw } from 'lucide-react';

const VALID_TABS = [
  'overview',
  'calendar',
  'vehicles',
  'drivers',
  'bookings',
  'simulator',
  'storefront',
  'pricing',
];

function getTabFromLocation(): string {
  if (typeof window === 'undefined') return 'overview';
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
    if (path.includes('/rent') || path.includes('/storefront') || path.includes('/book')) {
      return 'storefront';
    }
  } catch (err) {
    console.error('Error reading location tab:', err);
  }
  return 'overview';
}

export default function App() {
  const store = useFleetStore();

  const [currentTab, setCurrentTab] = useState<string>(() => getTabFromLocation());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<string | undefined>();
  const [selectedDateForBooking, setSelectedDateForBooking] = useState<string | undefined>();
  const [isStorefrontOpen, setIsStorefrontOpen] = useState(false);
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
              onOpenNewBooking={() => handleOpenBooking()}
              onOpenStorefront={() => setIsStorefrontOpen(true)}
              onSelectBookingForDispatch={handleSelectDispatch}
              onAcknowledgeCheckin={store.acknowledgeDriverCheckin}
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
            />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesView
              vehicles={store.vehicles}
              bookings={store.bookings}
              currentTheme={store.currentTheme}
              onAddVehicle={store.addVehicle}
              onUpdateStatus={store.updateVehicleStatus}
              onUpdateRate={store.updateVehicleRate}
              onToggleMaintenance={store.toggleVehicleMaintenance}
              onOpenBookingForVehicle={(vehId) => handleOpenBooking(vehId)}
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

          {currentTab === 'storefront' && (
            <PublicStorefrontView
              vehicles={store.vehicles}
              drivers={store.drivers}
              bookings={store.bookings}
              currentTheme={store.currentTheme}
              onCompleteClientBooking={store.addBooking}
              onReturnToManager={(newId) => handleSelectTab(newId ? 'bookings' : 'overview')}
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
    </div>
  );
}
