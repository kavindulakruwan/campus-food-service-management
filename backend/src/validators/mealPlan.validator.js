const { z } = require('zod')

const mealTimeEnum = z.enum(['breakfast', 'lunch', 'dinner'])

const createMealPlanSchema = z.object({
  date: z.string().date(),
  mealTime: mealTimeEnum,
  mealName: z.string().min(2).max(120),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().max(300).optional(),
})

const updateMealPlanSchema = z.object({
  date: z.string().date().optional(),
  mealTime: mealTimeEnum.optional(),
  mealName: z.string().min(2).max(120).optional(),
  quantity: z.number().int().min(1).max(50).optional(),
  notes: z.string().max(300).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
})

const weekQuerySchema = z.object({
  startDate: z.string().date().optional(),
})

const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2200).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

const duplicateWeekSchema = z.object({
  sourceWeekStart: z.string().date(),
  targetWeekStart: z.string().date(),
  overwrite: z.boolean().optional(),
})

const quickCopyWeekSchema = z.object({
  targetWeekStart: z.string().date(),
  strategy: z.enum(['previous-week', 'next-week']).optional(),
  overwrite: z.boolean().optional(),
})

module.exports = {
  createMealPlanSchema,
  updateMealPlanSchema,
  weekQuerySchema,
  monthQuerySchema,
  duplicateWeekSchema,
  quickCopyWeekSchema,
}
