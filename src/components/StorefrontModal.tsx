import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const activeThemeColor = currentTheme?.hex || '#f59e0b';
  const activeBtnText = currentTheme?.btnText || 'text-slate-950';

  const whatsappMessage = encodeURIComponent(
    `Muraho! Welcome to Kigali Safari & Fleet Rentals. Book 4x4 SUVs, VIP Land Cruisers, and Airport Transfers with instant date confirmation: ${liveUrl || vanityUrl}`
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-950"
              style={{ backgroundColor: activeThemeColor }}
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Live Public Storefront & Client Booking Link
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct customer reservation portal with real-time collision guarding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 space-y-1">
            <div className="font-semibold text-emerald-400">Working Live Browser Link Ready</div>
            <p className="text-[11px] leading-relaxed">
              When you paste this URL into your browser, it opens the standalone customer booking wizard immediately. You can test it in this browser tab or open it directly in a new window.
            </p>
          </div>
        </div>

        {/* 1. Working Live Browser Link Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Direct Working Browser URL</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-mono">Instant Deep Link</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <input
              type="text"
              readOnly
              value={liveUrl}
              className="bg-transparent font-mono text-xs w-full outline-none select-all font-medium"
              style={{ color: activeThemeColor }}
            />
            <button
              onClick={handleCopyLive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-white transition-all shrink-0 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons: Open Directly / Open in New Tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {onNavigateToStorefront && (
            <button
              onClick={() => {
                onNavigateToStorefront();
                onClose();
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95 ${activeBtnText}`}
              style={{ backgroundColor: activeThemeColor }}
            >
              <Globe className="w-4 h-4" />
              <span>Open Storefront in View</span>
            </button>
          )}

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Browser Tab</span>
          </a>
        </div>

        {/* WhatsApp & Social sharing */}
        <div className="pt-1">
          <a
            href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Share to WhatsApp Business (Clients & Safari Tourists)</span>
          </a>
        </div>

        {/* 2. Custom Domain CNAME / Vanity Info */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase">
            <span>Custom White-Label Domain (Production Alias)</span>
            <span className="text-slate-500">DNS CNAME</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-300 font-mono text-xs bg-slate-900 p-2 rounded border border-slate-800/80">
            <span className="truncate">{vanityUrl}</span>
            <button
              onClick={handleCopyVanity}
              className="text-[11px] text-slate-400 hover:text-white shrink-0 px-2 py-0.5 rounded bg-slate-800"
            >
              {copiedVanity ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            For production deployment under your agency's domain (e.g. kigalifleet.rw), point your DNS CNAME record to the Cloud Run application endpoint.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5" style={{ color: activeThemeColor }} />
            <span>Collision Guard Active · Prevents double bookings</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
