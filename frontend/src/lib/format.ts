/**
 * All display formatting lives here (design.md §3.1 and §6). Formatting only: this file
 * never calculates business metrics (CLAUDE.md R-9). Values arrive from the API.
 *
 * - Money arrives in integer paise (CLAUDE.md R-6) and is shown in rupees, never paise.
 * - Tables: full Indian grouping, "₹4,82,300". Cards and tiles: compact, "₹4.8L" / "₹1.2Cr".
 * - Dates: "12 Aug 2026". Times: 12-hour with am/pm, in the brand's timezone (IST default).
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

const LAKH = 100_000;
const CRORE = 10_000_000;

const rupeeFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const plainNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

const oneDecimal = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) {
    throw new RangeError(`Money must be a finite number of paise, got ${paise}`);
  }
  // Paise are never shown (design.md §3.1 rule 3): round to whole rupees.
  return Math.round(paise / 100);
}

/** ₹ in full Indian grouping, for tables: 48230000 paise → "₹4,82,300". */
export function formatRupees(paise: number): string {
  return rupeeFull.format(paiseToRupees(paise));
}

/**
 * Compact ₹ for cards and tiles, in lakh/crore (never K/M): below ₹1 lakh the full value
 * is shown ("₹82,300"); from ₹1 lakh "₹4.8L"; from ₹1 crore "₹1.2Cr".
 */
export function formatRupeesCompact(paise: number): string {
  const rupees = paiseToRupees(paise);
  const sign = rupees < 0 ? "-" : "";
  const abs = Math.abs(rupees);
  if (abs >= CRORE) return `${sign}₹${oneDecimal.format(roundDown1(abs / CRORE))}Cr`;
  if (abs >= LAKH) {
    const lakhs = roundDown1(abs / LAKH);
    // 99.96 lakh would round to "100L"; show it as crore instead.
    if (lakhs >= 100) return `${sign}₹${oneDecimal.format(1)}Cr`;
    return `${sign}₹${oneDecimal.format(lakhs)}L`;
  }
  return `${sign}₹${plainNumber.format(abs)}`;
}

/** Truncate to one decimal so a compact value never overstates (₹4.86L → ₹4.8L). */
function roundDown1(value: number): number {
  return Math.floor(value * 10 + 1e-9) / 10;
}

/** Whole counts in Indian grouping: 1284 → "1,284", 1234567 → "12,34,567". */
export function formatCount(value: number): string {
  return plainNumber.format(value);
}

/**
 * A percentage the API already computed, with its base (design.md §3.1 rule 5):
 * formatPercent(18.24, 12400, "customers") → "18.2% of 12,400 customers".
 */
export function formatPercent(percent: number, base?: number, noun?: string): string {
  const value = `${oneDecimal.format(percent)}%`;
  if (base === undefined) return value;
  return `${value} of ${formatCount(base)}${noun ? ` ${noun}` : ""}`;
}

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Not a valid date: ${String(value)}`);
  }
  return date;
}

function parts(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions) {
  const out: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-IN", { timeZone, ...options }).formatToParts(
    date,
  )) {
    out[part.type] = part.value;
  }
  return out;
}

// Fixed names: ICU versions differ ("Sep" vs "Sept"); design.md §3.1 uses "12 Aug 2026".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayMonthYear(date: Date, timeZone: string): string {
  const p = parts(date, timeZone, { day: "numeric", month: "numeric", year: "numeric" });
  return `${p.day} ${MONTHS[Number(p.month) - 1]} ${p.year}`;
}

/** "12 Aug 2026" in the brand's timezone. */
export function formatDate(value: DateInput, timeZone: string = DEFAULT_TIMEZONE): string {
  return dayMonthYear(toDate(value), timeZone);
}

/** "3:05 pm" in the brand's timezone (12-hour, lower-case am/pm). */
export function formatTime(value: DateInput, timeZone: string = DEFAULT_TIMEZONE): string {
  const p = parts(toDate(value), timeZone, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${p.hour}:${p.minute} ${(p.dayPeriod ?? "").toLowerCase()}`;
}

/** "12 Aug 2026, 3:05 pm" in the brand's timezone. */
export function formatDateTime(value: DateInput, timeZone: string = DEFAULT_TIMEZONE): string {
  return `${formatDate(value, timeZone)}, ${formatTime(value, timeZone)}`;
}

/** "Wednesday, 5 Nov 2026": the Home header date. */
export function formatLongDate(value: DateInput, timeZone: string = DEFAULT_TIMEZONE): string {
  const date = toDate(value);
  const { weekday } = parts(date, timeZone, { weekday: "long" });
  return `${weekday}, ${dayMonthYear(date, timeZone)}`;
}

/** allauth sends epoch seconds (with fractions); everything else sends ISO strings. */
export function fromEpochSeconds(seconds: number): Date {
  return new Date(seconds * 1000);
}

/** Readable timezone label for pickers: "Asia/Kolkata" → "Asia / Kolkata". */
export function formatTimezoneName(timeZone: string): string {
  return timeZone.replaceAll("_", " ").replaceAll("/", " / ");
}

/** "morning" | "afternoon" | "evening" in the brand's timezone (for the Home greeting). */
export function partOfDay(
  value: DateInput,
  timeZone: string = DEFAULT_TIMEZONE,
): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(
      toDate(value),
    ),
  );
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}
