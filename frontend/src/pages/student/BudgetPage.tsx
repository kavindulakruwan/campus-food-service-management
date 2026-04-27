import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Save, Zap } from 'lucide-react'
import { getMeals, type MealItem } from '../../api/meals.api'
import { orderApi } from '../../api/order.api'
import { paymentApi } from '../../api/payment.api'
import {
  calculateBudgetAnalytics,
  calculatePeriodLabel,
  formatCurrency,
  formatDate,
  getPeriodDates,
  readBudgetSettings,
  saveBudgetSettings,
  type BudgetAnalytics,
  type BudgetPeriod,
  type BudgetSettings,
} from '../../utils/budgetTracking'

interface OrderWithTotal {
  _id: string
  createdAt: string
  totalAmount: number
  items?: Array<{ name: string; quantity: number; price: number }>
  status?: string
}

const BudgetPage = () => {
  const [settings, setSettings] = useState<BudgetSettings>(readBudgetSettings())
  const [tempSettings, setTempSettings] = useState<BudgetSettings>(settings)
  const [orders, setOrders] = useState<OrderWithTotal[]>([])
  const [meals, setMeals] = useState<MealItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadBudgetData = async () => {
    setLoading(true)
    setError('')

    try {
      const [ordersResponse, mealsResponse, paymentsResponse] = await Promise.all([
        orderApi.getMyOrders(),
        getMeals({ search: '', category: 'all', availability: 'available' }),
        paymentApi.getHistory(),
      ])

      const rawOrders = Array.isArray(ordersResponse.data) ? ordersResponse.data : []
      const meals = mealsResponse.data.data.meals || []

      // Map completed payments into synthetic order-like entries so budget analytics count them
      const payments = Array.isArray(paymentsResponse) ? paymentsResponse : Array.isArray(paymentsResponse?.data) ? paymentsResponse.data : []
      const paymentOrders = payments
        .filter((p: any) => p.status === 'Completed' && Number(p.amount))
        .map((p: any) => ({
          _id: `payment-${p._id}`,
          createdAt: p.createdAt,
          totalAmount: Number(p.amount || 0),
          items: [],
        }))

      setOrders([...rawOrders, ...paymentOrders])
      setMeals(meals)
    } catch (fetchError: any) {
      setError(fetchError?.response?.data?.message || 'Failed to load budget data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBudgetData()

    const handleBudgetUpdate = () => {
      void loadBudgetData()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadBudgetData()
      }
    }

    window.addEventListener('campus-bites-budget-updated', handleBudgetUpdate)
    window.addEventListener('storage', handleBudgetUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const pollInterval = setInterval(() => {
      void loadBudgetData()
    }, 15000)

    return () => {
      window.removeEventListener('campus-bites-budget-updated', handleBudgetUpdate)
      window.removeEventListener('storage', handleBudgetUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(pollInterval)
    }
  }, [])

  const analytics = useMemo(() => calculateBudgetAnalytics(settings, orders), [settings, orders])

  // Projected spend for the configured period (daily/weekly/monthly)
  const projectedPeriodSpend = useMemo(() => {
    if (!analytics) return 0
    if (settings.period === 'daily') return analytics.averageDailySpend
    if (settings.period === 'weekly') return analytics.averageDailySpend * 7
    return analytics.projectedMonthlySpend
  }, [analytics, settings.period])

  const expectedRemainingNextPeriod = useMemo(() => {
    return Math.round((settings.amount - projectedPeriodSpend) * 100) / 100
  }, [settings.amount, projectedPeriodSpend])

  const onSaveBudgetSettings = () => {
    if (tempSettings.amount <= 0) {
      setError('Budget amount must be greater than 0.')
      return
    }

    setSettings(tempSettings)
    saveBudgetSettings(tempSettings)
    setMessage('Budget settings saved successfully.')
    setTimeout(() => setMessage(''), 3000)
  }

  const getMealPrice = (meal: MealItem) =>
    Number((meal.offer?.isActive && meal.offer.type === 'discount' ? meal.discountedPrice : meal.price).toFixed(2))

  const affordableMeals = useMemo(() => {
    if (analytics.remaining <= 0 || meals.length === 0) return []

    const avgNeeded = analytics.remaining / Math.max(1, analytics.daysRemaining)
    return meals
      .filter((meal) => {
        const price = getMealPrice(meal)
        return price > 0 && price <= avgNeeded && meal.isAvailable && meal.quantity > 0
      })
      .sort((a, b) => getMealPrice(a) - getMealPrice(b))
      .slice(0, 6)
  }, [analytics, meals])


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-orange-200 border-t-orange-500" />
        <p className="text-sm font-medium text-slate-400">Loading budget data...</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Budget Management</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Spending control center</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Set your budget in LKR and track spending from orders and payments in real time.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Projected Next Period</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{formatCurrency(projectedPeriodSpend)}</p>
          <p className="mt-1 text-xs text-slate-500">Expected remaining: {formatCurrency(expectedRemainingNextPeriod)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Budget Limit</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{formatCurrency(analytics.totalBudget)}</p>
          <p className="mt-1 text-xs text-slate-500">{settings.period} budget in LKR</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Spent from Orders</p>
          <p
            className={`mt-2 text-2xl font-bold ${analytics.totalSpent > analytics.totalBudget ? 'text-rose-600' : 'text-slate-900'}`}
          >
            {formatCurrency(analytics.totalSpent)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{analytics.spendingByDay.length} days tracked</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Remaining to Spend</p>
          <p
            className={`mt-2 text-2xl font-bold ${analytics.remaining < 0 ? 'text-rose-600' : analytics.remaining < analytics.totalBudget * 0.2 ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            {formatCurrency(analytics.remaining)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{analytics.daysRemaining} days left</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Daily Average</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(analytics.averageDailySpend)}</p>
          <p className="mt-1 text-xs text-slate-500">Live update from your latest payments and orders</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Budget Status</h2>
            <p className="mt-1 text-sm text-slate-500">Period: {calculatePeriodLabel(settings.period, settings.startDate)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {analytics.percentageUsed}% used ({formatCurrency(analytics.totalSpent)} of{' '}
                {formatCurrency(analytics.totalBudget)})
              </span>
              <span
                className={`text-xs font-semibold ${analytics.percentageUsed >= 100 ? 'text-rose-600' : analytics.percentageUsed >= 75 ? 'text-amber-600' : 'text-emerald-600'}`}
              >
                {analytics.percentageUsed >= 100 ? 'OVER BUDGET' : analytics.percentageUsed >= 90 ? 'CRITICAL' : 'ON TRACK'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full animate-pulse transition-all duration-700 ${
                  analytics.percentageUsed >= 100
                    ? 'bg-rose-500'
                    : analytics.percentageUsed >= 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, analytics.percentageUsed)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-500" />
          <h2 className="text-lg font-bold text-slate-900">Budget Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Budget Period</label>
              <select
                value={tempSettings.period}
                onChange={(e) => setTempSettings({ ...tempSettings, period: e.target.value as BudgetPeriod })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Budget Amount</label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">LKR</span>
                <input
                  type="number"
                  min={1}
                  step={0.01}
                  value={tempSettings.amount}
                  onChange={(e) => setTempSettings({ ...tempSettings, amount: Number(e.target.value) || 0 })}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                value={tempSettings.startDate}
                onChange={(e) => setTempSettings({ ...tempSettings, startDate: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={onSaveBudgetSettings}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            Save Budget
          </button>
        </div>
      </div>

      {affordableMeals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Affordable Meal Options</h2>
          <p className="mb-4 text-sm text-slate-500">
            These meals fit your remaining budget of {formatCurrency(analytics.remaining)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {affordableMeals.map((meal) => (
              <article key={meal.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{meal.name}</h3>
                    <p className="text-xs text-slate-500">
                      {meal.category} • {meal.calories} kcal
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                    {formatCurrency(getMealPrice(meal))}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default BudgetPage
