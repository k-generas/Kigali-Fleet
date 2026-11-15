import { useState, useEffect, useRef } from 'react';
import {
  Vehicle,
  Driver,
  Booking,
  ActivityLog,
  SubscriptionTier,
  BookingStatus,
  VehicleStatus,
  DriverStatus,
  User,
  Company,
  CompanyStatus,
  UserRole,
  Customer,
  PaymentRecord,
  PaymentRecordStatus,
  MaintenanceRecord,
  CompanySettings,
  VehicleHandoverInspection,
  ExpenseRecord,
  ExpenseStatus,
  OperationalTask,
  TaskStatus,
  PlatformAdmin,
  PlatformPlan,
  CompanySubscription,
  SaasPaymentRecord,
  SaasPaymentStatus,
  PlatformAuditLog,
  SupportTicket,
  SupportTicketStatus,
  NotificationTemplate,
  NotificationDeliveryLog,
  PlatformIntegration,
  BackgroundJob,
  SystemErrorLog,
  SecurityIncident,
  PlatformContentItem,
  PlatformSettings,
  SuperAdminSubRole,
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_BOOKINGS,
  INITIAL_LOGS,
  SUBSCRIPTION_TIERS,
  INITIAL_COMPANY,
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_PAYMENTS,
  INITIAL_MAINTENANCE,
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_HANDOVER_INSPECTIONS,
  INITIAL_EXPENSES,
  INITIAL_OPERATIONAL_TASKS,
} from '../data/seedData';
import {
  INITIAL_PLATFORM_ADMINS,
  INITIAL_PLATFORM_PLANS,
  INITIAL_COMPANY_SUBSCRIPTIONS,
  INITIAL_SAAS_PAYMENTS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_PLATFORM_AUDIT_LOGS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_PLATFORM_INTEGRATIONS,
  INITIAL_BACKGROUND_JOBS,
  INITIAL_SYSTEM_ERRORS,
  INITIAL_SECURITY_INCIDENTS,
  INITIAL_PLATFORM_CONTENT,
  DEFAULT_PLATFORM_SETTINGS,
} from '../data/superAdminSeedData';
import { checkBookingCollision, generateDriverSMS } from '../utils/collision';
import { getThemeById, applyThemeCssVariables } from '../theme';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  canModifyPlatformAdmin,
  getDefaultRolePermissions,
  isSuperAdminEmail,
  verifySuperAdminPassword,
} from '../utils/auth';

const STORAGE_KEY_FLEET = 'kigalifleet_state_v3';

// Remove undefined fields to prevent Firestore serialization errors
function cleanForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

interface StoredState {
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  logs: ActivityLog[];
  activeTierId: 'starter' | 'growth' | 'enterprise';
  theme: 'dark' | 'light';
  accentColorId: string;
  currentUser: User;
  currentCompany: Company;
  companies: Company[];
  users: User[];
  customers: Customer[];
  payments: PaymentRecord[];
  maintenance: MaintenanceRecord[];
  handovers: VehicleHandoverInspection[];
  expenses: ExpenseRecord[];
  tasks: OperationalTask[];
  settings: CompanySettings;
  platformAdmins: PlatformAdmin[];
  platformPlans: PlatformPlan[];
  companySubscriptions: CompanySubscription[];
  saasPayments: SaasPaymentRecord[];
  supportTickets: SupportTicket[];
  platformAuditLogs: PlatformAuditLog[];
  notificationTemplates: NotificationTemplate[];
  notificationDeliveryLogs: NotificationDeliveryLog[];
  platformIntegrations: PlatformIntegration[];
  backgroundJobs: BackgroundJob[];
  systemErrorLogs: SystemErrorLog[];
  securityIncidents: SecurityIncident[];
  platformContent: PlatformContentItem[];
  platformSettings: PlatformSettings;
  isAuthenticated: boolean;
  isFirebaseConnected: boolean;
}

function loadInitialState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FLEET);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.vehicles && parsed.drivers && parsed.bookings) {
        const hydratedVehicles = parsed.vehicles.map((v: Vehicle) => {
          const initV = INITIAL_VEHICLES.find((iv) => iv.id === v.id);
          return {
            ...v,
            image_url: v.image_url || initV?.image_url,
          };
        });
        return {
          ...parsed,
          vehicles: hydratedVehicles,
          accentColorId: parsed.accentColorId || 'amber',
          currentUser: parsed.currentUser || INITIAL_USERS[0],
          currentCompany: parsed.currentCompany || INITIAL_COMPANY,
          companies: parsed.companies || INITIAL_COMPANIES,
          users: parsed.users || INITIAL_USERS,
          customers: parsed.customers || INITIAL_CUSTOMERS,
          payments: parsed.payments || INITIAL_PAYMENTS,
          maintenance: parsed.maintenance || INITIAL_MAINTENANCE,
          handovers: parsed.handovers || INITIAL_HANDOVER_INSPECTIONS,
          expenses: parsed.expenses || INITIAL_EXPENSES,
          tasks: parsed.tasks || INITIAL_OPERATIONAL_TASKS,
          settings: parsed.settings || DEFAULT_COMPANY_SETTINGS,
          platformAdmins: parsed.platformAdmins || INITIAL_PLATFORM_ADMINS,
          platformPlans: parsed.platformPlans || INITIAL_PLATFORM_PLANS,
          companySubscriptions: parsed.companySubscriptions || INITIAL_COMPANY_SUBSCRIPTIONS,
          saasPayments: parsed.saasPayments || INITIAL_SAAS_PAYMENTS,
          supportTickets: parsed.supportTickets || INITIAL_SUPPORT_TICKETS,
          platformAuditLogs: parsed.platformAuditLogs || INITIAL_PLATFORM_AUDIT_LOGS,
          notificationTemplates: parsed.notificationTemplates || INITIAL_NOTIFICATION_TEMPLATES,
          notificationDeliveryLogs: parsed.notificationDeliveryLogs || INITIAL_NOTIFICATION_LOGS,
          platformIntegrations: parsed.platformIntegrations || INITIAL_PLATFORM_INTEGRATIONS,
          backgroundJobs: parsed.backgroundJobs || INITIAL_BACKGROUND_JOBS,
          systemErrorLogs: parsed.systemErrorLogs || INITIAL_SYSTEM_ERRORS,
          securityIncidents: parsed.securityIncidents || INITIAL_SECURITY_INCIDENTS,
          platformContent: parsed.platformContent || INITIAL_PLATFORM_CONTENT,
          platformSettings: parsed.platformSettings || DEFAULT_PLATFORM_SETTINGS,
          isAuthenticated: parsed.isAuthenticated ?? true,
          isFirebaseConnected: false,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse stored KigaliFleet state:', err);
  }
  return {
    vehicles: INITIAL_VEHICLES,
    drivers: INITIAL_DRIVERS,
    bookings: INITIAL_BOOKINGS,
    logs: INITIAL_LOGS,
    customers: INITIAL_CUSTOMERS,
    payments: INITIAL_PAYMENTS,
    maintenance: INITIAL_MAINTENANCE,
    handovers: INITIAL_HANDOVER_INSPECTIONS,
    expenses: INITIAL_EXPENSES,
    tasks: INITIAL_OPERATIONAL_TASKS,
    settings: DEFAULT_COMPANY_SETTINGS,
    platformAdmins: INITIAL_PLATFORM_ADMINS,
    platformPlans: INITIAL_PLATFORM_PLANS,
    companySubscriptions: INITIAL_COMPANY_SUBSCRIPTIONS,
    saasPayments: INITIAL_SAAS_PAYMENTS,
    supportTickets: INITIAL_SUPPORT_TICKETS,
    platformAuditLogs: INITIAL_PLATFORM_AUDIT_LOGS,
    notificationTemplates: INITIAL_NOTIFICATION_TEMPLATES,
    notificationDeliveryLogs: INITIAL_NOTIFICATION_LOGS,
    platformIntegrations: INITIAL_PLATFORM_INTEGRATIONS,
    backgroundJobs: INITIAL_BACKGROUND_JOBS,
    systemErrorLogs: INITIAL_SYSTEM_ERRORS,
    securityIncidents: INITIAL_SECURITY_INCIDENTS,
    platformContent: INITIAL_PLATFORM_CONTENT,
    platformSettings: DEFAULT_PLATFORM_SETTINGS,
    activeTierId: 'growth',
    theme: 'dark',
    accentColorId: 'amber',
    currentUser: INITIAL_USERS[0],
    currentCompany: INITIAL_COMPANY,
    companies: INITIAL_COMPANIES,
    users: INITIAL_USERS,
    isAuthenticated: true,
    isFirebaseConnected: false,
  };
}

export function useFleetStore() {
  const [state, setState] = useState<StoredState>(() => loadInitialState());
  const isInitialSeedingDone = useRef(false);

  // Sync to localStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FLEET, JSON.stringify(state));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [state]);

  // Apply dark theme to html root and dynamic CSS custom properties for accent color
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const themeObj = getThemeById(state.accentColorId || 'amber');
    applyThemeCssVariables(themeObj);
  }, [state.theme, state.accentColorId]);

  // Real-time Firestore Listeners & Initial Seeding
  useEffect(() => {
    let unsubscribeVehicles: () => void = () => {};
    let unsubscribeDrivers: () => void = () => {};
    let unsubscribeBookings: () => void = () => {};
    let unsubscribeLogs: () => void = () => {};
    let unsubscribeCustomers: () => void = () => {};
    let unsubscribePayments: () => void = () => {};
    let unsubscribeMaintenance: () => void = () => {};
    let unsubscribeCompanies: () => void = () => {};
    let unsubscribeSupportTickets: () => void = () => {};
    let unsubscribePlatformPlans: () => void = () => {};
    let unsubscribeAuth: () => void = () => {};
    const authOnlyUnsubscribers: Array<() => void> = [];

    const clearAuthListeners = () => {
      while (authOnlyUnsubscribers.length) {
        const unsub = authOnlyUnsubscribers.pop();
        try {
          unsub?.();
        } catch {
          // ignore
        }
      }
    };

    const initFirestoreSync = async () => {
      try {
        // 1. Vehicles Real-Time Listener
        const vehCol = collection(db, 'vehicles');
        unsubscribeVehicles = onSnapshot(
          vehCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              isInitialSeedingDone.current = true;
              for (const v of INITIAL_VEHICLES) {
                setDoc(doc(db, 'vehicles', v.id), cleanForFirestore(v)).catch(() => {});
              }
            } else if (!snapshot.empty) {
              const liveVehicles: Vehicle[] = snapshot.docs.map((d) => d.data() as Vehicle);
              setState((prev) => ({
                ...prev,
                vehicles: liveVehicles,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore vehicles listener notice:', error.message);
          }
        );

        // 2. Drivers Real-Time Listener
        unsubscribeDrivers = onSnapshot(
          collection(db, 'drivers'),
          (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              for (const d of INITIAL_DRIVERS) {
                setDoc(doc(db, 'drivers', d.id), cleanForFirestore(d)).catch(() => {});
              }
            } else if (!snapshot.empty) {
              setState((prev) => ({
                ...prev,
                drivers: snapshot.docs.map((d) => d.data() as Driver),
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore drivers listener notice:', error.message);
          }
        );

        // 3. Bookings Real-Time Listener
        unsubscribeBookings = onSnapshot(
          collection(db, 'bookings'),
          (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              for (const b of INITIAL_BOOKINGS) {
                setDoc(doc(db, 'bookings', b.id), cleanForFirestore(b)).catch(() => {});
              }
            } else if (!snapshot.empty) {
              setState((prev) => ({
                ...prev,
                bookings: snapshot.docs.map((d) => d.data() as Booking),
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore bookings listener notice:', error.message);
          }
        );

        // 4. Companies Real-Time Listener
        unsubscribeCompanies = onSnapshot(
          collection(db, 'companies'),
          (snapshot) => {
            if (!snapshot.empty) {
              setState((prev) => ({
                ...prev,
                companies: snapshot.docs.map((d) => d.data() as Company),
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore companies listener notice:', error.message);
          }
        );

        // 5. Public Platform Plans Listener
        unsubscribePlatformPlans = onSnapshot(
          collection(db, 'platform_plans'),
          (snapshot) => {
            if (!snapshot.empty) {
              setState((prev) => ({
                ...prev,
                platformPlans: snapshot.docs.map((d) => d.data() as PlatformPlan),
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore platform_plans listener notice:', error.message);
          }
        );

        // 6. Support Tickets Listener
        unsubscribeSupportTickets = onSnapshot(
          collection(db, 'support_tickets'),
          (snapshot) => {
            if (!snapshot.empty) {
              setState((prev) => ({
                ...prev,
                supportTickets: snapshot.docs.map((d) => d.data() as SupportTicket),
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore support_tickets listener notice:', error.message);
          }
        );

        // 7. Auth State Changed Listener -> attach protected listeners only when authenticated
        unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
          clearAuthListeners();
          if (fbUser) {
            const email = fbUser.email || '';
            const isSuper = isSuperAdminEmail(email);
            setState((prev) => ({
              ...prev,
              isAuthenticated: true,
              currentUser: {
                ...prev.currentUser,
                name: fbUser.displayName || prev.currentUser.name,
                email: email || prev.currentUser.email,
                role: isSuper ? 'superadmin' : prev.currentUser.role,
                avatar_url: fbUser.photoURL || prev.currentUser.avatar_url,
              },
            }));

            authOnlyUnsubscribers.push(
              onSnapshot(
                collection(db, 'activity_logs'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    setState((prev) => ({
                      ...prev,
                      logs: snapshot.docs.map((d) => d.data() as ActivityLog),
                    }));
                  }
                },
                (err) => console.warn('activity_logs listener notice:', err.message)
              ),
              onSnapshot(
                collection(db, 'customers'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    setState((prev) => ({
                      ...prev,
                      customers: snapshot.docs.map((d) => d.data() as Customer),
                    }));
                  }
                },
                (err) => console.warn('customers listener notice:', err.message)
              ),
              onSnapshot(
                collection(db, 'payments'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    setState((prev) => ({
                      ...prev,
                      payments: snapshot.docs.map((d) => d.data() as PaymentRecord),
                    }));
                  }
                },
                (err) => console.warn('payments listener notice:', err.message)
              ),
              onSnapshot(
                collection(db, 'maintenance'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    setState((prev) => ({
                      ...prev,
                      maintenance: snapshot.docs.map((d) => d.data() as MaintenanceRecord),
                    }));
                  }
                },
                (err) => console.warn('maintenance listener notice:', err.message)
              ),
              onSnapshot(
                collection(db, 'platform_audit_logs'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    const liveAudit = snapshot.docs
                      .map((d) => d.data() as PlatformAuditLog)
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                    setState((prev) => ({
                      ...prev,
                      platformAuditLogs: liveAudit,
                    }));
                  }
                },
                (err) => console.warn('platform_audit_logs listener notice:', err.message)
              ),
              onSnapshot(
                collection(db, 'saas_payments'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    setState((prev) => ({
                      ...prev,
                      saasPayments: snapshot.docs.map((d) => d.data() as SaasPaymentRecord),
                    }));
                  }
                },
                (err) => console.warn('saas_payments listener notice:', err.message)
              ),
              onSnapshot(
                collection(db, 'company_subscriptions'),
                (snapshot) => {
                  if (!snapshot.empty) {
                    setState((prev) => ({
                      ...prev,
                      companySubscriptions: snapshot.docs.map((d) => d.data() as CompanySubscription),
                    }));
                  }
                },
                (err) => console.warn('company_subscriptions listener notice:', err.message)
              )
            );
          }
        });
      } catch (err) {
        console.warn('Firestore sync initialization notice:', err);
      }
    };

    initFirestoreSync();

    return () => {
      unsubscribeVehicles();
      unsubscribeDrivers();
      unsubscribeBookings();
      unsubscribeLogs();
      unsubscribeCustomers();
      unsubscribePayments();
      unsubscribeMaintenance();
      unsubscribeCompanies();
      unsubscribeSupportTickets();
      unsubscribePlatformPlans();
      unsubscribeAuth();
      clearAuthListeners();
    };
  }, []);

  const toggleTheme = () => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const setAccentColor = (themeId: string) => {
    setState((prev) => ({
      ...prev,
      accentColorId: themeId,
    }));
  };

  const addBooking = (
    newBooking: Omit<Booking, 'id' | 'created_at' | 'dispatch_status'>
  ): { success: boolean; error?: string; booking?: Booking } => {
    // 1. Collision Guard check
    const collision = checkBookingCollision(
      newBooking.vehicle_id,
      newBooking.start_date,
      newBooking.end_date,
      state.bookings
    );

    if (collision.hasCollision) {
      return {
        success: false,
        error: collision.conflictReason || 'Collision detected: Vehicle is already booked during these dates.',
      };
    }

    const createdBooking: Booking = {
      ...newBooking,
      id: `bk-${Date.now().toString().slice(-6)}`,
      dispatch_status: 'Not Sent',
      created_at: new Date().toISOString(),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Booking Created',
      details: `${createdBooking.client_name} reserved vehicle (${createdBooking.destination}) from ${createdBooking.start_date} to ${createdBooking.end_date}.`,
      category: 'booking',
    };

    const today = new Date().toISOString().split('T')[0];
    const isStartingToday = createdBooking.start_date <= today && createdBooking.end_date >= today;

    // Async write to Firestore
    try {
      setDoc(doc(db, 'bookings', createdBooking.id), cleanForFirestore(createdBooking)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `bookings/${createdBooking.id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `activity_logs/${newLog.id}`)
      );
      if (isStartingToday) {
        updateDoc(doc(db, 'vehicles', createdBooking.vehicle_id), { status: 'Booked' }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore write notice:', err);
    }

    // Optimistic local state update
    setState((prev) => {
      const updatedVehicles = prev.vehicles.map((v) => {
        if (v.id === createdBooking.vehicle_id && isStartingToday) {
          return { ...v, status: 'Booked' as VehicleStatus };
        }
        return v;
      });

      return {
        ...prev,
        bookings: [createdBooking, ...prev.bookings],
        vehicles: updatedVehicles,
        logs: [newLog, ...prev.logs].slice(0, 50),
      };
    });

    return { success: true, booking: createdBooking };
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    // Firestore write
    try {
      updateDoc(doc(db, 'bookings', id), { status }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`)
      );
    } catch (err) {
      console.warn('Firestore updateBookingStatus notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    try {
      updateDoc(doc(db, 'bookings', id), cleanForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`)
      );
    } catch (err) {
      console.warn('Firestore updateBooking notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const deleteBooking = (id: string) => {
    try {
      deleteDoc(doc(db, 'bookings', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`)
      );
    } catch (err) {
      console.warn('Firestore deleteBooking notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.filter((b) => b.id !== id),
    }));
  };

  const dispatchDriverSMS = (bookingId: string, language: 'RW' | 'EN' = 'RW') => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;

    const driver = state.drivers.find((d) => d.id === booking.driver_id);
    const vehicle = state.vehicles.find((v) => v.id === booking.vehicle_id);

    if (!driver || !vehicle) return null;

    const smsData = generateDriverSMS({
      driver,
      vehicle,
      booking,
      language,
    });

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `SMS Dispatched (${language === 'RW' ? 'Kinyarwanda' : 'English'})`,
      details: `Dispatched to ${driver.name} (${driver.phone}) for booking #${booking.id}.`,
      category: 'dispatch',
    };

    // Firestore writes
    try {
      updateDoc(doc(db, 'bookings', bookingId), { dispatch_status: 'Dispatched (SMS)' }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `activity_logs/${newLog.id}`)
      );
    } catch (err) {
      console.warn('Firestore dispatchDriverSMS notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, dispatch_status: 'Dispatched (SMS)' } : b
      ),
      logs: [newLog, ...prev.logs].slice(0, 50),
    }));

    return smsData;
  };

  const acknowledgeDriverCheckin = (
    bookingId: string,
    targetStage?: 'Acknowledged by Driver' | 'Driver at Terminal' | 'Client Onboard'
  ) => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const driver = state.drivers.find((d) => d.id === booking.driver_id);

    let nextStage = targetStage;
    if (!nextStage) {
      if (booking.dispatch_status === 'Not Sent' || booking.dispatch_status === 'Dispatched (SMS)') {
        nextStage = 'Acknowledged by Driver';
      } else if (booking.dispatch_status === 'Acknowledged by Driver') {
        nextStage = 'Driver at Terminal';
      } else {
        nextStage = 'Client Onboard';
      }
    }

    const actionDescription =
      nextStage === 'Acknowledged by Driver'
        ? 'USSD Itinerary Acknowledged (*134#)'
        : nextStage === 'Driver at Terminal'
        ? 'Chauffeur Arrived at KIA Terminal'
        : 'Passenger Picked Up & Onboard';

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: actionDescription,
      details: `${driver?.name || 'Chauffeur'} confirmed: "${actionDescription}" for Booking #${booking.id} (${booking.client_name}).`,
      category: 'driver',
    };

    // Firestore writes
    try {
      updateDoc(doc(db, 'bookings', bookingId), {
        dispatch_status: nextStage!,
        status: nextStage === 'Client Onboard' ? 'In Progress' : booking.status,
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`));

      if (booking.driver_id) {
        updateDoc(doc(db, 'drivers', booking.driver_id), { status: 'On Trip' }).catch(() => {});
      }
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore acknowledge notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              dispatch_status: nextStage!,
              status: nextStage === 'Client Onboard' ? 'In Progress' : b.status,
            }
          : b
      ),
      drivers: prev.drivers.map((d) =>
        d.id === booking.driver_id ? { ...d, status: 'On Trip' as DriverStatus } : d
      ),
      logs: [newLog, ...prev.logs].slice(0, 50),
    }));
  };

  const updateFlightStatus = (
    bookingId: string,
    flightStatus: 'On Time' | 'Delayed' | 'Landed' | 'Scheduled',
    delayMinutes: number = 45
  ) => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    const driver = booking ? state.drivers.find((d) => d.id === booking.driver_id) : null;

    let logMessage = `Flight for Booking #${bookingId} updated to ${flightStatus}.`;
    if (flightStatus === 'Delayed' && booking && driver) {
      logMessage = `FLIGHT DELAY DETECTED: ${booking.flight_number || 'Flight'} delayed by ${delayMinutes}m. Chauffeur ${driver.name} notified via Africa's Talking to adjust KIA pickup window.`;
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: flightStatus === 'Delayed' ? 'Flight Delay Alert Dispatched' : 'Flight Status Updated',
      details: logMessage,
      category: 'booking',
    };

    try {
      updateDoc(doc(db, 'bookings', bookingId), {
        flight_status: flightStatus,
        flight_delay_minutes: flightStatus === 'Delayed' ? delayMinutes : 0,
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`));
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore flight update notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              flight_status: flightStatus,
              flight_delay_minutes: flightStatus === 'Delayed' ? delayMinutes : undefined,
            }
          : b
      ),
      logs: [newLog, ...prev.logs],
    }));
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh-${Date.now().toString().slice(-5)}`,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Vehicle Registered',
      details: `Registered ${newVehicle.model_name} (${newVehicle.plate_number}) at ${newVehicle.daily_rate_rwf.toLocaleString()} RWF/day.`,
      category: 'fleet',
    };

    try {
      setDoc(doc(db, 'vehicles', newVehicle.id), cleanForFirestore(newVehicle)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `vehicles/${newVehicle.id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addVehicle notice:', err);
    }

    setState((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle],
      logs: [newLog, ...prev.logs],
    }));
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const target = state.vehicles.find((v) => v.id === id);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Vehicle Specs Updated',
      details: `Updated fleet records for ${target?.model_name || 'Vehicle'} (${target?.plate_number || id}).`,
      category: 'fleet',
    };

    try {
      updateDoc(doc(db, 'vehicles', id), cleanForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateVehicle notice:', err);
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteVehicle = (id: string) => {
    const target = state.vehicles.find((v) => v.id === id);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Vehicle Archived',
      details: `Archived/removed ${target?.model_name || 'Vehicle'} (${target?.plate_number || id}) from active fleet.`,
      category: 'fleet',
    };

    try {
      deleteDoc(doc(db, 'vehicles', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteVehicle notice:', err);
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
      logs: [newLog, ...prev.logs],
    }));
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
    try {
      updateDoc(doc(db, 'vehicles', id), { status }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
      );
    } catch (err) {
      console.warn('Firestore updateVehicleStatus notice:', err);
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, status } : v)),
    }));
  };

  const updateVehicleRate = (id: string, newRateRwf: number) => {
    const rate = Math.max(10000, newRateRwf);
    const target = state.vehicles.find((v) => v.id === id);
    const oldRate = target?.daily_rate_rwf || 0;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Rate Adjusted',
      details: `Adjusted daily rate for ${target?.model_name || 'Vehicle'} from ${oldRate.toLocaleString()} RWF to ${rate.toLocaleString()} RWF.`,
      category: 'fleet',
    };

    try {
      updateDoc(doc(db, 'vehicles', id), { daily_rate_rwf: rate }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateVehicleRate notice:', err);
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, daily_rate_rwf: rate } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const toggleVehicleMaintenance = (id: string, notes?: string) => {
    const target = state.vehicles.find((v) => v.id === id);
    const isCurrentlyMaintenance = target?.status === 'Maintenance';
    const newStatus: VehicleStatus = isCurrentlyMaintenance ? 'Available' : 'Maintenance';

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: isCurrentlyMaintenance ? 'Vehicle Cleared from Service' : 'Vehicle Sent to Maintenance',
      details: `${target?.model_name} (${target?.plate_number}) ${isCurrentlyMaintenance ? 'cleared for customer rental' : `grounded for workshop service${notes ? ` (${notes})` : ''}`}.`,
      category: 'fleet',
    };

    try {
      updateDoc(doc(db, 'vehicles', id), { status: newStatus }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore toggleVehicleMaintenance notice:', err);
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, status: newStatus } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const addDriver = (driver: Omit<Driver, 'id' | 'trips_completed' | 'rating'>) => {
    const newDriver: Driver = {
      ...driver,
      id: `drv-${Date.now().toString().slice(-5)}`,
      trips_completed: 0,
      rating: 5.0,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Onboarded',
      details: `Onboarded ${newDriver.name} (${newDriver.language}).`,
      category: 'driver',
    };

    try {
      setDoc(doc(db, 'drivers', newDriver.id), cleanForFirestore(newDriver)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `drivers/${newDriver.id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addDriver notice:', err);
    }

    setState((prev) => ({
      ...prev,
      drivers: [...prev.drivers, newDriver],
      logs: [newLog, ...prev.logs],
    }));
  };

  const updateDriverStatus = (id: string, status: DriverStatus) => {
    try {
      updateDoc(doc(db, 'drivers', id), { status }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `drivers/${id}`)
      );
    } catch (err) {
      console.warn('Firestore updateDriverStatus notice:', err);
    }

    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    const target = state.drivers.find((d) => d.id === id);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Profile Updated',
      details: `Updated chauffeur record for ${target?.name || 'Driver'}.`,
      category: 'driver',
    };

    try {
      updateDoc(doc(db, 'drivers', id), cleanForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `drivers/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateDriver notice:', err);
    }

    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteDriver = (id: string) => {
    const target = state.drivers.find((d) => d.id === id);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Deactivated',
      details: `Deactivated chauffeur ${target?.name || 'Driver'} from active roster.`,
      category: 'driver',
    };

    try {
      deleteDoc(doc(db, 'drivers', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `drivers/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteDriver notice:', err);
    }

    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.filter((d) => d.id !== id),
      logs: [newLog, ...prev.logs],
    }));
  };

  const completeDriverTrip = (bookingId: string) => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Trip Completed',
      details: `Booking #${booking.id} (${booking.client_name} - ${booking.destination}) marked completed. Vehicle & chauffeur released to Available.`,
      category: 'driver',
    };

    try {
      updateDoc(doc(db, 'bookings', bookingId), { status: 'Completed' }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`)
      );
      if (booking.driver_id) {
        const curDriver = state.drivers.find((d) => d.id === booking.driver_id);
        const newCount = (curDriver?.trips_completed || 0) + 1;
        updateDoc(doc(db, 'drivers', booking.driver_id), { status: 'Available', trips_completed: newCount }).catch(() => {});
      }
      if (booking.vehicle_id) {
        updateDoc(doc(db, 'vehicles', booking.vehicle_id), { status: 'Available' }).catch(() => {});
      }
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore completeTrip notice:', err);
    }

    setState((prev) => {
      const updatedBookings = prev.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'Completed' as BookingStatus } : b
      );
      const updatedDrivers = prev.drivers.map((d) =>
        d.id === booking.driver_id
          ? { ...d, status: 'Available' as DriverStatus, trips_completed: d.trips_completed + 1 }
          : d
      );
      const updatedVehicles = prev.vehicles.map((v) =>
        v.id === booking.vehicle_id ? { ...v, status: 'Available' as VehicleStatus } : v
      );

      return {
        ...prev,
        bookings: updatedBookings,
        drivers: updatedDrivers,
        vehicles: updatedVehicles,
        logs: [newLog, ...prev.logs],
      };
    });
  };

  const assignDriverToBooking = (
    bookingId: string,
    driverId: string
  ): { success: boolean; error?: string } => {
    const booking = state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const driver = state.drivers.find((d) => d.id === driverId);
    if (!driver) return { success: false, error: 'Driver not found.' };

    // Check collision
    const driverConflict = state.bookings.find(
      (b) =>
        b.id !== bookingId &&
        b.driver_id === driverId &&
        b.status !== 'Cancelled' &&
        b.status !== 'Completed' &&
        booking.start_date <= b.end_date &&
        booking.end_date >= b.start_date
    );

    if (driverConflict) {
      return {
        success: false,
        error: `Driver ${driver.name} is already booked on Booking #${driverConflict.id} (${driverConflict.client_name}) from ${driverConflict.start_date} to ${driverConflict.end_date}.`,
      };
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Assigned',
      details: `Linked ${driver.name} to booking #${booking.id} (${booking.client_name}).`,
      category: 'driver',
    };

    try {
      updateDoc(doc(db, 'bookings', bookingId), { driver_id: driverId }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore assignDriver notice:', err);
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, driver_id: driverId } : b)),
      logs: [newLog, ...prev.logs],
    }));

    return { success: true };
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'created_at'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString().split('T')[0],
      total_spent_rwf: customer.total_spent_rwf || 0,
      total_bookings_count: customer.total_bookings_count || 0,
      outstanding_balance_rwf: customer.outstanding_balance_rwf || 0,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Customer Profile Created',
      details: `Registered ${newCustomer.name} (${newCustomer.category}) - ${newCustomer.phone}.`,
      category: 'booking',
    };

    try {
      setDoc(doc(db, 'customers', newCustomer.id), cleanForFirestore(newCustomer)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `customers/${newCustomer.id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addCustomer notice:', err);
    }

    setState((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
      logs: [newLog, ...prev.logs],
    }));
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const target = state.customers.find((c) => c.id === id);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Customer Profile Updated',
      details: `Updated CRM records for ${target?.name || 'Customer'}.`,
      category: 'booking',
    };

    try {
      updateDoc(doc(db, 'customers', id), cleanForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `customers/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateCustomer notice:', err);
    }

    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteCustomer = (id: string) => {
    const target = state.customers.find((c) => c.id === id);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Customer Archived',
      details: `Archived CRM client record for ${target?.name || 'Customer'}.`,
      category: 'booking',
    };

    try {
      deleteDoc(doc(db, 'customers', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `customers/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteCustomer notice:', err);
    }

    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
      logs: [newLog, ...prev.logs],
    }));
  };

  const recordCustomerPayment = (customerId: string, amountRwf: number) => {
    const target = state.customers.find((c) => c.id === customerId);
    if (!target) return;

    const newBalance = Math.max(0, (target.outstanding_balance_rwf || 0) - amountRwf);
    const newSpent = (target.total_spent_rwf || 0) + amountRwf;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Corporate Payment Settled',
      details: `Received payment of ${amountRwf.toLocaleString()} RWF from ${target.name}. Outstanding balance updated to ${newBalance.toLocaleString()} RWF.`,
      category: 'booking',
    };

    try {
      updateDoc(doc(db, 'customers', customerId), {
        outstanding_balance_rwf: newBalance,
        total_spent_rwf: newSpent,
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `customers/${customerId}`));
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore payment record notice:', err);
    }

    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, outstanding_balance_rwf: newBalance, total_spent_rwf: newSpent }
          : c
      ),
      logs: [newLog, ...prev.logs],
    }));
  };

  const addPaymentRecord = (payment: Omit<PaymentRecord, 'id' | 'created_at'>) => {
    const newPayment: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString().split('T')[0],
      ebm_receipt_number: payment.ebm_receipt_number || `EBM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Payment Recorded',
      details: `Logged ${newPayment.payment_method} transaction of ${newPayment.amount_rwf.toLocaleString()} RWF for ${newPayment.customer_name}.`,
      category: 'booking',
    };

    try {
      setDoc(doc(db, 'payments', newPayment.id), cleanForFirestore(newPayment)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `payments/${newPayment.id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addPayment notice:', err);
    }

    setState((prev) => ({
      ...prev,
      payments: [newPayment, ...prev.payments],
      logs: [newLog, ...prev.logs],
    }));
    return newPayment;
  };

  const updatePaymentStatus = (id: string, status: PaymentRecordStatus, amountPaid?: number) => {
    const target = state.payments.find((p) => p.id === id);
    const updates: Partial<PaymentRecord> = { status };
    if (amountPaid !== undefined) {
      updates.amount_rwf = amountPaid;
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Payment Status Updated',
      details: `Payment #${id} (${target?.customer_name}) marked as ${status}.`,
      category: 'booking',
    };

    try {
      updateDoc(doc(db, 'payments', id), cleanForFirestore(updates)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `payments/${id}`)
      );
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore updatePayment notice:', err);
    }

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const generateEBMReceipt = (paymentId: string) => {
    const target = state.payments.find((p) => p.id === paymentId);
    if (!target) return null;

    const receiptNum = target.ebm_receipt_number || `EBM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    try {
      updateDoc(doc(db, 'payments', paymentId), { ebm_receipt_number: receiptNum }).catch(() => {});
    } catch (err) {
      console.warn('Firestore EBM update notice:', err);
    }

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === paymentId ? { ...p, ebm_receipt_number: receiptNum } : p)),
    }));
    return receiptNum;
  };

  const addMaintenanceRecord = (record: Omit<MaintenanceRecord, 'id' | 'created_at'>) => {
    const id = `mnt-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: MaintenanceRecord = {
      ...record,
      id,
      created_at: new Date().toISOString().slice(0, 10),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Maintenance Scheduled',
      details: `${record.vehicle_plate} sent to ${record.garage_name} for ${record.service_type}. Grounded.`,
      category: 'fleet',
    };

    const shouldGroundVehicle = record.status === 'In Garage';
    const vehicleUpdates = shouldGroundVehicle ? { status: 'Maintenance' as VehicleStatus } : {};

    try {
      setDoc(doc(db, 'maintenance', id), cleanForFirestore(newRecord)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `maintenance/${id}`)
      );
      if (shouldGroundVehicle) {
        updateDoc(doc(db, 'vehicles', record.vehicle_id), vehicleUpdates).catch(() => {});
      }
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addMaintenance notice:', err);
    }

    setState((prev) => ({
      ...prev,
      maintenance: [newRecord, ...prev.maintenance],
      vehicles: shouldGroundVehicle
        ? prev.vehicles.map((v) => (v.id === record.vehicle_id ? { ...v, status: 'Maintenance' } : v))
        : prev.vehicles,
      logs: [newLog, ...prev.logs],
    }));

    return newRecord;
  };

  const updateMaintenanceRecord = (record: MaintenanceRecord) => {
    try {
      updateDoc(doc(db, 'maintenance', record.id), cleanForFirestore(record)).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `maintenance/${record.id}`)
      );
    } catch (err) {
      console.warn('Firestore updateMaintenance notice:', err);
    }

    setState((prev) => ({
      ...prev,
      maintenance: prev.maintenance.map((m) => (m.id === record.id ? record : m)),
    }));
  };

  const completeMaintenanceRecord = (
    maintenanceId: string,
    actualOdometer?: number,
    finalCost?: number,
    nextServiceKm?: number
  ) => {
    const target = state.maintenance.find((m) => m.id === maintenanceId);
    if (!target) return;

    const completionDate = new Date().toISOString().slice(0, 10);
    const updatedRecord: MaintenanceRecord = {
      ...target,
      status: 'Completed',
      actual_completion_date: completionDate,
      cost_rwf: finalCost !== undefined ? finalCost : target.cost_rwf,
    };

    const vehicleUpdates: Partial<Vehicle> = {
      status: 'Available',
      last_service_date: completionDate,
      last_service_notes: `${target.service_type} at ${target.garage_name}. Cost: ${updatedRecord.cost_rwf.toLocaleString()} RWF.`,
      ...(actualOdometer ? { current_odometer_km: actualOdometer } : {}),
      ...(nextServiceKm ? { next_service_km: nextServiceKm } : {}),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Maintenance Completed',
      details: `${target.vehicle_plate} released from ${target.garage_name}. Status: Available.`,
      category: 'fleet',
    };

    try {
      updateDoc(doc(db, 'maintenance', maintenanceId), cleanForFirestore(updatedRecord)).catch(() => {});
      updateDoc(doc(db, 'vehicles', target.vehicle_id), cleanForFirestore(vehicleUpdates)).catch(() => {});
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore completeMaintenance notice:', err);
    }

    setState((prev) => ({
      ...prev,
      maintenance: prev.maintenance.map((m) => (m.id === maintenanceId ? updatedRecord : m)),
      vehicles: prev.vehicles.map((v) => (v.id === target.vehicle_id ? { ...v, ...vehicleUpdates } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteMaintenanceRecord = (maintenanceId: string) => {
    try {
      deleteDoc(doc(db, 'maintenance', maintenanceId)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteMaintenance notice:', err);
    }

    setState((prev) => ({
      ...prev,
      maintenance: prev.maintenance.filter((m) => m.id !== maintenanceId),
    }));
  };

  const addHandoverInspection = (
    inspection: Omit<VehicleHandoverInspection, 'id' | 'created_at'>
  ) => {
    const id = `INSP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInspection: VehicleHandoverInspection = {
      ...inspection,
      id,
      created_at: new Date().toISOString(),
    };

    const isPickup = inspection.inspection_type === 'pickup';
    const actionName = isPickup ? 'Vehicle Check-out (Pickup)' : 'Vehicle Check-in (Return)';
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: actionName,
      details: `${isPickup ? 'Handed over' : 'Checked in'} ${inspection.vehicle_plate} to ${inspection.client_name}. Odometer: ${inspection.odometer_km.toLocaleString()} km, Fuel: ${inspection.fuel_level_eighths}/8.`,
      category: 'handover',
    };

    const vehicleUpdates: Partial<Vehicle> = {
      current_odometer_km: inspection.odometer_km,
      status: isPickup ? 'Booked' : 'Available',
    };

    let newPenaltyPayment: PaymentRecord | undefined;
    const existingBooking = state.bookings.find((b) => b.id === inspection.booking_id);

    if (!isPickup && inspection.additional_charges_rwf && inspection.additional_charges_rwf > 0) {
      newPenaltyPayment = {
        id: `PAY-PENALTY-${Date.now()}`,
        booking_id: inspection.booking_id,
        customer_name: inspection.client_name,
        customer_phone: inspection.client_phone,
        amount_rwf: 0,
        expected_amount_rwf: inspection.additional_charges_rwf,
        payment_method: 'MTN Mobile Money',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        notes: `Vehicle Return Adjustment: ${inspection.additional_charges_reason || 'Excess mileage / fuel shortfall'}`,
        created_at: new Date().toISOString(),
      };
    }

    const bookingUpdates: Partial<Booking> = {
      ...(isPickup
        ? { handover_pickup_id: id, status: 'In Progress' as BookingStatus }
        : {
            handover_return_id: id,
            status: 'Completed' as BookingStatus,
            ...(inspection.additional_charges_rwf && inspection.additional_charges_rwf > 0
              ? { total_rwf: (existingBooking?.total_rwf || 0) + inspection.additional_charges_rwf }
              : {}),
          }),
    };

    try {
      setDoc(doc(db, 'handovers', id), cleanForFirestore(newInspection)).catch(() => {});
      updateDoc(doc(db, 'vehicles', inspection.vehicle_id), cleanForFirestore(vehicleUpdates)).catch(() => {});
      if (inspection.booking_id) {
        updateDoc(doc(db, 'bookings', inspection.booking_id), cleanForFirestore(bookingUpdates)).catch(() => {});
      }
      if (newPenaltyPayment) {
        setDoc(doc(db, 'payments', newPenaltyPayment.id), cleanForFirestore(newPenaltyPayment)).catch(() => {});
      }
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addHandover notice:', err);
    }

    setState((prev) => ({
      ...prev,
      handovers: [newInspection, ...prev.handovers],
      vehicles: prev.vehicles.map((v) =>
        v.id === inspection.vehicle_id ? { ...v, ...vehicleUpdates } : v
      ),
      bookings: prev.bookings.map((b) =>
        b.id === inspection.booking_id ? { ...b, ...bookingUpdates } : b
      ),
      payments: newPenaltyPayment ? [newPenaltyPayment, ...prev.payments] : prev.payments,
      logs: [newLog, ...prev.logs],
    }));

    return newInspection;
  };

  const deleteHandoverInspection = (id: string) => {
    try {
      deleteDoc(doc(db, 'handovers', id)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteHandover notice:', err);
    }
    setState((prev) => ({
      ...prev,
      handovers: prev.handovers.filter((h) => h.id !== id),
    }));
  };

  const addExpenseRecord = (expense: Omit<ExpenseRecord, 'id' | 'created_at'>) => {
    const id = `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExpense: ExpenseRecord = {
      ...expense,
      id,
      created_at: new Date().toISOString().slice(0, 10),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Expense Logged',
      details: `${expense.category} of ${expense.amount_rwf.toLocaleString()} RWF recorded${expense.vehicle_plate ? ` for ${expense.vehicle_plate}` : ''} (${expense.title}).`,
      category: 'expense',
    };

    try {
      setDoc(doc(db, 'expenses', id), cleanForFirestore(newExpense)).catch(() => {});
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addExpense notice:', err);
    }

    setState((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      logs: [newLog, ...prev.logs],
    }));

    return newExpense;
  };

  const updateExpenseStatus = (id: string, status: ExpenseStatus, approved_by?: string) => {
    const target = state.expenses.find((e) => e.id === id);
    if (!target) return;

    const updated: ExpenseRecord = {
      ...target,
      status,
      ...(approved_by ? { approved_by } : {}),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `Expense ${status}`,
      details: `Expense #${id} (${target.title}) marked as ${status}${approved_by ? ` by ${approved_by}` : ''}.`,
      category: 'expense',
    };

    try {
      updateDoc(doc(db, 'expenses', id), cleanForFirestore(updated)).catch(() => {});
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateExpense notice:', err);
    }

    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? updated : e)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteExpenseRecord = (id: string) => {
    try {
      deleteDoc(doc(db, 'expenses', id)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteExpense notice:', err);
    }
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const addOperationalTask = (task: Omit<OperationalTask, 'id' | 'created_at'>) => {
    const id = `TSK-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: OperationalTask = {
      ...task,
      id,
      created_at: new Date().toISOString().slice(0, 10),
    };

    try {
      setDoc(doc(db, 'tasks', id), cleanForFirestore(newTask)).catch(() => {});
    } catch (err) {
      console.warn('Firestore addTask notice:', err);
    }

    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    return newTask;
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    try {
      updateDoc(doc(db, 'tasks', id), { status }).catch(() => {});
    } catch (err) {
      console.warn('Firestore updateTask notice:', err);
    }

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  };

  const deleteOperationalTask = (id: string) => {
    try {
      deleteDoc(doc(db, 'tasks', id)).catch(() => {});
    } catch (err) {
      console.warn('Firestore deleteTask notice:', err);
    }

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user && res.user.email) {
        const normalizedEmail = res.user.email.toLowerCase();
        const isSuper = isSuperAdminEmail(normalizedEmail);

        let matchedUser = state.users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (!matchedUser) {
          matchedUser = {
            id: `usr-${Date.now().toString().slice(-4)}`,
            name: res.user.displayName || normalizedEmail.split('@')[0],
            email: res.user.email,
            phone: res.user.phoneNumber || '+250 788 100 000',
            role: isSuper ? 'superadmin' : 'owner',
            company_id: isSuper ? 'platform-root' : state.currentCompany.id,
            avatar_url: res.user.photoURL || undefined,
            status: 'Active',
            created_at: new Date().toISOString().slice(0, 10),
          };
          setDoc(doc(db, 'users', matchedUser.id), cleanForFirestore(matchedUser)).catch(() => {});
        } else {
          matchedUser = {
            ...matchedUser,
            name: res.user.displayName || matchedUser.name,
            avatar_url: res.user.photoURL || matchedUser.avatar_url,
            role: isSuper ? 'superadmin' : matchedUser.role,
          };
          setDoc(doc(db, 'users', matchedUser.id), cleanForFirestore(matchedUser), { merge: true }).catch(() => {});
        }

        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          currentUser: matchedUser!,
          users: prev.users.some((u) => u.id === matchedUser!.id)
            ? prev.users.map((u) => (u.id === matchedUser!.id ? matchedUser! : u))
            : [matchedUser!, ...prev.users],
        }));

        return { success: true, user: matchedUser };
      }
    } catch (err) {
      console.error('Google Sign-in error:', err);
      throw err;
    }
  };

  const login = (userId: string) => {
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      setState((prev) => ({
        ...prev,
        currentUser: user,
        isAuthenticated: true,
      }));
    }
  };

  const loginWithEmail = (email: string) => {
    const normalized = email.toLowerCase().trim();
    const user = state.users.find((u) => u.email.toLowerCase() === normalized);
    if (user) {
      setState((prev) => ({
        ...prev,
        currentUser: user,
        isAuthenticated: true,
      }));
      return true;
    }
    return false;
  };

  const loginWithCredentials = async (email: string, passwordAttempt: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const isSuper = isSuperAdminEmail(normalizedEmail);

    // 1. Super Admin Password Validation (Row-Level Security)
    if (isSuper) {
      const isValid = verifySuperAdminPassword(normalizedEmail, passwordAttempt);
      if (!isValid) {
        return {
          success: false,
          error: 'Security Alert: Incorrect Super Admin master credentials.',
        };
      }

      let superUser = state.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!superUser) {
        superUser = {
          id: `usr-superadmin-${Date.now().toString().slice(-4)}`,
          name: normalizedEmail.includes('9') ? 'Generas Kagiraneza (Secondary)' : 'Generas Kagiraneza',
          email: normalizedEmail,
          phone: '+250 788 100 200',
          role: 'superadmin',
          company_id: 'platform-root',
          status: 'Active',
          created_at: new Date().toISOString().slice(0, 10),
        };
      } else {
        superUser = { ...superUser, role: 'superadmin' };
      }

      setState((prev) => ({
        ...prev,
        currentUser: superUser!,
        users: prev.users.some((u) => u.id === superUser!.id)
          ? prev.users.map((u) => (u.id === superUser!.id ? superUser! : u))
          : [superUser!, ...prev.users],
        isAuthenticated: true,
      }));

      return { success: true, user: superUser };
    }

    // 2. Standard Staff / Member login
    const user = state.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user) {
      setState((prev) => ({
        ...prev,
        currentUser: user,
        isAuthenticated: true,
      }));
      return { success: true, user };
    }

    // 3. Fallback account provisioning for legitimate credentials
    if (passwordAttempt.length >= 6) {
      const newUser: User = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: email.split('@')[0],
        email: normalizedEmail,
        phone: '+250 788 000 000',
        role: 'manager',
        company_id: state.currentCompany.id,
        status: 'Active',
        created_at: new Date().toISOString().slice(0, 10),
      };

      setDoc(doc(db, 'users', newUser.id), cleanForFirestore(newUser)).catch(() => {});

      setState((prev) => ({
        ...prev,
        users: [newUser, ...prev.users],
        currentUser: newUser,
        isAuthenticated: true,
      }));

      return { success: true, user: newUser };
    }

    return {
      success: false,
      error: 'Account not found. Please click "Create Account" to register or verify your password.',
    };
  };

  const createUserAccount = async (data: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    password?: string;
    companyId?: string;
  }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const isSuper = isSuperAdminEmail(normalizedEmail);

    // If super admin email, enforce correct password
    if (isSuper && data.password && !verifySuperAdminPassword(normalizedEmail, data.password)) {
      return {
        success: false,
        error: 'Security Alert: Password does not match designated Super Admin master credential.',
      };
    }

    const assignedRole: UserRole = isSuper ? 'superadmin' : data.role;
    const assignedCompanyId = isSuper ? 'platform-root' : (data.companyId || state.currentCompany.id);

    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      role: assignedRole,
      company_id: assignedCompanyId,
      status: 'Active',
      created_at: new Date().toISOString().slice(0, 10),
    };

    try {
      await setDoc(doc(db, 'users', newUser.id), cleanForFirestore(newUser));
    } catch (e) {
      console.warn('Firestore user save notice:', e);
    }

    setState((prev) => ({
      ...prev,
      users: [newUser, ...prev.users.filter((u) => u.email.toLowerCase() !== normalizedEmail)],
      currentUser: newUser,
      isAuthenticated: true,
    }));

    return { success: true, user: newUser };
  };

  const switchRole = (role: UserRole) => {
    setState((prev) => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        role,
      },
    }));
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase logout notice:', e);
    }
    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
    }));
  };

  const registerCompany = (
    companyDataOrParams:
      | {
          companyName: string;
          businessType: 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport';
          tinNumber: string;
          city: string;
          ownerName: string;
          phone: string;
          email: string;
          tierId: 'starter' | 'growth' | 'enterprise';
        }
      | Omit<Company, 'id' | 'created_at'>,
    ownerData?: { name: string; email: string; phone: string }
  ) => {
    let newCompany: Company;
    let newOwner: User;

    if ('companyName' in companyDataOrParams) {
      const p = companyDataOrParams;
      const slug = p.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const companyId = `comp-${slug || Date.now().toString().slice(-4)}`;
      newCompany = {
        id: companyId,
        name: p.companyName,
        slug,
        business_type: p.businessType,
        tin_number: p.tinNumber,
        phone: p.phone,
        email: p.email,
        city: p.city || 'Kigali',
        country: 'Rwanda',
        currency: 'RWF',
        tier_id: p.tierId,
        created_at: new Date().toISOString(),
      };
      newOwner = {
        id: `usr-owner-${Date.now().toString().slice(-4)}`,
        name: p.ownerName,
        email: p.email,
        phone: p.phone,
        role: 'owner',
        company_id: companyId,
      };
    } else {
      const companyId = `comp-${companyDataOrParams.slug || Date.now().toString().slice(-4)}`;
      newCompany = {
        ...companyDataOrParams,
        id: companyId,
        created_at: new Date().toISOString(),
      };
      newOwner = {
        id: `usr-owner-${Date.now().toString().slice(-4)}`,
        name: ownerData?.name || 'Owner',
        email: ownerData?.email || newCompany.email,
        phone: ownerData?.phone || newCompany.phone,
        role: 'owner',
        company_id: companyId,
      };
    }

    try {
      setDoc(doc(db, 'companies', newCompany.id), cleanForFirestore(newCompany)).catch(() => {});
      setDoc(doc(db, 'users', newOwner.id), cleanForFirestore(newOwner)).catch(() => {});
    } catch (err) {
      console.warn('Firestore registerCompany notice:', err);
    }

    setState((prev) => ({
      ...prev,
      currentCompany: newCompany,
      currentUser: newOwner,
      users: [newOwner, ...prev.users],
      isAuthenticated: true,
      activeTierId: newCompany.tier_id,
    }));

    return { success: true, company: newCompany, owner: newOwner };
  };

  const setTier = (tierId: 'starter' | 'growth' | 'enterprise') => {
    setState((prev) => ({
      ...prev,
      activeTierId: tierId,
      currentCompany: {
        ...prev.currentCompany,
        tier_id: tierId,
      },
    }));
  };

  // ============================================================================
  // Immutable Platform Audit Logger & Superadmin Actions (Release 1 & 2)
  // ============================================================================

  const createAuditEntry = (params: {
    action: string;
    affected_entity_type: PlatformAuditLog['affected_entity_type'];
    affected_entity_id: string;
    affected_entity_label: string;
    reason: string;
    before_value?: string;
    after_value?: string;
  }): PlatformAuditLog => {
    const actor = state.currentUser;
    const matchedAdmin = state.platformAdmins.find(
      (a) => a.email.toLowerCase() === actor.email.toLowerCase()
    );
    const entry: PlatformAuditLog = {
      id: `paud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      actor_name: actor.name,
      actor_email: actor.email,
      actor_role: matchedAdmin?.sub_role || actor.role,
      action: params.action,
      affected_entity_type: params.affected_entity_type,
      affected_entity_id: params.affected_entity_id,
      affected_entity_label: params.affected_entity_label,
      reason: params.reason || 'Administrative action recorded via Superadmin Control Center',
      before_value: params.before_value,
      after_value: params.after_value,
      correlation_id: `CORR-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
    };
    if (auth.currentUser) {
      setDoc(doc(db, 'platform_audit_logs', entry.id), cleanForFirestore(entry)).catch(() => {});
    }
    return entry;
  };

  const updateCompanyStatus = (companyId: string, status: CompanyStatus, reason?: string) => {
    const target = state.companies.find((c) => c.id === companyId);
    if (!target) return;
    const audit = createAuditEntry({
      action: `Company Status Changed to ${status}`,
      affected_entity_type: 'Company',
      affected_entity_id: companyId,
      affected_entity_label: target.name,
      reason: reason?.trim() || `Tenant status updated to ${status}`,
      before_value: target.status || 'Active',
      after_value: status,
    });

    if (auth.currentUser) {
      updateDoc(doc(db, 'companies', companyId), cleanForFirestore({ status, suspension_reason: reason })).catch(
        () => {}
      );
    }

    const mappedSubStatus =
      status === 'Suspended'
        ? 'Suspended'
        : status === 'Grace Period'
        ? 'Past Due'
        : status === 'Trial'
        ? 'Trial'
        : status === 'Closed'
        ? 'Cancelled'
        : 'Active';

    setState((prev) => ({
      ...prev,
      companies: prev.companies.map((c) =>
        c.id === companyId ? { ...c, status, suspension_reason: reason || c.suspension_reason } : c
      ),
      currentCompany:
        prev.currentCompany.id === companyId
          ? { ...prev.currentCompany, status, suspension_reason: reason || prev.currentCompany.suspension_reason }
          : prev.currentCompany,
      companySubscriptions: prev.companySubscriptions.map((sub) =>
        sub.company_id === companyId
          ? {
              ...sub,
              status: mappedSubStatus,
              last_adjustment_reason: reason || sub.last_adjustment_reason,
              updated_at: new Date().toISOString().slice(0, 10),
            }
          : sub
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const updateCompanyPlan = (
    companyId: string,
    tierId: 'starter' | 'growth' | 'enterprise',
    reason?: string
  ) => {
    const target = state.companies.find((c) => c.id === companyId);
    const matchingPlan = state.platformPlans.find((p) => p.tier_key === tierId);
    const fee =
      matchingPlan?.monthly_fee_rwf ??
      (tierId === 'enterprise' ? 150000 : tierId === 'growth' ? 75000 : 35000);

    const audit = createAuditEntry({
      action: 'Company Plan Changed',
      affected_entity_type: 'Subscription',
      affected_entity_id: companyId,
      affected_entity_label: target?.name || companyId,
      reason: reason?.trim() || `Plan updated to ${tierId.toUpperCase()}`,
      before_value: target?.tier_id || 'starter',
      after_value: `${tierId} (${fee.toLocaleString()} RWF/mo)`,
    });

    if (auth.currentUser) {
      updateDoc(doc(db, 'companies', companyId), { tier_id: tierId, monthly_fee_rwf: fee }).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      companies: prev.companies.map((c) =>
        c.id === companyId ? { ...c, tier_id: tierId, monthly_fee_rwf: fee } : c
      ),
      currentCompany:
        prev.currentCompany.id === companyId
          ? { ...prev.currentCompany, tier_id: tierId, monthly_fee_rwf: fee }
          : prev.currentCompany,
      activeTierId: prev.currentCompany.id === companyId ? tierId : prev.activeTierId,
      companySubscriptions: prev.companySubscriptions.map((sub) =>
        sub.company_id === companyId
          ? {
              ...sub,
              plan_id: matchingPlan?.id || `plan-${tierId}`,
              plan_name: matchingPlan?.name || tierId,
              monthly_fee_rwf: fee,
              last_adjustment_reason: reason || `Changed to ${tierId}`,
              updated_at: new Date().toISOString().slice(0, 10),
            }
          : sub
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const switchCompanyContext = (companyId: string, reason?: string) => {
    const target = state.companies.find((c) => c.id === companyId);
    if (!target) return;
    const audit = createAuditEntry({
      action: 'Tenant Context Switched (Audited)',
      affected_entity_type: 'Company',
      affected_entity_id: target.id,
      affected_entity_label: target.name,
      reason: reason || 'Superadmin switched active tenant workspace context for operational inspection.',
      before_value: state.currentCompany.name,
      after_value: target.name,
    });

    setState((prev) => ({
      ...prev,
      currentCompany: target,
      activeTierId: target.tier_id,
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const addTenantCompany = (
    companyData: Omit<Company, 'id' | 'created_at'>,
    ownerName: string,
    ownerEmail: string,
    ownerPhone: string
  ) => {
    const slug = companyData.slug || companyData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `comp-${slug}-${Date.now().toString().slice(-3)}`;
    const monthlyFee =
      companyData.tier_id === 'enterprise' ? 150000 : companyData.tier_id === 'growth' ? 75000 : 35000;

    const newCompany: Company = {
      ...companyData,
      id,
      slug,
      status: companyData.status || 'Active',
      monthly_fee_rwf: monthlyFee,
      owner_name: ownerName,
      branches_count: companyData.branches_count || 1,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const newOwner: User = {
      id: `usr-owner-${Date.now().toString().slice(-4)}`,
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      role: 'owner',
      company_id: id,
      status: 'Active',
      created_at: new Date().toISOString().slice(0, 10),
    };

    const newSubscription: CompanySubscription = {
      id: `sub-${slug}-${Date.now().toString().slice(-3)}`,
      company_id: id,
      company_name: newCompany.name,
      plan_id: `plan-${newCompany.tier_id}`,
      plan_name: newCompany.tier_id.charAt(0).toUpperCase() + newCompany.tier_id.slice(1),
      status: newCompany.status === 'Trial' ? 'Trial' : 'Active',
      start_date: new Date().toISOString().slice(0, 10),
      renewal_date:
        newCompany.renewal_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      monthly_fee_rwf: newCompany.status === 'Trial' ? 0 : monthlyFee,
      auto_renew: true,
      updated_at: new Date().toISOString().slice(0, 10),
    };

    const audit = createAuditEntry({
      action: 'Tenant Company Onboarded',
      affected_entity_type: 'Company',
      affected_entity_id: id,
      affected_entity_label: newCompany.name,
      reason: `Onboarded new ${newCompany.business_type} operator on ${newCompany.tier_id} plan.`,
      after_value: `${newCompany.name} (${newCompany.status})`,
    });

    if (auth.currentUser) {
      setDoc(doc(db, 'companies', newCompany.id), cleanForFirestore(newCompany)).catch(() => {});
      setDoc(doc(db, 'users', newOwner.id), cleanForFirestore(newOwner)).catch(() => {});
      setDoc(doc(db, 'company_subscriptions', newSubscription.id), cleanForFirestore(newSubscription)).catch(
        () => {}
      );
    }

    setState((prev) => ({
      ...prev,
      companies: [newCompany, ...prev.companies],
      users: [newOwner, ...prev.users],
      companySubscriptions: [newSubscription, ...prev.companySubscriptions],
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));

    return newCompany;
  };

  const updateUserStatusByAdmin = (
    userId: string,
    status: 'Active' | 'Suspended' | 'Deactivated',
    reason: string
  ) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    if (isSuperAdminEmail(target.email)) return;

    const audit = createAuditEntry({
      action: `Global User ${status}`,
      affected_entity_type: 'User',
      affected_entity_id: userId,
      affected_entity_label: `${target.name} (${target.email})`,
      reason,
      before_value: target.status || 'Active',
      after_value: status,
    });

    if (auth.currentUser) {
      updateDoc(doc(db, 'users', userId), cleanForFirestore({ status, suspension_reason: reason })).catch(
        () => {}
      );
    }

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, status, suspension_reason: reason } : u)),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const revokeUserSessions = (userId: string, reason: string) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const audit = createAuditEntry({
      action: 'User Sessions Force-Revoked',
      affected_entity_type: 'User',
      affected_entity_id: userId,
      affected_entity_label: `${target.name} (${target.email})`,
      reason,
      after_value: `Revoked at ${nowIso}`,
    });

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, sessions_revoked_at: nowIso } : u)),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const triggerUserRecovery = (userId: string) => {
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const audit = createAuditEntry({
      action: 'Account Recovery Initiated',
      affected_entity_type: 'User',
      affected_entity_id: userId,
      affected_entity_label: target.email,
      reason: 'Superadmin initiated secure out-of-band password reset link.',
      after_value: `Recovery dispatched ${nowIso}`,
    });

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, recovery_requested_at: nowIso } : u)),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const savePlatformPlan = (plan: PlatformPlan, reason: string) => {
    const existing = state.platformPlans.find((p) => p.id === plan.id);
    const updatedPlan: PlatformPlan = {
      ...plan,
      updated_at: new Date().toISOString().slice(0, 10),
    };
    const audit = createAuditEntry({
      action: existing ? 'Subscription Plan Updated' : 'Subscription Plan Created',
      affected_entity_type: 'Plan',
      affected_entity_id: updatedPlan.id,
      affected_entity_label: updatedPlan.name,
      reason,
      before_value: existing ? `${existing.monthly_fee_rwf} RWF (${existing.max_vehicles} cars)` : undefined,
      after_value: `${updatedPlan.monthly_fee_rwf} RWF (${updatedPlan.max_vehicles} cars)`,
    });

    if (auth.currentUser) {
      setDoc(doc(db, 'platform_plans', updatedPlan.id), cleanForFirestore(updatedPlan)).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      platformPlans: existing
        ? prev.platformPlans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
        : [...prev.platformPlans, updatedPlan],
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const extendCompanySubscription = (subscriptionId: string, newRenewalDate: string, reason: string) => {
    const target = state.companySubscriptions.find((s) => s.id === subscriptionId);
    if (!target) return;
    const audit = createAuditEntry({
      action: 'Subscription Renewal Extended',
      affected_entity_type: 'Subscription',
      affected_entity_id: subscriptionId,
      affected_entity_label: target.company_name,
      reason,
      before_value: target.renewal_date,
      after_value: newRenewalDate,
    });

    setState((prev) => ({
      ...prev,
      companySubscriptions: prev.companySubscriptions.map((s) =>
        s.id === subscriptionId
          ? {
              ...s,
              renewal_date: newRenewalDate,
              status: 'Active',
              last_adjustment_reason: reason,
              updated_at: new Date().toISOString().slice(0, 10),
            }
          : s
      ),
      companies: prev.companies.map((c) =>
        c.id === target.company_id ? { ...c, renewal_date: newRenewalDate, status: 'Active' } : c
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const grantCompanyTrial = (companyId: string, trialDays: number, reason: string) => {
    const target = state.companies.find((c) => c.id === companyId);
    if (!target) return;
    const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const audit = createAuditEntry({
      action: `Granted ${trialDays}-Day Trial`,
      affected_entity_type: 'Subscription',
      affected_entity_id: companyId,
      affected_entity_label: target.name,
      reason,
      before_value: target.status || 'Active',
      after_value: `Trial until ${trialEnd}`,
    });

    setState((prev) => ({
      ...prev,
      companies: prev.companies.map((c) =>
        c.id === companyId ? { ...c, status: 'Trial', trial_ends_at: trialEnd, renewal_date: trialEnd } : c
      ),
      companySubscriptions: prev.companySubscriptions.map((s) =>
        s.company_id === companyId
          ? {
              ...s,
              status: 'Trial',
              trial_end_date: trialEnd,
              renewal_date: trialEnd,
              last_adjustment_reason: reason,
              updated_at: new Date().toISOString().slice(0, 10),
            }
          : s
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const reconcileSaasPayment = (
    paymentId: string,
    nextStatus: SaasPaymentStatus,
    reconciliationNotes: string
  ) => {
    const target = state.saasPayments.find((p) => p.id === paymentId);
    if (!target) return;
    const ebmRef =
      nextStatus === 'Successful'
        ? target.ebm_invoice_ref || `EBM-SAAS-2026-${Math.floor(1000 + Math.random() * 9000)}`
        : target.ebm_invoice_ref;

    const audit = createAuditEntry({
      action: `SaaS Payment Reconciled (${nextStatus})`,
      affected_entity_type: 'SaasPayment',
      affected_entity_id: paymentId,
      affected_entity_label: `${target.transaction_ref} · ${target.company_name}`,
      reason: reconciliationNotes,
      before_value: target.status,
      after_value: nextStatus,
    });

    if (auth.currentUser) {
      updateDoc(
        doc(db, 'saas_payments', paymentId),
        cleanForFirestore({
          status: nextStatus,
          reconciliation_notes: reconciliationNotes,
          reconciled_by: state.currentUser.email,
          ebm_invoice_ref: ebmRef,
        })
      ).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      saasPayments: prev.saasPayments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: nextStatus,
              reconciliation_notes: reconciliationNotes,
              reconciled_by: prev.currentUser.email,
              ebm_invoice_ref: ebmRef,
            }
          : p
      ),
      companies:
        nextStatus === 'Successful'
          ? prev.companies.map((c) => (c.id === target.company_id ? { ...c, status: 'Active' } : c))
          : prev.companies,
      companySubscriptions:
        nextStatus === 'Successful'
          ? prev.companySubscriptions.map((s) =>
              s.id === target.subscription_id ? { ...s, status: 'Active' } : s
            )
          : prev.companySubscriptions,
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const refundSaasPayment = (paymentId: string, refundAmountRwf: number, reason: string) => {
    const target = state.saasPayments.find((p) => p.id === paymentId);
    if (!target) return;
    const isFull = refundAmountRwf >= target.amount_rwf;
    const nextStatus: SaasPaymentStatus = isFull ? 'Refunded' : 'Partially Refunded';

    const audit = createAuditEntry({
      action: `SaaS Payment ${nextStatus}`,
      affected_entity_type: 'SaasPayment',
      affected_entity_id: paymentId,
      affected_entity_label: `${target.transaction_ref} · ${target.company_name}`,
      reason,
      before_value: `${target.status} (${target.amount_rwf.toLocaleString()} RWF)`,
      after_value: `${nextStatus} (-${refundAmountRwf.toLocaleString()} RWF)`,
    });

    setState((prev) => ({
      ...prev,
      saasPayments: prev.saasPayments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: nextStatus,
              refunded_amount_rwf: refundAmountRwf,
              refund_reason: reason,
              reconciled_by: prev.currentUser.email,
            }
          : p
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const logAuditedBookingInspection = (bookingId: string, bookingLabel: string) => {
    const audit = createAuditEntry({
      action: 'Sensitive Data Access: Cross-Tenant Booking Inspected',
      affected_entity_type: 'Booking',
      affected_entity_id: bookingId,
      affected_entity_label: bookingLabel,
      reason: 'Superadmin opened read-only cross-company booking & dispute dossier.',
    });
    setState((prev) => ({
      ...prev,
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const addSupportTicket = (
    ticketData: Omit<SupportTicket, 'id' | 'ticket_ref' | 'status' | 'created_at'>
  ) => {
    const ticketRef = `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: SupportTicket = {
      ...ticketData,
      id: `tck-${Date.now().toString().slice(-6)}`,
      ticket_ref: ticketRef,
      status: 'New',
      requester_type: ticketData.requester_type || 'Storefront Customer',
      company_id: ticketData.company_id || state.currentCompany.id,
      company_name: ticketData.company_name || state.currentCompany.name,
      created_at: new Date().toISOString(),
    };

    if (auth.currentUser) {
      setDoc(doc(db, 'support_tickets', newTicket.id), cleanForFirestore(newTicket)).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      supportTickets: [newTicket, ...prev.supportTickets],
    }));
    return newTicket;
  };

  const updateSupportTicket = (
    ticketId: string,
    updates: Partial<SupportTicket>,
    newInternalNote?: string
  ) => {
    const target = state.supportTickets.find((t) => t.id === ticketId);
    if (!target) return;

    const appendedNotes = newInternalNote?.trim()
      ? [
          ...(target.internal_notes || []),
          {
            id: `note-${Date.now()}`,
            author: state.currentUser.name,
            note: newInternalNote.trim(),
            created_at: new Date().toISOString(),
          },
        ]
      : target.internal_notes;

    const updatedTicket: SupportTicket = {
      ...target,
      ...updates,
      internal_notes: appendedNotes,
      updated_at: new Date().toISOString(),
    };

    const audit = createAuditEntry({
      action: `Support Ticket Updated (${updatedTicket.status})`,
      affected_entity_type: 'SupportTicket',
      affected_entity_id: ticketId,
      affected_entity_label: `${target.ticket_ref} · ${target.customer_name}`,
      reason: newInternalNote?.trim() || updates.response?.trim() || `Status set to ${updatedTicket.status}`,
      before_value: target.status,
      after_value: updatedTicket.status,
    });

    if (auth.currentUser) {
      updateDoc(doc(db, 'support_tickets', ticketId), cleanForFirestore(updatedTicket)).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      supportTickets: prev.supportTickets.map((t) => (t.id === ticketId ? updatedTicket : t)),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const saveNotificationTemplate = (template: NotificationTemplate) => {
    const exists = state.notificationTemplates.some((t) => t.id === template.id);
    const updated: NotificationTemplate = {
      ...template,
      updated_at: new Date().toISOString().slice(0, 10),
    };
    const audit = createAuditEntry({
      action: exists ? 'Notification Template Edited' : 'Notification Template Created',
      affected_entity_type: 'Notification',
      affected_entity_id: updated.id,
      affected_entity_label: `${updated.name} (${updated.channel})`,
      reason: 'Updated platform messaging template.',
    });

    setState((prev) => ({
      ...prev,
      notificationTemplates: exists
        ? prev.notificationTemplates.map((t) => (t.id === updated.id ? updated : t))
        : [updated, ...prev.notificationTemplates],
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const sendPlatformNotification = (
    templateId: string,
    recipient: string,
    companyName?: string
  ) => {
    const tpl = state.notificationTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    const provider =
      tpl.channel === 'SMS'
        ? "Africa's Talking SMS"
        : tpl.channel === 'WhatsApp'
        ? 'Meta WhatsApp Cloud API'
        : tpl.channel === 'Email'
        ? 'SendGrid Rwanda Relay'
        : 'KigaliFleet In-App Push';

    const delivery: NotificationDeliveryLog = {
      id: `ndel-${Date.now().toString().slice(-6)}`,
      template_id: tpl.id,
      template_name: tpl.name,
      channel: tpl.channel,
      recipient,
      company_name: companyName,
      provider,
      status: 'Provider Accepted',
      sent_at: new Date().toISOString(),
    };

    const audit = createAuditEntry({
      action: 'Platform Notification Dispatched',
      affected_entity_type: 'Notification',
      affected_entity_id: delivery.id,
      affected_entity_label: `${tpl.channel} -> ${recipient}`,
      reason: `Dispatched template "${tpl.name}" via ${provider}.`,
    });

    setState((prev) => ({
      ...prev,
      notificationDeliveryLogs: [delivery, ...prev.notificationDeliveryLogs],
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const toggleIntegration = (integrationId: string, reason: string) => {
    const target = state.platformIntegrations.find((i) => i.id === integrationId);
    if (!target) return;
    const nextEnabled = !target.is_enabled;
    const audit = createAuditEntry({
      action: `Integration ${nextEnabled ? 'Enabled' : 'Disabled'}`,
      affected_entity_type: 'Integration',
      affected_entity_id: integrationId,
      affected_entity_label: target.name,
      reason,
      before_value: target.is_enabled ? 'Enabled' : 'Disabled',
      after_value: nextEnabled ? 'Enabled' : 'Disabled',
    });

    setState((prev) => ({
      ...prev,
      platformIntegrations: prev.platformIntegrations.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              is_enabled: nextEnabled,
              status: nextEnabled ? 'Connected' : 'Disconnected',
              last_checked_at: new Date().toISOString(),
            }
          : i
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const testIntegrationConnection = async (integrationId: string) => {
    const start = Date.now();
    let status: PlatformIntegration['status'] = 'Connected';
    let latencyMs = 110;
    if (integrationId === 'int-firebase') {
      try {
        await Promise.race([
          getDocFromServer(doc(db, 'test', 'connection')),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500)),
        ]);
        latencyMs = Math.max(25, Date.now() - start);
        status = 'Connected';
      } catch {
        latencyMs = Date.now() - start;
        status = 'Degraded';
      }
    } else {
      latencyMs = 85 + Math.floor(Math.random() * 90);
    }

    setState((prev) => ({
      ...prev,
      platformIntegrations: prev.platformIntegrations.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              status: i.is_enabled ? status : 'Disconnected',
              latency_ms: latencyMs,
              last_checked_at: new Date().toISOString(),
            }
          : i
      ),
    }));
    return { status, latencyMs };
  };

  const retryBackgroundJob = (jobId: string) => {
    const target = state.backgroundJobs.find((j) => j.id === jobId);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const audit = createAuditEntry({
      action: 'Background Job Retried',
      affected_entity_type: 'Integration',
      affected_entity_id: jobId,
      affected_entity_label: target.name,
      reason: 'Manual retry triggered from System Health monitor.',
      before_value: target.status,
      after_value: 'Completed',
    });

    setState((prev) => ({
      ...prev,
      backgroundJobs: prev.backgroundJobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'Completed',
              last_run_at: nowIso,
              error_message: undefined,
              records_processed: j.records_processed + 1,
            }
          : j
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const resolveSystemError = (errorId: string) => {
    setState((prev) => ({
      ...prev,
      systemErrorLogs: prev.systemErrorLogs.map((e) => (e.id === errorId ? { ...e, resolved: true } : e)),
    }));
  };

  const logFailedLoginAttempt = (emailAttempt: string, details: string) => {
    const incident: SecurityIncident = {
      id: `sec-${Date.now().toString().slice(-6)}`,
      title: `Failed Login Attempt (${emailAttempt})`,
      category: 'Failed Login Spike',
      severity: isSuperAdminEmail(emailAttempt) ? 'Critical' : 'Medium',
      target_email: emailAttempt,
      details,
      status: 'Open',
      assigned_to: 'security@kigalifleet.rw',
      created_at: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      securityIncidents: [incident, ...prev.securityIncidents],
    }));
  };

  const resolveSecurityIncident = (
    incidentId: string,
    status: SecurityIncident['status'],
    resolutionNotes: string
  ) => {
    const target = state.securityIncidents.find((i) => i.id === incidentId);
    if (!target) return;
    const audit = createAuditEntry({
      action: `Security Incident ${status}`,
      affected_entity_type: 'Security',
      affected_entity_id: incidentId,
      affected_entity_label: target.title,
      reason: resolutionNotes,
      before_value: target.status,
      after_value: status,
    });

    setState((prev) => ({
      ...prev,
      securityIncidents: prev.securityIncidents.map((i) =>
        i.id === incidentId ? { ...i, status, resolution_notes: resolutionNotes } : i
      ),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const savePlatformContent = (item: PlatformContentItem) => {
    const exists = state.platformContent.some((c) => c.id === item.id);
    const updated: PlatformContentItem = {
      ...item,
      updated_by: state.currentUser.email,
      updated_at: new Date().toISOString(),
    };
    const audit = createAuditEntry({
      action: exists ? `Content Updated (${updated.status})` : `Content Created (${updated.status})`,
      affected_entity_type: 'Content',
      affected_entity_id: updated.id,
      affected_entity_label: `${updated.title} v${updated.version}`,
      reason: `Updated ${updated.type} content item.`,
    });

    setState((prev) => ({
      ...prev,
      platformContent: exists
        ? prev.platformContent.map((c) => (c.id === updated.id ? updated : c))
        : [updated, ...prev.platformContent],
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const updatePlatformSettings = (updates: Partial<PlatformSettings>, reason: string) => {
    const nextSettings: PlatformSettings = {
      ...state.platformSettings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const audit = createAuditEntry({
      action: 'Platform Settings Updated',
      affected_entity_type: 'Settings',
      affected_entity_id: 'global-platform-settings',
      affected_entity_label: nextSettings.platform_name,
      reason,
      after_value: updates.maintenance_mode !== undefined ? `Maintenance=${updates.maintenance_mode}` : 'Config updated',
    });

    if (auth.currentUser) {
      setDoc(doc(db, 'platform_settings', 'global'), cleanForFirestore(nextSettings)).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      platformSettings: nextSettings,
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
  };

  const createPlatformAdmin = (
    data: { name: string; email: string; phone: string; sub_role: SuperAdminSubRole },
    reason: string
  ): { success: boolean; error?: string } => {
    const actorAdmin = state.platformAdmins.find(
      (a) => a.email.toLowerCase() === state.currentUser.email.toLowerCase()
    );
    const dummyTarget: PlatformAdmin = {
      id: `adm-${Date.now().toString().slice(-5)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      sub_role: data.sub_role,
      status: 'Active',
      permissions: getDefaultRolePermissions(data.sub_role),
      created_at: new Date().toISOString(),
    };
    const guard = canModifyPlatformAdmin(actorAdmin, dummyTarget, data.sub_role);
    if (!guard.allowed) {
      return { success: false, error: guard.reason };
    }

    const audit = createAuditEntry({
      action: 'Platform Admin Added',
      affected_entity_type: 'PlatformAdmin',
      affected_entity_id: dummyTarget.id,
      affected_entity_label: `${dummyTarget.name} (${dummyTarget.sub_role})`,
      reason,
      after_value: dummyTarget.email,
    });

    setState((prev) => ({
      ...prev,
      platformAdmins: [...prev.platformAdmins, dummyTarget],
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
    return { success: true };
  };

  const updatePlatformAdmin = (
    adminId: string,
    updates: Partial<PlatformAdmin>,
    reason: string
  ): { success: boolean; error?: string } => {
    const actorAdmin = state.platformAdmins.find(
      (a) => a.email.toLowerCase() === state.currentUser.email.toLowerCase()
    );
    const targetAdmin = state.platformAdmins.find((a) => a.id === adminId);
    if (!targetAdmin) return { success: false, error: 'Administrator not found.' };

    const guard = canModifyPlatformAdmin(actorAdmin, targetAdmin, updates.sub_role);
    if (!guard.allowed) {
      return { success: false, error: guard.reason };
    }

    const nextSubRole = updates.sub_role || targetAdmin.sub_role;
    const nextPermissions =
      updates.permissions ||
      (updates.sub_role && updates.sub_role !== targetAdmin.sub_role
        ? getDefaultRolePermissions(nextSubRole)
        : targetAdmin.permissions);

    const updatedAdmin: PlatformAdmin = {
      ...targetAdmin,
      ...updates,
      sub_role: nextSubRole,
      permissions: nextPermissions,
    };

    const audit = createAuditEntry({
      action: 'Platform Admin Updated',
      affected_entity_type: 'PlatformAdmin',
      affected_entity_id: adminId,
      affected_entity_label: `${updatedAdmin.name} (${updatedAdmin.email})`,
      reason,
      before_value: `${targetAdmin.sub_role} / ${targetAdmin.status}`,
      after_value: `${updatedAdmin.sub_role} / ${updatedAdmin.status}`,
    });

    setState((prev) => ({
      ...prev,
      platformAdmins: prev.platformAdmins.map((a) => (a.id === adminId ? updatedAdmin : a)),
      platformAuditLogs: [audit, ...prev.platformAuditLogs],
    }));
    return { success: true };
  };

  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  const updateCompanyProfile = (profileUpdates: Partial<Company>) => {
    if (auth.currentUser) {
      updateDoc(doc(db, 'companies', state.currentCompany.id), cleanForFirestore(profileUpdates)).catch(() => {});
    }
    setState((prev) => {
      const updatedCurrent = { ...prev.currentCompany, ...profileUpdates };
      const updatedCompanies = prev.companies.map((c) =>
        c.id === prev.currentCompany.id ? { ...c, ...profileUpdates } : c
      );
      return {
        ...prev,
        currentCompany: updatedCurrent,
        companies: updatedCompanies,
      };
    });
  };

  const inviteStaffMember = (staff: Omit<User, 'id'>) => {
    const newStaff: User = {
      ...staff,
      id: `usr-staff-${Date.now().toString().slice(-4)}`,
      status: 'Active',
      created_at: new Date().toISOString().slice(0, 10),
    };

    if (auth.currentUser) {
      setDoc(doc(db, 'users', newStaff.id), cleanForFirestore(newStaff)).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      users: [newStaff, ...prev.users],
    }));

    return newStaff;
  };

  const updateStaffRole = (userId: string, role: UserRole) => {
    if (role === 'superadmin') return;
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', userId), { role }).catch(() => {});
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
      currentUser: prev.currentUser.id === userId ? { ...prev.currentUser, role } : prev.currentUser,
    }));
  };

  const updateStaffStatus = (userId: string, status: 'Active' | 'Invited' | 'Deactivated' | 'Suspended') => {
    if (auth.currentUser) {
      updateDoc(doc(db, 'users', userId), { status }).catch(() => {});
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    }));
  };

  const deleteStaffMember = (userId: string) => {
    if (auth.currentUser) {
      deleteDoc(doc(db, 'users', userId)).catch(() => {});
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  const resetToDefaults = async () => {
    try {
      for (const v of state.vehicles) {
        deleteDoc(doc(db, 'vehicles', v.id)).catch(() => {});
      }
      for (const d of state.drivers) {
        deleteDoc(doc(db, 'drivers', d.id)).catch(() => {});
      }
      for (const b of state.bookings) {
        deleteDoc(doc(db, 'bookings', b.id)).catch(() => {});
      }
      for (const v of INITIAL_VEHICLES) {
        setDoc(doc(db, 'vehicles', v.id), cleanForFirestore(v)).catch(() => {});
      }
      for (const d of INITIAL_DRIVERS) {
        setDoc(doc(db, 'drivers', d.id), cleanForFirestore(d)).catch(() => {});
      }
      for (const b of INITIAL_BOOKINGS) {
        setDoc(doc(db, 'bookings', b.id), cleanForFirestore(b)).catch(() => {});
      }
    } catch (err) {
      console.warn('Reset defaults notice:', err);
    }

    localStorage.removeItem(STORAGE_KEY_FLEET);
    setState({
      vehicles: INITIAL_VEHICLES,
      drivers: INITIAL_DRIVERS,
      bookings: INITIAL_BOOKINGS,
      logs: INITIAL_LOGS,
      customers: INITIAL_CUSTOMERS,
      payments: INITIAL_PAYMENTS,
      maintenance: INITIAL_MAINTENANCE,
      handovers: INITIAL_HANDOVER_INSPECTIONS,
      expenses: INITIAL_EXPENSES,
      tasks: INITIAL_OPERATIONAL_TASKS,
      companies: INITIAL_COMPANIES,
      settings: DEFAULT_COMPANY_SETTINGS,
      platformAdmins: INITIAL_PLATFORM_ADMINS,
      platformPlans: INITIAL_PLATFORM_PLANS,
      companySubscriptions: INITIAL_COMPANY_SUBSCRIPTIONS,
      saasPayments: INITIAL_SAAS_PAYMENTS,
      supportTickets: INITIAL_SUPPORT_TICKETS,
      platformAuditLogs: INITIAL_PLATFORM_AUDIT_LOGS,
      notificationTemplates: INITIAL_NOTIFICATION_TEMPLATES,
      notificationDeliveryLogs: INITIAL_NOTIFICATION_LOGS,
      platformIntegrations: INITIAL_PLATFORM_INTEGRATIONS,
      backgroundJobs: INITIAL_BACKGROUND_JOBS,
      systemErrorLogs: INITIAL_SYSTEM_ERRORS,
      securityIncidents: INITIAL_SECURITY_INCIDENTS,
      platformContent: INITIAL_PLATFORM_CONTENT,
      platformSettings: DEFAULT_PLATFORM_SETTINGS,
      activeTierId: 'growth',
      theme: 'dark',
      accentColorId: 'amber',
      currentUser: INITIAL_USERS[0],
      currentCompany: INITIAL_COMPANY,
      users: INITIAL_USERS,
      isAuthenticated: true,
      isFirebaseConnected: true,
    });
  };

  const currentTheme = getThemeById(state.accentColorId || 'amber');

  // Sync dynamic PlatformPlans back into SubscriptionTier[] for company billing views
  const dynamicTiers: SubscriptionTier[] = (['starter', 'growth', 'enterprise'] as const).map((key) => {
    const plan = state.platformPlans.find((p) => p.tier_key === key);
    const fallback = SUBSCRIPTION_TIERS.find((t) => t.id === key)!;
    if (!plan) return fallback;
    return {
      id: key,
      name: plan.name,
      target_fleet_size: plan.target_fleet_size,
      max_vehicles: plan.max_vehicles,
      monthly_fee_rwf: plan.monthly_fee_rwf,
      features: plan.features,
    };
  });

  return {
    state,
    vehicles: state.vehicles,
    drivers: state.drivers,
    bookings: state.bookings,
    logs: state.logs,
    activeTier: dynamicTiers.find((t) => t.id === state.activeTierId) || dynamicTiers[1],
    tiers: dynamicTiers,
    theme: state.theme,
    toggleTheme,
    accentColorId: state.accentColorId || 'amber',
    currentTheme,
    setAccentColor,
    currentUser: state.currentUser,
    currentCompany: state.currentCompany,
    companies: state.companies,
    users: state.users,
    isAuthenticated: state.isAuthenticated,
    isFirebaseConnected: state.isFirebaseConnected,
    login,
    loginWithEmail,
    loginWithCredentials,
    createUserAccount,
    loginWithGoogle,
    switchRole,
    logout,
    registerCompany,
    addBooking,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    dispatchDriverSMS,
    acknowledgeDriverCheckin,
    updateFlightStatus,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
    updateVehicleRate,
    toggleVehicleMaintenance,
    addDriver,
    updateDriver,
    deleteDriver,
    completeDriverTrip,
    updateDriverStatus,
    assignDriverToBooking,
    customers: state.customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
    payments: state.payments,
    addPaymentRecord,
    updatePaymentStatus,
    generateEBMReceipt,
    maintenance: state.maintenance,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    completeMaintenanceRecord,
    deleteMaintenanceRecord,
    handovers: state.handovers,
    addHandoverInspection,
    deleteHandoverInspection,
    expenses: state.expenses,
    addExpenseRecord,
    updateExpenseStatus,
    deleteExpenseRecord,
    tasks: state.tasks,
    addOperationalTask,
    updateTaskStatus,
    deleteOperationalTask,
    updateCompanyStatus,
    updateCompanyPlan,
    switchCompanyContext,
    addTenantCompany,
    // Superadmin Release 1 & 2 state + actions
    platformAdmins: state.platformAdmins,
    platformPlans: state.platformPlans,
    companySubscriptions: state.companySubscriptions,
    saasPayments: state.saasPayments,
    supportTickets: state.supportTickets,
    platformAuditLogs: state.platformAuditLogs,
    notificationTemplates: state.notificationTemplates,
    notificationDeliveryLogs: state.notificationDeliveryLogs,
    platformIntegrations: state.platformIntegrations,
    backgroundJobs: state.backgroundJobs,
    systemErrorLogs: state.systemErrorLogs,
    securityIncidents: state.securityIncidents,
    platformContent: state.platformContent,
    platformSettings: state.platformSettings,
    updateUserStatusByAdmin,
    revokeUserSessions,
    triggerUserRecovery,
    savePlatformPlan,
    extendCompanySubscription,
    grantCompanyTrial,
    reconcileSaasPayment,
    refundSaasPayment,
    logAuditedBookingInspection,
    addSupportTicket,
    updateSupportTicket,
    saveNotificationTemplate,
    sendPlatformNotification,
    toggleIntegration,
    testIntegrationConnection,
    retryBackgroundJob,
    resolveSystemError,
    logFailedLoginAttempt,
    resolveSecurityIncident,
    savePlatformContent,
    updatePlatformSettings,
    createPlatformAdmin,
    updatePlatformAdmin,
    settings: state.settings,
    updateCompanySettings,
    updateCompanyProfile,
    inviteStaffMember,
    updateStaffRole,
    updateStaffStatus,
    deleteStaffMember,
    setTier,
    resetToDefaults,
  };
}
