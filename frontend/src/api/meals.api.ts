import api from './axiosClient'

export interface MealItem {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
  price: number
  calories: number
  description: string
  imageUrl: string
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface MealFilters {
  search?: string
  category?: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
  availability?: 'all' | 'available' | 'out-of-stock'
  minPrice?: number
  maxPrice?: number
}

export interface MealPayload {
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
  price: number
  calories?: number
  description?: string
  imageUrl?: string
  isAvailable?: boolean
}

export const getMeals = (filters: MealFilters) =>
  api.get<{ success: boolean; data: { meals: MealItem[] } }>('/meals', { params: filters })

export const createMeal = (payload: MealPayload) =>
  api.post<{ success: boolean; message: string; data: MealItem }>('/meals', payload)

export const updateMeal = (mealId: string, payload: Partial<MealPayload>) =>
  api.patch<{ success: boolean; message: string; data: MealItem }>(`/meals/${mealId}`, payload)

export const deleteMeal = (mealId: string) =>
  api.delete<{ success: boolean; message: string }>(`/meals/${mealId}`)
