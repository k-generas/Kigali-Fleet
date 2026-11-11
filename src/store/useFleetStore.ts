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
import { checkBookingCollision, generateDriverSMS } from '../utils/collision';
import { getThemeById, applyThemeCssVariables } from '../theme';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { isSuperAdminEmail, isSuperAdminUser, verifySuperAdminPassword } from '../utils/auth';

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
    let unsubscribeAuth: () => void = () => {};

    const initFirestoreSync = async () => {
      try {
        // 1. Vehicles Real-Time Listener
        const vehCol = collection(db, 'vehicles');
        unsubscribeVehicles = onSnapshot(
          vehCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              isInitialSeedingDone.current = true;
              console.log('Seeding initial vehicles to Firestore...');
              for (const v of INITIAL_VEHICLES) {
                await setDoc(doc(db, 'vehicles', v.id), cleanForFirestore(v));
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
        const drvCol = collection(db, 'drivers');
        unsubscribeDrivers = onSnapshot(
          drvCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              console.log('Seeding initial drivers to Firestore...');
              for (const d of INITIAL_DRIVERS) {
                await setDoc(doc(db, 'drivers', d.id), cleanForFirestore(d));
              }
            } else if (!snapshot.empty) {
              const liveDrivers: Driver[] = snapshot.docs.map((d) => d.data() as Driver);
              setState((prev) => ({
                ...prev,
                drivers: liveDrivers,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore drivers listener notice:', error.message);
          }
        );

        // 3. Bookings Real-Time Listener
        const bkCol = collection(db, 'bookings');
        unsubscribeBookings = onSnapshot(
          bkCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              console.log('Seeding initial bookings to Firestore...');
              for (const b of INITIAL_BOOKINGS) {
                await setDoc(doc(db, 'bookings', b.id), cleanForFirestore(b));
              }
            } else if (!snapshot.empty) {
              const liveBookings: Booking[] = snapshot.docs.map((d) => d.data() as Booking);
              setState((prev) => ({
                ...prev,
                bookings: liveBookings,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore bookings listener notice:', error.message);
          }
        );

        // 4. Activity Logs Real-Time Listener
        const logsCol = collection(db, 'activity_logs');
        unsubscribeLogs = onSnapshot(
          logsCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              console.log('Seeding initial activity logs to Firestore...');
              for (const l of INITIAL_LOGS) {
                await setDoc(doc(db, 'activity_logs', l.id), cleanForFirestore(l));
              }
            } else if (!snapshot.empty) {
              const liveLogs: ActivityLog[] = snapshot.docs.map((d) => d.data() as ActivityLog);
              setState((prev) => ({
                ...prev,
                logs: liveLogs,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore logs listener notice:', error.message);
          }
        );

        // 5. Customers Real-Time Listener
        const custCol = collection(db, 'customers');
        unsubscribeCustomers = onSnapshot(
          custCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              console.log('Seeding initial customers to Firestore...');
              for (const c of INITIAL_CUSTOMERS) {
                await setDoc(doc(db, 'customers', c.id), cleanForFirestore(c));
              }
            } else if (!snapshot.empty) {
              const liveCustomers: Customer[] = snapshot.docs.map((d) => d.data() as Customer);
              setState((prev) => ({
                ...prev,
                customers: liveCustomers,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore customers listener notice:', error.message);
          }
        );

        // 6. Payments Real-Time Listener
        const payCol = collection(db, 'payments');
        unsubscribePayments = onSnapshot(
          payCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              console.log('Seeding initial payments to Firestore...');
              for (const p of INITIAL_PAYMENTS) {
                await setDoc(doc(db, 'payments', p.id), cleanForFirestore(p));
              }
            } else if (!snapshot.empty) {
              const livePayments: PaymentRecord[] = snapshot.docs.map((d) => d.data() as PaymentRecord);
              setState((prev) => ({
                ...prev,
                payments: livePayments,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore payments listener notice:', error.message);
          }
        );

        // 7. Maintenance Work Orders Real-Time Listener
        const maintCol = collection(db, 'maintenance');
        unsubscribeMaintenance = onSnapshot(
          maintCol,
          async (snapshot) => {
            if (snapshot.empty && !isInitialSeedingDone.current) {
              console.log('Seeding initial maintenance records to Firestore...');
              for (const m of INITIAL_MAINTENANCE) {
                await setDoc(doc(db, 'maintenance', m.id), cleanForFirestore(m));
              }
            } else if (!snapshot.empty) {
              const liveMaintenance: MaintenanceRecord[] = snapshot.docs.map((d) => d.data() as MaintenanceRecord);
              setState((prev) => ({
                ...prev,
                maintenance: liveMaintenance,
                isFirebaseConnected: true,
              }));
            }
          },
          (error) => {
            console.warn('Firestore maintenance listener notice:', error.message);
          }
        );

        // 8. Auth State Changed Listener
        unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            setState((prev) => ({
              ...prev,
              isAuthenticated: true,
              currentUser: {
                ...prev.currentUser,
                name: fbUser.displayName || prev.currentUser.name,
                email: fbUser.email || prev.currentUser.email,
                avatar_url: fbUser.photoURL || prev.currentUser.avatar_url,
              },
            }));
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
      unsubscribeAuth();
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

    const bookingUpdates: Partial<Booking> = {
      ...(isPickup
        ? { handover_pickup_id: id, status: 'In Progress' as BookingStatus }
        : { handover_return_id: id, status: 'Completed' as BookingStatus }),
    };

    try {
      setDoc(doc(db, 'handovers', id), cleanForFirestore(newInspection)).catch(() => {});
      updateDoc(doc(db, 'vehicles', inspection.vehicle_id), cleanForFirestore(vehicleUpdates)).catch(() => {});
      if (inspection.booking_id) {
        updateDoc(doc(db, 'bookings', inspection.booking_id), cleanForFirestore(bookingUpdates)).catch(() => {});
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
        } else if (isSuper && matchedUser.role !== 'superadmin') {
          matchedUser = { ...matchedUser, role: 'superadmin' };
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

  const updateCompanyStatus = (companyId: string, status: CompanyStatus) => {
    setState((prev) => {
      const updatedCompanies = prev.companies.map((c) => (c.id === companyId ? { ...c, status } : c));
      const updatedCurrentCompany =
        prev.currentCompany.id === companyId ? { ...prev.currentCompany, status } : prev.currentCompany;
      return {
        ...prev,
        companies: updatedCompanies,
        currentCompany: updatedCurrentCompany,
      };
    });
  };

  const updateCompanyPlan = (companyId: string, tierId: 'starter' | 'growth' | 'enterprise') => {
    const fee = tierId === 'enterprise' ? 150000 : tierId === 'growth' ? 75000 : 35000;
    setState((prev) => {
      const updatedCompanies = prev.companies.map((c) =>
        c.id === companyId ? { ...c, tier_id: tierId, monthly_fee_rwf: fee } : c
      );
      const updatedCurrentCompany =
        prev.currentCompany.id === companyId
          ? { ...prev.currentCompany, tier_id: tierId, monthly_fee_rwf: fee }
          : prev.currentCompany;
      return {
        ...prev,
        companies: updatedCompanies,
        currentCompany: updatedCurrentCompany,
        activeTierId: prev.currentCompany.id === companyId ? tierId : prev.activeTierId,
      };
    });
  };

  const switchCompanyContext = (companyId: string) => {
    const target = state.companies.find((c) => c.id === companyId);
    if (!target) return;
    setState((prev) => ({
      ...prev,
      currentCompany: target,
      activeTierId: target.tier_id,
    }));
  };

  const addTenantCompany = (
    companyData: Omit<Company, 'id' | 'created_at'>,
    ownerName: string,
    ownerEmail: string,
    ownerPhone: string
  ) => {
    const slug = companyData.slug || companyData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `comp-${slug}`;
    const monthlyFee =
      companyData.tier_id === 'enterprise' ? 150000 : companyData.tier_id === 'growth' ? 75000 : 35000;

    const newCompany: Company = {
      ...companyData,
      id,
      slug,
      status: companyData.status || 'Active',
      monthly_fee_rwf: monthlyFee,
      owner_name: ownerName,
      created_at: new Date().toISOString(),
    };

    const newOwner: User = {
      id: `usr-owner-${Date.now().toString().slice(-4)}`,
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      role: 'owner',
      company_id: id,
    };

    setState((prev) => ({
      ...prev,
      companies: [newCompany, ...prev.companies],
      users: [newOwner, ...prev.users],
    }));

    return newCompany;
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

    setState((prev) => ({
      ...prev,
      users: [newStaff, ...prev.users],
    }));

    return newStaff;
  };

  const updateStaffRole = (userId: string, role: UserRole) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
      currentUser: prev.currentUser.id === userId ? { ...prev.currentUser, role } : prev.currentUser,
    }));
  };

  const updateStaffStatus = (userId: string, status: 'Active' | 'Invited' | 'Deactivated') => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    }));
  };

  const deleteStaffMember = (userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  const resetToDefaults = async () => {
    try {
      // Clean Firestore
      for (const v of state.vehicles) {
        deleteDoc(doc(db, 'vehicles', v.id)).catch(() => {});
      }
      for (const d of state.drivers) {
        deleteDoc(doc(db, 'drivers', d.id)).catch(() => {});
      }
      for (const b of state.bookings) {
        deleteDoc(doc(db, 'bookings', b.id)).catch(() => {});
      }

      // Re-seed defaults
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

  return {
    state,
    vehicles: state.vehicles,
    drivers: state.drivers,
    bookings: state.bookings,
    logs: state.logs,
    activeTier: SUBSCRIPTION_TIERS.find((t) => t.id === state.activeTierId) || SUBSCRIPTION_TIERS[1],
    tiers: SUBSCRIPTION_TIERS,
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
