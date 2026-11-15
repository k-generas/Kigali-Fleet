import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ColorTheme } from '../../theme';

export function getStatusStyles(status: string): string {
  switch (status) {
    case 'Active':
    case 'Successful':
    case 'Connected':
    case 'Completed':
    case 'Delivered':
    case 'Published':
    case 'Resolved':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
    case 'Trial':
    case 'In Progress':
    case 'Investigating':
    case 'Provider Accepted':
    case 'Scheduled':
    case 'Open':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25';
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
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
    case 'Suspended':
    case 'Failed':
    case 'Disconnected':
    case 'Escalated':
    case 'Critical':
    case 'High':
    case 'Emergency':
    case 'Restricted':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
    case 'Refunded':
    case 'Partially Refunded':
      return 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25';
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
  currentTheme,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="stripe-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                danger
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}
            >
              {danger ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0a2540] dark:text-white">{title}</h3>
              <p className="text-sm text-[#425466] dark:text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setReason('');
              setError(null);
              onCancel();
            }}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#0a2540] dark:text-slate-300 mb-1.5">
              Reason for This Change
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-[#0a2540] dark:text-white outline-none focus:border-amber-500"
              required
            />
            {error && <p className="text-sm text-rose-500 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setReason('');
                setError(null);
                onCancel();
              }}
              className="px-4 py-2 rounded-full text-sm font-semibold text-[#425466] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90 ${
                danger ? 'bg-rose-600 text-white' : currentTheme.btnText
              }`}
              style={!danger ? { backgroundColor: currentTheme.hex } : undefined}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
