export interface PaymentRecord {
  id?: number;
  amount: number;
  amountRemaining: number | null;
  status: string;
  method?: string;
  paidAt?: string | null;
  clientId?: number;
}

export interface SubscriptionRecord {
  id?: number;
  price: number | null;
  status: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface ClientFinanceSummary {
  totalPaid: number;
  remainingBalance: number;
  subscriptionValue: number;
}

export interface CoachFinanceSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingAmount: number;
  expectedRevenue: number;
  activeSubscriptionRevenue: number;
}

export function calculateClientFinance(payments: PaymentRecord[], subscriptions: SubscriptionRecord[]): ClientFinanceSummary {
  const totalPaid = payments
    .filter((p) => p.status !== "unpaid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const now = new Date().toISOString().split("T")[0];
  const activeSub = subscriptions.find((s) => s.status === "active" && s.endDate && s.endDate >= now);
  const latestSub = !activeSub ? subscriptions.sort((a, b) => (b.endDate || "").localeCompare(a.endDate || ""))[0] : null;
  const activeSubValue = activeSub?.price ?? latestSub?.price ?? 0;

  const remainingBalance = Math.max(0, activeSubValue - totalPaid);

  return {
    totalPaid: safeNumber(totalPaid),
    remainingBalance: safeNumber(Math.max(0, remainingBalance)),
    subscriptionValue: safeNumber(activeSubValue),
  };
}

export function calculateCoachFinanceSummary(payments: PaymentRecord[], activeSubscriptions: SubscriptionRecord[]): CoachFinanceSummary {
  const totalRevenue = payments
    .filter((p) => p.status !== "unpaid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const monthlyRevenue = payments
    .filter((p) => p.status !== "unpaid" && p.paidAt && p.paidAt >= startOfMonth && p.paidAt <= endOfMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const activeSubscriptionRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.price || 0), 0);

  const outstandingAmount = Math.max(0, activeSubscriptionRevenue - totalRevenue);

  return {
    totalRevenue: safeNumber(totalRevenue),
    monthlyRevenue: safeNumber(monthlyRevenue),
    outstandingAmount: safeNumber(Math.max(0, outstandingAmount)),
    expectedRevenue: safeNumber(totalRevenue + Math.max(0, outstandingAmount)),
    activeSubscriptionRevenue: safeNumber(activeSubscriptionRevenue),
  };
}

export function calculateRevenueByMethod(payments: PaymentRecord[]): { method: string; amount: number }[] {
  const methodMap: Record<string, number> = {};
  payments
    .filter((p) => p.status !== "unpaid")
    .forEach((p) => {
      const method = p.method || "other";
      methodMap[method] = (methodMap[method] || 0) + (p.amount || 0);
    });
  return Object.entries(methodMap)
    .map(([method, amount]) => ({ method, amount: safeNumber(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateMonthlyTrend(payments: PaymentRecord[]): { month: string; year: number; total: number }[] {
  const now = new Date();
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).toISOString();
    const total = payments
      .filter((p) => p.status !== "unpaid" && p.paidAt && p.paidAt >= monthStart && p.paidAt <= monthEnd)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    trend.push({
      month: d.toLocaleString("ar-SA", { month: "long" }),
      year: d.getFullYear(),
      total: safeNumber(total),
    });
  }
  return trend;
}

export function deriveClientPaymentStatus(payments: PaymentRecord[]): string {
  if (payments.length === 0) return "unpaid";
  let hasPaid = false;
  let hasPartial = false;
  let hasUnpaid = false;
  for (const p of payments) {
    if (p.status === "paid" && (!p.amountRemaining || p.amountRemaining <= 0)) hasPaid = true;
    if (p.status === "partial" || (p.status === "paid" && p.amountRemaining && p.amountRemaining > 0)) hasPartial = true;
    if (p.status === "unpaid") hasUnpaid = true;
  }
  if (hasPartial || (hasPaid && hasUnpaid)) return "partial";
  if (hasPaid) return "paid";
  if (hasUnpaid) return "unpaid";
  return "unpaid";
}

function safeNumber(val: number): number {
  if (typeof val !== "number" || isNaN(val) || !isFinite(val)) return 0;
  return Math.round(val * 100) / 100;
}
