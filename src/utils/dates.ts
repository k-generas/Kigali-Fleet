const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseIsoDateParts(dateStr?: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Formats YYYY-MM-DD (or ISO string) into full human date: "4 Nov 2026"
 */
export function formatHumanDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parts = parseIsoDateParts(dateStr);
  if (!parts) return dateStr;
  return `${parts.day} ${MONTHS_SHORT[parts.month - 1]} ${parts.year}`;
}

/**
 * Formats YYYY-MM-DD into day + month without year: "4 Nov"
 */
export function formatHumanDateShort(dateStr?: string): string {
  if (!dateStr) return '—';
  const parts = parseIsoDateParts(dateStr);
  if (!parts) return dateStr;
  return `${parts.day} ${MONTHS_SHORT[parts.month - 1]}`;
}

/**
 * Formats a date range cleanly:
 * - Same month & year: "4 to 12 Nov" (or "4 to 12 Nov 2026" if includeYear is true)
 * - Different month, same year: "30 Oct to 3 Nov"
 * - Different years: "28 Dec 2026 to 3 Jan 2027"
 * - Same day: "4 Nov 2026"
 */
export function formatHumanDateRange(
  startStr?: string,
  endStr?: string,
  options?: { includeYear?: boolean }
): string {
  const s = parseIsoDateParts(startStr);
  const e = parseIsoDateParts(endStr);
  if (!s && !e) return '—';
  if (s && !e) return formatHumanDate(startStr);
  if (!s && e) return formatHumanDate(endStr);
  if (!s || !e) return '—';

  const includeYear = options?.includeYear ?? false;
  if (s.year === e.year && s.month === e.month && s.day === e.day) {
    return `${s.day} ${MONTHS_SHORT[s.month - 1]}${includeYear ? ` ${s.year}` : ''}`;
  }
  if (s.year === e.year && s.month === e.month) {
    return `${s.day} to ${e.day} ${MONTHS_SHORT[s.month - 1]}${includeYear ? ` ${s.year}` : ''}`;
  }
  if (s.year === e.year) {
    return `${s.day} ${MONTHS_SHORT[s.month - 1]} to ${e.day} ${MONTHS_SHORT[e.month - 1]}${
      includeYear ? ` ${s.year}` : ''
    }`;
  }
  return `${s.day} ${MONTHS_SHORT[s.month - 1]} ${s.year} to ${e.day} ${MONTHS_SHORT[e.month - 1]} ${e.year}`;
}

/**
 * Formats ISO datetime or date string into "10 Nov, 10:30"
 */
export function formatHumanDateTime(isoOrDate?: string): string {
  if (!isoOrDate) return '—';
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) {
    return formatHumanDate(isoOrDate);
  }
  const day = d.getDate();
  const mon = MONTHS_SHORT[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (isoOrDate.length <= 10) {
    return `${day} ${mon} ${d.getFullYear()}`;
  }
  return `${day} ${mon}, ${hh}:${mm}`;
}

/**
 * Signed days difference: (targetDate - refDate) in whole calendar days.
 * Positive = days remaining in future. Negative = days past.
 */
export function daysDiffFromRef(targetDateStr?: string, refDateStr?: string): number | null {
  const t = parseIsoDateParts(targetDateStr);
  if (!t) return null;
  let r: { year: number; month: number; day: number };
  if (refDateStr) {
    const parsed = parseIsoDateParts(refDateStr);
    if (!parsed) return null;
    r = parsed;
  } else {
    const now = new Date();
    r = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }
  const tMs = Date.UTC(t.year, t.month - 1, t.day);
  const rMs = Date.UTC(r.year, r.month - 1, r.day);
  return Math.round((tMs - rMs) / (1000 * 60 * 60 * 24));
}

export function formatExpiryStatus(
  dateStr?: string,
  refDateStr?: string
): { text: string; level: 'ok' | 'attention' | 'problem'; daysLeft: number | null } {
  if (!dateStr) {
    return { text: 'Not set', level: 'attention', daysLeft: null };
  }
  const diff = daysDiffFromRef(dateStr, refDateStr);
  if (diff === null) {
    return { text: dateStr, level: 'ok', daysLeft: null };
  }
  if (diff < 0) {
    return {
      text: `Expired ${formatHumanDate(dateStr)}`,
      level: 'problem',
      daysLeft: diff,
    };
  }
  if (diff === 0) {
    return { text: 'Expires today', level: 'attention', daysLeft: 0 };
  }
  if (diff <= 14) {
    return {
      text: `Expires in ${diff} ${diff === 1 ? 'day' : 'days'}`,
      level: 'attention',
      daysLeft: diff,
    };
  }
  return {
    text: `Valid to ${formatHumanDate(dateStr)}`,
    level: 'ok',
    daysLeft: diff,
  };
}

export function formatDueStatus(
  dateStr?: string,
  refDateStr?: string
): { text: string; isLate: boolean; isToday: boolean } {
  if (!dateStr) return { text: 'No due date', isLate: false, isToday: false };
  const diff = daysDiffFromRef(dateStr, refDateStr);
  if (diff === null) return { text: dateStr, isLate: false, isToday: false };
  if (diff < 0) {
    const lateDays = Math.abs(diff);
    return {
      text: `Due ${formatHumanDateShort(dateStr)}, ${lateDays} ${lateDays === 1 ? 'day' : 'days'} late`,
      isLate: true,
      isToday: false,
    };
  }
  if (diff === 0) {
    return { text: 'Due today', isLate: false, isToday: true };
  }
  if (diff === 1) {
    return { text: 'Due tomorrow', isLate: false, isToday: false };
  }
  return { text: `Due ${formatHumanDateShort(dateStr)}`, isLate: false, isToday: false };
}
