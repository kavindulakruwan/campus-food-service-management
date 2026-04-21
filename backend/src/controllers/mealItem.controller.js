const MealItem = require('../models/MealItem')

const toMealItem = (item) => ({
  id: item._id.toString(),
  name: item.name,
  category: item.category,
  price: item.price,
  quantity: Number.isFinite(item.quantity) ? item.quantity : (item.isAvailable ? 1 : 0),
  calories: item.calories,
  description: item.description || '',
  imageUrl: item.imageUrl || '',
  isAvailable: item.isAvailable,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

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
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
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

  const meals = await MealItem.find(query).sort({ createdAt: -1 })

  return res.json({
    success: true,
    data: {
      meals: meals.map(toMealItem),
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