import { addDaysKey, toLocalDateKey, todayKey } from "./date-utils";
import type { Priority, Recurrence } from "./types";

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  wednes: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  thur: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

function nextWeekday(dow: number, today: Date): string {
  const current = today.getDay();
  let diff = (dow - current + 7) % 7;
  if (diff === 0) diff = 7;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return toLocalDateKey(d);
}

export type ParsedCapture = {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: Priority;
  recurrence?: Recurrence;
  tagNames: string[];
  matched: string[]; // matched text segments for highlighting
};

/**
 * Parse natural language quick capture text like:
 * "Call John tomorrow 3pm !high #errands every weekday"
 */
export function parseCapture(input: string): ParsedCapture {
  let text = input.trim();
  const matched: string[] = [];
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  let priority: Priority | undefined;
  let recurrence: Recurrence | undefined;
  const tagNames: string[] = [];

  // Tags: #word
  text = text.replace(/#([\w-]+)/g, (_, tag: string) => {
    tagNames.push(tag.toLowerCase());
    return "";
  });

  // Priority: !high / !h / !1
  text = text.replace(/!(high|med|medium|low|h|1|2|3)\b/i, (m, p: string) => {
    const v = p.toLowerCase();
    priority =
      v === "high" || v === "h" || v === "1"
        ? "high"
        : v === "low" || v === "3"
          ? "low"
          : "medium";
    matched.push(m);
    return "";
  });

  // Explicit date: yyyy-MM-dd
  text = text.replace(/\b(\d{4}-\d{2}-\d{2})\b/, (m, d: string) => {
    dueDate = d;
    matched.push(m);
    return "";
  });

  // Time: 3pm, 15:30, 3:30pm
  text = text.replace(
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
    (m, h: string, min: string | undefined, ap: string) => {
      let hour = parseInt(h, 10) % 12;
      if (ap.toLowerCase() === "pm") hour += 12;
      dueTime = `${String(hour).padStart(2, "0")}:${min ?? "00"}`;
      matched.push(m);
      return "";
    },
  );
  if (!dueTime) {
    text = text.replace(
      /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/,
      (m, h: string, min: string) => {
        dueTime = `${h.padStart(2, "0")}:${min}`;
        matched.push(m);
        return "";
      },
    );
  }

  // Recurrence
  if (/\bevery ?day\b|\bdaily\b/i.test(text)) {
    recurrence = { type: "daily" };
    text = text.replace(/\bevery ?day\b|\bdaily\b/i, (m) => {
      matched.push(m);
      return "";
    });
  }
  if (!recurrence && /\bevery weekday\b|\bweekdays\b/i.test(text)) {
    recurrence = { type: "weekdays" };
    text = text.replace(/\bevery weekday\b|\bweekdays\b/i, (m) => {
      matched.push(m);
      return "";
    });
  }
  // "every monday" — a specific weekday recurrence (checked before generic "weekly")
  if (!recurrence && /\b(every|each)\s+(mon|tue|wed|thu|fri|sat|sun)\w*/i.test(text)) {
    const days: number[] = [];
    text = text.replace(
      /\b(?:every|each)\s+((?:mon|tue|wed|thu|fri|sat|sun)\w*)/gi,
      (_m, dayWord: string) => {
        const key = dayWord.toLowerCase().slice(0, 3);
        if (WEEKDAYS[key] !== undefined) days.push(WEEKDAYS[key]);
        return "";
      },
    );
    if (days.length > 0) recurrence = { type: "weekly", weekdays: days };
  }
  if (!recurrence && /\bevery week\b|\bweekly\b/i.test(text)) {
    recurrence = { type: "weekly", weekdays: [] };
    text = text.replace(/\bevery week\b|\bweekly\b/i, (m) => {
      matched.push(m);
      return "";
    });
  }

  if (!recurrence && /\b(?:next\s+|on\s+|this\s+|last\s+)?(?:sunday|monday|tuesday|tues|wednesday|weds|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sun)\b/i.test(text)) {
    // bare weekday mention like "next monday" or "on friday"
    const days: number[] = [];
    text = text.replace(
      /\b((?:next\s+|on\s+|this\s+|last\s+)?(?:mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)\w*)\b/gi,
      (m, word: string) => {
        const key = word.toLowerCase().replace(/^(next|on|this|last)\s+/, "").slice(0, 4);
        const norm = key.slice(0, 3);
        if (WEEKDAYS[norm] !== undefined && /next|on|this|s$|day/i.test(word)) {
          days.push(WEEKDAYS[norm]);
          matched.push(m);
          return "";
        }
        return m;
      },
    );
    if (days.length > 0) {
      const today = new Date();
      const dow = days[0];
      // If the weekday is today, use today; otherwise next occurrence
      const todayDow = today.getDay();
      if (dow === todayDow && !/next/i.test(input)) {
        dueDate = toLocalDateKey(today);
      } else {
        dueDate = nextWeekday(dow, today);
      }
    }
  }

  // Tomorrow / today / tonight
  if (/\btomorrow\b|\btmrw?\b/i.test(text)) {
    dueDate = addDaysKey(todayKey(), 1);
    text = text.replace(/\btomorrow\b|\btmrw?\b/i, (m) => {
      matched.push(m);
      return " ";
    });
  } else if (/\btoday\b/i.test(text)) {
    dueDate = todayKey();
    text = text.replace(/\btoday\b/i, (m) => {
      matched.push(m);
      return " ";
    });
  } else if (/\btonight\b/i.test(text)) {
    dueDate = todayKey();
    dueTime = dueTime ?? "20:00";
    text = text.replace(/\btonight\b/i, (m) => {
      matched.push(m);
      return " ";
    });
  }

  // next week
  if (!dueDate && /\bnext week\b/i.test(text)) {
    dueDate = addDaysKey(todayKey(), 7);
    text = text.replace(/\bnext week\b/i, (m) => {
      matched.push(m);
      return " ";
    });
  }

  const title = text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();

  return { title, dueDate, dueTime, priority, recurrence, tagNames, matched };
}
