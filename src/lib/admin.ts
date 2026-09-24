/**
 * Admin / Owner analytics — read-only views computed from the local store.
 * Nothing here mutates data; admin pages aggregate what the three systems
 * already know (tasks, transactions, orders) into owner-level KPIs.
 */
import { getData } from "./store";
import { parseDateKey, todayKey } from "./date-utils";
import type { DateFilter } from "./store";
import { resolveDateRange } from "./store";

export type AdminSnapshot = {
  /** Life system */
  tasksTotal: number;
  tasksCompleted: number;
  habitsToday: number;
  habitsTotal: number;
  /** Expense system */
  expenseMonthIncome: number;
  expenseMonthExpense: number;
  expenseTxCount: number;
  debtOutstanding: number;
  /** Business system */
  bizMonthRevenue: number;
  bizMonthProfit: number;
  bizMonthOrders: number;
  bizLowStock: number;
  bizProductCount: number;
  bizCustomerCount: number;
  staffCount: number;
  monthlyPayroll: number;
  /** meta */
  seededAt: string | null;
  dataVersion: number;
};

function inRange(dateKey: string, from: string, to: string): boolean {
  return dateKey >= from && dateKey <= to;
}

export function adminSnapshot(filter: DateFilter): AdminSnapshot {
  const d = getData();
  const { from, to } = resolveDateRange(filter);
  const today = todayKey();

  // --- Life ---
  const tasksTotal = d.tasks.length;
  const tasksCompleted = d.tasks.filter((t) => t.status === "completed").length;
  const habitsTotal = d.habits.length;
  const habitsToday = d.habits.filter((h) => h.completions.includes(today)).length;

  // --- Expense ---
  let expenseMonthIncome = 0;
  let expenseMonthExpense = 0;
  let expenseTxCount = 0;
  for (const tx of d.transactions) {
    if (!inRange(tx.date, from, to)) continue;
    expenseTxCount++;
    if (tx.type === "income") expenseMonthIncome += tx.amount;
    else expenseMonthExpense += tx.amount;
  }
  let debtOutstanding = 0;
  for (const debt of d.debts) {
    debtOutstanding += Math.max(0, debt.total - debt.paid);
  }

  // --- Business ---
  const fromTs = parseDateKey(from).getTime();
  const toTs = parseDateKey(to).getTime() + 864e5 - 1;
  let bizMonthRevenue = 0;
  let bizMonthCogs = 0;
  let bizMonthOrders = 0;
  for (const o of d.business.orders) {
    if (o.status !== "completed") continue;
    if (o.createdAt < fromTs || o.createdAt > toTs) continue;
    bizMonthOrders++;
    bizMonthRevenue += o.total;
    bizMonthCogs += o.costTotal;
  }
  let bizMonthExpenses = 0;
  for (const e of d.business.expenses) {
    if (inRange(e.date, from, to)) bizMonthExpenses += e.amount;
  }
  const bizLowStock = d.business.products.filter(
    (p) => p.active && p.stock <= p.lowStockThreshold,
  ).length;
  const staffActive = d.business.staff.filter((s) => s.active);
  const monthlyPayroll = staffActive.reduce((s, m) => s + m.salary, 0);

  return {
    tasksTotal,
    tasksCompleted,
    habitsToday,
    habitsTotal,
    expenseMonthIncome,
    expenseMonthExpense,
    expenseTxCount,
    debtOutstanding,
    bizMonthRevenue,
    bizMonthProfit: bizMonthRevenue - bizMonthCogs - bizMonthExpenses,
    bizMonthOrders,
    bizLowStock,
    bizProductCount: d.business.products.length,
    bizCustomerCount: d.business.customers.length,
    staffCount: staffActive.length,
    monthlyPayroll,
    seededAt: null,
    dataVersion: d.version,
  };
}

/** Approximate local storage footprint of the user's data, in bytes. */
export function storageFootprint(): number {
  try {
    return new Blob([JSON.stringify(getData())]).size;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** Per-system record counts for the data page. */
export function collectionCounts(): { labelKey: string; count: number }[] {
  const d = getData();
  return [
    { labelKey: "admin.col.tasks", count: d.tasks.length },
    { labelKey: "admin.col.projects", count: d.projects.length },
    { labelKey: "admin.col.habits", count: d.habits.length },
    { labelKey: "admin.col.goals", count: d.goals.length },
    { labelKey: "admin.col.notes", count: d.notes.length },
    { labelKey: "admin.col.events", count: d.calendarEvents.length },
    { labelKey: "admin.col.transactions", count: d.transactions.length },
    { labelKey: "admin.col.accounts", count: d.accounts.length },
    { labelKey: "admin.col.recurring", count: d.recurring.length },
    { labelKey: "admin.col.debts", count: d.debts.length },
    { labelKey: "admin.col.products", count: d.business.products.length },
    { labelKey: "admin.col.customers", count: d.business.customers.length },
    { labelKey: "admin.col.orders", count: d.business.orders.length },
    { labelKey: "admin.col.purchases", count: d.business.purchases.length },
    { labelKey: "admin.col.staff", count: d.business.staff.length },
    { labelKey: "admin.col.quotes", count: d.business.quotes.length },
  ];
}
