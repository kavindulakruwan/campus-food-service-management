import api from './axiosClient'

export interface MealItem {
  id: string
  name: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
  price: number
  quantity: number
  calories: number
  description: string
  imageUrl: string
  isAvailable: boolean
  averageRating: number
  reviewCount: number
  discountedPrice: number
  offer: {
    type: 'none' | 'discount' | 'combo'
    title: string
    discountPercent: number
    comboText: string
    isActive: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface MealReview {
  id: string
  user: {
    id: string
    name: string
    role: 'student' | 'admin'
  }
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

export interface MealReviewSummary {
  averageRating: number
  reviewCount: number
}

export interface MealSuggestionResponse {
  success: boolean
  data: {
    suggestions: string[]
  }
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
  quantity?: number
  calories?: number
  description?: string
  imageUrl?: string
  isAvailable?: boolean
  offer?: {
    type?: 'none' | 'discount' | 'combo'
    title?: string
    discountPercent?: number
    comboText?: string
    isActive?: boolean
  }
}

export const getMeals = (filters: MealFilters) =>
  api.get<{ success: boolean; data: { meals: MealItem[] } }>('/meals', { params: filters })

export const createMeal = (payload: MealPayload) =>
  api.post<{ success: boolean; message: string; data: MealItem }>('/meals', payload)

export const updateMeal = (mealId: string, payload: Partial<MealPayload>) =>
  api.patch<{ success: boolean; message: string; data: MealItem }>(`/meals/${mealId}`, payload)

export const deleteMeal = (mealId: string) =>
  api.delete<{ success: boolean; message: string }>(`/meals/${mealId}`)

export const getMealReviews = (mealId: string) =>
  api.get<{ success: boolean; data: { reviews: MealReview[]; summary: MealReviewSummary } }>(`/meals/${mealId}/reviews`)

export const createMealReview = (mealId: string, payload: { rating: number; comment: string }) =>
  api.post<{ success: boolean; message: string; data: { review: MealReview; summary: MealReviewSummary } }>(`/meals/${mealId}/reviews`, payload)

export const updateMyMealReview = (mealId: string, payload: { rating: number; comment: string }) =>
  api.patch<{ success: boolean; message: string; data: { review: MealReview; summary: MealReviewSummary } }>(`/meals/${mealId}/reviews/my`, payload)

export const deleteMyMealReview = (mealId: string) =>
  api.delete<{ success: boolean; message: string; data: { summary: MealReviewSummary } }>(`/meals/${mealId}/reviews/my`)

export const getMealSuggestions = (query: string) =>
  api.get<MealSuggestionResponse>('/meals/suggestions', { params: { query } })
