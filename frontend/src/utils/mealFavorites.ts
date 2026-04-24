import type { MealItem } from '../api/meals.api'

const FAVORITE_MEALS_STORAGE_KEY = 'campus-bites-favorite-meals'

type FavoriteMealMap = Record<string, MealItem>

const readFavoriteMap = (): FavoriteMealMap => {
  try {
    const raw = localStorage.getItem(FAVORITE_MEALS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as FavoriteMealMap
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

const writeFavoriteMap = (value: FavoriteMealMap) => {
  localStorage.setItem(FAVORITE_MEALS_STORAGE_KEY, JSON.stringify(value))
}

export const getFavoriteMeals = (): MealItem[] => {
  const map = readFavoriteMap()
  return Object.values(map)
}

export const isMealFavorited = (mealId: string): boolean => {
  const map = readFavoriteMap()
  return Boolean(map[mealId])
}

export const toggleMealFavorite = (meal: MealItem): boolean => {
  const map = readFavoriteMap()

  if (map[meal.id]) {
    delete map[meal.id]
    writeFavoriteMap(map)
    return false
  }

  map[meal.id] = meal
  writeFavoriteMap(map)
  return true
}

export const removeMealFavorite = (mealId: string) => {
  const map = readFavoriteMap()
  if (!map[mealId]) return

  delete map[mealId]
  writeFavoriteMap(map)
}
