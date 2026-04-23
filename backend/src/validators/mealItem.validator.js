const { z } = require('zod')

const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']

const createMealItemSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(categories).optional(),
  price: z.number().min(0),
  quantity: z.number().int().min(0).optional(),
  calories: z.number().int().min(0).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(6000000).optional(),
  isAvailable: z.boolean().optional(),
})

const updateMealItemSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.enum(categories).optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  calories: z.number().int().min(0).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(6000000).optional(),
  isAvailable: z.boolean().optional(),
})

const mealReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(300),
})

module.exports = {
  createMealItemSchema,
  updateMealItemSchema,
  mealReviewSchema,
}