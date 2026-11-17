import React, { useState, useEffect } from 'react';
import { Booking, Driver, Vehicle } from '../types';
import { generateDriverSMS } from '../utils/collision';
import { useI18n } from '../utils/i18n';
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
  currentTheme: _currentTheme,
}) => {
  const { language, tr } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<'RW' | 'EN'>(language === 'EN' ? 'EN' : 'RW');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (language === 'EN' || language === 'RW') {
      setSelectedLanguage(language);
    }
  }, [language]);

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
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg accent-tint accent-text flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr('Send Text to Driver')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={tr('Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/40 rounded-lg flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">{tr('Driver')}</div>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{driver.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">{driver.phone}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">{tr('Car')}</div>
              <div className="font-semibold accent-text font-mono mt-0.5">{vehicle.plate_number}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{vehicle.model_name}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              {tr('Pick Language')}
            </label>
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedLanguage('RW')}
                className={`py-2 rounded-md transition-colors ${
                  selectedLanguage === 'RW'
                    ? 'accent-bg font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tr('Kinyarwanda (Best)')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage('EN')}
                className={`py-2 rounded-md transition-colors ${
                  selectedLanguage === 'EN'
                    ? 'accent-bg font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-300">{tr('Text Message')}</span>
              <span className="font-mono accent-text font-medium">{tr('From')}: KIGALIFLEET</span>
            </div>
            <div className="p-3.5 bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {smsData.messageText}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-100 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {tr('Driver dials free *134# to confirm — no internet bundle needed.')}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
          >
            {tr('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSent}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-opacity ${
              isSent ? 'bg-emerald-600 text-white' : 'accent-bg hover:opacity-95'
            }`}
          >
            {isSent ? (
              <>
                <Check className="w-4 h-4" />
                <span>{tr('Text Sent!')}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{tr('Send Text Now')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
