import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Vehicle } from '../types';
import { CATEGORY_DEFAULT_IMAGES, getVehicleGalleryImages } from '../utils/vehicleImages';
import { useI18n } from '../utils/i18n';

interface VehiclePhotoGalleryProps {
  vehicle: Pick<Vehicle, 'id' | 'model_name' | 'category' | 'image_url' | 'gallery_urls'>;
  aspectClass?: string;
  showThumbnails?: boolean;
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
  onImageClick,
  topLeftSlot,
  topRightSlot,
  bottomLeftSlot,
}) => {
  const { tr } = useI18n();
  const photos = getVehicleGalleryImages(vehicle);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [vehicle.id]);

  const safeIndex = activeIndex >= photos.length ? 0 : activeIndex;
  const activeSrc = photos[safeIndex] || CATEGORY_DEFAULT_IMAGES[vehicle.category];
  const hasMultiple = photos.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="space-y-2.5">
      <div
        onClick={onImageClick}
        className={`relative ${aspectClass} bg-slate-900 overflow-hidden rounded-lg border border-slate-200/80 dark:border-slate-800 ${
          onImageClick ? 'cursor-pointer' : ''
        }`}
      >
        <img
          src={activeSrc}
          alt={`${vehicle.model_name} - ${safeIndex + 1}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[vehicle.category];
          }}
          className="w-full h-full object-cover object-center"
        />

        {(topLeftSlot || topRightSlot) && (
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
            <div>{topLeftSlot}</div>
            <div>{topRightSlot}</div>
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label={tr('Previous photo')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-[2px] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={tr('Next photo')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 text-white flex items-center justify-center border border-white/15 backdrop-blur-[2px] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {(bottomLeftSlot || hasMultiple) && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
            <div>{bottomLeftSlot}</div>
            {hasMultiple && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/75 border border-white/15 backdrop-blur-[2px] text-xs font-mono font-medium text-white">
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {safeIndex + 1}/{photos.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

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
                className={`relative h-14 rounded-lg overflow-hidden border-2 transition-opacity bg-slate-900 ${
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
    </div>
  );
};
