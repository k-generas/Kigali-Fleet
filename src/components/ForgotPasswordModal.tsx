import React, { useState } from 'react';
import { X, Mail, Phone, ArrowRight, CheckCircle2, ShieldCheck, Radio } from 'lucide-react';
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
  const activeBtnText = currentTheme.btnText;

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Recover Account Access</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">Recovery Dispatch Sent!</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                An Africa&apos;s Talking verification code has been dispatched to{' '}
                <span className="font-mono text-white font-bold">{identifier}</span>. Enter the 6-digit code sent to your
                terminal to reset credentials.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300">
                SMS Preview: &quot;KigaliFleet: Umubare w&apos;ibanga wo gusubiramo konti yawe ni 481-920. Ntuwusangize
                undi muntu.&quot;
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-md ${activeBtnText}`}
                  style={{ backgroundColor: activeColor }}
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered Rwandan business telephone number or email address. We will dispatch a recovery
                code via Africa&apos;s Talking SMS or email.
              </p>

              <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setIdentifier('+250 788 100 201');
                  }}
                  className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
                    method === 'phone' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>SMS (Rwanda)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setIdentifier('owner@kigaliexecutive.rw');
                  }}
                  className={`flex-1 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 ${
                    method === 'email' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Business Email</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {method === 'phone' ? 'Rwanda Mobile Number' : 'Business Email Address'}
                </label>
                <input
                  type={method === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 ${activeBtnText}`}
                  style={{ backgroundColor: activeColor }}
                >
                  <span>Dispatch Recovery Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
