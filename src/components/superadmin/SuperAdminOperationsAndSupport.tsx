import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Car,
  Eye,
  Lock,
  Mail,
  MessageSquare,
  Plane,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';
import {
  Booking,
  Company,
  MaintenanceRecord,
  NotificationDeliveryLog,
  NotificationTemplate,
  PlatformAdmin,
  SupportTicket,
  SupportTicketStatus,
  Vehicle,
} from '../../types';
import { ColorTheme } from '../../theme';
import { getStatusStyles } from './SuperAdminShared';

interface SuperAdminOperationsAndSupportProps {
  mode: 'bookings' | 'fleet' | 'support' | 'notifications';
  companies: Company[];
  currentCompany: Company;
  bookings: Booking[];
  vehicles: Vehicle[];
  maintenance: MaintenanceRecord[];
  supportTickets: SupportTicket[];
  notificationTemplates: NotificationTemplate[];
  notificationLogs: NotificationDeliveryLog[];
  platformAdmins: PlatformAdmin[];
  currentTheme: ColorTheme;
  onInspectBooking: (bookingId: string, label: string) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<SupportTicket>, newInternalNote?: string) => void;
  onSaveTemplate: (template: NotificationTemplate) => void;
  onSendNotification: (templateId: string, recipient: string, companyName?: string) => void;
}

export const SuperAdminOperationsAndSupport: React.FC<SuperAdminOperationsAndSupportProps> = ({
  mode,
  companies,
  currentCompany,
  bookings,
  vehicles,
  maintenance,
  supportTickets,
  notificationTemplates,
  notificationLogs,
  platformAdmins,
  currentTheme,
  onInspectBooking,
  onUpdateTicket,
  onSaveTemplate,
  onSendNotification,
}) => {
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [inspectedBooking, setInspectedBooking] = useState<Booking | null>(null);

  const [ticketAudienceFilter, setTicketAudienceFilter] = useState<'all' | 'Company' | 'Storefront Customer'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | SupportTicketStatus>('all');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(supportTickets[0]?.id || null);
  const [publicReply, setPublicReply] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const [editingTpl, setEditingTpl] = useState<NotificationTemplate | null>(null);
  const [sendTplId, setSendTplId] = useState<string>(notificationTemplates[0]?.id || '');
  const [sendRecipient, setSendRecipient] = useState('+250 788 123 456');
  const [sendCompany, setSendCompany] = useState(companies[0]?.name || '');

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesQ =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.client_name.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q);
      const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      return matchesQ && matchesStatus;
    });
  }, [bookings, bookingSearch, bookingStatusFilter]);

  const filteredTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      const matchesAudience =
        ticketAudienceFilter === 'all' || (t.requester_type || 'Storefront Customer') === ticketAudienceFilter;
      const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
      return matchesAudience && matchesStatus;
    });
  }, [supportTickets, ticketAudienceFilter, ticketStatusFilter]);

  const activeTicket =
    supportTickets.find((t) => t.id === activeTicketId) || filteredTickets[0] || null;

  // -------------------------------------------------------------------------
  // MODULE 8: ALL BOOKINGS (VIEW ONLY)
  // -------------------------------------------------------------------------
  if (mode === 'bookings') {
    return (
      <div className="space-y-5">
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              All Bookings
            </h3>
            <p className="text-sm text-[#425466] dark:text-slate-400">
              View any trip to help clients or check late flights. Opening a booking saves a record in the change log.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search ID, client, place..."
                className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
              />
            </div>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm rounded-xl px-3.5 py-2.5 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending Dispatch">Waiting Driver</option>
              <option value="In Progress">On Trip</option>
              <option value="Completed">Finished</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
            <div className="col-span-3">Booking & Dates</div>
            <div className="col-span-3">Client & Place</div>
            <div className="col-span-2">Car & Flight</div>
            <div className="col-span-2 text-right">Total (RWF)</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">View</div>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
            {filteredBookings.map((b) => {
              const veh = vehicles.find((v) => v.id === b.vehicle_id);
              return (
                <div
                  key={b.id}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
                >
                  <div className="lg:col-span-3 font-mono min-w-0">
                    <div className="font-bold text-[#0a2540] dark:text-white truncate">{b.id}</div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 whitespace-nowrap">
                      {b.start_date} → {b.end_date}
                    </div>
                  </div>
                  <div className="lg:col-span-3 min-w-0">
                    <div className="font-semibold text-[#0a2540] dark:text-white truncate">{b.client_name}</div>
                    <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{b.destination}</div>
                  </div>
                  <div className="lg:col-span-2 min-w-0">
                    <div className="text-[#0a2540] dark:text-slate-200 truncate">
                      {veh ? `${veh.model_name} (${veh.plate_number})` : b.vehicle_id}
                    </div>
                    {b.flight_number && (
                      <div className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                        <Plane className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {b.flight_number} ({b.flight_status || 'On Time'})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-2 lg:text-right font-mono tabular-nums font-bold text-[#0a2540] dark:text-white whitespace-nowrap">
                    {b.total_rwf.toLocaleString()} RWF
                  </div>
                  <div className="lg:col-span-1 lg:text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="lg:col-span-1 flex lg:justify-end">
                    <button
                      onClick={() => {
                        onInspectBooking(b.id, `${b.id} · ${b.client_name}`);
                        setInspectedBooking(b);
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {inspectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-sm">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-base font-bold text-[#0a2540] dark:text-white">
                    Booking Details ({inspectedBooking.id})
                  </h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    Viewing is saved in the safety log
                  </p>
                </div>
                <button onClick={() => setInspectedBooking(null)} className="text-slate-400 p-1 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#425466] dark:text-slate-400">Client</div>
                  <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">
                    {inspectedBooking.client_name}
                  </div>
                  <div className="font-mono text-sm text-[#425466] dark:text-slate-400">{inspectedBooking.client_phone}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#425466] dark:text-slate-400">Payment</div>
                  <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">
                    {inspectedBooking.payment_status}
                  </div>
                  <div className="text-sm text-[#425466] dark:text-slate-400">{inspectedBooking.payment_method}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div>
                  <strong>Place:</strong> {inspectedBooking.destination}
                </div>
                <div>
                  <strong>Driver Step:</strong> {inspectedBooking.dispatch_status}
                </div>
                <div>
                  <strong>Company:</strong> {currentCompany.name}
                </div>
                {inspectedBooking.notes && (
                  <div>
                    <strong>Notes:</strong> {inspectedBooking.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 9: ALL CARS OVERVIEW
  // -------------------------------------------------------------------------
  if (mode === 'fleet') {
    const availableCount = vehicles.filter((v) => v.status === 'Available').length;
    const bookedCount = vehicles.filter((v) => v.status === 'Booked').length;
    const maintCount = vehicles.filter((v) => v.status === 'Maintenance').length;

    const categoryMap: Record<string, number> = {};
    vehicles.forEach((v) => {
      categoryMap[v.category] = (categoryMap[v.category] || 0) + 1;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">All Cars</div>
            <div className="text-3xl font-bold text-[#0a2540] dark:text-white font-mono tabular-nums mt-1.5">
              {vehicles.length}
            </div>
            <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              Total across {companies.length} companies:{' '}
              {companies.reduce((s, c) => s + (c.vehicle_count || 0), 0)}
            </div>
          </div>
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Ready Now</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1.5">
              {availableCount}
            </div>
            <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">Free for trips</div>
          </div>
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">Booked</div>
            <div className="text-3xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums mt-1.5">
              {bookedCount}
            </div>
            <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">On a trip or reserved</div>
          </div>
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <div className="text-sm text-[#425466] dark:text-slate-400 font-semibold">In Garage / Repairs</div>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1.5">
              {maintCount}
            </div>
            <div className="text-sm text-[#425466] dark:text-slate-400 mt-1">
              {maintenance.filter((m) => m.status !== 'Completed').length} active garage jobs
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
              <Car className="w-5 h-5" style={{ color: currentTheme.hex }} />
              <span>Cars by Type</span>
            </h4>
            <div className="space-y-3 text-sm">
              {Object.entries(categoryMap).map(([cat, count]) => {
                const pct = Math.round((count / Math.max(1, vehicles.length)) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between font-mono tabular-nums">
                      <span className="font-semibold text-[#0a2540] dark:text-slate-200">{cat}</span>
                      <span>
                        {count} cars ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: currentTheme.hex }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Safety & Insurance Dates</span>
            </h4>
            <div className="space-y-2.5 text-sm">
              {vehicles.slice(0, 6).map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-[#0a2540] dark:text-white">
                      {v.model_name} · <span className="font-mono">{v.plate_number}</span>
                    </div>
                    <div className="text-sm font-mono text-[#425466] dark:text-slate-400">
                      Police Check: {v.controle_technique_expiry || '2027-03-15'} · Insurance:{' '}
                      {v.insurance_expiry || '2027-04-01'}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(v.status)}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 10: HELP REQUESTS
  // -------------------------------------------------------------------------
  if (mode === 'support') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Queue */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">Help Requests ({filteredTickets.length})</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <select
              value={ticketAudienceFilter}
              onChange={(e) => setTicketAudienceFilter(e.target.value as any)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="all">Everyone</option>
              <option value="Company">Companies</option>
              <option value="Storefront Customer">Car Renters</option>
            </select>
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value as any)}
              className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 outline-none"
            >
              <option value="all">All Statuses</option>
              {(['New', 'Open', 'In Progress', 'Waiting for User', 'Escalated', 'Resolved', 'Closed'] as SupportTicketStatus[]).map(
                (st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {filteredTickets.map((t) => {
              const selected = activeTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTicketId(t.id);
                    setPublicReply(t.response || '');
                    setInternalNote('');
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors text-sm space-y-1 ${
                    selected
                      ? 'bg-[#f6f9fc] dark:bg-slate-800 border-amber-500/60'
                      : 'bg-[#f6f9fc]/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#0a2540] dark:text-white">{t.ticket_ref}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="font-semibold text-[#0a2540] dark:text-slate-200 truncate">{t.issue_category}</div>
                  <div className="text-sm text-[#425466] dark:text-slate-400 truncate">
                    {t.requester_type || 'Customer'} · {t.customer_name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Workspace */}
        <div className="lg:col-span-2 stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          {!activeTicket ? (
            <div className="py-12 text-center text-sm text-[#425466] dark:text-slate-400">Pick a help request to read it.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base text-[#0a2540] dark:text-white">
                      {activeTicket.ticket_ref}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-sm font-semibold ${getStatusStyles(activeTicket.priority)}`}>
                      {activeTicket.priority}
                    </span>
                    <span className="text-sm text-[#425466] dark:text-slate-400">
                      {activeTicket.requester_type || 'Renter'}
                      {activeTicket.company_name ? ` · ${activeTicket.company_name}` : ''}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#0a2540] dark:text-white mt-1">
                    {activeTicket.issue_category}
                  </h4>
                  <div className="text-sm text-[#425466] dark:text-slate-400 font-mono">
                    {activeTicket.customer_name} · {activeTicket.customer_email} · {activeTicket.customer_phone}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={activeTicket.status}
                    onChange={(e) =>
                      onUpdateTicket(activeTicket.id, {
                        status: e.target.value as SupportTicketStatus,
                        escalated: e.target.value === 'Escalated',
                      })
                    }
                    className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-semibold"
                  >
                    {(['New', 'Open', 'In Progress', 'Waiting for User', 'Escalated', 'Resolved', 'Closed'] as SupportTicketStatus[]).map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    value={activeTicket.assigned_admin_email || ''}
                    onChange={(e) => onUpdateTicket(activeTicket.id, { assigned_admin_email: e.target.value })}
                    className="bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2"
                  >
                    <option value="">No helper yet</option>
                    {platformAdmins.map((a) => (
                      <option key={a.id} value={a.email}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requester Message */}
              <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm space-y-1.5">
                <div className="text-sm font-semibold text-[#425466] dark:text-slate-400">Their Message</div>
                <p className="text-[#0a2540] dark:text-slate-200 leading-relaxed">{activeTicket.message}</p>
              </div>

              {/* Public Reply */}
              <div className="space-y-2 text-sm">
                <label className="block font-semibold text-[#0a2540] dark:text-slate-300">
                  Reply to Person (They Can Read This)
                </label>
                <textarea
                  rows={3}
                  value={publicReply}
                  onChange={(e) => setPublicReply(e.target.value)}
                  placeholder="Write your clear answer here..."
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                />
              </div>

              {/* Private Team Notes */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Private Team Notes — Only Admins See This</span>
                  </span>
                </div>

                {(activeTicket.internal_notes || []).map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-amber-500/20"
                  >
                    <div className="flex justify-between text-sm text-[#425466] dark:text-slate-400">
                      <span className="font-semibold text-[#0a2540] dark:text-slate-200">{n.author}</span>
                      <span className="font-mono">{n.created_at.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-[#0a2540] dark:text-slate-300 mt-1">{n.note}</p>
                  </div>
                ))}

                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add a private note for your team..."
                  className="w-full bg-white dark:bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-[#0a2540] dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    onUpdateTicket(
                      activeTicket.id,
                      {
                        response: publicReply.trim() || activeTicket.response,
                        status: publicReply.trim() ? 'Waiting for User' : activeTicket.status,
                      },
                      internalNote
                    );
                    setInternalNote('');
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  <Send className="w-4 h-4" />
                  <span>Save Reply & Note</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 11: MESSAGES & ALERTS
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Messages */}
        <div className="lg:col-span-2 stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              Saved Message Templates ({notificationTemplates.length})
            </h3>
            <button
              onClick={() =>
                setEditingTpl({
                  id: `tpl-${Date.now().toString().slice(-4)}`,
                  name: '',
                  channel: 'SMS',
                  event_trigger: 'custom.platform_notice',
                  body: 'KigaliFleet message for {{company_name}}: ',
                  variables: ['{{company_name}}'],
                  is_active: true,
                  updated_at: new Date().toISOString().slice(0, 10),
                })
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${currentTheme.btnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Plus className="w-4 h-4" />
              <span>New Message</span>
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {notificationTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0a2540] dark:text-white">{tpl.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-mono text-sm">
                      {tpl.channel}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingTpl(tpl)}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: currentTheme.hex }}
                  >
                    Edit
                  </button>
                </div>
                <p className="text-[#425466] dark:text-slate-300 font-mono text-sm">{tpl.body}</p>
                <div className="text-sm text-[#425466] dark:text-slate-400">
                  When sent: <span className="font-mono">{tpl.event_trigger}</span> · Words:{' '}
                  {tpl.variables.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Send a Test Message */}
        <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-sm">
          <h4 className="text-lg font-bold text-[#0a2540] dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" style={{ color: currentTheme.hex }} />
            <span>Send a Test Message</span>
          </h4>
          <div>
            <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Message</label>
            <select
              value={sendTplId}
              onChange={(e) => setSendTplId(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
            >
              {notificationTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.channel}] {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Phone or Email</label>
            <input
              type="text"
              value={sendRecipient}
              onChange={(e) => setSendRecipient(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Company</label>
            <select
              value={sendCompany}
              onChange={(e) => setSendCompany(e.target.value)}
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onSendNotification(sendTplId, sendRecipient, sendCompany)}
            className={`w-full py-3 rounded-full font-semibold flex items-center justify-center gap-2 ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Send className="w-4 h-4" />
            <span>Send Now</span>
          </button>
          <p className="text-sm text-[#425466] dark:text-slate-400">
            Shows both when the SMS service accepts it and when the phone receives it.
          </p>
        </div>
      </div>

      {/* Sent Messages List */}
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 font-bold text-base text-[#0a2540] dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          <span>Sent Messages History ({notificationLogs.length})</span>
        </div>
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3.5 bg-[#f6f9fc] dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-[#425466] dark:text-slate-400 font-semibold">
          <div className="col-span-3">Message & Type</div>
          <div className="col-span-3">Sent To</div>
          <div className="col-span-2">Service</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-right">Time</div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
          {notificationLogs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-[#f6f9fc] dark:hover:bg-slate-800/40"
            >
              <div className="lg:col-span-3 min-w-0">
                <div className="font-semibold text-[#0a2540] dark:text-white truncate">{log.template_name}</div>
                <div className="text-xs font-mono text-[#425466] dark:text-slate-400">{log.channel}</div>
              </div>
              <div className="lg:col-span-3 min-w-0">
                <div className="font-mono truncate">{log.recipient}</div>
                <div className="text-xs text-[#425466] dark:text-slate-400 truncate">{log.company_name || 'Direct'}</div>
              </div>
              <div className="lg:col-span-2 text-[#425466] dark:text-slate-300 truncate">{log.provider}</div>
              <div className="lg:col-span-2 lg:text-center">
                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${getStatusStyles(log.status)}`}>
                  {log.status}
                </span>
                {log.error_detail && <div className="text-xs text-rose-500 mt-0.5 truncate">{log.error_detail}</div>}
              </div>
              <div className="lg:col-span-2 lg:text-right font-mono text-xs text-[#425466] dark:text-slate-400 whitespace-nowrap">
                {log.sent_at.slice(0, 16).replace('T', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Message Modal */}
      {editingTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingTpl.name.trim()) return;
              onSaveTemplate(editingTpl);
              setEditingTpl(null);
            }}
            className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-[#0a2540] dark:text-white">Edit Message Template</h4>
              <button type="button" onClick={() => setEditingTpl(null)} className="text-slate-400 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Name</label>
              <input
                type="text"
                value={editingTpl.name}
                onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })}
                className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">How Sent</label>
                <select
                  value={editingTpl.channel}
                  onChange={(e) => setEditingTpl({ ...editingTpl, channel: e.target.value as any })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5"
                >
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="In-App">In App</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">When Sent</label>
                <input
                  type="text"
                  value={editingTpl.event_trigger}
                  onChange={(e) => setEditingTpl({ ...editingTpl, event_trigger: e.target.value })}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#0a2540] dark:text-slate-300">Message Words (supports {'{{name}}'})</label>
              <textarea
                rows={4}
                value={editingTpl.body}
                onChange={(e) => setEditingTpl({ ...editingTpl, body: e.target.value })}
                className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTpl(null)}
                className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-full font-semibold ${currentTheme.btnText}`}
                style={{ backgroundColor: currentTheme.hex }}
              >
                Save Message
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
