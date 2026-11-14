import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Sun, Moon, Check, X } from 'lucide-react';
import { ColorTheme, COLOR_THEMES } from '../theme';

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
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right?: number;
    left?: number;
  }>({ top: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Measure viewport and trigger rect
  const updatePosition = () => {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
    setIsMobile(mobile);

    if (triggerRef.current && !mobile) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 340; // width of popover
      const margin = 12;

      let left: number | undefined;
      let right: number | undefined;

      if (align === 'right') {
        const calculatedRight = window.innerWidth - rect.right;
        // Ensure it doesn't overflow off the left of screen
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
        // If scrolling inside the popover itself, ignore. Otherwise close or update
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

  // Handle escape key
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
      {/* Click-outside backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-2xs transition-opacity animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Popover Container: Bottom Sheet on Mobile, Anchored Dropdown on Desktop */}
      <div
        className={
          isMobile
            ? 'fixed inset-x-0 bottom-0 z-[9999] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-bottom duration-200'
            : 'fixed z-[9999] w-[340px] max-h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150'
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
        {/* Mobile Pull Handle Indicator */}
        {isMobile && (
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Appearance & Colors
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Personalize dashboard theme & mode
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Interface Background Mode: Dark vs Light Switcher */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Theme Mode
          </span>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (themeMode !== 'dark') onToggleThemeMode();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs border border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark Mode</span>
              {themeMode === 'dark' && <Check className="w-3 h-3 text-emerald-400 ml-auto" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (themeMode !== 'light') onToggleThemeMode();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                themeMode === 'light'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light Mode</span>
              {themeMode === 'light' && <Check className="w-3 h-3 text-emerald-500 ml-auto" />}
            </button>
          </div>
        </div>

        {/* 2. System Accent Palette (12 Regional Rwandan Colors) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              System Color Palette (12 Themes)
            </span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold truncate max-w-[140px]"
              style={{
                backgroundColor: `${currentTheme.hex}22`,
                color: currentTheme.hex,
              }}
            >
              {currentTheme.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-56 sm:max-h-48 overflow-y-auto pr-1">
            {COLOR_THEMES.map((t) => {
              const isSelected = t.id === accentColorId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectAccentColor(t.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800/90 border-slate-400 dark:border-slate-600 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: t.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 stroke-[3] ${
                          t.btnText === 'text-white' ? 'text-white' : 'text-slate-950'
                        }`}
                      />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {t.name}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                      {t.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Live Preview Chip */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400 font-medium">Applied Instantly</span>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono"
              style={{
                backgroundColor: `${currentTheme.hex}22`,
                color: currentTheme.hex,
              }}
            >
              {currentTheme.hex}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-md text-[10px] font-bold shadow-xs transition-opacity hover:opacity-90"
              style={{
                backgroundColor: currentTheme.hex,
                color: currentTheme.btnText === 'text-white' ? '#fff' : '#020617',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Unified Small Icon Button: Palette + Sun/Moon indicator in ONE compact trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isOpen) {
            updatePosition();
          }
          setIsOpen(!isOpen);
        }}
        className="relative flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs group cursor-pointer"
        title={`Appearance: ${currentTheme.name} · ${themeMode === 'dark' ? 'Dark' : 'Light'} Mode`}
        aria-label="Appearance settings"
        aria-expanded={isOpen}
      >
        <div className="relative flex items-center justify-center">
          <Palette
            className="w-4 h-4 transition-transform group-hover:scale-110"
            style={{ color: currentTheme.hex }}
          />
          {/* Micro indicator badge showing current mode */}
          <span
            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-xs"
            style={{ backgroundColor: themeMode === 'dark' ? '#0f172a' : '#fef08a' }}
          >
            {themeMode === 'dark' ? (
              <Moon className="w-1.5 h-1.5 text-amber-400" />
            ) : (
              <Sun className="w-1.5 h-1.5 text-amber-600" />
            )}
          </span>
        </div>
      </button>

      {/* Render popover in document.body via Portal to prevent any parent clipping or overflow traps */}
      {isOpen && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
};
