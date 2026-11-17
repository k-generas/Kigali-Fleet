import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { ColorTheme } from '../../theme';
import { ModalShell } from '../ModalShell';

export function getStatusStyles(status: string): string {
  switch (status) {
    case 'Active':
    case 'Successful':
    case 'Connected':
    case 'Completed':
    case 'Delivered':
    case 'Published':
    case 'Resolved':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-500/20';
    case 'Trial':
    case 'In Progress':
    case 'Investigating':
    case 'Provider Accepted':
    case 'Scheduled':
    case 'Open':
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/70 dark:border-blue-500/20';
    case 'Pending':
    case 'Pending Verification':
    case 'Grace Period':
    case 'Past Due':
    case 'Waiting for User':
    case 'Degraded':
    case 'Warning':
    case 'Draft':
    case 'Queued':
    case 'New':
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-500/20';
    case 'Suspended':
    case 'Failed':
    case 'Disconnected':
    case 'Escalated':
    case 'Critical':
    case 'High':
    case 'Emergency':
    case 'Restricted':
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-500/20';
    case 'Refunded':
    case 'Partially Refunded':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700';
    default:
      return 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700';
  }
}

export function getStatusDotColor(status: string): string {
  switch (status) {
    case 'Active':
    case 'Successful':
    case 'Connected':
    case 'Completed':
    case 'Delivered':
    case 'Published':
    case 'Resolved':
      return 'bg-emerald-500 dark:bg-emerald-400';
    case 'Trial':
    case 'In Progress':
    case 'Investigating':
    case 'Provider Accepted':
    case 'Scheduled':
    case 'Open':
      return 'bg-blue-500 dark:bg-blue-400';
    case 'Pending':
    case 'Pending Verification':
    case 'Grace Period':
    case 'Past Due':
    case 'Waiting for User':
    case 'Degraded':
    case 'Warning':
    case 'Draft':
    case 'Queued':
    case 'New':
      return 'bg-amber-500 dark:bg-amber-400';
    case 'Suspended':
    case 'Failed':
    case 'Disconnected':
    case 'Escalated':
    case 'Critical':
    case 'High':
    case 'Emergency':
    case 'Restricted':
      return 'bg-rose-500 dark:bg-rose-400';
    default:
      return 'bg-slate-400 dark:bg-slate-500';
  }
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number | undefined)[][]) {
  const escape = (val: string | number | undefined) => {
    const str = String(val ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ReasonActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  placeholder?: string;
  danger?: boolean;
  currentTheme: ColorTheme;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export const ReasonActionModal: React.FC<ReasonActionModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  placeholder = 'Write why you are making this change (saved in the history log)...',
  danger = false,
  onCancel,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Please write a short reason (at least 5 letters).');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError(null);
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onCancel();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      maxWidthClass="max-w-md"
      asForm
      onSubmit={handleSubmit}
      icon={
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            danger
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {danger ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
      }
      title={title}
      subtitle={description}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90 cursor-pointer ${
              danger ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'accent-bg'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Reason for this change
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-50/70 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-400/20"
          required
        />
        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">{error}</p>}
      </div>
    </ModalShell>
  );
};
