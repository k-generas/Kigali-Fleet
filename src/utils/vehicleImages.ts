import { Vehicle, VehicleCategory } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../firebase';

export const MAX_VEHICLE_PHOTOS = 6;
export const MAX_SINGLE_PHOTO_CHARS = 115000;
export const MAX_GALLERY_TOTAL_CHARS = 820000;

export const CATEGORY_DEFAULT_IMAGES: Record<VehicleCategory, string> = {
  LandCruiser: '/assets/images/hero_safari_landcruiser_1794311457296.jpg',
  RAV4: '/assets/images/car_toyota_rav4_1794311458980.jpg',
  'Safari Van': '/assets/images/car_safari_van_1794311459444.jpg',
  Coaster: '/assets/images/car_coaster_bus_1794792526002.jpg',
  'Luxury Sedan': '/assets/images/car_luxury_sedan_1794792526061.jpg',
};

export const PRESET_CAR_GALLERY: Array<{
  category: VehicleCategory;
  label: string;
  url: string;
}> = [
  {
    category: 'LandCruiser',
    label: '4x4 Prado / V8',
    url: CATEGORY_DEFAULT_IMAGES.LandCruiser,
  },
  {
    category: 'RAV4',
    label: 'RAV4 SUV',
    url: CATEGORY_DEFAULT_IMAGES.RAV4,
  },
  {
    category: 'Safari Van',
    label: 'Safari Van',
    url: CATEGORY_DEFAULT_IMAGES['Safari Van'],
  },
  {
    category: 'Coaster',
    label: 'Coaster Bus',
    url: CATEGORY_DEFAULT_IMAGES.Coaster,
  },
  {
    category: 'Luxury Sedan',
    label: 'VIP Sedan',
    url: CATEGORY_DEFAULT_IMAGES['Luxury Sedan'],
  },
];

export const VEHICLE_FEATURE_OPTIONS: string[] = [
  '4WD / 4x4',
  'Air Conditioning',
  'Pop-Up Safari Roof',
  'Bluetooth & USB',
  'Free Wi-Fi Ready',
  'Child Seat Ready',
  'Unlimited Rwanda km',
  'First-Aid & Spare Tire',
  '220V Camera Charger',
  'Leather VIP Seats',
];

export function getVehicleImageUrl(
  vehicle: Pick<Vehicle, 'image_url' | 'gallery_urls' | 'category'>
): string {
  const gallery = getVehicleGalleryImages(vehicle);
  return gallery[0] || CATEGORY_DEFAULT_IMAGES[vehicle.category] || CATEGORY_DEFAULT_IMAGES.LandCruiser;
}

/**
 * Returns a deduplicated list of photos for a car (cover photo first, followed by extra photos),
 * always guaranteeing at least one fallback category photo.
 */
export function getVehicleGalleryImages(
  vehicle: Pick<Vehicle, 'image_url' | 'gallery_urls' | 'category'>
): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const pushUnique = (raw?: string) => {
    const val = raw?.trim();
    if (!val || seen.has(val)) return;
    seen.add(val);
    ordered.push(val);
  };

  pushUnique(vehicle.image_url);
  if (Array.isArray(vehicle.gallery_urls)) {
    for (const url of vehicle.gallery_urls) {
      pushUnique(url);
      if (ordered.length >= MAX_VEHICLE_PHOTOS) break;
    }
  }

  if (ordered.length === 0) {
    ordered.push(CATEGORY_DEFAULT_IMAGES[vehicle.category] || CATEGORY_DEFAULT_IMAGES.LandCruiser);
  }

  return ordered.slice(0, MAX_VEHICLE_PHOTOS);
}

/**
 * Normalizes a gallery list so `image_url` stays synced with the cover photo (index 0)
 * and `gallery_urls` stays cleanly bounded within Firestore rules & 1MB doc safety.
 */
export function normalizeVehicleGallery(
  gallery: string[],
  category: VehicleCategory
): { image_url: string; gallery_urls: string[] } {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of gallery) {
    const val = raw?.trim();
    if (!val || seen.has(val)) continue;
    seen.add(val);
    cleaned.push(val);
    if (cleaned.length >= MAX_VEHICLE_PHOTOS) break;
  }
  if (cleaned.length === 0) {
    cleaned.push(CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.LandCruiser);
  }
  return {
    image_url: cleaned[0],
    gallery_urls: cleaned,
  };
}

/**
 * Estimates total character weight of all photos in a vehicle gallery
 * to stay comfortably below Firestore's 1MB document ceiling.
 */
export function getGalleryPayloadSize(gallery: string[]): number {
  return gallery.reduce((sum, url) => sum + (url?.length || 0), 0);
}

/**
 * Returns a helpful plain-language description fallback if an owner has not added custom copy yet.
 */
export function getVehicleCustomerSummary(vehicle: Vehicle): string {
  const custom = vehicle.description?.trim();
  if (custom) return custom;

  const gearText = (vehicle.transmission || 'Automatic').toLowerCase();
  const fuelText = (vehicle.fuel_type || 'Diesel').toLowerCase();
  const seats = vehicle.seating_capacity || 5;

  switch (vehicle.category) {
    case 'LandCruiser':
      return `Strong ${seats}-seat 4x4 (${gearText}, ${fuelText}) built for smooth Kigali business trips and Rwanda national park safaris. Plenty of space for suitcases and gear.`;
    case 'RAV4':
      return `Easy-to-drive ${seats}-seat SUV (${gearText}, ${fuelText}) ideal for Kigali city meetings, Lake Kivu road trips, and weekend drives across Rwanda.`;
    case 'Safari Van':
      return `Spacious ${seats}-seat safari van (${gearText}, ${fuelText}) with wide windows and gear room—great for wildlife parks, group tours, and photography.`;
    case 'Coaster':
      return `Comfortable ${seats}-seat group bus (${gearText}, ${fuelText}) with air conditioning for conferences, NGO teams, weddings, and large tour groups.`;
    case 'Luxury Sedan':
      return `Quiet ${seats}-seat executive sedan (${gearText}, ${fuelText}) with plush cabin comfort for VIP airport pickups, hotel transfers, and business meetings.`;
    default:
      return `Clean, safety-checked ${seats}-seat car (${gearText}, ${fuelText}) ready for city rides or trips across Rwanda.`;
  }
}

/**
 * Resize and compress a user-selected car photo on an HTML5 canvas
 * so multiple photos stay fast in browser storage and safely under Firestore's 1MB document cap.
 */
export async function compressVehicleImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a photo file (JPG, PNG, or WebP).');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read this photo file.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read this photo file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Photo format could not be opened.'));
    image.src = dataUrl;
  });

  const maxW = 760;
  const maxH = 570;
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser could not resize the photo.');
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const qualities = [0.74, 0.6, 0.46, 0.34];
  for (const q of qualities) {
    const output = canvas.toDataURL('image/jpeg', q);
    if (output.length <= MAX_SINGLE_PHOTO_CHARS) {
      return output;
    }
  }

  // Final smaller fallback if still oversized
  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = Math.round(targetW * 0.65);
  smallCanvas.height = Math.round(targetH * 0.65);
  const sCtx = smallCanvas.getContext('2d');
  if (sCtx) {
    sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
    return smallCanvas.toDataURL('image/jpeg', 0.48);
  }

  return canvas.toDataURL('image/jpeg', 0.34);
}

/**
 * Compresses an image onto an HTML5 canvas as a crisp JPEG Blob (max 1200x900)
 * suitable for Firebase Cloud Storage CDN hosting.
 */
async function compressVehicleImageBlob(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a photo file (JPG, PNG, or WebP).');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read this photo file.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read this photo file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Photo format could not be opened.'));
    image.src = dataUrl;
  });

  const maxW = 1200;
  const maxH = 900;
  const scale = Math.min(1, maxW / img.width, maxH / img.height);
  const targetW = Math.max(1, Math.round(img.width * scale));
  const targetH = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser could not resize the photo.');
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not convert photo to JPEG.'));
        }
      },
      'image/jpeg',
      0.82
    );
  });
}

/**
 * Uploads a vehicle photo to Firebase Cloud Storage when in Live Mode with an authenticated user,
 * or falls back cleanly to a compressed local preview when in Demo Sandbox mode or if upload fails.
 */
export async function uploadVehiclePhotoFile(
  file: File,
  options: { companyId?: string; vehicleId?: string; useCloudStorage?: boolean } = {}
): Promise<{ url: string; usedStorage: boolean }> {
  const { companyId = 'comp-kigali-exec', vehicleId = 'draft', useCloudStorage = true } = options;

  if (useCloudStorage && auth.currentUser) {
    try {
      const safeCompany = companyId.replace(/[^a-zA-Z0-9_-]/g, '') || 'company';
      const safeVehicle = vehicleId.replace(/[^a-zA-Z0-9_-]/g, '') || 'draft';
      const rand = Math.random().toString(36).slice(2, 8);
      const blob = await compressVehicleImageBlob(file);
      const storageRef = ref(storage, `vehicles/${safeCompany}/${safeVehicle}/${Date.now()}-${rand}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { url: downloadUrl, usedStorage: true };
    } catch (err) {
      console.warn('Cloud Storage upload fallback to compressed inline JPEG:', err);
    }
  }

  const compressedUrl = await compressVehicleImageFile(file);
  return { url: compressedUrl, usedStorage: false };
}

