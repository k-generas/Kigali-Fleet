export interface ColorTheme {
  id: string;
  name: string;
  hex: string;
  badge: string;
  // Precomputed Tailwind classes for consistent styling
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryLightBg: string;
  primaryLightBorder: string;
  primaryFocusRing: string;
  // Button text color for optimal contrast (dark on bright yellow/amber, light on deep tones)
  btnText: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'amber',
    name: 'Kigali Amber (Gold)',
    hex: '#f59e0b',
    badge: 'Rwanda Sun',
    primaryBg: 'bg-amber-400',
    primaryHoverBg: 'hover:bg-amber-300',
    primaryText: 'text-amber-500 dark:text-amber-400',
    primaryBorder: 'border-amber-400',
    primaryLightBg: 'bg-amber-500/15',
    primaryLightBorder: 'border-amber-500/30',
    primaryFocusRing: 'focus:ring-amber-400 focus:border-amber-400',
    btnText: 'text-slate-950',
  },
  {
    id: 'emerald',
    name: 'Volcanoes Emerald',
    hex: '#10b981',
    badge: 'Virunga Rainforest',
    primaryBg: 'bg-emerald-500',
    primaryHoverBg: 'hover:bg-emerald-400',
    primaryText: 'text-emerald-600 dark:text-emerald-400',
    primaryBorder: 'border-emerald-500',
    primaryLightBg: 'bg-emerald-500/15',
    primaryLightBorder: 'border-emerald-500/30',
    primaryFocusRing: 'focus:ring-emerald-400 focus:border-emerald-400',
    btnText: 'text-white',
  },
  {
    id: 'sky',
    name: 'Rwanda Sky Blue',
    hex: '#0284c7',
    badge: 'National Flag Blue',
    primaryBg: 'bg-sky-500',
    primaryHoverBg: 'hover:bg-sky-400',
    primaryText: 'text-sky-600 dark:text-sky-400',
    primaryBorder: 'border-sky-500',
    primaryLightBg: 'bg-sky-500/15',
    primaryLightBorder: 'border-sky-500/30',
    primaryFocusRing: 'focus:ring-sky-400 focus:border-sky-400',
    btnText: 'text-white',
  },
  {
    id: 'teal',
    name: 'Lake Kivu Teal',
    hex: '#14b8a6',
    badge: 'Lake Waters',
    primaryBg: 'bg-teal-500',
    primaryHoverBg: 'hover:bg-teal-400',
    primaryText: 'text-teal-600 dark:text-teal-400',
    primaryBorder: 'border-teal-500',
    primaryLightBg: 'bg-teal-500/15',
    primaryLightBorder: 'border-teal-500/30',
    primaryFocusRing: 'focus:ring-teal-400 focus:border-teal-400',
    btnText: 'text-slate-950',
  },
  {
    id: 'ochre',
    name: 'Akagera Safari Ochre',
    hex: '#d97706',
    badge: 'Savannah Bronze',
    primaryBg: 'bg-amber-600',
    primaryHoverBg: 'hover:bg-amber-500',
    primaryText: 'text-amber-600 dark:text-amber-500',
    primaryBorder: 'border-amber-600',
    primaryLightBg: 'bg-amber-600/15',
    primaryLightBorder: 'border-amber-600/30',
    primaryFocusRing: 'focus:ring-amber-500 focus:border-amber-500',
    btnText: 'text-white',
  },
  {
    id: 'purple',
    name: 'Royal Umushanana',
    hex: '#8b5cf6',
    badge: 'Highland Royalty',
    primaryBg: 'bg-purple-500',
    primaryHoverBg: 'hover:bg-purple-400',
    primaryText: 'text-purple-600 dark:text-purple-400',
    primaryBorder: 'border-purple-500',
    primaryLightBg: 'bg-purple-500/15',
    primaryLightBorder: 'border-purple-500/30',
    primaryFocusRing: 'focus:ring-purple-400 focus:border-purple-400',
    btnText: 'text-white',
  },
  {
    id: 'indigo',
    name: 'KCC Convention Indigo',
    hex: '#6366f1',
    badge: 'Summit Illumination',
    primaryBg: 'bg-indigo-500',
    primaryHoverBg: 'hover:bg-indigo-400',
    primaryText: 'text-indigo-600 dark:text-indigo-400',
    primaryBorder: 'border-indigo-500',
    primaryLightBg: 'bg-indigo-500/15',
    primaryLightBorder: 'border-indigo-500/30',
    primaryFocusRing: 'focus:ring-indigo-400 focus:border-indigo-400',
    btnText: 'text-white',
  },
  {
    id: 'rose',
    name: 'Kigali Sunset Rose',
    hex: '#f43f5e',
    badge: 'Dusk Coral',
    primaryBg: 'bg-rose-500',
    primaryHoverBg: 'hover:bg-rose-400',
    primaryText: 'text-rose-600 dark:text-rose-400',
    primaryBorder: 'border-rose-500',
    primaryLightBg: 'bg-rose-500/15',
    primaryLightBorder: 'border-rose-500/30',
    primaryFocusRing: 'focus:ring-rose-400 focus:border-rose-400',
    btnText: 'text-white',
  },
  {
    id: 'ruby',
    name: 'Inyambo Ruby',
    hex: '#be123c',
    badge: 'Sacred Heritage',
    primaryBg: 'bg-rose-700',
    primaryHoverBg: 'hover:bg-rose-600',
    primaryText: 'text-rose-700 dark:text-rose-400',
    primaryBorder: 'border-rose-700',
    primaryLightBg: 'bg-rose-700/15',
    primaryLightBorder: 'border-rose-700/30',
    primaryFocusRing: 'focus:ring-rose-600 focus:border-rose-600',
    btnText: 'text-white',
  },
  {
    id: 'forest',
    name: 'Nyungwe Highland Pine',
    hex: '#059669',
    badge: 'Canopy Forest',
    primaryBg: 'bg-emerald-600',
    primaryHoverBg: 'hover:bg-emerald-500',
    primaryText: 'text-emerald-700 dark:text-emerald-400',
    primaryBorder: 'border-emerald-600',
    primaryLightBg: 'bg-emerald-600/15',
    primaryLightBorder: 'border-emerald-600/30',
    primaryFocusRing: 'focus:ring-emerald-500 focus:border-emerald-500',
    btnText: 'text-white',
  },
  {
    id: 'orange',
    name: 'Bugesera Dawn Orange',
    hex: '#ea580c',
    badge: 'Airport Valley Dawn',
    primaryBg: 'bg-orange-500',
    primaryHoverBg: 'hover:bg-orange-400',
    primaryText: 'text-orange-600 dark:text-orange-400',
    primaryBorder: 'border-orange-500',
    primaryLightBg: 'bg-orange-500/15',
    primaryLightBorder: 'border-orange-500/30',
    primaryFocusRing: 'focus:ring-orange-400 focus:border-orange-400',
    btnText: 'text-white',
  },
  {
    id: 'slate',
    name: 'Monochrome Titanium',
    hex: '#64748b',
    badge: 'Minimalist Executive',
    primaryBg: 'bg-slate-500',
    primaryHoverBg: 'hover:bg-slate-400',
    primaryText: 'text-slate-600 dark:text-slate-300',
    primaryBorder: 'border-slate-500',
    primaryLightBg: 'bg-slate-500/15',
    primaryLightBorder: 'border-slate-500/30',
    primaryFocusRing: 'focus:ring-slate-400 focus:border-slate-400',
    btnText: 'text-white',
  },
];

export function getThemeById(themeId: string): ColorTheme {
  return COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
}

export function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export function applyThemeCssVariables(theme: ColorTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.hex);
  root.style.setProperty('--color-primary-rgb', hexToRgb(theme.hex));
}
