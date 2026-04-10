import { ArrowLeft, Clock3, Flame, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { MealItem } from '../../api/meals.api'

const MealDetailPage = () => {
  const location = useLocation()
  const meal = (location.state as { meal?: MealItem } | null)?.meal

  if (!meal) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Meal details not available</h1>
          <p className="mt-2 text-sm text-slate-600">
            This page needs meal data from the Meals page. Please open a meal using the View Details button.
          </p>
          <Link
            to="/meals"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Meals
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-100/80">Meal Details</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{meal.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Full meal information and quick actions for planning and ordering.
        </p>
      </header>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="h-64 bg-slate-100 md:h-full">
            {meal.imageUrl ? (
              <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-orange-400">
                <UtensilsCrossed className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{meal.name}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meal.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {meal.isAvailable ? 'Available' : 'Out of Stock'}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-600">{meal.description || 'No description provided.'}</p>

            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Clock3 className="h-3 w-3" /> {meal.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Flame className="h-3 w-3 text-orange-500" /> {meal.calories} kcal</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Sparkles className="h-3 w-3 text-emerald-500" /> Chef pick</span>
            </div>

            <p className="text-4xl font-black text-orange-500">LKR {meal.price.toFixed(0)}</p>

            <div className="grid gap-2 sm:grid-cols-3">
              <Link to="/meal-plans" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Meal Plan
              </Link>
              <Link
                to="/meals"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Meals
              </Link>
              <Link to="/orders" className="inline-flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                <ShoppingBag className="h-4 w-4" />
                Order
              </Link>
            </div>
          </div>
        </div>
      </article>
    </section>
  )
}

export default MealDetailPage
