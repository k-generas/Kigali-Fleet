import React, { useState } from 'react';
import { X, Mail, Phone, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ColorTheme } from '../theme';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ColorTheme;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
}) => {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('+250 788 100 201');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const activeColor = currentTheme.hex;

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-[#0a2540] dark:text-white text-lg">Reset Your Password</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isSent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#0a2540] dark:text-white text-lg">Code Sent!</h4>
              <p className="text-sm text-[#425466] dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                We sent a 6-digit code to{' '}
                <span className="font-mono text-[#0a2540] dark:text-white font-bold">{identifier}</span>. Use it to pick a new password.
              </p>
              <div className="p-3.5 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-amber-700 dark:text-amber-300">
                Text preview: &quot;KigaliFleet: Your reset code is 481-920. Keep it private.&quot;
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-full text-sm font-bold text-white shadow-sm hover:opacity-95"
                  style={{ backgroundColor: activeColor }}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-4 text-sm">
              <p className="text-[#425466] dark:text-slate-300 leading-relaxed">
                Type your phone number or email. We will send you a code to reset your password.
              </p>

              <div className="flex items-center gap-2 p-1 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setIdentifier('+250 788 100 201');
                  }}
                  className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 font-bold ${
                    method === 'phone'
                      ? 'text-white shadow-sm'
                      : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                  }`}
                  style={method === 'phone' ? { backgroundColor: activeColor } : undefined}
                >
                  <Phone className="w-4 h-4" />
                  <span>Phone Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setIdentifier('owner@kigaliexecutive.rw');
                  }}
                  className={`flex-1 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 font-bold ${
                    method === 'email'
                      ? 'text-white shadow-sm'
                      : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
                  }`}
                  style={method === 'email' ? { backgroundColor: activeColor } : undefined}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-[#0a2540] dark:text-slate-200 mb-1.5">
                  {method === 'phone' ? 'Phone Number' : 'Email Address'}
                </label>
                <input
                  type={method === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-[#0a2540] dark:text-white outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-[#425466] dark:text-slate-300 hover:text-[#0a2540] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-sm flex items-center gap-1.5 hover:opacity-95"
                  style={{ backgroundColor: activeColor }}
                >
                  <span>Send Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
