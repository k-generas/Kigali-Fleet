import React, { useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Star,
  X,
  Plus,
  Camera,
} from 'lucide-react';
import { VehicleCategory } from '../types';
import {
  CATEGORY_DEFAULT_IMAGES,
  PRESET_CAR_GALLERY,
  MAX_VEHICLE_PHOTOS,
  MAX_GALLERY_TOTAL_CHARS,
  uploadVehiclePhotoFile,
  getGalleryPayloadSize,
} from '../utils/vehicleImages';
import { useI18n } from '../utils/i18n';

interface VehiclePhotoManagerProps {
  category: VehicleCategory;
  photos: string[];
  onChange: (nextPhotos: string[]) => void;
  accentColor?: string;
  companyId?: string;
  vehicleId?: string;
  useCloudStorage?: boolean;
}

export const VehiclePhotoManager: React.FC<VehiclePhotoManagerProps> = ({
  category,
  photos,
  onChange,
  companyId,
  vehicleId,
  useCloudStorage = false,
}) => {
  const { tr } = useI18n();
  const [linkInput, setLinkInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectivePhotos =
    photos.length > 0 ? photos : [CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.LandCruiser];

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    e.target.value = '';
    if (fileList.length === 0) return;

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const current = [...photos];
      let addedCount = 0;

      for (const file of fileList) {
        if (current.length >= MAX_VEHICLE_PHOTOS) {
          setErrorMsg(tr(`Maximum ${MAX_VEHICLE_PHOTOS} photos per car reached.`));
          break;
        }
        const { url } = await uploadVehiclePhotoFile(file, {
          companyId,
          vehicleId,
          useCloudStorage,
        });
        if (url.startsWith('data:')) {
          const projectedSize = getGalleryPayloadSize([...current, url]);
          if (projectedSize > MAX_GALLERY_TOTAL_CHARS) {
            setErrorMsg(tr('Photo storage limit reached for this car. Remove a photo or add fewer photos.'));
            break;
          }
        }
        if (!current.includes(url)) {
          current.push(url);
          addedCount += 1;
        }
      }

      if (addedCount > 0) {
        onChange(current);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || tr('Could not load these photos. Please try JPG or PNG files.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    setErrorMsg(null);

    if (photos.length >= MAX_VEHICLE_PHOTOS) {
      setErrorMsg(tr(`Maximum ${MAX_VEHICLE_PHOTOS} photos per car reached.`));
      return;
    }
    if (!/^https?:\/\/|^\/|^data:image\//i.test(trimmed)) {
      setErrorMsg(tr('Please paste a valid photo link starting with https://'));
      return;
    }
    if (photos.includes(trimmed)) {
      setLinkInput('');
      return;
    }
    onChange([...photos, trimmed]);
    setLinkInput('');
  };

  const handleSetCover = (idx: number) => {
    if (idx <= 0 || idx >= effectivePhotos.length) return;
    const chosen = effectivePhotos[idx];
    const reordered = [chosen, ...effectivePhotos.filter((_, i) => i !== idx)];
    onChange(reordered);
  };

  const handleRemovePhoto = (idx: number) => {
    setErrorMsg(null);
    const next = effectivePhotos.filter((_, i) => i !== idx);
    onChange(next.length > 0 ? next : [CATEGORY_DEFAULT_IMAGES[category]]);
  };

  const handleAddPreset = (url: string) => {
    setErrorMsg(null);
    if (photos.includes(url)) {
      const idx = photos.indexOf(url);
      if (idx > 0) handleSetCover(idx);
      return;
    }
    if (photos.length >= MAX_VEHICLE_PHOTOS) {
      setErrorMsg(tr(`Maximum ${MAX_VEHICLE_PHOTOS} photos per car reached.`));
      return;
    }
    onChange([...photos, url]);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-2 text-sm">
          <ImageIcon className="w-4 h-4 shrink-0 accent-text" />
          <span>{tr('Car Photos (Shown to Customers)')}</span>
        </span>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <span
              className={`w-2 h-2 rounded-full ${
                useCloudStorage ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{useCloudStorage ? tr('Cloud Storage') : tr('Demo Sandbox')}</span>
          </span>

          <span className="font-mono font-medium text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 accent-text" />
            <span>
              {effectivePhotos.length}/{MAX_VEHICLE_PHOTOS} {tr('photos')}
            </span>
          </span>

          <button
            type="button"
            onClick={() => {
              onChange([CATEGORY_DEFAULT_IMAGES[category]]);
              setErrorMsg(null);
            }}
            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{tr('Reset')}</span>
          </button>
        </div>
      </div>

      {/* Gallery Thumbnails Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {effectivePhotos.map((url, idx) => {
          const isCover = idx === 0;
          return (
            <div
              key={`${url.slice(0, 32)}-${idx}`}
              className={`relative h-24 rounded-lg overflow-hidden bg-slate-900 border-2 ${
                isCover ? 'accent-border' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <img
                src={url}
                alt={`${tr('Photo')} ${idx + 1}`}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = CATEGORY_DEFAULT_IMAGES[category];
                }}
                className="w-full h-full object-cover"
              />

              {isCover ? (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-xs font-medium accent-bg inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{tr('Cover')}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetCover(idx)}
                  className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-medium border border-white/20"
                >
                  {tr('Set Cover')}
                </button>
              )}

              {effectivePhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  aria-label={tr('Remove photo')}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-950/80 hover:bg-red-600 text-white flex items-center justify-center border border-white/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {effectivePhotos.length < MAX_VEHICLE_PHOTOS && (
          <label className="h-24 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-1 cursor-pointer text-center p-2 transition-colors">
            <Upload className="w-4 h-4 accent-text" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {isUploading ? tr('Saving...') : tr('Upload Photos')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {tr('Add 1 or more')}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Paste Link Row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={tr('Or paste photo link (https://...)')}
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddLink();
            }
          }}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500"
        />
        <button
          type="button"
          onClick={handleAddLink}
          disabled={!linkInput.trim() || effectivePhotos.length >= MAX_VEHICLE_PHOTOS}
          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Add Photo')}</span>
        </button>
      </div>

      {errorMsg && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{errorMsg}</p>}

      {/* Preset Quick Add Strip */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs text-slate-500 dark:text-slate-400 block">
          {tr('Quick sample photos (tap to add):')}
        </span>
        <div className="grid grid-cols-5 gap-2">
          {PRESET_CAR_GALLERY.map((preset) => {
            const isIncluded = effectivePhotos.includes(preset.url);
            return (
              <button
                key={preset.category}
                type="button"
                onClick={() => handleAddPreset(preset.url)}
                className={`rounded-lg overflow-hidden border-2 transition-opacity text-left relative ${
                  isIncluded
                    ? 'accent-border opacity-100'
                    : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                }`}
                title={preset.label}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-11 object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
