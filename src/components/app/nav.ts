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
  label: string;
  path: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Today", path: "/today", icon: CalendarDays },
  { label: "Inbox", path: "/inbox", icon: Inbox },
  { label: "Tasks", path: "/tasks", icon: ListChecks },
  { label: "Projects", path: "/projects", icon: LayoutList },
  { label: "Processes", path: "/processes", icon: Repeat2 },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Habits", path: "/habits", icon: CheckCircle2 },
  { label: "Goals", path: "/goals", icon: Target },
  { label: "Progress", path: "/progress", icon: LineChart },
  { label: "Settings", path: "/settings", icon: Settings },
];
