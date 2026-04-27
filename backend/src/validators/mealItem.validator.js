const { z } = require('zod')

const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'beverage']

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value)

const normalizedCategorySchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value
  return value.trim().toLowerCase()
}, z.enum(categories))

const nonNegativeNumberSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return undefined
    return Number(trimmed)
  }
  return value
}, z.number().min(0))

const nonNegativeIntegerSchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return undefined
    return Number(trimmed)
  }
  return value
}, z.number().int().min(0))

const mealOfferSchema = z.object({
  type: z.preprocess((value) => {
    if (typeof value !== 'string') return value
    return value.trim().toLowerCase()
  }, z.enum(['none', 'discount', 'combo'])).optional(),
  title: z.preprocess(normalizeString, z.string().max(80)).optional(),
  discountPercent: z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return undefined
      return Number(trimmed)
    }
    return value
  }, z.number().min(0).max(100)).optional(),
  comboText: z.preprocess(normalizeString, z.string().max(120)).optional(),
  isActive: z.boolean().optional(),
}).superRefine((offer, ctx) => {
  if (!offer.type || offer.type === 'none') {
    return
  }

  if (offer.type === 'discount') {
    if (offer.discountPercent === undefined || offer.discountPercent <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['discountPercent'], message: 'Discount percent is required for discount offers' })
    }
  }

  if (offer.type === 'combo' && !offer.comboText) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['comboText'], message: 'Combo text is required for combo offers' })
  }
})

const createMealItemSchema = z.object({
  name: z.string().min(2).max(120),
  category: normalizedCategorySchema.optional(),
  price: nonNegativeNumberSchema,
  quantity: z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed === '') return undefined
      return Number(trimmed)
    }
    return value
  }, z.number().int().min(1)).optional(),
  calories: nonNegativeIntegerSchema.optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(6000000).optional(),
  isAvailable: z.boolean().optional(),
  offer: mealOfferSchema.optional(),
})

const updateMealItemSchema = z.object({
  name: z.preprocess(normalizeString, z.string().min(2).max(120)).optional(),
  category: normalizedCategorySchema.optional(),
  price: nonNegativeNumberSchema.optional(),
  quantity: nonNegativeIntegerSchema.optional(),
  calories: nonNegativeIntegerSchema.optional(),
  description: z.string().max(300).optional(),
  imageUrl: z.string().max(6000000).optional(),
  isAvailable: z.boolean().optional(),
  offer: mealOfferSchema.optional(),
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