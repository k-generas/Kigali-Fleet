import React from 'react';
import { ColorTheme } from '../theme';
import { AppCurrency, AppLanguage, useI18n } from '../utils/i18n';

interface LocaleCurrencySwitcherProps {
  currentTheme: ColorTheme;
  compact?: boolean;
  className?: string;
}

export const LocaleCurrencySwitcher: React.FC<LocaleCurrencySwitcherProps> = ({
  compact = false,
  className = '',
}) => {
  const { currency, setCurrency, language, setLanguage } = useI18n();
  const padBtn = compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      {/* Currency Switcher: RWF | USD ($) */}
      <div
        role="group"
        aria-label="Currency selector"
        className="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
      >
        {(['RWF', 'USD'] as AppCurrency[]).map((curr) => {
          const isActive = currency === curr;
          return (
            <button
              key={curr}
              type="button"
              onClick={() => setCurrency(curr)}
              className={`${padBtn} rounded-md font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'accent-bg shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {curr === 'USD' ? 'USD ($)' : 'RWF'}
            </button>
          );
        })}
      </div>

      {/* Language Switcher: EN | RW | FR */}
      <div
        role="group"
        aria-label="Language selector"
        className="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80"
      >
        {(['EN', 'RW', 'FR'] as AppLanguage[]).map((lang) => {
          const isActive = language === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`${padBtn} rounded-md font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang}
            </button>
          );
        })}
      </div>
    </div>
  );
};
