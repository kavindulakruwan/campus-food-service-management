export type BudgetPeriod = 'daily' | 'weekly' | 'monthly'

export interface BudgetSettings {
  period: BudgetPeriod
  amount: number
  startDate: string
}

export interface SpendingBreakdown {
  date: string
  amount: number
  items: Array<{ name: string; quantity: number; price: number }>
}

export interface BudgetAnalytics {
  totalBudget: number
  totalSpent: number
  remaining: number
  percentageUsed: number
  periodStart: string
  periodEnd: string
  spendingByDay: Array<{ date: string; amount: number }>
  averageDailySpend: number
  projectedMonthlySpend: number
  daysInPeriod: number
  daysRemaining: number
}

const BUDGET_SETTINGS_KEY = 'campus-bites-budget-settings'

const getDefaultSettings = (): BudgetSettings => ({
  period: 'monthly',
  amount: 150,
  startDate: new Date().toISOString().split('T')[0],
})

export const readBudgetSettings = (): BudgetSettings => {
  try {
    const raw = localStorage.getItem(BUDGET_SETTINGS_KEY)
    if (!raw) return getDefaultSettings()
    const parsed = JSON.parse(raw) as BudgetSettings
    return {
      period: (parsed.period || 'monthly') as BudgetPeriod,
      amount: Number(parsed.amount || 150),
      startDate: parsed.startDate || new Date().toISOString().split('T')[0],
    }
  } catch {
    return getDefaultSettings()
  }
}

export const saveBudgetSettings = (settings: BudgetSettings) => {
  localStorage.setItem(BUDGET_SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event('campus-bites-budget-updated'))
}

export const getPeriodDates = (period: BudgetPeriod, baseDate?: Date) => {
  const date = baseDate ? new Date(baseDate) : new Date()
  const periodStart = new Date(date)
  const periodEnd = new Date(date)

  if (period === 'daily') {
    periodStart.setHours(0, 0, 0, 0)
    periodEnd.setHours(23, 59, 59, 999)
  } else if (period === 'weekly') {
    const dayOfWeek = date.getDay()
    const daysToMonday = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    periodStart.setDate(daysToMonday)
    periodStart.setHours(0, 0, 0, 0)
    periodEnd.setDate(daysToMonday + 6)
    periodEnd.setHours(23, 59, 59, 999)
  } else if (period === 'monthly') {
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)
    periodEnd.setMonth(date.getMonth() + 1)
    periodEnd.setDate(0)
    periodEnd.setHours(23, 59, 59, 999)
  }

  return { periodStart, periodEnd }
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Math.abs(value))
}

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const calculatePeriodLabel = (period: BudgetPeriod, startDate: string) => {
  const start = new Date(startDate)
  const { periodEnd } = getPeriodDates(period, start)

  if (period === 'daily') {
    return formatDate(start)
  } else if (period === 'weekly') {
    const { periodStart } = getPeriodDates(period, start)
    return `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
  } else {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
}

interface OrderWithTotal {
  createdAt: string
  totalAmount: number
  items?: Array<{ name: string; quantity: number; price: number }>
}

export const calculateBudgetAnalytics = (
  settings: BudgetSettings,
  orders: OrderWithTotal[],
  completedOnly = true,
): BudgetAnalytics => {
  const { periodStart, periodEnd } = getPeriodDates(settings.period, new Date(settings.startDate))

  const relevantOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    return orderDate >= periodStart && orderDate <= periodEnd
  })

  const totalSpent = relevantOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

  const spendingByDay: Record<string, number> = {}
  relevantOrders.forEach((order) => {
    const orderDate = new Date(order.createdAt)
    const dayKey = orderDate.toISOString().split('T')[0]
    spendingByDay[dayKey] = (spendingByDay[dayKey] || 0) + Number(order.totalAmount || 0)
  })

  const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysSinceStart = Math.ceil((new Date().getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysRemaining = Math.max(0, daysInPeriod - daysSinceStart)

  const averageDailySpend = totalSpent / Math.max(1, daysSinceStart)
  const projectedMonthlySpend =
    settings.period === 'daily'
      ? averageDailySpend
      : settings.period === 'weekly'
        ? averageDailySpend * 7
        : averageDailySpend * 30

  return {
    totalBudget: settings.amount,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remaining: Math.round((settings.amount - totalSpent) * 100) / 100,
    percentageUsed: Math.round((totalSpent / settings.amount) * 100),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    spendingByDay: Object.entries(spendingByDay)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    averageDailySpend: Math.round(averageDailySpend * 100) / 100,
    projectedMonthlySpend: Math.round(projectedMonthlySpend * 100) / 100,
    daysInPeriod,
    daysRemaining,
  }
}
