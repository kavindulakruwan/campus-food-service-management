import { Link } from 'react-router-dom'
import { Clock3, Flame, Search, Sparkles, Star, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getMeals, type MealItem } from '../../api/meals.api'
import { getFavoriteMeals, toggleMealFavorite } from '../../utils/mealFavorites'

type CategoryFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
type AvailabilityFilter = 'all' | 'available' | 'out-of-stock'

const categoryOptions: CategoryFilter[] = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'beverage']

const MealsPage = () => {
  const [meals, setMeals] = useState<MealItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteMeals().map((meal) => meal.id))

  const loadMeals = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getMeals({
        search: query,
        category,
        availability,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      })
      setMeals(response.data.data.meals)
    } catch (fetchError: any) {
      setError(fetchError?.response?.data?.message || 'Failed to load meals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMeals()
  }, [query, category, availability, minPrice, maxPrice])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setQuery(searchText.trim())
  }

  const handleToggleFavorite = (meal: MealItem) => {
    const nowFavorited = toggleMealFavorite(meal)

    setFavoriteIds((prev) => {
      if (nowFavorited) {
        if (prev.includes(meal.id)) return prev
        return [...prev, meal.id]
      }

      return prev.filter((id) => id !== meal.id)
    })
  }

  const availableCount = useMemo(() => meals.filter((meal) => meal.isAvailable).length, [meals])

  return (
    <section className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-100/80">Meals</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Meal items for students</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          View all available meals, search by name or price, filter by category and price range, and check availability status.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Meals</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{meals.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Available</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{availableCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Out of Stock</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{meals.length - availableCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1.8fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
              placeholder="Search by name, keyword, or price"
            />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {categoryOptions.map((item) => (
              <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>
            ))}
          </select>
          <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min={0} placeholder="Min price" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min={0} placeholder="Max price" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setAvailability('all')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${availability === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
          <button onClick={() => setAvailability('available')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${availability === 'available' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Available</button>
          <button onClick={() => setAvailability('out-of-stock')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${availability === 'out-of-stock' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Out of Stock</button>
        </div>

        {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">No meals found for this filter.</div>
        ) : meals.map((meal) => (
          <article key={meal.id} className="group mx-auto w-full max-w-[265px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-orange-400"><Utensils className="h-10 w-10" /></div>
              )}
              <button
                type="button"
                onClick={() => handleToggleFavorite(meal)}
                className={`absolute right-2.5 top-2.5 rounded-full p-1.5 shadow-sm ${favoriteIds.includes(meal.id) ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 hover:text-orange-500'}`}
                aria-label="Favorite meal"
              >
                <Star className={`h-4 w-4 ${favoriteIds.includes(meal.id) ? 'fill-current' : ''}`} />
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

              <div className="grid grid-cols-3 gap-1.5">
                <Link to="/meal-plans" className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-xs">
                  Meal Plan
                </Link>
                <Link
                  to={`/meals/${meal.id}`}
                  state={{ meal }}
                  className="rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-xs"
                >
                  View Details
                </Link>
                <Link to="/orders" className="rounded-xl bg-orange-500 px-2 py-1.5 text-center text-[11px] font-semibold text-white transition hover:bg-orange-600 sm:text-xs">
                  Order
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MealsPage
