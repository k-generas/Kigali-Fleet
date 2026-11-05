import React, { useState } from 'react';
import { Booking, Driver, Vehicle } from '../types';
import { generateDriverSMS } from '../utils/collision';
import { X, Send, MessageSquare, Check, Phone, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Africa's Talking SMS Dispatch
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Details */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Chauffeur</div>
            <div className="font-bold text-white mt-0.5">{driver.name}</div>
            <div className="text-slate-400 font-mono text-[11px]">{driver.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Vehicle</div>
            <div className="font-bold text-amber-400 font-mono mt-0.5">{vehicle.plate_number}</div>
            <div className="text-slate-400 text-[11px]">{vehicle.model_name}</div>
          </div>
        </div>

        {/* Language Tabs */}
        <div>
          <label className="block text-slate-300 text-xs font-semibold mb-1.5">
            Select Dispatch Language (Rwanda Telecommunication Standards)
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setSelectedLanguage('RW')}
              className={`py-1.5 rounded-md font-semibold transition-all ${
                selectedLanguage === 'RW'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Kinyarwanda (Recommended)
            </button>
            <button
              onClick={() => setSelectedLanguage('EN')}
              className={`py-1.5 rounded-md font-semibold transition-all ${
                selectedLanguage === 'EN'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* SMS Message Preview */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>SMS Payload Preview</span>
            <span className="font-mono text-[10px] text-amber-400">Sender ID: KIGALIFLEET</span>
          </div>
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
            {smsData.messageText}
          </div>
        </div>

        {/* Zero-Data USSD Hook Explanation */}
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="text-emerald-400">Zero-Data USSD Check-In Hook:</strong>
            <p className="text-[11px] text-emerald-200/90">
              Driver dials free shortcode <strong>*134#</strong> to acknowledge the pickup, requiring zero mobile data bundle.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-lg text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSent}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
              isSent
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
          >
            {isSent ? (
              <>
                <Check className="w-4 h-4" />
                <span>Dispatched via Africa's Talking!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send SMS Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
