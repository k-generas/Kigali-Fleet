import React, { useState } from 'react';
import { Booking, Driver, Vehicle } from '../types';
import { generateDriverSMS } from '../utils/collision';
import { X, Send, MessageSquare, Check, ShieldCheck } from 'lucide-react';
import { ColorTheme } from '../theme';

interface SMSDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  driver: Driver | null;
  vehicle: Vehicle | null;
  onConfirmDispatch: (bookingId: string, language: 'RW' | 'EN') => void;
  currentTheme?: ColorTheme;
}

export const SMSDispatchModal: React.FC<SMSDispatchModalProps> = ({
  isOpen,
  onClose,
  booking,
  driver,
  vehicle,
  onConfirmDispatch,
  currentTheme,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'RW' | 'EN'>('RW');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !booking || !driver || !vehicle) return null;

  const activeColor = currentTheme?.hex || '#635bff';
  const smsData = generateDriverSMS({
    driver,
    vehicle,
    booking,
    language: selectedLanguage,
  });

  const handleSend = () => {
    onConfirmDispatch(booking.id, selectedLanguage);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-[#0a2540] dark:text-white">
              Send Text to Driver
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm flex items-center justify-between">
          <div>
            <div className="text-[#425466] dark:text-slate-400 font-semibold">Driver</div>
            <div className="font-bold text-[#0a2540] dark:text-white mt-0.5">{driver.name}</div>
            <div className="text-[#425466] dark:text-slate-400 font-mono">{driver.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-[#425466] dark:text-slate-400 font-semibold">Car</div>
            <div className="font-bold text-amber-700 dark:text-amber-400 font-mono mt-0.5">{vehicle.plate_number}</div>
            <div className="text-[#425466] dark:text-slate-400">{vehicle.model_name}</div>
          </div>
        </div>

        <div>
          <label className="block text-[#0a2540] dark:text-slate-200 text-sm font-bold mb-2">
            Pick Language
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f6f9fc] dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-sm">
            <button
              onClick={() => setSelectedLanguage('RW')}
              className={`py-2 rounded-full font-bold transition-all ${
                selectedLanguage === 'RW'
                  ? 'text-white shadow-sm'
                  : 'text-[#425466] dark:text-slate-300'
              }`}
              style={selectedLanguage === 'RW' ? { backgroundColor: activeColor } : undefined}
            >
              Kinyarwanda (Best)
            </button>
            <button
              onClick={() => setSelectedLanguage('EN')}
              className={`py-2 rounded-full font-bold transition-all ${
                selectedLanguage === 'EN'
                  ? 'text-white shadow-sm'
                  : 'text-[#425466] dark:text-slate-300'
              }`}
              style={selectedLanguage === 'EN' ? { backgroundColor: activeColor } : undefined}
            >
              English
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-[#425466] dark:text-slate-400 mb-1.5">
            <span className="font-semibold">Text Message</span>
            <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">From: KIGALIFLEET</span>
          </div>
          <div className="p-4 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-[#0a2540] dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {smsData.messageText}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 text-sm flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Driver dials free <strong>*134#</strong> to say &quot;I got it&quot; — no internet bundle needed.
          </p>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm rounded-full text-[#0a2540] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSent}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full text-white transition-colors shadow-sm ${
              isSent ? 'bg-emerald-600' : ''
            }`}
            style={!isSent ? { backgroundColor: activeColor } : undefined}
          >
            {isSent ? (
              <>
                <Check className="w-4 h-4" />
                <span>Text Sent!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Text Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
