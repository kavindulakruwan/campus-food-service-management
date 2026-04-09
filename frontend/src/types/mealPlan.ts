export type MealTime = 'breakfast' | 'lunch' | 'dinner'

export interface MealPlanItem {
  id: string
  date: string
  mealTime: MealTime
  mealName: string
  quantity: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface WeeklyMealPlansPayload {
  weekStart: string
  weekEnd: string
  plans: MealPlanItem[]
}

export interface MonthlyMealPlansPayload {
  year: number
  month: number
  plans: MealPlanItem[]
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data: T
}

export interface MealPlanInput {
  date: string
  mealTime: MealTime
  mealName: string
  quantity: number
  notes?: string
}
