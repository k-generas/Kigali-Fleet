import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, MessageSquare, ExternalLink, Globe, CheckCircle2 } from 'lucide-react';
import { ColorTheme } from '../theme';
import { Company } from '../types';
import { useI18n } from '../utils/i18n';
import { ModalShell } from './ModalShell';

interface StorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStorefront?: () => void;
  currentTheme?: ColorTheme;
  currentCompany?: Company;
}

export const StorefrontModal: React.FC<StorefrontModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStorefront,
  currentCompany,
}) => {
  const { tr } = useI18n();
  const [copied, setCopied] = useState(false);
  const [copiedVanity, setCopiedVanity] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');

  const companyKey = currentCompany?.slug || currentCompany?.id || 'kigali-executive';
  const vanityUrl = `https://kigalifleet.rw/rent/${companyKey}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      const companyQuery = companyKey ? `&company=${encodeURIComponent(companyKey)}` : '';
      setLiveUrl(`${origin}${pathname}?tab=storefront${companyQuery}`);
    } else {
      setLiveUrl(vanityUrl);
    }
  }, [isOpen, companyKey, vanityUrl]);

  const handleCopyLive = () => {
    if (liveUrl) {
      navigator.clipboard?.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleCopyVanity = () => {
    navigator.clipboard?.writeText(vanityUrl);
    setCopiedVanity(true);
    setTimeout(() => setCopiedVanity(false), 2200);
  };

  const whatsappMessage = encodeURIComponent(
    `${tr('Muraho! Book your 4x4 SUV, Land Cruiser, or airport ride in Kigali right here:')} ${liveUrl || vanityUrl}`
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      icon={
        <div className="w-9 h-9 rounded-lg flex items-center justify-center accent-bg shrink-0">
          <Share2 className="w-4 h-4" />
        </div>
      }
      title={tr('Your Booking Website Link')}
      subtitle={tr('Share this link so guests can book cars online')}
      bodyClassName="p-5 sm:p-6 space-y-5 text-sm"
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {tr('Close')}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-900 dark:text-white space-y-0.5">
          <div className="font-semibold text-sm">{tr('Ready to Share')}</div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {tr('Send this link to any customer. They pick dates, choose an open car, and book without double bookings.')}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{tr('Your Live Booking Link')}</span>
        </label>

        <div className="flex items-center gap-2 bg-slate-50/90 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
          <input
            type="text"
            readOnly
            value={liveUrl}
            className="bg-transparent font-mono text-xs w-full outline-none select-all text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleCopyLive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">{tr('Copied!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{tr('Copy Link')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {onNavigateToStorefront && (
          <button
            type="button"
            onClick={() => {
              onNavigateToStorefront();
              onClose();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm accent-bg hover:opacity-95 transition-opacity"
          >
            <Globe className="w-4 h-4" />
            <span>{tr('Open Booking Page')}</span>
          </button>
        )}

        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>{tr('Open in New Tab')}</span>
        </a>
      </div>

      <a
        href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span>{tr('Share on WhatsApp')}</span>
      </a>

      <div className="p-4 rounded-lg bg-slate-50/90 dark:bg-slate-800/40 space-y-2">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {tr('Short Website Address')}
        </div>
        <div className="flex items-center justify-between gap-2 text-slate-800 dark:text-slate-200 font-mono text-xs bg-white dark:bg-[#0f172a] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="truncate">{vanityUrl}</span>
          <button
            type="button"
            onClick={handleCopyVanity}
            className="text-xs text-slate-700 dark:text-slate-200 shrink-0 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {copiedVanity ? tr('Copied') : tr('Copy')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
