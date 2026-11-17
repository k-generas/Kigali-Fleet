import React, { useState } from 'react';
import { Mail, Phone, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ColorTheme } from '../theme';
import { useI18n } from '../utils/i18n';
import { ModalShell } from './ModalShell';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ColorTheme;
  onSendResetEmail?: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSendResetEmail,
}) => {
  const { tr } = useI18n();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setIsSent(false);
    setErrorMessage(null);
    setIsLoading(false);
    onClose();
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage(tr('Please enter your email address or phone number.'));
      return;
    }

    if (method === 'email' && onSendResetEmail) {
      setIsLoading(true);
      const result = await onSendResetEmail(identifier.trim());
      setIsLoading(false);
      if (!result.success) {
        setErrorMessage(result.error || tr('Could not send reset email. Please check the address.'));
        return;
      }
    }

    setIsSent(true);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      maxWidthClass="max-w-md"
      icon={
        <span className="w-8 h-8 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </span>
      }
      title={tr('Reset Your Password')}
      bodyClassName="p-5 sm:p-6 space-y-4 text-sm"
    >
      {isSent ? (
        <div className="py-2 space-y-4">
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                {method === 'email' ? tr('Reset Link Sent!') : tr('Code Sent!')}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {method === 'email'
                  ? tr('Check your email inbox (and spam folder) for your password reset link sent to')
                  : tr('We sent a 6-digit code to')}{' '}
                <span className="font-mono text-slate-900 dark:text-white font-semibold">{identifier}</span>.
              </p>
            </div>
          </div>

          {method === 'phone' && (
            <div className="p-3.5 rounded-lg bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
              {tr('Text preview')}: &quot;KigaliFleet: {tr('Your reset code is')} 481-920.&quot;
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg text-sm font-medium accent-bg hover:opacity-95 transition-opacity"
            >
              {tr('Back to Sign In')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSendReset} className="space-y-4 text-sm">
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {tr('Enter your account email to receive a password reset link, or preview SMS recovery.')}
          </p>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setIdentifier('');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                method === 'email'
                  ? 'accent-bg font-medium shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{tr('Email')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setIdentifier('+250 788 100 201');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                method === 'phone'
                  ? 'accent-bg font-medium shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{tr('Phone Text')}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {method === 'phone' ? tr('Phone Number') : tr('Email Address')}
            </label>
            <input
              type={method === 'phone' ? 'tel' : 'email'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={method === 'phone' ? '+250 788 000 000' : 'name@company.rw'}
              className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 font-mono"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {tr('Cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium accent-bg flex items-center gap-1.5 hover:opacity-95 disabled:opacity-50"
            >
              <span>{isLoading ? tr('Sending...') : method === 'email' ? tr('Send Reset Link') : tr('Send Code')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
};
