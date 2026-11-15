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
        className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-2xs transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        className={
          isMobile
            ? 'fixed inset-x-0 bottom-0 z-[9999] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4'
            : 'fixed z-[9999] w-[340px] max-h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4'
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
        {isMobile && (
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1 mb-2" />
        )}

        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: currentTheme.hex }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0a2540] dark:text-white">
                Screen & Colors
              </h4>
              <p className="text-sm text-[#425466] dark:text-slate-400">
                Pick light or dark and your favorite color
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Light vs Dark */}
        <div className="space-y-1.5">
          <span className="text-sm font-bold text-[#0a2540] dark:text-slate-200">
            Screen Mode
          </span>
          <div className="grid grid-cols-2 gap-2 bg-[#f6f9fc] dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (themeMode !== 'light') onToggleThemeMode();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                themeMode === 'light'
                  ? 'bg-white text-[#0a2540] shadow-xs border border-slate-200'
                  : 'text-[#425466] dark:text-slate-400 hover:text-[#0a2540] dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light</span>
              {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (themeMode !== 'dark') onToggleThemeMode();
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                themeMode === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs border border-slate-700'
                  : 'text-[#425466] hover:text-[#0a2540] dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-amber-400" />
              <span>Dark</span>
              {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#0a2540] dark:text-slate-200">
              Pick a Color
            </span>
            <span
              className="text-sm px-2 py-0.5 rounded-full font-semibold truncate max-w-[150px]"
              style={{
                backgroundColor: `${currentTheme.hex}20`,
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
                  className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-[#f6f9fc] dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-xs'
                      : 'border-transparent hover:bg-[#f6f9fc] dark:hover:bg-slate-800/50'
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
                    <div className="text-sm font-bold text-[#0a2540] dark:text-slate-200 truncate">
                      {t.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 rounded-full text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95"
            style={{ backgroundColor: currentTheme.hex }}
          >
            Done
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
        className="relative flex items-center justify-center p-2.5 rounded-full bg-[#f6f9fc] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0a2540] dark:text-slate-200 transition-all shadow-xs group cursor-pointer"
        title={`Colors & Screen: ${currentTheme.name} · ${themeMode === 'dark' ? 'Dark' : 'Light'}`}
        aria-label="Screen and color settings"
        aria-expanded={isOpen}
      >
        <div className="relative flex items-center justify-center">
          <Palette
            className="w-4 h-4 transition-transform group-hover:scale-110"
            style={{ color: currentTheme.hex }}
          />
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

      {isOpen && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
};
