const mongoose = require('mongoose')
const PantryItem = require('../models/PantryItem')

const allowedUnits = new Set(['g', 'ml', 'cup', 'tbsp', 'tsp', 'count', 'oz'])
const allowedCategories = new Set(['Grains', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Condiments', 'Spices', 'Other'])

const isLowStock = (quantity, unit) => {
  if (unit === 'count') return quantity <= 3
  if (unit === 'cup') return quantity <= 1
  return quantity <= 200
}

const toPantryItem = (item) => ({
  id: item._id.toString(),
  name: item.name,
  quantity: item.quantity,
  unit: item.unit,
  purchaseDate: item.purchaseDate,
  expiryDate: item.expiryDate,
  category: item.category,
  notes: item.notes || '',
  lowStock: isLowStock(item.quantity, item.unit),
  approvalStatus: item.approvalStatus,
  approvedAt: item.approvedAt,
  addedDate: item.createdAt,
  user: item.user && typeof item.user === 'object'
    ? {
        id: item.user._id?.toString?.() || '',
        name: item.user.name || '',
        email: item.user.email || '',
      }
    : undefined,
})

exports.listMyPantryItems = async (req, res) => {
  const items = await PantryItem.find({ user: req.user.id }).sort({ createdAt: -1 })

  return res.json({
    success: true,
    data: items.map(toPantryItem),
  })
}

exports.createPantryItem = async (req, res) => {
  const {
    name,
    quantity,
    unit,
    purchaseDate,
    expiryDate,
    category = 'Other',
    notes = '',
  } = req.body

  if (!name || !expiryDate) {
    return res.status(422).json({ success: false, message: 'name and expiryDate are required' })
  }

  if (!allowedUnits.has(unit)) {
    return res.status(422).json({ success: false, message: 'Invalid pantry unit' })
  }

  if (!allowedCategories.has(category)) {
    return res.status(422).json({ success: false, message: 'Invalid pantry category' })
  }

  const numericQuantity = Number(quantity)
  if (Number.isNaN(numericQuantity) || numericQuantity <= 0) {
    return res.status(422).json({ success: false, message: 'quantity must be greater than 0' })
  }

  const parsedExpiryDate = new Date(expiryDate)
  if (Number.isNaN(parsedExpiryDate.getTime())) {
    return res.status(422).json({ success: false, message: 'Invalid expiryDate' })
  }

  const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date()
  if (Number.isNaN(parsedPurchaseDate.getTime())) {
    return res.status(422).json({ success: false, message: 'Invalid purchaseDate' })
  }

  const created = await PantryItem.create({
    user: req.user.id,
    name,
    quantity: numericQuantity,
    unit,
    purchaseDate: parsedPurchaseDate,
    expiryDate: parsedExpiryDate,
    category,
    notes,
  })

  return res.status(201).json({
    success: true,
    message: 'Pantry item created and pending admin approval',
    data: toPantryItem(created),
  })
}

exports.updateMyPantryItem = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid pantry item id' })
  }

  const existing = await PantryItem.findOne({ _id: id, user: req.user.id })
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Pantry item not found' })
  }

  const {
    name,
    quantity,
    unit,
    purchaseDate,
    expiryDate,
    category,
    notes,
  } = req.body

  if (name !== undefined) existing.name = name

  if (quantity !== undefined) {
    const numericQuantity = Number(quantity)
    if (Number.isNaN(numericQuantity) || numericQuantity <= 0) {
      return res.status(422).json({ success: false, message: 'quantity must be greater than 0' })
    }
    existing.quantity = numericQuantity
  }

  if (unit !== undefined) {
    if (!allowedUnits.has(unit)) {
      return res.status(422).json({ success: false, message: 'Invalid pantry unit' })
    }
    existing.unit = unit
  }

  if (purchaseDate !== undefined) {
    const parsedPurchaseDate = new Date(purchaseDate)
    if (Number.isNaN(parsedPurchaseDate.getTime())) {
      return res.status(422).json({ success: false, message: 'Invalid purchaseDate' })
    }
    existing.purchaseDate = parsedPurchaseDate
  }

  if (expiryDate !== undefined) {
    const parsedExpiryDate = new Date(expiryDate)
    if (Number.isNaN(parsedExpiryDate.getTime())) {
      return res.status(422).json({ success: false, message: 'Invalid expiryDate' })
    }
    existing.expiryDate = parsedExpiryDate
  }

  if (category !== undefined) {
    if (!allowedCategories.has(category)) {
      return res.status(422).json({ success: false, message: 'Invalid pantry category' })
    }
    existing.category = category
  }

  if (notes !== undefined) existing.notes = notes

  // Any user update should be re-reviewed by admin.
  existing.approvalStatus = 'pending'
  existing.approvedBy = null
  existing.approvedAt = null

  await existing.save()

  return res.json({
    success: true,
    message: 'Pantry item updated and moved to pending approval',
    data: toPantryItem(existing),
  })
}

exports.listPantryItemsForAdmin = async (req, res) => {
  const {
    search = '',
    status = 'all',
    stock = 'all',
    page = '1',
    limit = '20',
  } = req.query

  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100)

  const query = {}

  if (status !== 'all') {
    query.approvalStatus = status
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ]
  }

  const baseQuery = PantryItem.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })

  let stockFilteredItems = []
  let total = 0

  if (stock === 'low') {
    const allMatched = await baseQuery
    stockFilteredItems = allMatched.filter((item) => isLowStock(item.quantity, item.unit))
    total = stockFilteredItems.length
    stockFilteredItems = stockFilteredItems.slice((safePage - 1) * safeLimit, safePage * safeLimit)
  } else {
    const [items, count] = await Promise.all([
      baseQuery.clone().skip((safePage - 1) * safeLimit).limit(safeLimit),
      PantryItem.countDocuments(query),
    ])
    stockFilteredItems = items
    total = count
  }

  return res.json({
    success: true,
    data: {
      items: stockFilteredItems.map(toPantryItem),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    },
  })
}

exports.approvePantryItem = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid pantry item id' })
  }

  const item = await PantryItem.findById(id)
  if (!item) {
    return res.status(404).json({ success: false, message: 'Pantry item not found' })
  }

  item.approvalStatus = 'approved'
  item.approvedBy = req.user.id
  item.approvedAt = new Date()
  await item.save()

  return res.json({
    success: true,
    message: 'Pantry item approved',
    data: toPantryItem(item),
  })
}

exports.deletePantryItemAsAdmin = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid pantry item id' })
  }

  const deleted = await PantryItem.findByIdAndDelete(id)
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Pantry item not found' })
  }

  return res.json({
    success: true,
    message: 'Pantry item deleted',
  })
}
