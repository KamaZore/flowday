export type ID = string;

export type Priority = "low" | "medium" | "high";

export type TaskStatus =
  | "inbox"
  | "todo"
  | "in_progress"
  | "waiting"
  | "completed";

export type ProjectStatus = "planning" | "active" | "paused" | "done";

export type Recurrence =
  | { type: "daily" }
  | { type: "weekly"; weekdays?: number[] } // 0=Sun..6=Sat
  | { type: "monthly"; dayOfMonth: number }
  | { type: "weekdays" };

export type Subtask = {
  id: ID;
  title: string;
  completed: boolean;
};

export type Task = {
  id: ID;
  title: string;
  description?: string;
  notes?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // yyyy-MM-dd
  dueTime?: string; // HH:mm
  projectId?: ID;
  processId?: ID;
  processRunId?: ID;
  goalId?: ID;
  tagIds: ID[];
  subtasks: Subtask[];
  recurrence?: Recurrence;
  reminder?: string; // HH:mm
  order: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
};

export type InboxItem = {
  id: ID;
  text: string;
  createdAt: number;
  organizedId?: ID;
  organizedType?: "task" | "project" | "goal" | "habit" | "process";
};

export type Project = {
  id: ID;
  name: string;
  description?: string;
  goalId?: ID;
  dueDate?: string;
  status: ProjectStatus;
  color?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type ProcessStep = {
  id: ID;
  title: string;
  description?: string;
  durationMin?: number;
  order: number;
};

export type Process = {
  id: ID;
  name: string;
  description?: string;
  steps: ProcessStep[];
  recurrence?: Recurrence;
  startDate?: string;
  endDate?: string;
  tagIds: ID[];
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ProcessRun = {
  id: ID;
  processId: ID;
  date: string; // yyyy-MM-dd
  startedAt: number;
  completedAt?: number;
};

export type Habit = {
  id: ID;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  schedule: Recurrence;
  timeOfDay?: "anytime" | "morning" | "afternoon" | "evening";
  targetPerDay?: number;
  completions: string[]; // yyyy-MM-dd list
  createdAt: number;
  updatedAt: number;
  archived?: boolean;
};

export type Goal = {
  id: ID;
  title: string;
  description?: string;
  targetDate?: string;
  status: "active" | "achieved" | "dropped";
  color?: string;
  createdAt: number;
  updatedAt: number;
};

export type Tag = {
  id: ID;
  name: string;
  color?: string;
  createdAt: number;
};

export type Note = {
  id: ID;
  title: string;
  body?: string;
  createdAt: number;
  updatedAt: number;
};

export type CalendarEvent = {
  id: ID;
  title: string;
  date: string; // yyyy-MM-dd
  time?: string;
  kind: "event" | "deadline";
  linkedId?: ID;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  theme: "light" | "dark" | "system";
  name: string;
  weekStartsMonday: boolean;
};

export type AppData = {
  version: number;
  seeded: boolean;
  settings: AppSettings;
  tasks: Task[];
  inboxItems: InboxItem[];
  projects: Project[];
  processes: Process[];
  processRuns: ProcessRun[];
  habits: Habit[];
  goals: Goal[];
  tags: Tag[];
  notes: Note[];
  calendarEvents: CalendarEvent[];
};

export const PRIORITIES: Priority[] = ["low", "medium", "high"];
export const TASK_STATUSES: TaskStatus[] = [
  "inbox",
  "todo",
  "in_progress",
  "waiting",
  "completed",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: "Inbox",
  todo: "Todo",
  in_progress: "In Progress",
  waiting: "Waiting",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
