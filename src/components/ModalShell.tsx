import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

let activeModalCount = 0;
let previousBodyOverflow = '';

/**
 * Registers Escape-to-close and safe body scroll locking for any modal overlay.
 */
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (typeof document !== 'undefined') {
      if (activeModalCount === 0) {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      activeModalCount += 1;
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        activeModalCount = Math.max(0, activeModalCount - 1);
        if (activeModalCount === 0) {
          document.body.style.overflow = previousBodyOverflow;
        }
      }
    };
  }, [isOpen]);
}

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  bodyClassName?: string;
  asForm?: boolean;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  printFullscreen?: boolean;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerActions,
  footer,
  maxWidthClass = 'max-w-lg',
  bodyClassName = 'p-5 sm:p-6 space-y-4 text-sm',
  asForm = false,
  onSubmit,
  children,
  printFullscreen = false,
}) => {
  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const cardClasses = [
    'relative w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl kf-modal',
    'max-h-[92dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden my-auto text-slate-900 dark:text-slate-100',
    maxWidthClass,
    printFullscreen
      ? 'print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none print:max-h-none print:overflow-visible'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const innerContent = (
    <>
      {/* Pinned Header — always stays visible and provides a clear Close (X) button */}
      <div
        className={`px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#111827] ${
          printFullscreen ? 'print:hidden' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerActions}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${bodyClassName} ${
          printFullscreen ? 'print:max-h-none print:overflow-visible' : ''
        }`}
      >
        {children}
      </div>

      {/* Optional Pinned Footer */}
      {footer && (
        <div
          className={`px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 dark:bg-slate-900/70 border-t border-slate-200/80 dark:border-slate-800 shrink-0 ${
            printFullscreen ? 'print:hidden' : ''
          }`}
        >
          {footer}
        </div>
      )}
    </>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-[70] bg-slate-950/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-2 sm:p-4 overflow-y-auto ${
        printFullscreen ? 'print:p-0 print:bg-white print:block print:overflow-visible' : ''
      }`}
    >
      {asForm ? (
        <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className={cardClasses}>
          {innerContent}
        </form>
      ) : (
        <div onClick={(e) => e.stopPropagation()} className={cardClasses}>
          {innerContent}
        </div>
      )}
    </div>
  );
};
