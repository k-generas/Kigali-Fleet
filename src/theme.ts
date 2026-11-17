export interface ColorTheme {
  id: string;
  name: string;
  hex: string;
  darkHex: string;
  badge: string;
  barBg: string;
  barInk: string;
  accentRule: string;
  // Precomputed Tailwind classes for consistent light & dark styling
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryLightBg: string;
  primaryLightBorder: string;
  primaryFocusRing: string;
  btnText: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'lake-kivu',
    name: 'Lake Kivu',
    hex: '#0b6e8a',
    darkHex: '#6cc4dd',
    badge: 'Calm teal-blue',
    barBg: '#e6f2f5',
    barInk: '#14181f',
    accentRule: '#0b6e8a',
    primaryBg: 'bg-[#0b6e8a] dark:bg-[#6cc4dd]',
    primaryHoverBg: 'hover:bg-[#095a71] dark:hover:bg-[#8cd2e6]',
    primaryText: 'text-[#0b6e8a] dark:text-[#6cc4dd]',
    primaryBorder: 'border-[#0b6e8a] dark:border-[#6cc4dd]',
    primaryLightBg: 'bg-[#e6f2f5] dark:bg-[#0b6e8a]/20',
    primaryLightBorder: 'border-[#0b6e8a]/30 dark:border-[#6cc4dd]/35',
    primaryFocusRing: 'focus:ring-[#0b6e8a] focus:border-[#0b6e8a]',
    btnText: 'text-white dark:text-[#0f141d]',
  },
  {
    id: 'rwanda-sky',
    name: 'Rwanda Sky',
    hex: '#0a6fb3',
    darkHex: '#60b6f5',
    badge: 'Clear blue',
    barBg: '#e8f3fb',
    barInk: '#0b1f2e',
    accentRule: '#0a6fb3',
    primaryBg: 'bg-[#0a6fb3] dark:bg-[#60b6f5]',
    primaryHoverBg: 'hover:bg-[#085c94] dark:hover:bg-[#7fc5f8]',
    primaryText: 'text-[#0a6fb3] dark:text-[#60b6f5]',
    primaryBorder: 'border-[#0a6fb3] dark:border-[#60b6f5]',
    primaryLightBg: 'bg-[#e8f3fb] dark:bg-[#0a6fb3]/20',
    primaryLightBorder: 'border-[#0a6fb3]/30 dark:border-[#60b6f5]/35',
    primaryFocusRing: 'focus:ring-[#0a6fb3] focus:border-[#0a6fb3]',
    btnText: 'text-white dark:text-[#0f141d]',
  },
  {
    id: 'imigongo',
    name: 'Imigongo Black',
    hex: '#1a1a1a',
    darkHex: '#e8ecf3',
    badge: 'Flat black & rust',
    barBg: '#ffffff',
    barInk: '#1a1a1a',
    accentRule: '#9c5a2b',
    primaryBg: 'bg-[#1a1a1a] dark:bg-[#e8ecf3]',
    primaryHoverBg: 'hover:bg-[#2c313a] dark:hover:bg-white',
    primaryText: 'text-[#14181f] dark:text-[#e8ecf3]',
    primaryBorder: 'border-[#1a1a1a] dark:border-[#e8ecf3]',
    primaryLightBg: 'bg-slate-100 dark:bg-slate-800/60',
    primaryLightBorder: 'border-slate-200 dark:border-slate-700',
    primaryFocusRing: 'focus:ring-[#1a1a1a] focus:border-[#1a1a1a] dark:focus:ring-[#e8ecf3]',
    btnText: 'text-white dark:text-[#14181f]',
  },
  {
    id: 'jacaranda',
    name: 'Jacaranda',
    hex: '#5b3fa0',
    darkHex: '#b49df2',
    badge: 'Kigali blossom',
    barBg: '#efeaf8',
    barInk: '#14181f',
    accentRule: '#5b3fa0',
    primaryBg: 'bg-[#5b3fa0] dark:bg-[#b49df2]',
    primaryHoverBg: 'hover:bg-[#4a3285] dark:hover:bg-[#c7b5f7]',
    primaryText: 'text-[#5b3fa0] dark:text-[#b49df2]',
    primaryBorder: 'border-[#5b3fa0] dark:border-[#b49df2]',
    primaryLightBg: 'bg-[#efeaf8] dark:bg-[#5b3fa0]/20',
    primaryLightBorder: 'border-[#5b3fa0]/30 dark:border-[#b49df2]/35',
    primaryFocusRing: 'focus:ring-[#5b3fa0] focus:border-[#5b3fa0]',
    btnText: 'text-white dark:text-[#0f141d]',
  },
  {
    id: 'kigali-amber',
    name: 'Kigali Amber',
    hex: '#9a4e00',
    darkHex: '#f59e0b',
    badge: 'Burnt ochre',
    barBg: '#fff3d6',
    barInk: '#14181f',
    accentRule: '#9a4e00',
    primaryBg: 'bg-[#9a4e00] dark:bg-[#f59e0b]',
    primaryHoverBg: 'hover:bg-[#7d3f00] dark:hover:bg-[#fbbf24]',
    primaryText: 'text-[#8a4b00] dark:text-[#f59e0b]',
    primaryBorder: 'border-[#9a4e00] dark:border-[#f59e0b]',
    primaryLightBg: 'bg-[#fff3d6] dark:bg-[#9a4e00]/25',
    primaryLightBorder: 'border-[#9a4e00]/30 dark:border-[#f59e0b]/35',
    primaryFocusRing: 'focus:ring-[#9a4e00] focus:border-[#9a4e00]',
    btnText: 'text-white dark:text-[#14181f]',
  },
];

const LEGACY_THEME_MAP: Record<string, string> = {
  teal: 'lake-kivu',
  emerald: 'lake-kivu',
  forest: 'lake-kivu',
  sky: 'rwanda-sky',
  slate: 'imigongo',
  ruby: 'imigongo',
  rose: 'imigongo',
  purple: 'jacaranda',
  indigo: 'jacaranda',
  amber: 'kigali-amber',
  ochre: 'kigali-amber',
  orange: 'kigali-amber',
};

export function getThemeById(themeId: string): ColorTheme {
  const mappedId = LEGACY_THEME_MAP[themeId] || themeId;
  return COLOR_THEMES.find((t) => t.id === mappedId) || COLOR_THEMES[0];
}

export function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export function applyThemeCssVariables(theme: ColorTheme, mode?: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = mode ? mode === 'dark' : root.classList.contains('dark');
  const activeHex = isDark ? theme.darkHex : theme.hex;
  const btnInk = isDark ? '#0f141d' : '#ffffff';

  root.style.setProperty('--color-primary', activeHex);
  root.style.setProperty('--color-primary-text', activeHex);
  root.style.setProperty('--color-primary-btn-bg', activeHex);
  root.style.setProperty('--color-primary-btn-ink', btnInk);
  root.style.setProperty('--color-primary-rule', theme.accentRule);
  root.style.setProperty('--color-primary-rgb', hexToRgb(activeHex));
}
