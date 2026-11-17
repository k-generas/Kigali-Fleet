import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera, Maximize2, X } from 'lucide-react';
import { Vehicle } from '../types';
import { CATEGORY_DEFAULT_IMAGES, getVehicleGalleryImages } from '../utils/vehicleImages';
import { useI18n } from '../utils/i18n';

interface VehiclePhotoGalleryProps {
  vehicle: Pick<Vehicle, 'id' | 'model_name' | 'category' | 'image_url' | 'gallery_urls'>;
  aspectClass?: string;
  showThumbnails?: boolean;
  compactThumbnails?: boolean;
  enableLightbox?: boolean;
  accentColor?: string;
  onImageClick?: () => void;
  topLeftSlot?: React.ReactNode;
  topRightSlot?: React.ReactNode;
  bottomLeftSlot?: React.ReactNode;
}

export const VehiclePhotoGallery: React.FC<VehiclePhotoGalleryProps> = ({
  vehicle,
  aspectClass = 'h-48',
  showThumbnails = true,
  compactThumbnails = false,
  enableLightbox = true,
  onImageClick,
  topLeftSlot,
  topRightSlot,
  bottomLeftSlot,
}) => {
  const { tr } = useI18n();
  const photos = getVehicleGalleryImages(vehicle);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setIsLightboxOpen(false);
  }, [vehicle.id]);

  const safeIndex = activeIndex >= photos.length ? 0 : activeIndex;
  const activeSrc = photos[safeIndex] || CATEGORY_DEFAULT_IMAGES[vehicle.category];
  const hasMultiple = photos.length > 1;

  // Keyboard navigation + Esc close when lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setActiveIndex((prev) => (prev + 1) % photos.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isLightboxOpen, photos.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const handleMainImageClick = () => {
    if (onImageClick) {
      onImageClick();
    } else if (enableLightbox) {
      setIsLightboxOpen(true);
    }
  };

  const isMainClickable = Boolean(onImageClick || enableLightbox);

  return (
    <div className="space-y-2">
      <div
        onClick={isMainClickable ? handleMainImageClick : undefined}
        className={`relative ${aspectClass} bg-slate-900 overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-800 ${
          isMainClickable ? 'cursor-pointer group' : ''
        }`}
      >
        <img
          src={activeSrc}
          alt={`${vehicle.model_name} - ${safeIndex + 1}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[vehicle.category];
          }}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {(topLeftSlot || topRightSlot) && (
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10 pointer-events-none">
            <div className="pointer-events-auto">{topLeftSlot}</div>
            <div className="pointer-events-auto">{topRightSlot}</div>
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label={tr('Previous photo')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-[2px] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={tr('Next photo')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-[2px] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {(bottomLeftSlot || hasMultiple || enableLightbox) && (
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
            <div>{bottomLeftSlot}</div>
            <div className="flex items-center gap-1.5">
              {hasMultiple && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/75 border border-white/15 backdrop-blur-[2px] text-xs font-mono font-medium text-white">
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {safeIndex + 1}/{photos.length}
                  </span>
                </div>
              )}
              {enableLightbox && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  aria-label={tr('Enlarge photos')}
                  title={tr('Enlarge photos')}
                  className="w-7 h-7 rounded-md bg-slate-950/75 hover:bg-slate-950 border border-white/15 backdrop-blur-[2px] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Thumbnail Strip (used on Details modals / Car Page) */}
      {showThumbnails && hasMultiple && (
        <div className="grid grid-cols-6 gap-2">
          {photos.map((url, idx) => {
            const isSelected = idx === safeIndex;
            return (
              <button
                key={`${url.slice(0, 40)}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                aria-label={`${tr('Photo')} ${idx + 1}`}
                className={`relative h-14 rounded-lg overflow-hidden border-2 transition-opacity bg-slate-900 cursor-pointer ${
                  isSelected
                    ? 'accent-border opacity-100'
                    : 'opacity-70 hover:opacity-100 border-slate-200 dark:border-slate-700'
                }`}
              >
                <img
                  src={url}
                  alt={`${vehicle.model_name} ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[vehicle.category];
                  }}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Compact Thumbnail Strip (used on Booking Website cards so visitors explore exterior & interior photos right away) */}
      {!showThumbnails && compactThumbnails && hasMultiple && (
        <div className="flex items-center gap-1.5 px-1">
          {photos.map((url, idx) => {
            const isSelected = idx === safeIndex;
            return (
              <button
                key={`compact-${url.slice(0, 32)}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                aria-label={`${tr('Photo')} ${idx + 1}`}
                className={`relative flex-1 max-w-[56px] h-10 rounded-md overflow-hidden border-2 transition-all bg-slate-900 cursor-pointer ${
                  isSelected
                    ? 'accent-border opacity-100'
                    : 'opacity-65 hover:opacity-100 border-slate-200 dark:border-slate-700'
                }`}
              >
                <img
                  src={url}
                  alt={`${vehicle.model_name} ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[vehicle.category];
                  }}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={vehicle.model_name}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between text-white pb-3"
          >
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-semibold truncate">{vehicle.model_name}</h4>
              <span className="text-xs font-mono text-slate-300">
                {tr('Photo')} {safeIndex + 1} / {photos.length} · {tr('Press Esc to close')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label={tr('Close')}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl flex-1 flex items-center justify-center min-h-[260px] max-h-[72vh]"
          >
            <img
              src={activeSrc}
              alt={`${vehicle.model_name} - ${safeIndex + 1}`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[vehicle.category];
              }}
              className="max-w-full max-h-[70vh] rounded-xl object-contain bg-slate-900 border border-white/10"
            />
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={tr('Previous photo')}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={tr('Next photo')}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl pt-3 flex items-center justify-center gap-2 overflow-x-auto"
            >
              {photos.map((url, idx) => {
                const isSelected = idx === safeIndex;
                return (
                  <button
                    key={`lb-${url.slice(0, 32)}-${idx}`}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`${tr('Photo')} ${idx + 1}`}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-opacity cursor-pointer ${
                      isSelected ? 'border-white opacity-100' : 'border-white/25 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${vehicle.model_name} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
