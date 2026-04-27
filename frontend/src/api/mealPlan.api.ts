import api from './axiosClient'
import type {
  ApiEnvelope,
  MealPlanInput,
  MealPlanItem,
  MonthlyMealPlansPayload,
  WeeklyMealPlansPayload,
} from '../types/mealPlan'

interface DuplicateWeekInput {
  sourceWeekStart: string
  targetWeekStart: string
  overwrite?: boolean
}

interface QuickCopyWeekInput {
  targetWeekStart: string
  strategy?: 'previous-week' | 'next-week'
  overwrite?: boolean
}

export const createMealPlan = (input: MealPlanInput) =>
  api.post<ApiEnvelope<MealPlanItem>>('/meal-plans', input)

export const getWeeklyMealPlans = (startDate: string) =>
  api.get<ApiEnvelope<WeeklyMealPlansPayload>>('/meal-plans/week', {
    params: { startDate },
  })

export const getMonthlyMealPlans = (year: number, month: number) =>
  api.get<ApiEnvelope<MonthlyMealPlansPayload>>('/meal-plans/month', {
    params: { year, month },
  })

export const updateMealPlan = (id: string, input: Partial<MealPlanInput>) =>
  api.patch<ApiEnvelope<MealPlanItem>>(`/meal-plans/${id}`, input)

export const deleteMealPlan = (id: string) =>
  api.delete<{ success: boolean; message: string }>(`/meal-plans/${id}`)

export const duplicateWeekPlans = (input: DuplicateWeekInput) =>
  api.post<ApiEnvelope<{ copiedCount: number }>>('/meal-plans/week/duplicate', input)

export const quickCopyWeekPlans = (input: QuickCopyWeekInput) =>
  api.post<ApiEnvelope<{ copiedCount: number }>>('/meal-plans/week/quick-copy', input)
