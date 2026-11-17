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
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  canModifyPlatformAdmin,
  getDefaultRolePermissions,
  isSuperAdminEmail,
} from '../utils/auth';
import {
  CATEGORY_DEFAULT_IMAGES,
  getVehicleGalleryImages,
  normalizeVehicleGallery,
} from '../utils/vehicleImages';
import {
  AppCurrency,
  AppLanguage,
  setGlobalCurrency,
  setGlobalLanguage,
} from '../utils/i18n';

const STORAGE_KEY_PREFS = 'kigalifleet_prefs_v4';
const LEGACY_STORAGE_KEY = 'kigalifleet_state_v3';

function formatFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled on this Firebase project yet. Please use "Continue with Google" or try the Free Demo Sandbox.';
  }
  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Incorrect email or password. Please check your details or use Google Sign-In.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please switch to Sign in.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in popup was closed before completing.';
  }
  return err?.message || 'Sign-in could not be completed. Please try again.';
}

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
  currency: AppCurrency;
  language: AppLanguage;
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
  isDemoMode: boolean;
  isFirebaseConnected: boolean;
}

interface LightweightPrefs {
  theme: 'dark' | 'light';
  accentColorId: string;
  currency: AppCurrency;
  language: AppLanguage;
  activeTierId: 'starter' | 'growth' | 'enterprise';
}

function loadPrefs(): LightweightPrefs {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          theme: parsed.theme === 'light' ? 'light' : 'dark',
          accentColorId: parsed.accentColorId || 'lake-kivu',
          currency: parsed.currency === 'USD' ? 'USD' : 'RWF',
          language: parsed.language === 'RW' || parsed.language === 'FR' ? parsed.language : 'EN',
          activeTierId:
            parsed.activeTierId === 'starter' || parsed.activeTierId === 'enterprise'
              ? parsed.activeTierId
              : 'growth',
        };
      }
    }
  } catch (err) {
    console.warn('Prefs load notice:', err);
  }
  return {
    theme: 'dark',
    accentColorId: 'lake-kivu',
    currency: 'RWF',
    language: 'EN',
    activeTierId: 'growth',
  };
}

function buildDemoState(prefs: LightweightPrefs): StoredState {
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
    activeTierId: prefs.activeTierId,
    theme: prefs.theme,
    accentColorId: prefs.accentColorId,
    currency: prefs.currency,
    language: prefs.language,
    currentUser: INITIAL_USERS[0],
    currentCompany: INITIAL_COMPANY,
    companies: INITIAL_COMPANIES,
    users: INITIAL_USERS,
    isAuthenticated: false,
    isDemoMode: true,
    isFirebaseConnected: false,
  };
}

function loadInitialState(): StoredState {
  const prefs = loadPrefs();
  return buildDemoState(prefs);
}

export function useFleetStore() {
  const [state, setState] = useState<StoredState>(() => {
    const initial = loadInitialState();
    setGlobalCurrency(initial.currency);
    setGlobalLanguage(initial.language);
    return initial;
  });
  const pendingRegistrationRef = useRef<{ company: Company; owner: User } | null>(null);

  // Sync currency and language globally + update <html lang>
  useEffect(() => {
    setGlobalCurrency(state.currency);
    setGlobalLanguage(state.language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang =
        state.language === 'RW' ? 'rw' : state.language === 'FR' ? 'fr' : 'en';
    }
  }, [state.currency, state.language]);

  // Persist ONLY lightweight UI preferences (never fleet/user PII blobs or photos)
  useEffect(() => {
    try {
      const prefs: LightweightPrefs = {
        theme: state.theme,
        accentColorId: state.accentColorId,
        currency: state.currency,
        language: state.language,
        activeTierId: state.activeTierId,
      };
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Prefs save failed:', e);
    }
  }, [state.theme, state.accentColorId, state.currency, state.language, state.activeTierId]);

  // Apply dark theme to html root and dynamic CSS custom properties for accent color
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const themeObj = getThemeById(state.accentColorId || 'lake-kivu');
    applyThemeCssVariables(themeObj, state.theme);
  }, [state.theme, state.accentColorId]);

  // Bounded Tenant-Scoped Firestore Listeners & Shared Public Storefront Resolution
  useEffect(() => {
    let unsubscribePlans: () => void = () => {};
    let unsubscribeAuth: () => void = () => {};
    const activeListeners: Array<() => void> = [];

    const clearActiveListeners = () => {
      while (activeListeners.length) {
        const unsub = activeListeners.pop();
        try {
          unsub?.();
        } catch {
          // ignore
        }
      }
    };

    const hydrateVehicles = (docs: any[]): Vehicle[] =>
      docs.map((d) => {
        const raw = d.data() as Vehicle;
        const gallery = getVehicleGalleryImages({
          category: raw.category,
          image_url: raw.image_url?.trim(),
          gallery_urls: raw.gallery_urls && raw.gallery_urls.length > 0 ? raw.gallery_urls : undefined,
        });
        return {
          ...raw,
          image_url: gallery[0],
          gallery_urls: gallery,
        };
      });

    // Public pricing plans listener (bounded)
    unsubscribePlans = onSnapshot(
      query(collection(db, 'platform_plans'), where('is_active', '==', true), limit(10)),
      (snapshot) => {
        if (!snapshot.empty) {
          setState((prev) => ({
            ...prev,
            platformPlans: snapshot.docs.map((d) => d.data() as PlatformPlan),
            isFirebaseConnected: true,
          }));
        }
      },
      (err) => console.warn('platform_plans listener notice:', err.message)
    );

    const attachSharedPublicStorefront = async (companyParam: string) => {
      try {
        let targetCompany: Company | null = null;
        const byId = await getDoc(doc(db, 'companies', companyParam));
        if (byId.exists()) {
          targetCompany = byId.data() as Company;
        } else {
          const bySlug = await getDocs(
            query(collection(db, 'companies'), where('slug', '==', companyParam), limit(1))
          );
          if (!bySlug.empty) {
            targetCompany = bySlug.docs[0].data() as Company;
          }
        }

        if (!targetCompany) return;

        setState((prev) => ({
          ...prev,
          currentCompany: targetCompany!,
          vehicles: [],
          drivers: [],
          bookings: [],
          isFirebaseConnected: true,
        }));

        activeListeners.push(
          onSnapshot(
            query(collection(db, 'vehicles'), where('company_id', '==', targetCompany.id), limit(60)),
            (snapshot) => {
              setState((prev) => ({
                ...prev,
                vehicles: hydrateVehicles(snapshot.docs),
                isFirebaseConnected: true,
              }));
            },
            (err) => console.warn('Storefront vehicles listener notice:', err.message)
          ),
          onSnapshot(
            query(collection(db, 'drivers'), where('company_id', '==', targetCompany.id), limit(60)),
            (snapshot) => {
              setState((prev) => ({
                ...prev,
                drivers: snapshot.docs.map((d) => d.data() as Driver),
                isFirebaseConnected: true,
              }));
            },
            (err) => console.warn('Storefront drivers listener notice:', err.message)
          )
        );
      } catch (err) {
        console.warn('Shared storefront load notice:', err);
      }
    };

    const attachSuperAdminListeners = () => {
      activeListeners.push(
        onSnapshot(
          query(collection(db, 'companies'), limit(200)),
          (s) =>
            setState((prev) => ({
              ...prev,
              companies: s.docs.map((d) => d.data() as Company),
              isFirebaseConnected: true,
            })),
          (err) => console.warn('superadmin companies listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'vehicles'), limit(200)),
          (s) => setState((prev) => ({ ...prev, vehicles: hydrateVehicles(s.docs) })),
          (err) => console.warn('superadmin vehicles listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'drivers'), limit(200)),
          (s) => setState((prev) => ({ ...prev, drivers: s.docs.map((d) => d.data() as Driver) })),
          (err) => console.warn('superadmin drivers listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'bookings'), limit(200)),
          (s) => setState((prev) => ({ ...prev, bookings: s.docs.map((d) => d.data() as Booking) })),
          (err) => console.warn('superadmin bookings listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'users'), limit(200)),
          (s) => setState((prev) => ({ ...prev, users: s.docs.map((d) => d.data() as User) })),
          (err) => console.warn('superadmin users listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'customers'), limit(200)),
          (s) => setState((prev) => ({ ...prev, customers: s.docs.map((d) => d.data() as Customer) })),
          (err) => console.warn('superadmin customers listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'payments'), limit(200)),
          (s) => setState((prev) => ({ ...prev, payments: s.docs.map((d) => d.data() as PaymentRecord) })),
          (err) => console.warn('superadmin payments listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'maintenance'), limit(200)),
          (s) => setState((prev) => ({ ...prev, maintenance: s.docs.map((d) => d.data() as MaintenanceRecord) })),
          (err) => console.warn('superadmin maintenance listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'expenses'), limit(200)),
          (s) => setState((prev) => ({ ...prev, expenses: s.docs.map((d) => d.data() as ExpenseRecord) })),
          (err) => console.warn('superadmin expenses listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'handovers'), limit(200)),
          (s) => setState((prev) => ({ ...prev, handovers: s.docs.map((d) => d.data() as VehicleHandoverInspection) })),
          (err) => console.warn('superadmin handovers listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'tasks'), limit(200)),
          (s) => setState((prev) => ({ ...prev, tasks: s.docs.map((d) => d.data() as OperationalTask) })),
          (err) => console.warn('superadmin tasks listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'activity_logs'), limit(150)),
          (s) => setState((prev) => ({ ...prev, logs: s.docs.map((d) => d.data() as ActivityLog) })),
          (err) => console.warn('superadmin activity_logs listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'support_tickets'), limit(200)),
          (s) => setState((prev) => ({ ...prev, supportTickets: s.docs.map((d) => d.data() as SupportTicket) })),
          (err) => console.warn('superadmin support_tickets listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'platform_audit_logs'), limit(200)),
          (s) => {
            const liveAudit = s.docs
              .map((d) => d.data() as PlatformAuditLog)
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            setState((prev) => ({ ...prev, platformAuditLogs: liveAudit }));
          },
          (err) => console.warn('superadmin platform_audit_logs listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'saas_payments'), limit(200)),
          (s) => setState((prev) => ({ ...prev, saasPayments: s.docs.map((d) => d.data() as SaasPaymentRecord) })),
          (err) => console.warn('superadmin saas_payments listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'company_subscriptions'), limit(200)),
          (s) =>
            setState((prev) => ({
              ...prev,
              companySubscriptions: s.docs.map((d) => d.data() as CompanySubscription),
            })),
          (err) => console.warn('superadmin company_subscriptions listener notice:', err.message)
        )
      );
    };

    const attachTenantListeners = (fbUid: string, userEmail: string, activeCompanyId: string) => {
      activeListeners.push(
        onSnapshot(
          doc(db, 'users', fbUid),
          (snap) => {
            if (snap.exists()) {
              const u = snap.data() as User;
              setState((prev) => ({
                ...prev,
                currentUser: u,
                users: prev.users.some((item) => item.id === u.id)
                  ? prev.users.map((item) => (item.id === u.id ? u : item))
                  : [u, ...prev.users],
              }));
            }
          },
          (err) => console.warn('user doc listener notice:', err.message)
        ),
        onSnapshot(
          doc(db, 'companies', activeCompanyId),
          (snap) => {
            if (snap.exists()) {
              const comp = snap.data() as Company;
              setState((prev) => ({
                ...prev,
                currentCompany: comp,
                activeTierId: comp.tier_id || prev.activeTierId,
                companies: [comp],
                isFirebaseConnected: true,
              }));
            }
          },
          (err) => console.warn('company doc listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'vehicles'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              vehicles: hydrateVehicles(s.docs),
              isFirebaseConnected: true,
            })),
          (err) => console.warn('tenant vehicles listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'drivers'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              drivers: s.docs.map((d) => d.data() as Driver),
            })),
          (err) => console.warn('tenant drivers listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'bookings'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              bookings: s.docs.map((d) => d.data() as Booking),
            })),
          (err) => console.warn('tenant bookings listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'customers'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              customers: s.docs.map((d) => d.data() as Customer),
            })),
          (err) => console.warn('tenant customers listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'payments'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              payments: s.docs.map((d) => d.data() as PaymentRecord),
            })),
          (err) => console.warn('tenant payments listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'maintenance'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              maintenance: s.docs.map((d) => d.data() as MaintenanceRecord),
            })),
          (err) => console.warn('tenant maintenance listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'expenses'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              expenses: s.docs.map((d) => d.data() as ExpenseRecord),
            })),
          (err) => console.warn('tenant expenses listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'handovers'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              handovers: s.docs.map((d) => d.data() as VehicleHandoverInspection),
            })),
          (err) => console.warn('tenant handovers listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'tasks'), where('company_id', '==', activeCompanyId), limit(150)),
          (s) =>
            setState((prev) => ({
              ...prev,
              tasks: s.docs.map((d) => d.data() as OperationalTask),
            })),
          (err) => console.warn('tenant tasks listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'activity_logs'), where('company_id', '==', activeCompanyId), limit(100)),
          (s) =>
            setState((prev) => ({
              ...prev,
              logs: s.docs.map((d) => d.data() as ActivityLog),
            })),
          (err) => console.warn('tenant activity_logs listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'company_subscriptions'), where('company_id', '==', activeCompanyId), limit(20)),
          (s) =>
            setState((prev) => ({
              ...prev,
              companySubscriptions: s.docs.map((d) => d.data() as CompanySubscription),
            })),
          (err) => console.warn('tenant company_subscriptions listener notice:', err.message)
        ),
        onSnapshot(
          query(collection(db, 'support_tickets'), where('customer_email', '==', userEmail), limit(50)),
          (s) =>
            setState((prev) => ({
              ...prev,
              supportTickets: s.docs.map((d) => d.data() as SupportTicket),
            })),
          (err) => console.warn('tenant support_tickets listener notice:', err.message)
        )
      );
    };

    unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      clearActiveListeners();

      if (!fbUser) {
        const companyParam =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('company')?.trim()
            : '';

        if (
          companyParam &&
          companyParam !== INITIAL_COMPANY.id &&
          companyParam !== INITIAL_COMPANY.slug &&
          companyParam !== 'kigali-safari-express'
        ) {
          await attachSharedPublicStorefront(companyParam);
        } else {
          setState((prev) => ({
            ...buildDemoState({
              theme: prev.theme,
              accentColorId: prev.accentColorId,
              currency: prev.currency,
              language: prev.language,
              activeTierId: prev.activeTierId,
            }),
            platformPlans: prev.platformPlans,
            isFirebaseConnected: prev.isFirebaseConnected,
          }));
        }
        return;
      }

      const email = (fbUser.email || '').trim().toLowerCase();
      const isSuper = isSuperAdminEmail(email);

      try {
        let userDocData: User | null = null;
        let companyDocData: Company | null = null;

        if (pendingRegistrationRef.current && pendingRegistrationRef.current.owner.id === fbUser.uid) {
          companyDocData = pendingRegistrationRef.current.company;
          userDocData = pendingRegistrationRef.current.owner;
          pendingRegistrationRef.current = null;
        } else {
          const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userSnap.exists()) {
            userDocData = userSnap.data() as User;
          }
        }

        if (!userDocData) {
          if (isSuper) {
            userDocData = {
              id: fbUser.uid,
              name: fbUser.displayName || (email.includes('9') ? 'Generas Kagiraneza (Secondary)' : 'Generas Kagiraneza'),
              email: fbUser.email || email,
              phone: fbUser.phoneNumber || '+250 788 100 200',
              role: 'superadmin',
              company_id: 'platform-root',
              avatar_url: fbUser.photoURL || undefined,
              status: 'Active',
              created_at: new Date().toISOString().slice(0, 10),
            };
            await setDoc(doc(db, 'users', fbUser.uid), cleanForFirestore(userDocData)).catch(() => {});
          } else {
            const isolatedCompanyId = `comp-${fbUser.uid.slice(0, 8)}`;
            const baseName = fbUser.displayName || email.split('@')[0] || 'My Fleet';
            companyDocData = {
              id: isolatedCompanyId,
              name: `${baseName} Fleet`,
              slug: `fleet-${fbUser.uid.slice(0, 6).toLowerCase()}`,
              business_type: 'Car Rental',
              tin_number: '100000000',
              phone: fbUser.phoneNumber || '+250 788 000 000',
              email: fbUser.email || email,
              city: 'Kigali',
              country: 'Rwanda',
              currency: 'RWF',
              tier_id: 'starter',
              status: 'Trial',
              owner_name: baseName,
              created_at: new Date().toISOString(),
            };
            userDocData = {
              id: fbUser.uid,
              name: baseName,
              email: fbUser.email || email,
              phone: fbUser.phoneNumber || '+250 788 000 000',
              role: 'owner',
              company_id: isolatedCompanyId,
              avatar_url: fbUser.photoURL || undefined,
              status: 'Active',
              created_at: new Date().toISOString().slice(0, 10),
            };
            await setDoc(doc(db, 'companies', isolatedCompanyId), cleanForFirestore(companyDocData)).catch(() => {});
            await setDoc(doc(db, 'users', fbUser.uid), cleanForFirestore(userDocData)).catch(() => {});
          }
        } else if (isSuper && userDocData.role !== 'superadmin') {
          userDocData = { ...userDocData, role: 'superadmin', company_id: 'platform-root' };
          await setDoc(doc(db, 'users', fbUser.uid), cleanForFirestore(userDocData), { merge: true }).catch(() => {});
        }

        if (!isSuper && !companyDocData && userDocData.company_id) {
          const compSnap = await getDoc(doc(db, 'companies', userDocData.company_id));
          if (compSnap.exists()) {
            companyDocData = compSnap.data() as Company;
          }
        }

        if (isSuper) {
          setState((prev) => ({
            ...prev,
            isDemoMode: false,
            isAuthenticated: true,
            isFirebaseConnected: true,
            currentUser: userDocData!,
          }));
          attachSuperAdminListeners();
        } else {
          const activeCompanyId = userDocData.company_id;
          const resolvedCompany: Company = companyDocData || {
            id: activeCompanyId,
            name: `${userDocData.name} Fleet`,
            slug: activeCompanyId,
            business_type: 'Car Rental',
            tin_number: '100000000',
            phone: userDocData.phone,
            email: userDocData.email,
            city: 'Kigali',
            country: 'Rwanda',
            currency: 'RWF',
            tier_id: 'starter',
            status: 'Trial',
            owner_name: userDocData.name,
            created_at: new Date().toISOString(),
          };

          setState((prev) => ({
            ...prev,
            isDemoMode: false,
            isAuthenticated: true,
            isFirebaseConnected: true,
            currentUser: userDocData!,
            currentCompany: resolvedCompany,
            activeTierId: resolvedCompany.tier_id || 'starter',
            companies: [resolvedCompany],
            users: [userDocData!],
            vehicles: [],
            drivers: [],
            bookings: [],
            logs: [],
            customers: [],
            payments: [],
            maintenance: [],
            handovers: [],
            expenses: [],
            tasks: [],
            supportTickets: [],
            companySubscriptions: [],
          }));
          attachTenantListeners(fbUser.uid, fbUser.email || email, activeCompanyId);
        }
      } catch (err) {
        console.warn('Auth profile hydration notice:', err);
      }
    });

    return () => {
      unsubscribePlans();
      unsubscribeAuth();
      clearActiveListeners();
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

  const setCurrency = (currency: AppCurrency) => {
    setGlobalCurrency(currency);
    setState((prev) => ({
      ...prev,
      currency,
    }));
  };

  const setLanguage = (language: AppLanguage) => {
    setGlobalLanguage(language);
    setState((prev) => ({
      ...prev,
      language,
    }));
  };

  const isLiveSyncEnabled = () => !state.isDemoMode && Boolean(auth.currentUser);
  const isLiveStorefrontSync = () =>
    isLiveSyncEnabled() || state.currentCompany.id !== INITIAL_COMPANY.id;

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

    const companyId = newBooking.company_id || state.currentCompany.id;
    const createdBooking: Booking = {
      ...newBooking,
      company_id: companyId,
      id: `bk-${Date.now().toString().slice(-6)}`,
      dispatch_status: 'Not Sent',
      created_at: new Date().toISOString(),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Booking Created',
      details: `${createdBooking.client_name} reserved vehicle (${createdBooking.destination}) from ${createdBooking.start_date} to ${createdBooking.end_date}.`,
      category: 'booking',
    };

    const today = new Date().toISOString().split('T')[0];
    const isStartingToday = createdBooking.start_date <= today && createdBooking.end_date >= today;

    // Async write to Firestore when Live Mode or shared live company storefront
    if (isLiveStorefrontSync()) {
      try {
        setDoc(doc(db, 'bookings', createdBooking.id), cleanForFirestore(createdBooking)).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `bookings/${createdBooking.id}`)
        );
        if (isLiveSyncEnabled()) {
          setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch((err) =>
            handleFirestoreError(err, OperationType.CREATE, `activity_logs/${newLog.id}`)
          );
          if (isStartingToday) {
            updateDoc(doc(db, 'vehicles', createdBooking.vehicle_id), { status: 'Booked' }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Firestore write notice:', err);
      }
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
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'bookings', id), { status }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`)
        );
      } catch (err) {
        console.warn('Firestore updateBookingStatus notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    }));
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'bookings', id), cleanForFirestore(updates)).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`)
        );
      } catch (err) {
        console.warn('Firestore updateBooking notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const deleteBooking = (id: string) => {
    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'bookings', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`)
        );
      } catch (err) {
        console.warn('Firestore deleteBooking notice:', err);
      }
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

    const companyId = booking.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `SMS Dispatched (${language === 'RW' ? 'Kinyarwanda' : 'English'})`,
      details: `Dispatched to ${driver.name} (${driver.phone}) for booking #${booking.id}.`,
      category: 'dispatch',
    };

    // Firestore writes
    if (isLiveSyncEnabled()) {
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

    const companyId = booking.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: actionDescription,
      details: `${driver?.name || 'Chauffeur'} confirmed: "${actionDescription}" for Booking #${booking.id} (${booking.client_name}).`,
      category: 'driver',
    };

    // Firestore writes
    if (isLiveSyncEnabled()) {
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

    const companyId = booking?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: flightStatus === 'Delayed' ? 'Flight Delay Alert Dispatched' : 'Flight Status Updated',
      details: logMessage,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'bookings', bookingId), {
          flight_status: flightStatus,
          flight_delay_minutes: flightStatus === 'Delayed' ? delayMinutes : 0,
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`));
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore flight update notice:', err);
      }
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
    const normalizedGallery = normalizeVehicleGallery(
      getVehicleGalleryImages(vehicle),
      vehicle.category
    );
    const cleanedDescription = vehicle.description?.trim().slice(0, 1000) || undefined;
    const cleanedFeatures = vehicle.features?.length
      ? vehicle.features.map((f) => f.trim().slice(0, 80)).filter(Boolean).slice(0, 12)
      : undefined;

    const companyId = vehicle.company_id || state.currentCompany.id;
    const newVehicle: Vehicle = {
      ...vehicle,
      company_id: companyId,
      id: `veh-${Date.now().toString().slice(-5)}`,
      image_url: normalizedGallery.image_url,
      gallery_urls: normalizedGallery.gallery_urls,
      description: cleanedDescription,
      features: cleanedFeatures,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Vehicle Registered',
      details: `Registered ${newVehicle.model_name} (${newVehicle.plate_number}) at ${newVehicle.daily_rate_rwf.toLocaleString()} RWF/day.`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      try {
        setDoc(doc(db, 'vehicles', newVehicle.id), cleanForFirestore(newVehicle)).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `vehicles/${newVehicle.id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore addVehicle notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle],
      logs: [newLog, ...prev.logs],
    }));
  };

  const updateVehicle = (id: string, rawUpdates: Partial<Vehicle>) => {
    const target = state.vehicles.find((v) => v.id === id);
    const effectiveCategory = rawUpdates.category || target?.category || 'LandCruiser';

    const updates: Partial<Vehicle> = { ...rawUpdates };

    if (rawUpdates.gallery_urls !== undefined || rawUpdates.image_url !== undefined) {
      const candidateUrls =
        rawUpdates.gallery_urls !== undefined
          ? rawUpdates.gallery_urls
          : [
              rawUpdates.image_url || CATEGORY_DEFAULT_IMAGES[effectiveCategory],
              ...(target?.gallery_urls || []).slice(1),
            ];
      const normalizedGallery = normalizeVehicleGallery(candidateUrls, effectiveCategory);
      updates.image_url = normalizedGallery.image_url;
      updates.gallery_urls = normalizedGallery.gallery_urls;
    }

    if (rawUpdates.description !== undefined) {
      updates.description = rawUpdates.description.trim().slice(0, 1000);
    }

    if (rawUpdates.features !== undefined) {
      updates.features = rawUpdates.features
        .map((f) => f.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 12);
    }

    const companyId = target?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Vehicle Specs Updated',
      details: `Updated fleet records for ${updates.model_name || target?.model_name || 'Vehicle'} (${updates.plate_number || target?.plate_number || id}).`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'vehicles', id), cleanForFirestore(updates)).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore updateVehicle notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteVehicle = (id: string) => {
    const target = state.vehicles.find((v) => v.id === id);
    const companyId = target?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Vehicle Archived',
      details: `Archived/removed ${target?.model_name || 'Vehicle'} (${target?.plate_number || id}) from active fleet.`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'vehicles', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteVehicle notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
      logs: [newLog, ...prev.logs],
    }));
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'vehicles', id), { status }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
        );
      } catch (err) {
        console.warn('Firestore updateVehicleStatus notice:', err);
      }
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
    const companyId = target?.company_id || state.currentCompany.id;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Rate Adjusted',
      details: `Adjusted daily rate for ${target?.model_name || 'Vehicle'} from ${oldRate.toLocaleString()} RWF to ${rate.toLocaleString()} RWF.`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'vehicles', id), { daily_rate_rwf: rate }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore updateVehicleRate notice:', err);
      }
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
    const companyId = target?.company_id || state.currentCompany.id;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: isCurrentlyMaintenance ? 'Vehicle Cleared from Service' : 'Vehicle Sent to Maintenance',
      details: `${target?.model_name} (${target?.plate_number}) ${isCurrentlyMaintenance ? 'cleared for customer rental' : `grounded for workshop service${notes ? ` (${notes})` : ''}`}.`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'vehicles', id), { status: newStatus }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore toggleVehicleMaintenance notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((v) => (v.id === id ? { ...v, status: newStatus } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const addDriver = (driver: Omit<Driver, 'id' | 'trips_completed' | 'rating'>) => {
    const companyId = driver.company_id || state.currentCompany.id;
    const newDriver: Driver = {
      ...driver,
      company_id: companyId,
      id: `drv-${Date.now().toString().slice(-5)}`,
      trips_completed: 0,
      rating: 5.0,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Onboarded',
      details: `Onboarded ${newDriver.name} (${newDriver.language}).`,
      category: 'driver',
    };

    if (isLiveSyncEnabled()) {
      try {
        setDoc(doc(db, 'drivers', newDriver.id), cleanForFirestore(newDriver)).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `drivers/${newDriver.id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore addDriver notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      drivers: [...prev.drivers, newDriver],
      logs: [newLog, ...prev.logs],
    }));
  };

  const updateDriverStatus = (id: string, status: DriverStatus) => {
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'drivers', id), { status }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `drivers/${id}`)
        );
      } catch (err) {
        console.warn('Firestore updateDriverStatus notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    const target = state.drivers.find((d) => d.id === id);
    const companyId = target?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Profile Updated',
      details: `Updated chauffeur record for ${target?.name || 'Driver'}.`,
      category: 'driver',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'drivers', id), cleanForFirestore(updates)).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `drivers/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore updateDriver notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteDriver = (id: string) => {
    const target = state.drivers.find((d) => d.id === id);
    const companyId = target?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Deactivated',
      details: `Deactivated chauffeur ${target?.name || 'Driver'} from active roster.`,
      category: 'driver',
    };

    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'drivers', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `drivers/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteDriver notice:', err);
      }
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

    const companyId = booking.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Trip Completed',
      details: `Booking #${booking.id} (${booking.client_name} - ${booking.destination}) marked completed. Vehicle & chauffeur released to Available.`,
      category: 'driver',
    };

    if (isLiveSyncEnabled()) {
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

    const companyId = booking.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Driver Assigned',
      details: `Linked ${driver.name} to booking #${booking.id} (${booking.client_name}).`,
      category: 'driver',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'bookings', bookingId), { driver_id: driverId }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore assignDriver notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, driver_id: driverId } : b)),
      logs: [newLog, ...prev.logs],
    }));

    return { success: true };
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'created_at'>) => {
    const companyId = customer.company_id || state.currentCompany.id;
    const newCustomer: Customer = {
      ...customer,
      company_id: companyId,
      id: `cust-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString().split('T')[0],
      total_spent_rwf: customer.total_spent_rwf || 0,
      total_bookings_count: customer.total_bookings_count || 0,
      outstanding_balance_rwf: customer.outstanding_balance_rwf || 0,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Customer Profile Created',
      details: `Registered ${newCustomer.name} (${newCustomer.category}) - ${newCustomer.phone}.`,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        setDoc(doc(db, 'customers', newCustomer.id), cleanForFirestore(newCustomer)).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `customers/${newCustomer.id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore addCustomer notice:', err);
      }
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
    const companyId = target?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Customer Profile Updated',
      details: `Updated CRM records for ${target?.name || 'Customer'}.`,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'customers', id), cleanForFirestore(updates)).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `customers/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore updateCustomer notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteCustomer = (id: string) => {
    const target = state.customers.find((c) => c.id === id);
    const companyId = target?.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Customer Archived',
      details: `Archived CRM client record for ${target?.name || 'Customer'}.`,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'customers', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, `customers/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteCustomer notice:', err);
      }
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
    const companyId = target.company_id || state.currentCompany.id;

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Corporate Payment Settled',
      details: `Received payment of ${amountRwf.toLocaleString()} RWF from ${target.name}. Outstanding balance updated to ${newBalance.toLocaleString()} RWF.`,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'customers', customerId), {
          outstanding_balance_rwf: newBalance,
          total_spent_rwf: newSpent,
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `customers/${customerId}`));
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore payment record notice:', err);
      }
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
    const companyId = payment.company_id || state.currentCompany.id;
    const newPayment: PaymentRecord = {
      ...payment,
      company_id: companyId,
      id: `pay-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString().split('T')[0],
      ebm_receipt_number: payment.ebm_receipt_number || `EBM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Payment Recorded',
      details: `Logged ${newPayment.payment_method} transaction of ${newPayment.amount_rwf.toLocaleString()} RWF for ${newPayment.customer_name}.`,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        setDoc(doc(db, 'payments', newPayment.id), cleanForFirestore(newPayment)).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `payments/${newPayment.id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore addPayment notice:', err);
      }
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
    const companyId = target?.company_id || state.currentCompany.id;
    const updates: Partial<PaymentRecord> = { status };
    if (amountPaid !== undefined) {
      updates.amount_rwf = amountPaid;
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Payment Status Updated',
      details: `Payment #${id} (${target?.customer_name}) marked as ${status}.`,
      category: 'booking',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'payments', id), cleanForFirestore(updates)).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `payments/${id}`)
        );
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore updatePayment notice:', err);
      }
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
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'payments', paymentId), { ebm_receipt_number: receiptNum }).catch(() => {});
      } catch (err) {
        console.warn('Firestore EBM update notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === paymentId ? { ...p, ebm_receipt_number: receiptNum } : p)),
    }));
    return receiptNum;
  };

  const addMaintenanceRecord = (record: Omit<MaintenanceRecord, 'id' | 'created_at'>) => {
    const id = `mnt-2026-${Math.floor(100 + Math.random() * 900)}`;
    const companyId = record.company_id || state.currentCompany.id;
    const newRecord: MaintenanceRecord = {
      ...record,
      company_id: companyId,
      id,
      created_at: new Date().toISOString().slice(0, 10),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Maintenance Scheduled',
      details: `${record.vehicle_plate} sent to ${record.garage_name} for ${record.service_type}. Grounded.`,
      category: 'fleet',
    };

    const shouldGroundVehicle = record.status === 'In Garage';
    const vehicleUpdates = shouldGroundVehicle ? { status: 'Maintenance' as VehicleStatus } : {};

    if (isLiveSyncEnabled()) {
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
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'maintenance', record.id), cleanForFirestore(record)).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `maintenance/${record.id}`)
        );
      } catch (err) {
        console.warn('Firestore updateMaintenance notice:', err);
      }
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

    const companyId = target.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Maintenance Completed',
      details: `${target.vehicle_plate} released from ${target.garage_name}. Status: Available.`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'maintenance', maintenanceId), cleanForFirestore(updatedRecord)).catch(() => {});
        updateDoc(doc(db, 'vehicles', target.vehicle_id), cleanForFirestore(vehicleUpdates)).catch(() => {});
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore completeMaintenance notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      maintenance: prev.maintenance.map((m) => (m.id === maintenanceId ? updatedRecord : m)),
      vehicles: prev.vehicles.map((v) => (v.id === target.vehicle_id ? { ...v, ...vehicleUpdates } : v)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteMaintenanceRecord = (maintenanceId: string) => {
    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'maintenance', maintenanceId)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteMaintenance notice:', err);
      }
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
    const companyId = inspection.company_id || state.currentCompany.id;
    const newInspection: VehicleHandoverInspection = {
      ...inspection,
      company_id: companyId,
      id,
      created_at: new Date().toISOString(),
    };

    const isPickup = inspection.inspection_type === 'pickup';
    const actionName = isPickup ? 'Vehicle Check-out (Pickup)' : 'Vehicle Check-in (Return)';
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
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
        company_id: companyId,
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

    if (isLiveSyncEnabled()) {
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
    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'handovers', id)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteHandover notice:', err);
      }
    }
    setState((prev) => ({
      ...prev,
      handovers: prev.handovers.filter((h) => h.id !== id),
    }));
  };

  const addExpenseRecord = (expense: Omit<ExpenseRecord, 'id' | 'created_at'>) => {
    const id = `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const companyId = expense.company_id || state.currentCompany.id;
    const newExpense: ExpenseRecord = {
      ...expense,
      company_id: companyId,
      id,
      created_at: new Date().toISOString().slice(0, 10),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Expense Logged',
      details: `${expense.category} of ${expense.amount_rwf.toLocaleString()} RWF recorded${expense.vehicle_plate ? ` for ${expense.vehicle_plate}` : ''} (${expense.title}).`,
      category: 'expense',
    };

    if (isLiveSyncEnabled()) {
      try {
        setDoc(doc(db, 'expenses', id), cleanForFirestore(newExpense)).catch(() => {});
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore addExpense notice:', err);
      }
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

    const companyId = target.company_id || state.currentCompany.id;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: companyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: `Expense ${status}`,
      details: `Expense #${id} (${target.title}) marked as ${status}${approved_by ? ` by ${approved_by}` : ''}.`,
      category: 'expense',
    };

    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'expenses', id), cleanForFirestore(updated)).catch(() => {});
        setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
      } catch (err) {
        console.warn('Firestore updateExpense notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? updated : e)),
      logs: [newLog, ...prev.logs],
    }));
  };

  const deleteExpenseRecord = (id: string) => {
    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'expenses', id)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteExpense notice:', err);
      }
    }
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const addOperationalTask = (task: Omit<OperationalTask, 'id' | 'created_at'>) => {
    const id = `TSK-2026-${Math.floor(100 + Math.random() * 900)}`;
    const companyId = task.company_id || state.currentCompany.id;
    const newTask: OperationalTask = {
      ...task,
      company_id: companyId,
      id,
      created_at: new Date().toISOString().slice(0, 10),
    };

    if (isLiveSyncEnabled()) {
      try {
        setDoc(doc(db, 'tasks', id), cleanForFirestore(newTask)).catch(() => {});
      } catch (err) {
        console.warn('Firestore addTask notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    return newTask;
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    if (isLiveSyncEnabled()) {
      try {
        updateDoc(doc(db, 'tasks', id), { status }).catch(() => {});
      } catch (err) {
        console.warn('Firestore updateTask notice:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  };

  const deleteOperationalTask = (id: string) => {
    if (isLiveSyncEnabled()) {
      try {
        deleteDoc(doc(db, 'tasks', id)).catch(() => {});
      } catch (err) {
        console.warn('Firestore deleteTask notice:', err);
      }
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
        const userSummary: User = {
          id: res.user.uid,
          name: res.user.displayName || normalizedEmail.split('@')[0],
          email: res.user.email,
          phone: res.user.phoneNumber || '+250 788 100 000',
          role: isSuper ? 'superadmin' : 'owner',
          company_id: isSuper ? 'platform-root' : `comp-${res.user.uid.slice(0, 8)}`,
          avatar_url: res.user.photoURL || undefined,
          status: 'Active',
          created_at: new Date().toISOString().slice(0, 10),
        };
        return { success: true, user: userSummary };
      }
      return { success: false, error: 'Google sign-in did not return an account.' };
    } catch (err) {
      console.error('Google Sign-in error:', err);
      throw new Error(formatFirebaseAuthError(err));
    }
  };

  const enterDemoMode = async (userId?: string) => {
    if (auth.currentUser) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Sign out before demo notice:', err);
      }
    }
    const targetUser =
      INITIAL_USERS.find(
        (u) => u.id === userId && u.role !== 'superadmin' && !isSuperAdminEmail(u.email)
      ) || INITIAL_USERS[0];

    setState((prev) => {
      const demo = buildDemoState({
        theme: prev.theme,
        accentColorId: prev.accentColorId,
        currency: prev.currency,
        language: prev.language,
        activeTierId: 'growth',
      });
      return {
        ...demo,
        currentUser: targetUser,
        isAuthenticated: true,
        isDemoMode: true,
      };
    });
  };

  const login = (userId: string) => {
    void enterDemoMode(userId);
  };

  const loginWithCredentials = async (email: string, passwordAttempt: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, passwordAttempt);
      const fbUser = cred.user;
      const isSuper = isSuperAdminEmail(fbUser.email || normalizedEmail);
      const userObj: User = {
        id: fbUser.uid,
        name: fbUser.displayName || normalizedEmail.split('@')[0],
        email: fbUser.email || normalizedEmail,
        phone: fbUser.phoneNumber || '+250 788 000 000',
        role: isSuper ? 'superadmin' : 'owner',
        company_id: isSuper ? 'platform-root' : `comp-${fbUser.uid.slice(0, 8)}`,
        avatar_url: fbUser.photoURL || undefined,
        status: 'Active',
        created_at: new Date().toISOString().slice(0, 10),
      };
      return { success: true, user: userObj };
    } catch (err: any) {
      return {
        success: false,
        error: formatFirebaseAuthError(err),
      };
    }
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

    if (data.role === 'superadmin' && !isSuper) {
      return {
        success: false,
        error: 'Security Alert: Platform admin access is restricted.',
      };
    }

    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, data.password);
      const fbUser = cred.user;
      await updateProfile(fbUser, { displayName: data.name.trim() }).catch(() => {});

      const companyId = isSuper ? 'platform-root' : data.companyId || `comp-${fbUser.uid.slice(0, 8)}`;
      const assignedRole: UserRole = isSuper ? 'superadmin' : data.role;

      const newCompany: Company = {
        id: companyId,
        name: `${data.name.trim()} Fleet`,
        slug: companyId,
        business_type: 'Car Rental',
        tin_number: '100000000',
        phone: data.phone.trim(),
        email: normalizedEmail,
        city: 'Kigali',
        country: 'Rwanda',
        currency: 'RWF',
        tier_id: 'starter',
        status: 'Trial',
        owner_name: data.name.trim(),
        created_at: new Date().toISOString(),
      };

      const newUser: User = {
        id: fbUser.uid,
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone.trim(),
        role: assignedRole,
        company_id: companyId,
        status: 'Active',
        created_at: new Date().toISOString().slice(0, 10),
      };

      if (!isSuper) {
        pendingRegistrationRef.current = { company: newCompany, owner: newUser };
        await setDoc(doc(db, 'companies', companyId), cleanForFirestore(newCompany)).catch(() => {});
      }
      await setDoc(doc(db, 'users', fbUser.uid), cleanForFirestore(newUser)).catch(() => {});

      return { success: true, user: newUser };
    } catch (err: any) {
      return {
        success: false,
        error: formatFirebaseAuthError(err),
      };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: formatFirebaseAuthError(err),
      };
    }
  };

  const switchRole = (role: UserRole) => {
    if (role === 'superadmin' && !isSuperAdminEmail(state.currentUser.email)) {
      return;
    }
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
    setState((prev) =>
      buildDemoState({
        theme: prev.theme,
        accentColorId: prev.accentColorId,
        currency: prev.currency,
        language: prev.language,
        activeTierId: 'growth',
      })
    );
  };

  const registerCompany = async (
    companyDataOrParams:
      | {
          companyName: string;
          businessType: 'Car Rental' | 'Tour Operator' | 'Airport Shuttle' | 'Corporate Transport';
          tinNumber: string;
          city: string;
          ownerName: string;
          phone: string;
          email: string;
          password?: string;
          tierId: 'starter' | 'growth' | 'enterprise';
        }
      | Omit<Company, 'id' | 'created_at'>,
    ownerData?: { name: string; email: string; phone: string; password?: string }
  ): Promise<{ success: boolean; error?: string; company?: Company; owner?: User }> => {
    const isParams = 'companyName' in companyDataOrParams;
    const ownerEmail = (isParams ? companyDataOrParams.email : ownerData?.email || companyDataOrParams.email)
      .trim()
      .toLowerCase();
    const ownerName = (isParams ? companyDataOrParams.ownerName : ownerData?.name || 'Owner').trim();
    const ownerPhone = (isParams ? companyDataOrParams.phone : ownerData?.phone || companyDataOrParams.phone).trim();
    const passwordAttempt = isParams ? companyDataOrParams.password : ownerData?.password;

    try {
      let fbUser = auth.currentUser;
      if (!fbUser) {
        if (!passwordAttempt || passwordAttempt.length < 6) {
          return {
            success: false,
            error: 'Please enter a password of at least 6 characters to create your company account.',
          };
        }
        const cred = await createUserWithEmailAndPassword(auth, ownerEmail, passwordAttempt);
        fbUser = cred.user;
        await updateProfile(fbUser, { displayName: ownerName }).catch(() => {});
      }

      const companyId = `comp-${fbUser.uid.slice(0, 8)}`;
      const rawName = isParams ? companyDataOrParams.companyName : companyDataOrParams.name;
      const slugBase = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'fleet';
      const slug = `${slugBase}-${fbUser.uid.slice(0, 4).toLowerCase()}`;

      const newCompany: Company = isParams
        ? {
            id: companyId,
            name: companyDataOrParams.companyName.trim(),
            slug,
            business_type: companyDataOrParams.businessType,
            tin_number: companyDataOrParams.tinNumber.trim(),
            phone: ownerPhone,
            email: ownerEmail,
            city: companyDataOrParams.city.trim() || 'Kigali',
            country: 'Rwanda',
            currency: 'RWF',
            tier_id: companyDataOrParams.tierId,
            status: 'Trial',
            owner_name: ownerName,
            created_at: new Date().toISOString(),
          }
        : {
            ...companyDataOrParams,
            id: companyId,
            slug,
            status: companyDataOrParams.status || 'Trial',
            owner_name: ownerName,
            created_at: new Date().toISOString(),
          };

      const newOwner: User = {
        id: fbUser.uid,
        name: ownerName,
        email: fbUser.email || ownerEmail,
        phone: ownerPhone,
        role: 'owner',
        company_id: companyId,
        avatar_url: fbUser.photoURL || undefined,
        status: 'Active',
        created_at: new Date().toISOString().slice(0, 10),
      };

      pendingRegistrationRef.current = { company: newCompany, owner: newOwner };

      await setDoc(doc(db, 'companies', newCompany.id), cleanForFirestore(newCompany));
      await setDoc(doc(db, 'users', newOwner.id), cleanForFirestore(newOwner));

      setState((prev) => ({
        ...prev,
        isDemoMode: false,
        isAuthenticated: true,
        isFirebaseConnected: true,
        currentCompany: newCompany,
        currentUser: newOwner,
        companies: [newCompany],
        users: [newOwner],
        vehicles: [],
        drivers: [],
        bookings: [],
        logs: [],
        customers: [],
        payments: [],
        maintenance: [],
        handovers: [],
        expenses: [],
        tasks: [],
        supportTickets: [],
        companySubscriptions: [],
        activeTierId: newCompany.tier_id,
      }));

      return { success: true, company: newCompany, owner: newOwner };
    } catch (err: any) {
      return {
        success: false,
        error: formatFirebaseAuthError(err),
      };
    }
  };

  const seedSampleFleetForCompany = () => {
    const activeCompanyId = state.currentCompany.id;
    const suffix = activeCompanyId.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'ten';

    const starterVehicles: Vehicle[] = INITIAL_VEHICLES.slice(0, 4).map((v, idx) => ({
      ...v,
      id: `veh-${suffix}-0${idx + 1}`,
      company_id: activeCompanyId,
      status: 'Available',
    }));

    const starterDrivers: Driver[] = INITIAL_DRIVERS.slice(0, 2).map((d, idx) => ({
      ...d,
      id: `drv-${suffix}-0${idx + 1}`,
      company_id: activeCompanyId,
      status: 'Available',
    }));

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      company_id: activeCompanyId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'Starter Sample Cars Loaded',
      details: `Added ${starterVehicles.length} sample cars and ${starterDrivers.length} drivers to ${state.currentCompany.name}.`,
      category: 'fleet',
    };

    if (isLiveSyncEnabled()) {
      for (const v of starterVehicles) {
        setDoc(doc(db, 'vehicles', v.id), cleanForFirestore(v)).catch(() => {});
      }
      for (const d of starterDrivers) {
        setDoc(doc(db, 'drivers', d.id), cleanForFirestore(d)).catch(() => {});
      }
      setDoc(doc(db, 'activity_logs', newLog.id), cleanForFirestore(newLog)).catch(() => {});
    }

    setState((prev) => ({
      ...prev,
      vehicles: [...starterVehicles, ...prev.vehicles],
      drivers: [...starterDrivers, ...prev.drivers],
      logs: [newLog, ...prev.logs],
    }));
  };

  const setTier = (tierId: 'starter' | 'growth' | 'enterprise') => {
    if (isLiveSyncEnabled()) {
      updateDoc(doc(db, 'companies', state.currentCompany.id), { tier_id: tierId }).catch(() => {});
    }
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

    if (isLiveStorefrontSync()) {
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
    if (isLiveSyncEnabled()) {
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
      company_id: staff.company_id || state.currentCompany.id,
      id: `usr-staff-${Date.now().toString().slice(-4)}`,
      status: 'Active',
      created_at: new Date().toISOString().slice(0, 10),
    };

    if (isLiveSyncEnabled()) {
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
    if (isLiveSyncEnabled()) {
      updateDoc(doc(db, 'users', userId), { role }).catch(() => {});
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
      currentUser: prev.currentUser.id === userId ? { ...prev.currentUser, role } : prev.currentUser,
    }));
  };

  const updateStaffStatus = (userId: string, status: 'Active' | 'Invited' | 'Deactivated' | 'Suspended') => {
    if (isLiveSyncEnabled()) {
      updateDoc(doc(db, 'users', userId), { status }).catch(() => {});
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    }));
  };

  const deleteStaffMember = (userId: string) => {
    if (isLiveSyncEnabled()) {
      deleteDoc(doc(db, 'users', userId)).catch(() => {});
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  const resetToDefaults = async () => {
    // Only reset the local Free Demo Sandbox — NEVER delete live tenant Firestore data!
    if (!state.isDemoMode && auth.currentUser) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY_PREFS);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setState((prev) => ({
      ...buildDemoState({
        theme: prev.theme,
        accentColorId: prev.accentColorId,
        currency: prev.currency,
        language: prev.language,
        activeTierId: 'growth',
      }),
      isAuthenticated: prev.isAuthenticated,
      isDemoMode: true,
    }));
  };

  const currentTheme = getThemeById(state.accentColorId || 'lake-kivu');

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

  // Defense-in-depth tenant isolation on exported arrays when signed into a live tenant account
  const activeTenantId = state.currentCompany.id;
  const shouldFilterTenant = !state.isDemoMode && !isSuperAdminEmail(state.currentUser.email);
  const scopeByTenant = <T extends { company_id?: string }>(items: T[]): T[] =>
    shouldFilterTenant ? items.filter((item) => item.company_id === activeTenantId) : items;

  return {
    state,
    vehicles: scopeByTenant(state.vehicles),
    drivers: scopeByTenant(state.drivers),
    bookings: scopeByTenant(state.bookings),
    logs: scopeByTenant(state.logs),
    activeTier: dynamicTiers.find((t) => t.id === state.activeTierId) || dynamicTiers[1],
    tiers: dynamicTiers,
    theme: state.theme,
    toggleTheme,
    accentColorId: state.accentColorId || 'lake-kivu',
    currentTheme,
    setAccentColor,
    currency: state.currency,
    setCurrency,
    language: state.language,
    setLanguage,
    currentUser: state.currentUser,
    currentCompany: state.currentCompany,
    companies: state.companies,
    users: state.users,
    isAuthenticated: state.isAuthenticated,
    isDemoMode: state.isDemoMode,
    isFirebaseConnected: state.isFirebaseConnected,
    login,
    enterDemoMode,
    loginWithCredentials,
    createUserAccount,
    loginWithGoogle,
    sendPasswordReset,
    switchRole,
    logout,
    registerCompany,
    seedSampleFleetForCompany,
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
    customers: scopeByTenant(state.customers),
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
    payments: scopeByTenant(state.payments),
    addPaymentRecord,
    updatePaymentStatus,
    generateEBMReceipt,
    maintenance: scopeByTenant(state.maintenance),
    addMaintenanceRecord,
    updateMaintenanceRecord,
    completeMaintenanceRecord,
    deleteMaintenanceRecord,
    handovers: scopeByTenant(state.handovers),
    addHandoverInspection,
    deleteHandoverInspection,
    expenses: scopeByTenant(state.expenses),
    addExpenseRecord,
    updateExpenseStatus,
    deleteExpenseRecord,
    tasks: scopeByTenant(state.tasks),
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
    supportTickets: scopeByTenant(state.supportTickets),
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
