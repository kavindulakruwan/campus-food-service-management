import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Filter, Sparkles, XCircle } from 'lucide-react'
import { getMeals, type MealItem } from '../../api/meals.api'
import {
  getRecommendationReviews,
  saveRecommendationDecision,
  saveRecommendationDecisionsBulk,
  type RecommendationDecisionStatus,
  type RecommendationReview,
} from '../../utils/recommendationReview'

type ReviewFilter = 'all' | RecommendationDecisionStatus

const isProteinForward = (meal: MealItem) => {
  const text = meal.name.toLowerCase()
  return /chicken|egg|fish|beef|protein|tofu|lentil|beans/.test(text)
}

const getMealPrice = (meal: MealItem) =>
  Number((meal.offer?.isActive && meal.offer.type === 'discount' ? meal.discountedPrice : meal.price).toFixed(2))

const AdminRecommendationsPage = () => {
  const [meals, setMeals] = useState<MealItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [reviews, setReviews] = useState<Record<string, RecommendationReview>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<ReviewFilter>('all')

  const [maxPrice, setMaxPrice] = useState(15)
  const [maxCalories, setMaxCalories] = useState(550)
  const [requireProtein, setRequireProtein] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await getMeals({
          search: '',
          category: 'all',
          availability: 'available',
        })

        const loadedMeals = response.data.data.meals || []
        const loadedReviews = getRecommendationReviews()

        setMeals(loadedMeals)
        setReviews(loadedReviews)

        const seededNotes: Record<string, string> = {}
        Object.values(loadedReviews).forEach((review) => {
          seededNotes[review.mealId] = review.reason || ''
        })
        setNotes(seededNotes)
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || 'Failed to load admin recommendation queue.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      if (filter === 'all') return true
      return (reviews[meal.id]?.status || 'pending') === filter
    })
  }, [meals, reviews, filter])

  const counts = useMemo(
    () => ({
      all: meals.length,
      pending: meals.filter((meal) => (reviews[meal.id]?.status || 'pending') === 'pending').length,
      approved: meals.filter((meal) => (reviews[meal.id]?.status || 'pending') === 'approved').length,
      rejected: meals.filter((meal) => (reviews[meal.id]?.status || 'pending') === 'rejected').length,
    }),
    [meals, reviews],
  )

  const applyDecision = (mealId: string, status: RecommendationDecisionStatus) => {
    const reason = notes[mealId] || ''
    saveRecommendationDecision(mealId, status, reason)

    setReviews((prev) => ({
      ...prev,
      [mealId]: {
        mealId,
        status,
        reason: reason.trim(),
        reviewedAt: new Date().toISOString(),
      },
    }))

    setMessage(`Meal ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'reset to pending'}.`)
  }

  const runAutoReview = () => {
    if (meals.length === 0) return

    const updates: RecommendationReview[] = meals.map((meal) => {
      const mealPrice = getMealPrice(meal)
      const matchesProteinRule = !requireProtein || isProteinForward(meal)
      const matches = mealPrice <= maxPrice && meal.calories <= maxCalories && matchesProteinRule

      return {
        mealId: meal.id,
        status: matches ? 'approved' : 'rejected',
        reason: matches
          ? `Auto-approved: price <= ${maxPrice}, calories <= ${maxCalories}${requireProtein ? ', protein-forward' : ''}`
          : `Auto-rejected: does not match rule (price <= ${maxPrice}, calories <= ${maxCalories}${requireProtein ? ', protein-forward' : ''})`,
        reviewedAt: new Date().toISOString(),
      }
    })

    saveRecommendationDecisionsBulk(updates)

    const nextMap: Record<string, RecommendationReview> = { ...reviews }
    updates.forEach((item) => {
      nextMap[item.mealId] = item
    })
    setReviews(nextMap)

    const nextNotes: Record<string, string> = { ...notes }
    updates.forEach((item) => {
      nextNotes[item.mealId] = item.reason || ''
    })
    setNotes(nextNotes)

    setMessage('Auto review completed with current matching rules.')
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Admin Recommendations</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Recommendation moderation</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Approve or reject recommendation candidates so students only see verified suggestions.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{counts.all}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{counts.pending}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{counts.approved}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{counts.rejected}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h2 className="text-lg font-bold">Auto-match rules</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <input
            type="number"
            min={1}
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value) || 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Max price"
          />
          <input
            type="number"
            min={50}
            value={maxCalories}
            onChange={(event) => setMaxCalories(Number(event.target.value) || 50)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Max calories"
          />
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={requireProtein}
              onChange={(event) => setRequireProtein(event.target.checked)}
            />
            Must be protein-forward
          </label>
          <button
            type="button"
            onClick={runAutoReview}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Run Auto Approve/Reject
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ReviewFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {message && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading meals...</div>
          ) : filteredMeals.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No meals for this filter.</div>
          ) : (
            filteredMeals.map((meal) => {
              const mealReview = reviews[meal.id]
              const status = mealReview?.status || 'pending'
              const badgeClass =
                status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status === 'rejected'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-amber-50 text-amber-700'

              return (
                <article key={meal.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{meal.name}</h3>
                      <p className="text-xs text-slate-500">
                        {meal.category} · {meal.calories} kcal · ${getMealPrice(meal).toFixed(2)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${badgeClass}`}>
                      {status}
                    </span>
                  </div>

                  <textarea
                    value={notes[meal.id] ?? mealReview?.reason ?? ''}
                    onChange={(event) =>
                      setNotes((prev) => ({
                        ...prev,
                        [meal.id]: event.target.value,
                      }))
                    }
                    placeholder="Optional review note"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyDecision(meal.id, 'approved')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDecision(meal.id, 'rejected')}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => applyDecision(meal.id, 'pending')}
                      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                    >
                      Reset
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminRecommendationsPage
