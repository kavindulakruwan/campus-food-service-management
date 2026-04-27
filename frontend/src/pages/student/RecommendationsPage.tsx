import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, PiggyBank, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { getMeals, type MealItem } from '../../api/meals.api'
import { orderApi } from '../../api/order.api'
import { getFavoriteMeals } from '../../utils/mealFavorites'
import {
  getRecommendationReviews,
  RECOMMENDATION_REVIEW_UPDATED_EVENT,
} from '../../utils/recommendationReview'

type HealthGoal = 'balanced' | 'high-protein' | 'low-calorie'

interface StudentOrder {
  _id: string
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  createdAt: string
}

interface ScoredMeal {
  meal: MealItem
  score: number
  reasons: string[]
}

const RECOMMENDATION_SETTINGS_KEY = 'campus-bites-recommendation-settings'

const readSettings = () => {
  try {
    const raw = localStorage.getItem(RECOMMENDATION_SETTINGS_KEY)
    if (!raw) {
      return {
        budgetLimit: 15,
        healthGoal: 'balanced' as HealthGoal,
        pantryItems: 'rice, egg, onion',
      }
    }

    const parsed = JSON.parse(raw)
    return {
      budgetLimit: Number(parsed.budgetLimit || 15),
      healthGoal: (parsed.healthGoal || 'balanced') as HealthGoal,
      pantryItems: String(parsed.pantryItems || 'rice, egg, onion'),
    }
  } catch {
    return {
      budgetLimit: 15,
      healthGoal: 'balanced' as HealthGoal,
      pantryItems: 'rice, egg, onion',
    }
  }
}

const getMealPrice = (meal: MealItem) =>
  Number((meal.offer?.isActive && meal.offer.type === 'discount' ? meal.discountedPrice : meal.price).toFixed(2))

const getCurrentMealTimeCategory = (): 'breakfast' | 'lunch' | 'dinner' => {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 17) return 'lunch'
  return 'dinner'
}

const isProteinForward = (meal: MealItem) => {
  const text = meal.name.toLowerCase()
  return /chicken|egg|fish|beef|protein|tofu|lentil|beans/.test(text)
}

const RecommendationsPage = () => {
  const settings = useMemo(() => readSettings(), [])

  const [meals, setMeals] = useState<MealItem[]>([])
  const [orders, setOrders] = useState<StudentOrder[]>([])
  const [favoriteMeals, setFavoriteMeals] = useState<MealItem[]>(() => getFavoriteMeals())

  const [budgetLimit, setBudgetLimit] = useState<number>(settings.budgetLimit)
  const [healthGoal, setHealthGoal] = useState<HealthGoal>(settings.healthGoal)
  const [pantryItemsInput, setPantryItemsInput] = useState<string>(settings.pantryItems)

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reviewRefreshToken, setReviewRefreshToken] = useState(0)

  useEffect(() => {
    localStorage.setItem(
      RECOMMENDATION_SETTINGS_KEY,
      JSON.stringify({ budgetLimit, healthGoal, pantryItems: pantryItemsInput }),
    )
  }, [budgetLimit, healthGoal, pantryItemsInput])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        const [mealsResponse, ordersResponse] = await Promise.all([
          getMeals({ search: '', category: 'all', availability: 'available' }),
          orderApi.getMyOrders(),
        ])

        setMeals(mealsResponse.data.data.meals || [])
        setOrders((ordersResponse.data || []) as StudentOrder[])
        setFavoriteMeals(getFavoriteMeals())
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || 'Failed to load recommendations.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  useEffect(() => {
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'campus-bites-recommendation-review') {
        setReviewRefreshToken((prev) => prev + 1)
      }
    }

    const handleSameTabUpdate = () => {
      setReviewRefreshToken((prev) => prev + 1)
    }

    window.addEventListener('storage', handleStorageUpdate)
    window.addEventListener(RECOMMENDATION_REVIEW_UPDATED_EVENT, handleSameTabUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageUpdate)
      window.removeEventListener(RECOMMENDATION_REVIEW_UPDATED_EVENT, handleSameTabUpdate)
    }
  }, [])

  const pantryItems = useMemo(
    () =>
      pantryItemsInput
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    [pantryItemsInput],
  )

  const orderedMealNames = useMemo(() => {
    return orders
      .flatMap((order) => order.items || [])
      .map((item) => item.name.toLowerCase())
  }, [orders])

  const favoriteMealNames = useMemo(
    () => favoriteMeals.map((meal) => meal.name.toLowerCase()),
    [favoriteMeals],
  )

  const scoredMeals = useMemo<ScoredMeal[]>(() => {
    const targetCategory = getCurrentMealTimeCategory()
    const reviewMap = getRecommendationReviews()
    const approvedIds = new Set(
      Object.values(reviewMap)
        .filter((entry) => entry.status === 'approved')
        .map((entry) => entry.mealId),
    )
    const hasApprovedMeals = approvedIds.size > 0

    return meals
      .filter((meal) => {
        if (!meal.isAvailable || meal.quantity <= 0) return false

        const reviewStatus = reviewMap[meal.id]?.status || 'pending'
        if (reviewStatus === 'rejected') return false
        if (hasApprovedMeals && !approvedIds.has(meal.id)) return false

        if (!query.trim()) return true
        return meal.name.toLowerCase().includes(query.toLowerCase())
      })
      .map((meal) => {
        let score = 0
        const reasons: string[] = []
        const mealName = meal.name.toLowerCase()
        const mealPrice = getMealPrice(meal)

        if (meal.category === targetCategory) {
          score += 4
          reasons.push(`Great for ${targetCategory} time`) 
        }

        const orderedBefore = orderedMealNames.some((name) => name.includes(mealName) || mealName.includes(name))
        if (orderedBefore) {
          score += 3
          reasons.push('Matches your past orders')
        }

        const favorited = favoriteMealNames.some((name) => name.includes(mealName) || mealName.includes(name))
        if (favorited) {
          score += 4
          reasons.push('Aligned with your favorites')
        }

        const pantryHits = pantryItems.filter((item) => item && mealName.includes(item)).length
        if (pantryHits > 0) {
          score += pantryHits * 2
          reasons.push(`Uses ${pantryHits} pantry match(es)`)
        }

        if (mealPrice <= budgetLimit) {
          score += 3
          reasons.push('Fits your budget limit')
        }

        if (healthGoal === 'high-protein' && isProteinForward(meal)) {
          score += 4
          reasons.push('Supports high-protein goal')
        }

        if (healthGoal === 'low-calorie' && meal.calories <= 350) {
          score += 4
          reasons.push('Supports low-calorie goal')
        }

        if (healthGoal === 'balanced' && meal.calories > 250 && meal.calories < 550) {
          score += 2
          reasons.push('Balanced calorie range')
        }

        if (approvedIds.has(meal.id)) {
          score += 2
          reasons.push('Approved by admin review')
        }

        return { meal, score, reasons }
      })
      .sort((a, b) => b.score - a.score)
  }, [meals, query, orderedMealNames, favoriteMealNames, pantryItems, budgetLimit, healthGoal, reviewRefreshToken])

  const bestForToday = useMemo(() => scoredMeals.slice(0, 6), [scoredMeals])

  const budgetFriendly = useMemo(
    () => scoredMeals.filter((entry) => getMealPrice(entry.meal) <= budgetLimit).slice(0, 6),
    [scoredMeals, budgetLimit],
  )

  const highProtein = useMemo(
    () => scoredMeals.filter((entry) => isProteinForward(entry.meal)).slice(0, 6),
    [scoredMeals],
  )

  const renderMealCard = (entry: ScoredMeal) => {
    const mealPrice = getMealPrice(entry.meal)
    return (
      <article key={entry.meal.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{entry.meal.name}</h3>
            <p className="text-xs text-slate-500">
              {entry.meal.category} · {entry.meal.calories} kcal · ${mealPrice.toFixed(2)}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Score {entry.score}</span>
        </div>

        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {entry.reasons.slice(0, 3).map((reason) => (
            <li key={`${entry.meal.id}-${reason}`}>• {reason}</li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <Link
            to="/orders"
            state={{ meal: entry.meal }}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Order
          </Link>
          <Link
            to={`/meals/${entry.meal.id}`}
            state={{ meal: entry.meal }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View
          </Link>
        </div>
      </article>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Recommendations</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Personalized meal suggestions</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          AI-style recommendations based on your orders, favorite meals, budget limit, health goal, pantry items, and time of day.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:bg-white"
              placeholder="Search recommendation pool"
            />
          </div>

          <input
            type="number"
            min={1}
            step={1}
            value={budgetLimit}
            onChange={(event) => setBudgetLimit(Number(event.target.value) || 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Budget limit"
          />

          <select
            value={healthGoal}
            onChange={(event) => setHealthGoal(event.target.value as HealthGoal)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="balanced">Balanced</option>
            <option value="high-protein">High Protein</option>
            <option value="low-calorie">Low Calorie</option>
          </select>

          <input
            value={pantryItemsInput}
            onChange={(event) => setPantryItemsInput(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Pantry: rice, egg"
          />
        </div>

        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Past Orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Favorite Meals</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{favoriteMeals.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Budget Limit</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">${budgetLimit.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Health Goal</p>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{healthGoal}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading recommendations...</div>
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h2 className="text-lg font-bold">Best meals for today</h2>
            </div>
            <p className="text-sm text-slate-500">Context-aware picks tuned to current meal time and your behavior.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{bestForToday.map(renderMealCard)}</div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900">
              <PiggyBank className="h-4 w-4 text-emerald-500" />
              <h2 className="text-lg font-bold">Budget-friendly options</h2>
            </div>
            <p className="text-sm text-slate-500">Meals that fit your budget limit while staying relevant to your preferences.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{budgetFriendly.map(renderMealCard)}</div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900">
              <Zap className="h-4 w-4 text-rose-500" />
              <h2 className="text-lg font-bold">High-protein meals</h2>
            </div>
            <p className="text-sm text-slate-500">Protein-forward suggestions to support active and muscle-focused goals.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{highProtein.map(renderMealCard)}</div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <h2 className="text-lg font-bold">How this is personalized</h2>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>• Past order patterns influence repeated preference scoring.</li>
              <li>• Favorite meals influence affinity and ranking weight.</li>
              <li>• Budget limit filters and boosts cost-friendly meals.</li>
              <li>• Health goal prioritizes protein-forward or lower-calorie options.</li>
              <li>• Pantry text and meal-time context continuously adapt ranking.</li>
              <li>• <Sparkles className="inline h-4 w-4 text-indigo-500" /> Suggestions refresh dynamically as your settings and data change.</li>
            </ul>
          </section>
        </>
      )}
    </section>
  )
}

export default RecommendationsPage
