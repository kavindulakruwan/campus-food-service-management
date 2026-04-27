import { useEffect, useMemo, useState } from 'react'
import { ChefHat, Heart, Search, Sparkles, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMeals, type MealItem } from '../../api/meals.api'
import { orderApi, type CreateOrderRequest } from '../../api/order.api'
import { getFavoriteMeals, isMealFavorited, toggleMealFavorite } from '../../utils/mealFavorites'

type RecipeCategory = 'breakfast' | 'lunch' | 'dinner'
type DietaryType = 'all' | 'balanced' | 'high-protein' | 'low-carb' | 'vegetarian'

interface Recipe {
  id: string
  name: string
  category: RecipeCategory
  dietaryType: Exclude<DietaryType, 'all'>
  calories: number
  estimatedCost: number
  ingredients: string[]
  steps: string[]
  baseMeal?: MealItem
  source: 'ai' | 'community'
}

const RECIPE_FAVORITES_KEY = 'campus-bites-favorite-recipes'
const CUSTOM_RECIPES_KEY = 'campus-bites-custom-recipes'

const safeReadJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const saveJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const splitListInput = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const buildRecipeFromMeal = (meal: MealItem): Recipe => {
  const dietaryType: Recipe['dietaryType'] =
    meal.category === 'beverage'
      ? 'low-carb'
      : meal.name.toLowerCase().includes('veg')
        ? 'vegetarian'
        : meal.calories > 520
          ? 'high-protein'
          : 'balanced'

  const mappedCategory: RecipeCategory =
    meal.category === 'breakfast' ? 'breakfast' : meal.category === 'dinner' ? 'dinner' : 'lunch'

  return {
    id: `meal-${meal.id}`,
    name: `${meal.name} Recipe`,
    category: mappedCategory,
    dietaryType,
    calories: Math.max(100, Number(meal.calories || 0)),
    estimatedCost: Number((meal.offer?.isActive && meal.offer.type === 'discount' ? meal.discountedPrice : meal.price).toFixed(2)),
    ingredients: [
      meal.name,
      'Rice or grain base',
      'Fresh vegetables',
      'Seasoning mix',
    ],
    steps: [
      'Prepare all ingredients and keep portions measured.',
      `Cook and season ${meal.name.toLowerCase()} based on your taste preference.`,
      'Assemble with sides and serve warm.',
    ],
    baseMeal: meal,
    source: 'ai',
  }
}

const RecipesPage = () => {
  const navigate = useNavigate()

  const [mealRecipes, setMealRecipes] = useState<Recipe[]>([])
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>(() => safeReadJson<Recipe[]>(CUSTOM_RECIPES_KEY, []))
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => safeReadJson<string[]>(RECIPE_FAVORITES_KEY, []))

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | RecipeCategory>('all')
  const [dietaryType, setDietaryType] = useState<DietaryType>('all')
  const [calorieRange, setCalorieRange] = useState<'all' | 'under-350' | '350-550' | 'over-550'>('all')
  const [pantryInput, setPantryInput] = useState('rice, egg, onion')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Cash' | 'PayPal' | 'QRCode'>('Cash')
  const [orderingRecipeId, setOrderingRecipeId] = useState('')

  const [newRecipeName, setNewRecipeName] = useState('')
  const [newRecipeCategory, setNewRecipeCategory] = useState<RecipeCategory>('lunch')
  const [newRecipeDietary, setNewRecipeDietary] = useState<Recipe['dietaryType']>('balanced')
  const [newRecipeCalories, setNewRecipeCalories] = useState(420)
  const [newRecipeCost, setNewRecipeCost] = useState(7.5)
  const [newRecipeIngredients, setNewRecipeIngredients] = useState('')
  const [newRecipeSteps, setNewRecipeSteps] = useState('')

  useEffect(() => {
    const loadMeals = async () => {
      setLoading(true)
      setError('')
      setMessage('')
      try {
        const response = await getMeals({
          search: '',
          category: 'all',
          availability: 'all',
        })
        const meals = response.data.data.meals || []
        setMealRecipes(meals.map(buildRecipeFromMeal))
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || 'Failed to load recipe catalog')
      } finally {
        setLoading(false)
      }
    }

    void loadMeals()
  }, [])

  useEffect(() => {
    saveJson(CUSTOM_RECIPES_KEY, customRecipes)
  }, [customRecipes])

  useEffect(() => {
    saveJson(RECIPE_FAVORITES_KEY, favoriteIds)
  }, [favoriteIds])

  const userFavoriteMeals = useMemo(() => getFavoriteMeals(), [])
  const pantryItems = useMemo(() => splitListInput(pantryInput).map((item) => item.toLowerCase()), [pantryInput])

  const allRecipes = useMemo(() => [...customRecipes, ...mealRecipes], [customRecipes, mealRecipes])

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((recipe) => {
      const text = `${recipe.name} ${recipe.ingredients.join(' ')}`.toLowerCase()
      const matchesQuery = query.trim() === '' || text.includes(query.toLowerCase())
      const matchesCategory = category === 'all' || recipe.category === category
      const matchesDietary = dietaryType === 'all' || recipe.dietaryType === dietaryType

      const matchesCalories =
        calorieRange === 'all' ||
        (calorieRange === 'under-350' && recipe.calories < 350) ||
        (calorieRange === '350-550' && recipe.calories >= 350 && recipe.calories <= 550) ||
        (calorieRange === 'over-550' && recipe.calories > 550)

      return matchesQuery && matchesCategory && matchesDietary && matchesCalories
    })
  }, [allRecipes, query, category, dietaryType, calorieRange])

  const rankedRecipes = useMemo(() => {
    return [...filteredRecipes].sort((a, b) => {
      const aPantryHits = a.ingredients.filter((ingredient) => pantryItems.some((item) => ingredient.toLowerCase().includes(item))).length
      const bPantryHits = b.ingredients.filter((ingredient) => pantryItems.some((item) => ingredient.toLowerCase().includes(item))).length

      const aMealAffinity = userFavoriteMeals.some((meal) => a.name.toLowerCase().includes(meal.name.toLowerCase())) ? 1 : 0
      const bMealAffinity = userFavoriteMeals.some((meal) => b.name.toLowerCase().includes(meal.name.toLowerCase())) ? 1 : 0

      const scoreA = aPantryHits * 2 + aMealAffinity
      const scoreB = bPantryHits * 2 + bMealAffinity

      return scoreB - scoreA
    })
  }, [filteredRecipes, pantryItems, userFavoriteMeals])

  const toggleFavoriteRecipe = (recipeId: string) => {
    setFavoriteIds((current) =>
      current.includes(recipeId) ? current.filter((id) => id !== recipeId) : [...current, recipeId],
    )
  }

  const convertRecipeToOrder = (recipe: Recipe) => {
    if (recipe.baseMeal) {
      navigate('/orders', { state: { meal: recipe.baseMeal } })
      return
    }

    const estimatedMeal: MealItem = {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      price: recipe.estimatedCost,
      quantity: 1,
      calories: recipe.calories,
      description: recipe.ingredients.join(', '),
      imageUrl: '',
      isAvailable: true,
      averageRating: 0,
      reviewCount: 0,
      discountedPrice: recipe.estimatedCost,
      offer: {
        type: 'none',
        title: '',
        discountPercent: 0,
        comboText: '',
        isActive: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    navigate('/orders', { state: { meal: estimatedMeal } })
  }

  const quickOrderRecipe = async (recipe: Recipe) => {
    setError('')
    setMessage('')
    setOrderingRecipeId(recipe.id)

    try {
      const request: CreateOrderRequest = {
        items: [
          {
            mealId: recipe.baseMeal?.id,
            name: recipe.name,
            quantity: 1,
            price: Number(recipe.estimatedCost.toFixed(2)),
          },
        ],
        totalAmount: Number(recipe.estimatedCost.toFixed(2)),
        paymentMethod: selectedPaymentMethod,
      }

      const response = await orderApi.createOrder(request)
      const createdOrder = response.data?.data || response.data
      const createdOrderId = createdOrder?._id || createdOrder?.id

      if (selectedPaymentMethod === 'Cash') {
        setMessage('Order created successfully. You can track it in Orders.')
        return
      }

      if (createdOrderId) {
        navigate(`/payments?orderId=${createdOrderId}&method=${selectedPaymentMethod}`)
      } else {
        navigate('/payments')
      }
    } catch (placeError: any) {
      setError(placeError?.response?.data?.message || 'Failed to create order from this recipe.')
    } finally {
      setOrderingRecipeId('')
    }
  }

  const toggleBaseMealFavorite = (recipe: Recipe) => {
    if (!recipe.baseMeal) return
    toggleMealFavorite(recipe.baseMeal)
    setMessage(isMealFavorited(recipe.baseMeal.id) ? 'Saved to meal favorites.' : 'Removed from meal favorites.')
  }

  const handleCreateRecipe = (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!newRecipeName.trim()) {
      setError('Recipe name is required.')
      return
    }

    const ingredients = splitListInput(newRecipeIngredients)
    const steps = splitListInput(newRecipeSteps)

    if (ingredients.length === 0 || steps.length === 0) {
      setError('Please provide ingredients and preparation steps.')
      return
    }

    const created: Recipe = {
      id: `custom-${Date.now()}`,
      name: newRecipeName.trim(),
      category: newRecipeCategory,
      dietaryType: newRecipeDietary,
      calories: Number(newRecipeCalories),
      estimatedCost: Number(newRecipeCost),
      ingredients,
      steps,
      source: 'community',
    }

    setCustomRecipes((prev) => [created, ...prev])
    setNewRecipeName('')
    setNewRecipeIngredients('')
    setNewRecipeSteps('')
  }

  const deleteCustomRecipe = (recipeId: string) => {
    setCustomRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))
    setFavoriteIds((prev) => prev.filter((id) => id !== recipeId))
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-emerald-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/80">Recipes</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Explore and build smart recipes</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Filter by category, dietary type, and calories. Save favorites, manage your own recipes, and convert a recipe directly into an order.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              placeholder="Search recipes or ingredients"
            />
          </div>

          <select value={category} onChange={(event) => setCategory(event.target.value as 'all' | RecipeCategory)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Categories</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>

          <select value={dietaryType} onChange={(event) => setDietaryType(event.target.value as DietaryType)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Diet Types</option>
            <option value="balanced">Balanced</option>
            <option value="high-protein">High Protein</option>
            <option value="low-carb">Low Carb</option>
            <option value="vegetarian">Vegetarian</option>
          </select>

          <select value={calorieRange} onChange={(event) => setCalorieRange(event.target.value as typeof calorieRange)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All Calories</option>
            <option value="under-350">Under 350 kcal</option>
            <option value="350-550">350 - 550 kcal</option>
            <option value="over-550">Over 550 kcal</option>
          </select>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_auto]">
          <input
            value={pantryInput}
            onChange={(event) => setPantryInput(event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            placeholder="Pantry items (comma separated): rice, egg, tomato"
          />
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-4 w-4" />
            AI-like ranking enabled
          </div>
        </div>

        {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {message && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-700">Checkout preference for recipe orders</p>
          <select
            value={selectedPaymentMethod}
            onChange={(event) => setSelectedPaymentMethod(event.target.value as 'Cash' | 'PayPal' | 'QRCode')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="Cash">Cash</option>
            <option value="PayPal">PayPal</option>
            <option value="QRCode">QR Payment</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleCreateRecipe} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-3">
        <input value={newRecipeName} onChange={(event) => setNewRecipeName(event.target.value)} placeholder="Recipe name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <select value={newRecipeCategory} onChange={(event) => setNewRecipeCategory(event.target.value as RecipeCategory)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <select value={newRecipeDietary} onChange={(event) => setNewRecipeDietary(event.target.value as Recipe['dietaryType'])} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="balanced">Balanced</option>
          <option value="high-protein">High Protein</option>
          <option value="low-carb">Low Carb</option>
          <option value="vegetarian">Vegetarian</option>
        </select>
        <input type="number" min={50} value={newRecipeCalories} onChange={(event) => setNewRecipeCalories(Number(event.target.value))} placeholder="Calories" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <input type="number" min={0.5} step={0.5} value={newRecipeCost} onChange={(event) => setNewRecipeCost(Number(event.target.value))} placeholder="Estimated cost" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <ChefHat className="h-4 w-4" />
          Create Recipe
        </button>
        <textarea value={newRecipeIngredients} onChange={(event) => setNewRecipeIngredients(event.target.value)} placeholder="Ingredients (comma separated)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-2" rows={2} />
        <textarea value={newRecipeSteps} onChange={(event) => setNewRecipeSteps(event.target.value)} placeholder="Steps (comma separated)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" rows={2} />
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading recipes...</div>
        ) : rankedRecipes.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">No recipes found for your filters.</div>
        ) : rankedRecipes.map((recipe) => {
          const isFavorite = favoriteIds.includes(recipe.id)
          const pantryMatches = recipe.ingredients.filter((ingredient) => pantryItems.some((item) => ingredient.toLowerCase().includes(item))).length

          return (
            <article key={recipe.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{recipe.name}</h2>
                  <p className="text-xs text-slate-500">
                    {recipe.category} · {recipe.dietaryType} · {recipe.calories} kcal · ${recipe.estimatedCost.toFixed(2)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700">Pantry match: {pantryMatches} ingredient(s)</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFavoriteRecipe(recipe.id)}
                  className={`rounded-full border p-2 ${isFavorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-500'}`}
                  aria-label="Toggle favorite recipe"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ingredients</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                  {recipe.ingredients.map((ingredient) => (
                    <li key={`${recipe.id}-${ingredient}`}>{ingredient}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preparation</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-slate-700">
                  {recipe.steps.map((step) => (
                    <li key={`${recipe.id}-${step}`}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => convertRecipeToOrder(recipe)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Convert to Order
                </button>

                <button
                  type="button"
                  onClick={() => quickOrderRecipe(recipe)}
                  disabled={orderingRecipeId === recipe.id}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {orderingRecipeId === recipe.id ? 'Creating Order...' : 'Order Now'}
                </button>

                {recipe.baseMeal && (
                  <button
                    type="button"
                    onClick={() => toggleBaseMealFavorite(recipe)}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {isMealFavorited(recipe.baseMeal.id) ? 'Remove Meal Favorite' : 'Save Meal Favorite'}
                  </button>
                )}

                {recipe.source === 'community' && (
                  <button
                    type="button"
                    onClick={() => deleteCustomRecipe(recipe.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default RecipesPage
