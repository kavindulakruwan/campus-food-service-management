import { Clock3, Flame, Heart, Sparkles, Utensils } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MealItem } from '../../api/meals.api'
import { getFavoriteMeals, removeMealFavorite } from '../../utils/mealFavorites'

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<MealItem[]>(() => getFavoriteMeals())

  const stats = useMemo(() => ({
    total: favorites.length,
    available: favorites.filter((meal) => meal.isAvailable).length,
  }), [favorites])

  const handleRemove = (mealId: string) => {
    removeMealFavorite(mealId)
    setFavorites((prev) => prev.filter((meal) => meal.id !== mealId))
  }

  return (
    <section className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-r from-[#091b49] via-[#0c275f] to-[#1a3b83] p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-100/80">Favorites</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your favorite meals</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/90 sm:text-base">
          Saved meals from the meals page appear here. Click the heart icon to remove any item.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Saved Items</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Available Now</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.available}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {favorites.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-900">No favorites yet</p>
            <p className="mt-1 text-sm">Go to Meals and click the star on any meal card to add it here.</p>
            <Link to="/meals" className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Go to Meals</Link>
          </div>
        ) : favorites.map((meal) => (
          <article key={meal.id} className="group mx-auto w-full max-w-[265px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-orange-400"><Utensils className="h-10 w-10" /></div>
              )}

              <button
                type="button"
                onClick={() => handleRemove(meal.id)}
                className="absolute right-2.5 top-2.5 rounded-full bg-rose-100 p-1.5 text-rose-600 shadow-sm hover:bg-rose-200"
                aria-label="Remove favorite"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>

            <div className="space-y-2.5 p-3">
              <div className="flex items-center justify-between">
                <h2 className="line-clamp-1 text-xl font-bold tracking-tight text-slate-900">{meal.name}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meal.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {meal.isAvailable ? 'Available' : 'Out of Stock'}
                </span>
              </div>

              <p className="line-clamp-2 min-h-9 text-xs text-slate-500">{meal.description || 'No description provided.'}</p>

              <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><Clock3 className="h-3 w-3" /> {meal.category}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><Flame className="h-3 w-3 text-orange-500" /> {meal.calories} kcal</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1"><Sparkles className="h-3 w-3 text-emerald-500" /> Chef pick</span>
              </div>

              <p className="pt-0.5 text-3xl font-black text-orange-500">LKR {meal.price.toFixed(0)}</p>

              <button
                type="button"
                onClick={() => handleRemove(meal.id)}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                Remove Favorite
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FavoritesPage
