import { Link } from 'react-router-dom'
import { Clock3, Flame, Search, Sparkles, Star, Tag, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getMeals, getMealSuggestions, type MealItem } from '../../api/meals.api'
import { getFavoriteMeals, toggleMealFavorite } from '../../utils/mealFavorites'

type CategoryFilter = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
type AvailabilityFilter = 'all' | 'available' | 'out-of-stock'

const categoryTabs: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: 'Breakfast 🍳' },
  { value: 'lunch', label: 'Lunch 🍛' },
  { value: 'dinner', label: 'Dinner 🌙' },
  { value: 'snack', label: 'Snacks 🍟' },
  { value: 'beverage', label: 'Drinks 🥤' },
]

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
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

  useEffect(() => {
    const trimmed = searchText.trim()
    if (!trimmed) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const response = await getMealSuggestions(trimmed)
        setSuggestions(response.data.data.suggestions)
      } catch (_error) {
        setSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchText])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setQuery(searchText.trim())
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (value: string) => {
    setSearchText(value)
    setQuery(value)
    setShowSuggestions(false)
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

  const getOfferLabel = (meal: MealItem) => {
    if (!meal.offer?.isActive || meal.offer.type === 'none') return null

    if (meal.offer.type === 'discount') {
      return `${meal.offer.discountPercent}% OFF`
    }

    return meal.offer.title || 'Combo Offer'
  }

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
        <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="relative" onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:bg-white"
              placeholder="Search by name, keyword, or price"
              autoComplete="off"
            />

            {showSuggestions && searchText.trim() && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {suggestionsLoading ? (
                  <p className="px-3 py-2 text-sm text-slate-500">Finding suggestions...</p>
                ) : suggestions.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-500">No matching meals</p>
                ) : (
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {suggestions.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          onMouseDown={() => handleSuggestionClick(item)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-orange-50"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min={0} placeholder="Min price" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min={0} placeholder="Max price" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${category === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
          <article key={meal.id} className="group relative mx-auto w-full max-w-[265px] overflow-hidden rounded-3xl border border-white/40 bg-white/35 text-slate-900 shadow-[0_14px_40px_-20px_rgba(15,23,42,0.45)] ring-1 ring-white/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/45 hover:shadow-[0_24px_50px_-24px_rgba(15,23,42,0.55)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/55 via-white/15 to-orange-200/30" />

            <div className="relative h-36 w-full overflow-hidden border-b border-white/30 bg-slate-100/70">
              {meal.imageUrl ? (
                <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-orange-400"><Utensils className="h-10 w-10" /></div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => handleToggleFavorite(meal)}
                className={`absolute right-2.5 top-2.5 rounded-full border p-1.5 shadow-sm backdrop-blur-md ${favoriteIds.includes(meal.id) ? 'border-orange-200/70 bg-orange-500/85 text-white' : 'border-white/70 bg-white/75 text-slate-500 hover:text-orange-500'}`}
                aria-label="Favorite meal"
              >
                <Star className={`h-4 w-4 ${favoriteIds.includes(meal.id) ? 'fill-current' : ''}`} />
              </button>
              {getOfferLabel(meal) && (
                <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full border border-orange-100/70 bg-orange-500/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md">
                  <Tag className="h-3 w-3" />
                  {getOfferLabel(meal)}
                </div>
              )}
            </div>

            <div className="relative space-y-2.5 p-3">
              <div className="flex items-center justify-between">
                <h2 className="line-clamp-1 text-xl font-bold tracking-tight text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">{meal.name}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md ${meal.isAvailable ? 'border-emerald-200/60 bg-emerald-100/75 text-emerald-800' : 'border-rose-200/70 bg-rose-100/75 text-rose-800'}`}>
                  {meal.isAvailable ? 'Available' : 'Out of Stock'}
                </span>
              </div>

              <p className="line-clamp-2 min-h-9 text-xs text-slate-600">{meal.description || 'No description provided.'}</p>

              {meal.offer?.isActive && meal.offer.type === 'combo' && meal.offer.comboText && (
                <div className="rounded-xl border border-amber-100/80 bg-amber-50/65 px-3 py-2 text-xs text-amber-900 backdrop-blur-sm">
                  <p className="font-bold uppercase tracking-wide">Combo Offer</p>
                  <p className="mt-1">{meal.offer.comboText}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/45 px-2 py-1 backdrop-blur-sm"><Clock3 className="h-3 w-3" /> {meal.category}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/45 px-2 py-1 backdrop-blur-sm"><Flame className="h-3 w-3 text-orange-500" /> {meal.calories} kcal</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/45 px-2 py-1 backdrop-blur-sm">Stock: {meal.quantity}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/45 px-2 py-1 backdrop-blur-sm"><Sparkles className="h-3 w-3 text-emerald-500" /> Chef pick</span>
              </div>

              <div className="pt-0.5">
                {meal.offer?.isActive && meal.offer.type === 'discount' ? (
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-orange-500 drop-shadow-[0_2px_6px_rgba(251,146,60,0.35)]">LKR {meal.discountedPrice.toFixed(0)}</p>
                    <p className="pb-1 text-sm font-semibold text-slate-400 line-through">LKR {meal.price.toFixed(0)}</p>
                  </div>
                ) : (
                  <p className="text-3xl font-black text-orange-500 drop-shadow-[0_2px_6px_rgba(251,146,60,0.35)]">LKR {meal.price.toFixed(0)}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <Link to="/meal-plans" className="rounded-xl border border-white/70 bg-white/70 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white sm:text-xs">
                  Meal Plan
                </Link>
                <Link
                  to={`/meals/${meal.id}`}
                  state={{ meal }}
                  className="rounded-xl border border-white/70 bg-white/70 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white sm:text-xs"
                >
                  View Details
                </Link>
                {meal.isAvailable ? (
                  <Link
                    to="/orders"
                    state={{ meal }}
                    className="rounded-xl border border-orange-200/70 bg-orange-500/90 px-2 py-1.5 text-center text-[11px] font-semibold text-white backdrop-blur-sm transition hover:bg-orange-600 sm:text-xs"
                  >
                    Order
                  </Link>
                ) : (
                  <span className="rounded-xl border border-slate-200/70 bg-slate-200/75 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-600 backdrop-blur-sm sm:text-xs">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default MealsPage
