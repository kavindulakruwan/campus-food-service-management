const { z } = require('zod')

const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']

const createMealItemSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(categories).optional(),
  price: z.number().min(0),
  calories: z.number().int().min(0).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(6000000).optional(),
  isAvailable: z.boolean().optional(),
})

const updateMealItemSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  category: z.enum(categories).optional(),
  price: z.number().min(0).optional(),
  calories: z.number().int().min(0).optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(6000000).optional(),
  isAvailable: z.boolean().optional(),
})

module.exports = {
  createMealItemSchema,
  updateMealItemSchema,
}