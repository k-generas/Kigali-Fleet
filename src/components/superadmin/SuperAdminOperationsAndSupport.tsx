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
} from 'lucide-react';
import { ModalShell } from '../ModalShell';
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
import { getStatusDotColor, getStatusStyles } from './SuperAdminShared';
import { useI18n } from '../../utils/i18n';
import { formatHumanDate, formatHumanDateRange, formatHumanDateTime } from '../../utils/dates';

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
  onInspectBooking,
  onUpdateTicket,
  onSaveTemplate,
  onSendNotification,
}) => {
  const { formatMoney, tr } = useI18n();
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

  // MODULE 8: ALL BOOKINGS
  if (mode === 'bookings') {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {tr('All bookings')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr('View any trip to help clients or check late flights. Opening a booking saves a record in the change log.')}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder={tr('Search ID, client, place...')}
                className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm rounded-lg pl-9 pr-3 py-2 outline-none"
              />
            </div>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="all">{tr('All statuses')}</option>
              <option value="Confirmed">{tr('Confirmed')}</option>
              <option value="Pending Dispatch">{tr('Waiting driver')}</option>
              <option value="In Progress">{tr('On trip')}</option>
              <option value="Completed">{tr('Finished')}</option>
              <option value="Cancelled">{tr('Cancelled')}</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">{tr('Booking & dates')}</th>
                <th className="py-3 px-4">{tr('Client & place')}</th>
                <th className="py-3 px-4">{tr('Car & flight')}</th>
                <th className="py-3 px-4 text-right">{tr('Total')}</th>
                <th className="py-3 px-4">{tr('Status')}</th>
                <th className="py-3 px-4 text-right">{tr('View')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
              {filteredBookings.map((b) => {
                const veh = vehicles.find((v) => v.id === b.vehicle_id);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-xs">{b.id}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                        {formatHumanDateRange(b.start_date, b.end_date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{b.client_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{b.destination}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{veh ? `${veh.model_name} (${veh.plate_number})` : b.vehicle_id}</div>
                      {b.flight_number && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          <Plane className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {b.flight_number} ({b.flight_status || 'On time'})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                      {formatMoney(b.total_rwf)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(b.status)}`} />
                        <span>{tr(b.status)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onInspectBooking(b.id, `${b.id} · ${b.client_name}`);
                          setInspectedBooking(b);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{tr('Open')}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inspectedBooking && (
          <ModalShell
            isOpen={!!inspectedBooking}
            onClose={() => setInspectedBooking(null)}
            maxWidthClass="max-w-lg"
            title={`Booking details (${inspectedBooking.id})`}
            subtitle={
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                Viewing is saved in the safety log
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">Client</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {inspectedBooking.client_name}
                </div>
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {inspectedBooking.client_phone}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">Payment</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {inspectedBooking.payment_status}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {inspectedBooking.payment_method}
                </div>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 space-y-1.5 text-sm">
              <div>
                <strong className="font-semibold">Place:</strong> {inspectedBooking.destination}
              </div>
              <div>
                <strong className="font-semibold">Driver step:</strong> {inspectedBooking.dispatch_status}
              </div>
              <div>
                <strong className="font-semibold">Company:</strong> {currentCompany.name}
              </div>
              {inspectedBooking.notes && (
                <div>
                  <strong className="font-semibold">Notes:</strong> {inspectedBooking.notes}
                </div>
              )}
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  // MODULE 9: ALL CARS OVERVIEW
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
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('All cars')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {vehicles.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr('Total across')} {companies.length} {tr('companies')}:{' '}
              {companies.reduce((s, c) => s + (c.vehicle_count || 0), 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Ready now')}</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5">
              {availableCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('Free for trips')}</div>
          </div>
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Booked')}</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums mt-1.5">
              {bookedCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tr('On a trip or reserved')}</div>
          </div>
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('In garage / repairs')}</div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-1.5">
              {maintCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {maintenance.filter((m) => m.status !== 'Completed').length} {tr('active garage jobs')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Car className="w-4 h-4 accent-text" />
              <span>Cars by type</span>
            </h4>
            <div className="space-y-3 text-sm">
              {Object.entries(categoryMap).map(([cat, count]) => {
                const pct = Math.round((count / Math.max(1, vehicles.length)) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between font-mono tabular-nums text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{cat}</span>
                      <span>
                        {count} cars ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full accent-bg" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-3">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Safety & insurance dates</span>
            </h4>
            <div className="space-y-2 text-sm">
              {vehicles.slice(0, 6).map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {v.model_name} · <span className="font-mono text-xs">{v.plate_number}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      Police check: {formatHumanDate(v.controle_technique_expiry || '2027-03-15')} · Insurance:{' '}
                      {formatHumanDate(v.insurance_expiry || '2027-04-01')}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(v.status)}`}>
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

  // MODULE 10: HELP REQUESTS
  if (mode === 'support') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Help requests ({filteredTickets.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <select
              value={ticketAudienceFilter}
              onChange={(e) => setTicketAudienceFilter(e.target.value as any)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="all">Everyone</option>
              <option value="Company">Companies</option>
              <option value="Storefront Customer">Car renters</option>
            </select>
            <select
              value={ticketStatusFilter}
              onChange={(e) => setTicketStatusFilter(e.target.value as any)}
              className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 outline-none"
            >
              <option value="all">All statuses</option>
              {(['New', 'Open', 'In Progress', 'Waiting for User', 'Escalated', 'Resolved', 'Closed'] as SupportTicketStatus[]).map(
                (st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-1.5 max-h-[540px] overflow-y-auto">
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
                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm space-y-1 ${
                    selected
                      ? 'accent-tint'
                      : 'bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono font-semibold text-xs ${selected ? 'accent-text' : 'text-slate-900 dark:text-slate-100'}`}>
                      {t.ticket_ref}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${getStatusDotColor(t.status)}`} />
                      <span>{t.status}</span>
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.issue_category}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {t.requester_type || 'Customer'} · {t.customer_name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
          {!activeTicket ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Pick a help request to read it.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-base text-slate-900 dark:text-slate-100">
                      {activeTicket.ticket_ref}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${getStatusStyles(activeTicket.priority)}`}>
                      {activeTicket.priority}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {activeTicket.requester_type || 'Renter'}
                      {activeTicket.company_name ? ` · ${activeTicket.company_name}` : ''}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {activeTicket.issue_category}
                  </h4>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
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
                    className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold"
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
                    className="bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
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

              <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 text-sm space-y-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Their message</div>
                <p className="text-slate-900 dark:text-slate-100 leading-relaxed">{activeTicket.message}</p>
              </div>

              <div className="space-y-1.5 text-sm">
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Reply to person (they can read this)
                </label>
                <textarea
                  rows={3}
                  value={publicReply}
                  onChange={(e) => setPublicReply(e.target.value)}
                  placeholder="Write your clear answer here..."
                  className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 space-y-2.5 text-sm">
                <div className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2 text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private team notes — only admins see this</span>
                </div>

                {(activeTicket.internal_notes || []).map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-amber-200/70 dark:border-amber-500/20"
                  >
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{n.author}</span>
                      <span className="font-mono">{formatHumanDateTime(n.created_at)}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 mt-1 text-sm">{n.note}</p>
                  </div>
                ))}

                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Add a private note for your team..."
                  className="w-full bg-white dark:bg-[#0f172a] border border-amber-200 dark:border-amber-500/30 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 outline-none"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold accent-bg"
                >
                  <Send className="w-4 h-4" />
                  <span>Save reply & note</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // MODULE 11: MESSAGES & ALERTS
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Saved message templates ({notificationTemplates.length})
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold accent-bg"
            >
              <Plus className="w-4 h-4" />
              <span>New message</span>
            </button>
          </div>

          <div className="space-y-2.5 text-sm">
            {notificationTemplates.map((tpl) => (
              <div key={tpl.id} className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{tpl.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs">
                      {tpl.channel}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingTpl(tpl)}
                    className="text-xs font-semibold accent-text hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-mono text-xs">{tpl.body}</p>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  When sent: <span className="font-mono">{tpl.event_trigger}</span> · Words:{' '}
                  {tpl.variables.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card p-5 space-y-3.5 text-sm">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Mail className="w-4 h-4 accent-text" />
            <span>Send a test message</span>
          </h4>
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Message</label>
            <select
              value={sendTplId}
              onChange={(e) => setSendTplId(e.target.value)}
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
            >
              {notificationTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.channel}] {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Phone or email</label>
            <input
              type="text"
              value={sendRecipient}
              onChange={(e) => setSendRecipient(e.target.value)}
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Company</label>
            <select
              value={sendCompany}
              onChange={(e) => setSendCompany(e.target.value)}
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
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
            className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 accent-bg"
          >
            <Send className="w-4 h-4" />
            <span>Send now</span>
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Shows both when the SMS service accepts it and when the phone receives it.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-xl kf-card overflow-x-auto">
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>Sent messages history ({notificationLogs.length})</span>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Message & type</th>
              <th className="py-3 px-4">Sent to</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-900 dark:text-slate-100">
            {notificationLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold">{log.template_name}</div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{log.channel}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-mono text-xs">{log.recipient}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{log.company_name || 'Direct'}</div>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{log.provider}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(log.status)}`} />
                    <span>{log.status}</span>
                  </span>
                  {log.error_detail && (
                    <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{log.error_detail}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                  {formatHumanDateTime(log.sent_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingTpl && (
        <ModalShell
          isOpen={!!editingTpl}
          onClose={() => setEditingTpl(null)}
          maxWidthClass="max-w-md"
          asForm
          onSubmit={(e) => {
            e.preventDefault();
            if (!editingTpl.name.trim()) return;
            onSaveTemplate(editingTpl);
            setEditingTpl(null);
          }}
          title="Edit message template"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTpl(null)}
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg font-semibold accent-bg cursor-pointer">
                Save message
              </button>
            </div>
          }
        >
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={editingTpl.name}
              onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })}
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">How sent</label>
              <select
                value={editingTpl.channel}
                onChange={(e) => setEditingTpl({ ...editingTpl, channel: e.target.value as any })}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
              >
                <option value="SMS">SMS</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="In-App">In app</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">When sent</label>
              <input
                type="text"
                value={editingTpl.event_trigger}
                onChange={(e) => setEditingTpl({ ...editingTpl, event_trigger: e.target.value })}
                className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
              Message words (supports {'{{name}}'})
            </label>
            <textarea
              rows={4}
              value={editingTpl.body}
              onChange={(e) => setEditingTpl({ ...editingTpl, body: e.target.value })}
              className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-mono"
              required
            />
          </div>
        </ModalShell>
      )}
    </div>
  );
};
