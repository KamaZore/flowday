import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Recurrence } from "./types";

/** Format a Date to a local yyyy-MM-dd string (not UTC). */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toLocalDateKey(new Date());
}

/** Parse a yyyy-MM-dd key to a local Date at midnight. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysKey(key: string, days: number): string {
  return toLocalDateKey(addDays(parseDateKey(key), days));
}

export function formatDateKey(key: string, fmt: string = "EEE, MMM d"): string {
  return format(parseDateKey(key), fmt);
}

export function formatTime(time?: string): string {
  if (!time) return "";
  const [hStr, m] = time.split(":");
  const h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

export function isOverdue(dueDate?: string, completed = false): boolean {
  if (!dueDate || completed) return false;
  return dueDate < todayKey();
}

export function recurrenceMatches(
  rec: Recurrence | undefined,
  dateKey: string,
): boolean {
  if (!rec) return false;
  const date = parseDateKey(dateKey);
  const dow = date.getDay();
  switch (rec.type) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekly":
      if (rec.weekdays && rec.weekdays.length > 0) {
        return rec.weekdays.includes(dow);
      }
      return true;
    case "monthly":
      return date.getDate() === rec.dayOfMonth;
  }
}

/** Return weekday indices (0-6) the recurrence is active, or null for monthly. */
export function recurrenceWeekdays(rec: Recurrence): number[] | null {
  switch (rec.type) {
    case "daily":
      return [0, 1, 2, 3, 4, 5, 6];
    case "weekdays":
      return [1, 2, 3, 4, 5];
    case "weekly":
      return rec.weekdays && rec.weekdays.length > 0 ? rec.weekdays : null;
    case "monthly":
      return null;
  }
}

export function recurrenceLabel(rec: Recurrence | undefined): string {
  if (!rec) return "No repeat";
  switch (rec.type) {
    case "daily":
      return "Every day";
    case "weekdays":
      return "Weekdays";
    case "weekly": {
      const wd = rec.weekdays ?? [];
      if (wd.length === 0) return "Weekly";
      if (wd.length === 7) return "Every day";
      return wd
        .slice()
        .sort()
        .map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
        .join(", ");
    }
    case "monthly":
      return `Monthly on day ${rec.dayOfMonth}`;
  }
}

/** Build a month grid (weeks of Date objects) for the calendar view. */
export function buildMonthGrid(
  monthDate: Date,
  weekStartsMonday: boolean,
): Date[][] {
  const start = startOfWeek(startOfMonth(monthDate), {
    weekStartsOn: weekStartsMonday ? 1 : 0,
  });
  const end = endOfWeek(endOfMonth(monthDate), {
    weekStartsOn: weekStartsMonday ? 1 : 0,
  });
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function weekdayHeaders(weekStartsMonday: boolean): string[] {
  const base = ["S", "M", "T", "W", "T", "F", "S"];
  return weekStartsMonday ? [...base.slice(1), base[0]] : base;
}

/** Days of a month that a habit with this recurrence is scheduled. */
export function habitScheduledThisMonth(
  rec: Recurrence,
  monthDate: Date,
): string[] {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  return eachDayOfInterval({ start, end })
    .filter((d) => recurrenceMatches(rec, toLocalDateKey(d)))
    .map(toLocalDateKey);
}

export function isInRange(dateKey: string, start?: string, end?: string) {
  if (start && isBefore(parseDateKey(dateKey), parseDateKey(start))) return false;
  if (end && isAfter(parseDateKey(dateKey), parseDateKey(end))) return false;
  return true;
}

export { isSameDay, format, parseISO };
