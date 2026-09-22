import {
  CalendarDays,
  CheckCircle2,
  Inbox,
  LayoutList,
  LineChart,
  ListChecks,
  Repeat2,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  /** i18n key — labels localize automatically via t() */
  labelKey: string;
  path: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.today", path: "/today", icon: CalendarDays },
  { labelKey: "nav.inbox", path: "/inbox", icon: Inbox },
  { labelKey: "nav.tasks", path: "/tasks", icon: ListChecks },
  { labelKey: "nav.projects", path: "/projects", icon: LayoutList },
  { labelKey: "nav.processes", path: "/processes", icon: Repeat2 },
  { labelKey: "nav.calendar", path: "/calendar", icon: CalendarDays },
  { labelKey: "nav.habits", path: "/habits", icon: CheckCircle2 },
  { labelKey: "nav.goals", path: "/goals", icon: Target },
  { labelKey: "nav.progress", path: "/progress", icon: LineChart },
  { labelKey: "nav.settings", path: "/settings", icon: Settings },
];
