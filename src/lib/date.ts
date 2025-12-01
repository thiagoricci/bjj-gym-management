import { format, toDate, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Formats a date string or Date object to a localized string based on the provided timezone.
 * If no timezone is provided, it defaults to UTC to avoid "one day behind" issues caused by local browser time.
 * 
 * @param date - The date to format (string or Date object)
 * @param timezone - The timezone to format the date in (e.g., 'America/Los_Angeles'). Defaults to 'UTC'.
 * @param formatStr - The format string (default: 'PPP')
 * @returns The formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  timezone?: string,
  formatStr: string = "PPP"
): string {
  if (!date) return "";

  try {
    // Handle YYYY-MM-DD strings specifically to avoid timezone shifts
    // This ensures dates like birth dates and join dates are displayed exactly as stored
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return format(localDate, formatStr);
    }

    // Ensure timezone is valid, default to user's local timezone if null/undefined/empty
    const tz = timezone || getLocalTimezone();

    // Convert string to Date object if needed
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    const zonedDate = toZonedTime(dateObj, tz);
    
    return format(zonedDate, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Gets the user's local timezone.
 * @returns The local timezone string (e.g., 'America/New_York')
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
/**
 * Gets the current date in the specified timezone as a YYYY-MM-DD string.
 * @param timezone - The timezone to get the date for (default: 'UTC')
 * @returns The date string (e.g., '2023-12-25')
 */
export function getTodayInTimezone(timezone?: string): string {
  const now = new Date();
  const tz = timezone || getLocalTimezone();
  const zonedDate = toZonedTime(now, tz);
  return format(zonedDate, "yyyy-MM-dd");
}

/**
 * Gets the current day of the week (0-6) in the specified timezone.
 * @param timezone - The timezone to get the day for (default: 'UTC')
 * @returns The day of the week (0 = Sunday, 1 = Monday, etc.)
 */
export function getDayOfWeekInTimezone(timezone?: string): number {
  const now = new Date();
  const tz = timezone || getLocalTimezone();
  const zonedDate = toZonedTime(now, tz);
  return zonedDate.getDay();
}

/**
 * Gets the start of the current week (Monday) in the specified timezone as a YYYY-MM-DD string.
 * @param timezone - The timezone to get the date for (default: 'UTC')
 * @returns The date string (e.g., '2023-12-25')
 */
export function getWeekStartInTimezone(timezone?: string): string {
  const now = new Date();
  const tz = timezone || getLocalTimezone();
  const zonedDate = toZonedTime(now, tz);
  const start = startOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday start
  return format(start, "yyyy-MM-dd");
}