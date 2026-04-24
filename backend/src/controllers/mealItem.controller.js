const MealItem = require('../models/MealItem')

const getReviewSummary = (reviews = []) => {
  if (!reviews.length) {
    return { averageRating: 0, reviewCount: 0 }
  }

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0)
  const averageRating = Number((total / reviews.length).toFixed(1))

  return {
    averageRating,
    reviewCount: reviews.length,
  }
}

const toReview = (review) => ({
  id: review._id.toString(),
  user: {
    id: review.user?._id?.toString?.() || review.user?.toString?.() || '',
    name: review.user?.name || 'Unknown user',
    role: review.user?.role || 'student',
  },
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
})

const toOffer = (offer = {}) => {
  const type = ['discount', 'combo'].includes(offer.type) && offer.isActive ? offer.type : 'none'
  const discountPercent = type === 'discount' ? Number(offer.discountPercent || 0) : 0
  const title = offer.title || ''
  const comboText = offer.comboText || ''

  return {
    type,
    title,
    discountPercent,
    comboText,
    isActive: type !== 'none',
  }
}

const toDiscountedPrice = (price, offer) => (
  offer.type === 'discount'
    ? Number((price * (1 - (offer.discountPercent / 100))).toFixed(2))
    : price
)

const toMealItem = (item) => {
  const offer = toOffer(item.offer)
  return {
    ...getReviewSummary(item.reviews),
    id: item._id.toString(),
    name: item.name,
    category: item.category,
    price: item.price,
    quantity: Number.isFinite(item.quantity) ? item.quantity : (item.isAvailable ? 1 : 0),
    calories: item.calories,
    description: item.description || '',
    imageUrl: item.imageUrl || '',
    isAvailable: item.isAvailable,
    offer,
    discountedPrice: toDiscountedPrice(item.price, offer),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

const toMealItemFromAggregate = (item) => {
  const offer = toOffer(item.offer)
  return {
    averageRating: Number((Number(item.averageRating || 0)).toFixed(1)),
    reviewCount: Number(item.reviewCount || 0),
    id: item._id.toString(),
    name: item.name,
    category: item.category,
    price: item.price,
    quantity: Number.isFinite(item.quantity) ? item.quantity : (item.isAvailable ? 1 : 0),
    calories: item.calories,
    description: item.description || '',
    imageUrl: item.imageUrl || '',
    isAvailable: item.isAvailable,
    offer,
    discountedPrice: toDiscountedPrice(item.price, offer),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

exports.getMeals = async (req, res) => {
  const {
    search = '',
    category = 'all',
    availability = 'all',
    minPrice,
    maxPrice,
  } = req.query

  const query = {}

  if (search) {
    const safeSearch = escapeRegex(search)
    query.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
    ]
  }

  if (category !== 'all') {
    query.category = category
  }

  if (availability === 'available') query.isAvailable = true
  if (availability === 'out-of-stock') query.isAvailable = false

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {}
    if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice)
    if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice)
  }

  const meals = await MealItem.aggregate([
    { $match: query },
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        reviewCount: { $size: { $ifNull: ['$reviews', []] } },
        averageRating: {
          $cond: [
            { $eq: [{ $size: { $ifNull: ['$reviews', []] } }, 0] },
            0,
            { $avg: '$reviews.rating' }
          ]
        }
      }
    },
    {
      $project: {
        name: 1,
        category: 1,
        price: 1,
        quantity: 1,
        calories: 1,
        description: 1,
        imageUrl: 1,
        isAvailable: 1,
        offer: 1,
        createdAt: 1,
        updatedAt: 1,
        reviewCount: 1,
        averageRating: 1,
      },
    },
  ])

  return res.json({
    success: true,
    data: {
      meals: meals.map(toMealItemFromAggregate),
    },
  })
}

exports.getMealSuggestions = async (req, res) => {
  const rawQuery = typeof req.query.query === 'string' ? req.query.query.trim() : ''
  if (!rawQuery) {
    return res.json({
      success: true,
      data: {
        suggestions: [],
      },
    })
  }

  const matches = await MealItem.find({
    name: { $regex: rawQuery, $options: 'i' },
  })
    .select('name')
    .sort({ createdAt: -1 })
    .limit(12)

  const seen = new Set()
  const suggestions = []

  matches.forEach((item) => {
    const normalized = item.name.trim().toLowerCase()
    if (!normalized || seen.has(normalized) || suggestions.length >= 8) return
    seen.add(normalized)
    suggestions.push(item.name)
  })

  return res.json({
    success: true,
    data: {
      suggestions,
    },
  })
}

exports.createMeal = async (req, res) => {
  const quantity = Number(req.body?.quantity)
  const safeQuantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 1

  const payload = {
    ...req.body,
    quantity: safeQuantity,
    isAvailable: safeQuantity > 0,
  }

  const created = await MealItem.create(payload)

  return res.status(201).json({
    success: true,
    message: 'Meal created successfully',
    data: toMealItem(created),
  })
}

exports.updateMeal = async (req, res) => {
  const { id } = req.params

  const payload = { ...req.body }
  if (payload.quantity !== undefined) {
    const quantity = Number(payload.quantity)
    payload.quantity = Number.isFinite(quantity) && quantity >= 0 ? quantity : 0
    payload.isAvailable = payload.quantity > 0
  }

  const updated = await MealItem.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Meal not found' })
  }

  return res.json({
    success: true,
    message: 'Meal updated successfully',
    data: toMealItem(updated),
  })
}

exports.deleteMeal = async (req, res) => {
  const { id } = req.params

  const deleted = await MealItem.findByIdAndDelete(id)
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Meal not found' })
  }

  return res.json({ success: true, message: 'Meal deleted successfully' })
}

exports.getMealReviews = async (req, res) => {
  const { id } = req.params

  const meal = await MealItem.findById(id).populate('reviews.user', 'name role')
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' })
  }

  const reviews = [...meal.reviews]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toReview)

  return res.json({
    success: true,
    data: {
      reviews,
      summary: getReviewSummary(meal.reviews),
    },
  })
}

exports.createMealReview = async (req, res) => {
  const { id } = req.params
  const { rating, comment } = req.body

  const meal = await MealItem.findById(id)
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' })
  }

  const existing = meal.reviews.find((review) => review.user.toString() === req.user.id)
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'You already reviewed this meal. Edit your review instead.',
    })
  }

  meal.reviews.push({
    user: req.user.id,
    rating,
    comment: comment.trim(),
  })

  await meal.save()
  await meal.populate('reviews.user', 'name role')

  const created = meal.reviews.find((review) => review.user._id.toString() === req.user.id)

  return res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: {
      review: toReview(created),
      summary: getReviewSummary(meal.reviews),
    },
  })
}

exports.updateMyMealReview = async (req, res) => {
  const { id } = req.params
  const { rating, comment } = req.body

  const meal = await MealItem.findById(id)
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' })
  }

  const review = meal.reviews.find((item) => item.user.toString() === req.user.id)
  if (!review) {
    return res.status(404).json({ success: false, message: 'Your review was not found for this meal' })
  }

  review.rating = rating
  review.comment = comment.trim()

  await meal.save()
  await meal.populate('reviews.user', 'name role')

  const updated = meal.reviews.find((item) => item.user._id.toString() === req.user.id)

  return res.json({
    success: true,
    message: 'Review updated successfully',
    data: {
      review: toReview(updated),
      summary: getReviewSummary(meal.reviews),
    },
  })
}

exports.deleteMyMealReview = async (req, res) => {
  const { id } = req.params

  const meal = await MealItem.findById(id)
  if (!meal) {
    return res.status(404).json({ success: false, message: 'Meal not found' })
  }

  const review = meal.reviews.find((item) => item.user.toString() === req.user.id)
  if (!review) {
    return res.status(404).json({ success: false, message: 'Your review was not found for this meal' })
  }

  meal.reviews = meal.reviews.filter((item) => item.user.toString() !== req.user.id)
  await meal.save()

  return res.json({
    success: true,
    message: 'Review deleted successfully',
    data: {
      summary: getReviewSummary(meal.reviews),
    },
  })
}