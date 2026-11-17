import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Sun, Moon, Check, X } from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';
import { useI18n } from '../utils/i18n';

interface ThemeAppearanceMenuProps {
  currentTheme: ColorTheme;
  accentColorId: string;
  onSelectAccentColor: (themeId: string) => void;
  themeMode: 'dark' | 'light';
  onToggleThemeMode: () => void;
  align?: 'left' | 'right';
  className?: string;
}

export const ThemeAppearanceMenu: React.FC<ThemeAppearanceMenuProps> = ({
  currentTheme,
  accentColorId,
  onSelectAccentColor,
  themeMode,
  onToggleThemeMode,
  align = 'right',
  className = '',
}) => {
  const { tr } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right?: number;
    left?: number;
  }>({ top: 0 });
  const [isMobile, setIsMobile] = useState(false);

  const updatePosition = () => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
    setIsMobile(mobile);

    if (triggerRef.current && !mobile) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 340;
      const margin = 12;

      let left: number | undefined;
      let right: number | undefined;

      if (align === 'right') {
        const calculatedRight = window.innerWidth - rect.right;
        if (window.innerWidth - calculatedRight < popoverWidth) {
          left = margin;
          right = undefined;
        } else {
          right = Math.max(margin, calculatedRight);
        }
      } else {
        const calculatedLeft = rect.left;
        if (calculatedLeft + popoverWidth > window.innerWidth) {
          right = margin;
          left = undefined;
        } else {
          left = Math.max(margin, calculatedLeft);
        }
      }

      setDropdownPosition({
        top: rect.bottom + 8,
        left,
        right,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleResize = () => updatePosition();
      const handleScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.closest && target.closest('[data-theme-popover="true"]')) {
          return;
        }
        updatePosition();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, align]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const popoverContent = (
    <div data-theme-popover="true" className="contents">
      <div
        className="fixed inset-0 z-[9998] bg-slate-950/45 backdrop-blur-[1px]"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={
          isMobile
            ? 'fixed inset-x-0 bottom-0 z-[9999] max-h-[85vh] overflow-y-auto rounded-t-xl bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 kf-modal p-5 space-y-4'
            : 'fixed z-[9999] w-[340px] max-h-[88vh] overflow-y-auto rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 kf-modal p-5 space-y-4'
        }
        style={
          !isMobile
            ? {
                top: `${dropdownPosition.top}px`,
                ...(dropdownPosition.right !== undefined ? { right: `${dropdownPosition.right}px` } : {}),
                ...(dropdownPosition.left !== undefined ? { left: `${dropdownPosition.left}px` } : {}),
              }
            : undefined
        }
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              {tr('Screen & Colors')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr('Light or dark mode and accent color')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Light vs Dark */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr('Screen Mode')}
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (themeMode !== 'light') onToggleThemeMode();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                themeMode === 'light'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{tr('Light')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (themeMode !== 'dark') onToggleThemeMode();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                themeMode === 'dark'
                  ? 'bg-white text-slate-900 border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{tr('Dark')}</span>
            </button>
          </div>
        </div>

        {/* 5 Curated Colors */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            {tr('Accent color')}
          </span>

          <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {COLOR_THEMES.map((t) => {
              const isSelected = t.id === currentTheme.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectAccentColor(t.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className="w-[18px] h-[18px] rounded-full shrink-0 border border-black/15 dark:border-white/20"
                    style={{ backgroundColor: themeMode === 'dark' ? t.darkHex : t.hex }}
                  />
                  <span className="flex-1">{t.name}</span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium accent-text">
                      <Check className="w-3.5 h-3.5" />
                      {tr('Selected')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium accent-bg hover:opacity-95 transition-opacity"
          >
            {tr('Done')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updatePosition();
          }
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        title={`${tr('Screen & Colors')}: ${currentTheme.name} · ${themeMode === 'dark' ? tr('Dark') : tr('Light')}`}
        aria-label="Screen and color settings"
        aria-expanded={isOpen}
      >
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 dark:border-white/20"
          style={{ backgroundColor: themeMode === 'dark' ? currentTheme.darkHex : currentTheme.hex }}
        />
        <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="hidden xl:inline">{themeMode === 'dark' ? tr('Dark') : tr('Light')}</span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
};
