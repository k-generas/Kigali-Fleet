import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, Globe, CheckCircle2 } from 'lucide-react';
import { ColorTheme } from '../theme';

interface StorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStorefront?: () => void;
  currentTheme?: ColorTheme;
}

export const StorefrontModal: React.FC<StorefrontModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStorefront,
  currentTheme,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedVanity, setCopiedVanity] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');

  const vanityUrl = 'https://kigalifleet.rw/rent/kigali-safari-express';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname;
      setLiveUrl(`${origin}${pathname}?tab=storefront`);
    } else {
      setLiveUrl('https://kigalifleet.rw/rent/kigali-safari-express');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const activeThemeColor = currentTheme?.hex || '#635bff';

  const whatsappMessage = encodeURIComponent(
    `Muraho! Book your 4x4 SUV, Land Cruiser, or airport ride in Kigali right here: ${liveUrl || vanityUrl}`
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: activeThemeColor }}
            >
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0a2540] dark:text-white tracking-tight">
                Your Booking Website Link
              </h3>
              <p className="text-sm text-[#425466] dark:text-slate-400">
                Share this link so guests can book cars online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold">Ready to Share</div>
            <p className="leading-relaxed">
              Send this link to any customer. They pick dates, choose an open car, and book without double bookings.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#0a2540] dark:text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Your Live Booking Link</span>
          </label>

          <div className="flex items-center gap-2 bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
            <input
              type="text"
              readOnly
              value={liveUrl}
              className="bg-transparent font-mono text-sm w-full outline-none select-all font-medium text-[#0a2540] dark:text-white"
            />
            <button
              onClick={handleCopyLive}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 text-[#0a2540] dark:text-white border border-slate-200 dark:border-slate-700 transition-all shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onNavigateToStorefront && (
            <button
              onClick={() => {
                onNavigateToStorefront();
                onClose();
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-95 shadow-sm"
              style={{ backgroundColor: activeThemeColor }}
            >
              <Globe className="w-4 h-4" />
              <span>Open Booking Page</span>
            </button>
          )}

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0a2540] dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </a>
        </div>

        <a
          href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Share on WhatsApp</span>
        </a>

        <div className="p-4 rounded-xl bg-[#f6f9fc] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
          <div className="flex items-center justify-between text-[#425466] dark:text-slate-400 font-semibold">
            <span>Short Website Address</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-[#0a2540] dark:text-slate-200 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="truncate">{vanityUrl}</span>
            <button
              onClick={handleCopyVanity}
              className="text-sm text-[#0a2540] dark:text-white shrink-0 px-3 py-1 rounded-full bg-[#f6f9fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans font-semibold"
            >
              {copiedVanity ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#0a2540] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
