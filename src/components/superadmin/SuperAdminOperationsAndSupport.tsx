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
  // Bookings state (Read-only audited)
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [inspectedBooking, setInspectedBooking] = useState<Booking | null>(null);

  // Support center state
  const [ticketAudienceFilter, setTicketAudienceFilter] = useState<'all' | 'Company' | 'Storefront Customer'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | SupportTicketStatus>('all');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(supportTickets[0]?.id || null);
  const [publicReply, setPublicReply] = useState('');
  const [internalNote, setInternalNote] = useState('');

  // Notifications state
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
  // MODULE 8: BOOKINGS OVERVIEW (READ-ONLY AUDITED)
  // -------------------------------------------------------------------------
  if (mode === 'bookings') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Cross-Tenant Bookings Monitor (Read-Only Audited)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect reservations for customer dispute resolution or KIA flight delay triage. Every dossier inspection
              records a Sensitive Data Access audit entry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search ID, client, route..."
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg pl-8 pr-3 py-2 outline-none"
              />
            </div>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending Dispatch">Pending Dispatch</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3">Booking ID & Dates</th>
                  <th className="px-4 py-3">Client & Route</th>
                  <th className="px-4 py-3">Vehicle & Flight</th>
                  <th className="px-4 py-3 text-right">Total (RWF)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Audited View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {filteredBookings.map((b) => {
                  const veh = vehicles.find((v) => v.id === b.vehicle_id);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">{b.id}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.start_date} → {b.end_date}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{b.client_name}</div>
                        <div className="text-[11px] text-slate-500">{b.destination}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200">
                          {veh ? `${veh.model_name} (${veh.plate_number})` : b.vehicle_id}
                        </div>
                        {b.flight_number && (
                          <div className="text-[11px] text-sky-500 flex items-center gap-1 mt-0.5">
                            <Plane className="w-3 h-3" />
                            <span>
                              {b.flight_number} ({b.flight_status || 'Scheduled'})
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {b.total_rwf.toLocaleString()} RWF
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getStatusStyles(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            onInspectBooking(b.id, `${b.id} · ${b.client_name}`);
                            setInspectedBooking(b);
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {inspectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-xs">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Read-Only Audited Booking Dossier ({inspectedBooking.id})
                  </h4>
                  <p className="text-[11px] text-emerald-500 font-mono mt-0.5">
                    Sensitive Data Access logged to Platform Audit Trail
                  </p>
                </div>
                <button onClick={() => setInspectedBooking(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Client</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {inspectedBooking.client_name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">{inspectedBooking.client_phone}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">Payment & Method</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {inspectedBooking.payment_status}
                  </div>
                  <div className="text-[11px] text-slate-500">{inspectedBooking.payment_method}</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div>
                  <strong>Destination:</strong> {inspectedBooking.destination}
                </div>
                <div>
                  <strong>Dispatch Stage:</strong> {inspectedBooking.dispatch_status}
                </div>
                <div>
                  <strong>Tenant Context:</strong> {currentCompany.name}
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
  // MODULE 9: GLOBAL FLEET OVERVIEW
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
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Live Vehicles Stream</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1.5">
              {vehicles.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total allocated across {companies.length} companies:{' '}
              {companies.reduce((s, c) => s + (c.vehicle_count || 0), 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Available Ready</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1.5">
              {availableCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Cleared for dispatch</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Currently Booked</div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums mt-1.5">
              {bookedCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">On mission or reserved</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Grounded / Maintenance</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-1.5">
              {maintCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {maintenance.filter((m) => m.status !== 'Completed').length} active garage work orders
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-4 h-4" style={{ color: currentTheme.hex }} />
              <span>Fleet Composition by Vehicle Category</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              {Object.entries(categoryMap).map(([cat, count]) => {
                const pct = Math.round((count / Math.max(1, vehicles.length)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between font-mono tabular-nums">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                      <span>
                        {count} units ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: currentTheme.hex }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Contrôle Technique & Yellow Card Compliance Watch</span>
            </h4>
            <div className="space-y-2 text-xs">
              {vehicles.slice(0, 6).map((v) => (
                <div
                  key={v.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {v.model_name} · <span className="font-mono">{v.plate_number}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      CT Expiry: {v.controle_technique_expiry || '2027-03-15'} · Ins:{' '}
                      {v.insurance_expiry || '2027-04-01'}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(v.status)}`}>
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
  // MODULE 10: SUPPORT CENTER
  // -------------------------------------------------------------------------
  if (mode === 'support') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Queue ({filteredTickets.length})</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={ticketAudienceFilter}
              onChange={(e) => setTicketAudienceFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 outline-none"
            >
              <option value="all">All Audiences</option>
              <option value="Company">Company Tenants</option>
              <option value="Storefront Customer">Storefront Customers</option>
            </select>
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 outline-none"
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

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
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
                  className={`w-full text-left p-3 rounded-lg border transition-colors text-xs space-y-1 ${
                    selected
                      ? 'bg-slate-100 dark:bg-slate-800 border-amber-500/60'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{t.ticket_ref}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.issue_category}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {t.requester_type || 'Customer'} · {t.customer_name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Workspace */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          {!activeTicket ? (
            <div className="py-12 text-center text-xs text-slate-500">Select a support ticket to inspect.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {activeTicket.ticket_ref}
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(activeTicket.priority)}`}>
                      {activeTicket.priority}
                    </span>
                    <span className="text-xs text-slate-500">
                      {activeTicket.requester_type || 'Storefront Customer'}
                      {activeTicket.company_name ? ` · ${activeTicket.company_name}` : ''}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {activeTicket.issue_category}
                  </h4>
                  <div className="text-xs text-slate-500 font-mono">
                    {activeTicket.customer_name} · {activeTicket.customer_email} · {activeTicket.customer_phone}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={activeTicket.status}
                    onChange={(e) =>
                      onUpdateTicket(activeTicket.id, {
                        status: e.target.value as SupportTicketStatus,
                        escalated: e.target.value === 'Escalated',
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-semibold"
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
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="">Unassigned</option>
                    {platformAdmins.map((a) => (
                      <option key={a.id} value={a.email}>
                        {a.name} ({a.sub_role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requester Message */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="text-[11px] font-semibold uppercase text-slate-500">Customer / Tenant Inquiry</div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{activeTicket.message}</p>
              </div>

              {/* Public Reply */}
              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Public Response (Visible to Requester)
                </label>
                <textarea
                  rows={3}
                  value={publicReply}
                  onChange={(e) => setPublicReply(e.target.value)}
                  placeholder="Write official resolution or update for the requester..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Private Internal Notes (Staff Only) */}
              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Internal Staff Only — Hidden from Customer & Tenant</span>
                  </span>
                </div>

                {(activeTicket.internal_notes || []).map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/90 border border-amber-500/20"
                  >
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{n.author}</span>
                      <span className="font-mono">{n.created_at.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mt-1">{n.note}</p>
                  </div>
                ))}

                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add confidential internal triage note..."
                  className="w-full bg-white dark:bg-slate-950 border border-amber-500/30 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none"
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold ${currentTheme.btnText}`}
                  style={{ backgroundColor: currentTheme.hex }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Response & Internal Note</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // MODULE 11: NOTIFICATIONS & TEMPLATES
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Templates List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Platform Communication Templates ({notificationTemplates.length})
            </h3>
            <button
              onClick={() =>
                setEditingTpl({
                  id: `tpl-${Date.now().toString().slice(-4)}`,
                  name: '',
                  channel: 'SMS',
                  event_trigger: 'custom.platform_notice',
                  body: 'KigaliFleet notice for {{company_name}}: ',
                  variables: ['{{company_name}}'],
                  is_active: true,
                  updated_at: new Date().toISOString().slice(0, 10),
                })
              }
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${currentTheme.btnText}`}
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {notificationTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{tpl.name}</span>
                    <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                      {tpl.channel}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingTpl(tpl)}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: currentTheme.hex }}
                  >
                    Edit
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{tpl.body}</p>
                <div className="text-[10px] text-slate-500">
                  Trigger: <span className="font-mono">{tpl.event_trigger}</span> · Variables:{' '}
                  {tpl.variables.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Test/Live Dispatch */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 text-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4" style={{ color: currentTheme.hex }} />
            <span>Dispatch Test / Live Notice</span>
          </h4>
          <div>
            <label className="block font-semibold mb-1">Template</label>
            <select
              value={sendTplId}
              onChange={(e) => setSendTplId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5"
            >
              {notificationTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.channel}] {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Recipient (Phone or Email)</label>
            <input
              type="text"
              value={sendRecipient}
              onChange={(e) => setSendRecipient(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Target Company</label>
            <select
              value={sendCompany}
              onChange={(e) => setSendCompany(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5"
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
            className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${currentTheme.btnText}`}
            style={{ backgroundColor: currentTheme.hex }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit to Gateway</span>
          </button>
          <p className="text-[11px] text-slate-500">
            Status records reflect gateway acceptance (Provider Accepted) separately from carrier-confirmed Delivered.
          </p>
        </div>
      </div>

      {/* Delivery Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>Notification Delivery Log ({notificationLogs.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Template & Channel</th>
                <th className="px-4 py-3">Recipient / Company</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3 text-center">Delivery Status</th>
                <th className="px-4 py-3 text-right">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {notificationLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{log.template_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{log.channel}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono">{log.recipient}</div>
                    <div className="text-[11px] text-slate-500">{log.company_name || 'Platform Direct'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.provider}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${getStatusStyles(log.status)}`}>
                      {log.status}
                    </span>
                    {log.error_detail && <div className="text-[10px] text-rose-500 mt-0.5">{log.error_detail}</div>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500">
                    {log.sent_at.slice(0, 16).replace('T', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingTpl.name.trim()) return;
              onSaveTemplate(editingTpl);
              setEditingTpl(null);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h4 className="font-bold text-slate-900 dark:text-white">Edit Notification Template</h4>
              <button type="button" onClick={() => setEditingTpl(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Template Name</label>
              <input
                type="text"
                value={editingTpl.name}
                onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Channel</label>
                <select
                  value={editingTpl.channel}
                  onChange={(e) => setEditingTpl({ ...editingTpl, channel: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                >
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="In-App">In-App</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Event Trigger</label>
                <input
                  type="text"
                  value={editingTpl.event_trigger}
                  onChange={(e) => setEditingTpl({ ...editingTpl, event_trigger: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Message Body (supports {'{{placeholders}}'})</label>
              <textarea
                rows={4}
                value={editingTpl.body}
                onChange={(e) => setEditingTpl({ ...editingTpl, body: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTpl(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg font-bold ${currentTheme.btnText}`}
                style={{ backgroundColor: currentTheme.hex }}
              >
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
